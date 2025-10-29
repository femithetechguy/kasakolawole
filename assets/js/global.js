/**
 * ============================================
 * KASA KOLAWOLE - GLOBAL JAVASCRIPT
 * ============================================
 * Common utilities and functions used across the application
 */

// Global app namespace
window.KasaKolawole = window.KasaKolawole || {};

(function(app) {
    'use strict';

    // ============================================
    // CONFIGURATION & CONSTANTS
    // ============================================
    
    app.config = {
        APP_NAME: 'Kasa Kolawole',
        VERSION: '1.0.0',
        DEBUG: true,
        ANIMATION_DURATION: 300,
        SESSION_TIMEOUT: 3600000, // 1 hour
        API_BASE_URL: '/api',
        
        // Breakpoints (matching CSS)
        BREAKPOINTS: {
            MOBILE: 768,
            TABLET: 1024,
            DESKTOP: 1200
        },
        
        // Local storage keys
        STORAGE_KEYS: {
            SESSION: 'kasakolawole_session',
            THEME: 'kasakolawole_theme',
            PREFERENCES: 'kasakolawole_preferences'
        }
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    app.utils = {
        
        /**
         * Debounce function to limit function calls
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @param {boolean} immediate - Trigger on leading edge
         * @returns {Function} Debounced function
         */
        debounce: function(func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(this, args);
            };
        },

        /**
         * Throttle function to limit function calls
         * @param {Function} func - Function to throttle
         * @param {number} limit - Time limit in milliseconds
         * @returns {Function} Throttled function
         */
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Deep clone an object
         * @param {Object} obj - Object to clone
         * @returns {Object} Cloned object
         */
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
                const clonedObj = {};
                Object.keys(obj).forEach(key => {
                    clonedObj[key] = this.deepClone(obj[key]);
                });
                return clonedObj;
            }
        },

        /**
         * Generate a unique ID
         * @param {string} prefix - Optional prefix
         * @returns {string} Unique ID
         */
        generateId: function(prefix = 'id') {
            return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },

        /**
         * Format date to readable string
         * @param {Date|string} date - Date to format
         * @param {Object} options - Formatting options
         * @returns {string} Formatted date
         */
        formatDate: function(date, options = {}) {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            const formatOptions = { ...defaultOptions, ...options };
            
            if (typeof date === 'string') {
                date = new Date(date);
            }
            
            return date.toLocaleDateString('en-US', formatOptions);
        },

        /**
         * Validate email format
         * @param {string} email - Email to validate
         * @returns {boolean} Is valid email
         */
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * Get current viewport size
         * @returns {Object} Viewport dimensions and breakpoint
         */
        getViewport: function() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            let breakpoint = 'desktop';
            if (width < app.config.BREAKPOINTS.MOBILE) {
                breakpoint = 'mobile';
            } else if (width < app.config.BREAKPOINTS.TABLET) {
                breakpoint = 'tablet';
            }
            
            return { width, height, breakpoint };
        },

        /**
         * Scroll to element smoothly
         * @param {string|Element} target - Target element or selector
         * @param {number} offset - Offset from top
         */
        scrollTo: function(target, offset = 0) {
            const element = typeof target === 'string' ? 
                document.querySelector(target) : target;
            
            if (element) {
                const targetPosition = element.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    };

    // ============================================
    // DOM UTILITIES
    // ============================================
    
    app.dom = {
        
        /**
         * Safe query selector
         * @param {string} selector - CSS selector
         * @param {Element} context - Context element
         * @returns {Element|null} Found element
         */
        $: function(selector, context = document) {
            return context.querySelector(selector);
        },

        /**
         * Safe query selector all
         * @param {string} selector - CSS selector
         * @param {Element} context - Context element
         * @returns {NodeList} Found elements
         */
        $$: function(selector, context = document) {
            return context.querySelectorAll(selector);
        },

        /**
         * Add event listener with automatic cleanup
         * @param {Element} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         */
        on: function(element, event, handler, options = {}) {
            if (!element) return;
            
            element.addEventListener(event, handler, options);
            
            // Store for cleanup
            if (!element._eventListeners) {
                element._eventListeners = [];
            }
            element._eventListeners.push({ event, handler, options });
        },

        /**
         * Remove all event listeners from element
         * @param {Element} element - Target element
         */
        off: function(element) {
            if (!element || !element._eventListeners) return;
            
            element._eventListeners.forEach(({ event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            
            element._eventListeners = [];
        },

        /**
         * Create element with attributes and content
         * @param {string} tag - Element tag
         * @param {Object} attributes - Element attributes
         * @param {string|Element} content - Element content
         * @returns {Element} Created element
         */
        create: function(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'dataset') {
                    Object.keys(attributes[key]).forEach(dataKey => {
                        element.dataset[dataKey] = attributes[key][dataKey];
                    });
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });
            
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else if (content instanceof Element) {
                element.appendChild(content);
            }
            
            return element;
        },

        /**
         * Show element with animation
         * @param {Element} element - Element to show
         * @param {string} animation - Animation class
         */
        show: function(element, animation = 'fade-in') {
            if (!element) return;
            
            element.style.display = '';
            element.classList.add(animation);
            
            setTimeout(() => {
                element.classList.remove(animation);
            }, app.config.ANIMATION_DURATION);
        },

        /**
         * Hide element with animation
         * @param {Element} element - Element to hide
         * @param {string} animation - Animation class
         */
        hide: function(element, animation = 'fade-out') {
            if (!element) return;
            
            element.classList.add(animation);
            
            setTimeout(() => {
                element.style.display = 'none';
                element.classList.remove(animation);
            }, app.config.ANIMATION_DURATION);
        }
    };

    // ============================================
    // STORAGE UTILITIES
    // ============================================
    
    app.storage = {
        
        /**
         * Set item in localStorage with JSON support
         * @param {string} key - Storage key
         * @param {*} value - Value to store
         * @returns {boolean} Success status
         */
        set: function(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(key, serializedValue);
                return true;
            } catch (error) {
                app.logger.error('Storage set error:', error);
                return false;
            }
        },

        /**
         * Get item from localStorage with JSON parsing
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if not found
         * @returns {*} Stored value or default
         */
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                app.logger.error('Storage get error:', error);
                return defaultValue;
            }
        },

        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                app.logger.error('Storage remove error:', error);
            }
        },

        /**
         * Clear all localStorage
         */
        clear: function() {
            try {
                localStorage.clear();
            } catch (error) {
                app.logger.error('Storage clear error:', error);
            }
        },

        /**
         * Session storage methods
         */
        session: {
            set: function(key, value) {
                try {
                    const serializedValue = JSON.stringify(value);
                    sessionStorage.setItem(key, serializedValue);
                    return true;
                } catch (error) {
                    app.logger.error('Session storage set error:', error);
                    return false;
                }
            },

            get: function(key, defaultValue = null) {
                try {
                    const item = sessionStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (error) {
                    app.logger.error('Session storage get error:', error);
                    return defaultValue;
                }
            },

            remove: function(key) {
                try {
                    sessionStorage.removeItem(key);
                } catch (error) {
                    app.logger.error('Session storage remove error:', error);
                }
            }
        }
    };

    // ============================================
    // HTTP UTILITIES
    // ============================================
    
    app.http = {
        
        /**
         * Generic HTTP request
         * @param {string} url - Request URL
         * @param {Object} options - Request options
         * @returns {Promise} Request promise
         */
        request: async function(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const config = { ...defaultOptions, ...options };
            
            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            } catch (error) {
                app.logger.error('HTTP request error:', error);
                throw error;
            }
        },

        /**
         * GET request
         * @param {string} url - Request URL
         * @param {Object} options - Request options
         * @returns {Promise} Request promise
         */
        get: function(url, options = {}) {
            return this.request(url, { ...options, method: 'GET' });
        },

        /**
         * POST request
         * @param {string} url - Request URL
         * @param {*} data - Request data
         * @param {Object} options - Request options
         * @returns {Promise} Request promise
         */
        post: function(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * PUT request
         * @param {string} url - Request URL
         * @param {*} data - Request data
         * @param {Object} options - Request options
         * @returns {Promise} Request promise
         */
        put: function(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * DELETE request
         * @param {string} url - Request URL
         * @param {Object} options - Request options
         * @returns {Promise} Request promise
         */
        delete: function(url, options = {}) {
            return this.request(url, { ...options, method: 'DELETE' });
        }
    };

    // ============================================
    // LOGGER
    // ============================================
    
    app.logger = {
        
        log: function(...args) {
            if (app.config.DEBUG) {
                console.log(`[${app.config.APP_NAME}]`, ...args);
            }
        },

        error: function(...args) {
            console.error(`[${app.config.APP_NAME} ERROR]`, ...args);
        },

        warn: function(...args) {
            if (app.config.DEBUG) {
                console.warn(`[${app.config.APP_NAME} WARN]`, ...args);
            }
        },

        info: function(...args) {
            if (app.config.DEBUG) {
                console.info(`[${app.config.APP_NAME} INFO]`, ...args);
            }
        }
    };

    // ============================================
    // NOTIFICATION SYSTEM
    // ============================================
    
    app.notify = {
        
        /**
         * Show notification
         * @param {string} message - Notification message
         * @param {string} type - Notification type (success, error, warning, info)
         * @param {number} duration - Display duration in ms
         */
        show: function(message, type = 'info', duration = 5000) {
            const notification = app.dom.create('div', {
                className: `alert alert-${type} notification`,
                style: 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;'
            }, `
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
                <button type="button" class="close-btn" style="margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            `);
            
            document.body.appendChild(notification);
            
            // Close button functionality
            const closeBtn = notification.querySelector('.close-btn');
            app.dom.on(closeBtn, 'click', () => {
                this.hide(notification);
            });
            
            // Auto hide
            if (duration > 0) {
                setTimeout(() => {
                    this.hide(notification);
                }, duration);
            }
            
            // Show animation
            app.dom.show(notification, 'slide-in-down');
        },

        /**
         * Hide notification
         * @param {Element} notification - Notification element
         */
        hide: function(notification) {
            app.dom.hide(notification, 'fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, app.config.ANIMATION_DURATION);
        },

        /**
         * Get icon for notification type
         * @param {string} type - Notification type
         * @returns {string} Icon class
         */
        getIcon: function(type) {
            const icons = {
                success: 'check-circle',
                error: 'exclamation-triangle',
                warning: 'exclamation-circle',
                info: 'info-circle'
            };
            return icons[type] || icons.info;
        },

        // Convenience methods
        success: function(message, duration) {
            this.show(message, 'success', duration);
        },

        error: function(message, duration) {
            this.show(message, 'error', duration);
        },

        warning: function(message, duration) {
            this.show(message, 'warning', duration);
        },

        info: function(message, duration) {
            this.show(message, 'info', duration);
        }
    };

    // ============================================
    // LOADING UTILITIES
    // ============================================
    
    app.loading = {
        
        /**
         * Show loading overlay
         * @param {string} message - Loading message
         */
        show: function(message = 'Loading...') {
            const existingLoader = app.dom.$('.global-loader');
            if (existingLoader) return;
            
            const loader = app.dom.create('div', {
                className: 'global-loader',
                style: `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(5px);
                `
            }, `
                <div class="spinner" style="width: 40px; height: 40px; border-width: 4px;"></div>
                <p style="margin-top: 1rem; font-size: 1.1rem; color: var(--text-color);">${message}</p>
            `);
            
            document.body.appendChild(loader);
            app.dom.show(loader, 'fade-in');
        },

        /**
         * Hide loading overlay
         */
        hide: function() {
            const loader = app.dom.$('.global-loader');
            if (loader) {
                app.dom.hide(loader, 'fade-out');
                setTimeout(() => {
                    if (loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                    }
                }, app.config.ANIMATION_DURATION);
            }
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    
    app.init = function() {
        app.logger.info('Initializing Kasa Kolawole Global Scripts');
        
        // Set up global error handling
        window.addEventListener('error', function(event) {
            app.logger.error('Global error:', event.error);
        });
        
        // Set up unhandled promise rejection handling
        window.addEventListener('unhandledrejection', function(event) {
            app.logger.error('Unhandled promise rejection:', event.reason);
        });
        
        // Initialize responsive utilities
        app.responsive = {
            current: app.utils.getViewport(),
            
            init: function() {
                window.addEventListener('resize', app.utils.throttle(() => {
                    this.current = app.utils.getViewport();
                    app.logger.info('Viewport changed:', this.current);
                }, 250));
            }
        };
        
        app.responsive.init();
        
        app.logger.info('Global scripts initialized successfully');
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', app.init);
    } else {
        app.init();
    }

})(window.KasaKolawole);

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.KasaKolawole;
}