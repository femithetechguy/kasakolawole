// Landing Page JavaScript
// Uses global utilities from assets/js/global.js

console.log('Landing.js script is being executed!');

class LandingPageAuth {
    constructor() {
        console.log('LandingPageAuth constructor called');
        this.config = null;
        this.app = window.KasaKolawole || {};
        
        // Add a small delay to ensure global scripts are fully loaded
        setTimeout(() => {
            console.log('Starting LandingPageAuth initialization...');
            this.init();
        }, 100);
    }

    async init() {
        try {
            // Load configuration
            await this.loadConfig();
            
            // Check if global utilities are available
            console.log('Global app available:', !!this.app);
            console.log('Global notify available:', !!this.app.notify);
            console.log('Window.KasaKolawole:', window.KasaKolawole);
            
            // Test toast notification
            console.log('Testing toast notification...');
            this.testToast();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Check if user is already logged in
            this.checkExistingSession();
            
            console.log('Landing page initialized successfully');
        } catch (error) {
            console.error('Error initializing landing page:', error);
        }
    }

    testToast() {
        // Test both global and fallback toast systems
        if (this.app && this.app.notify) {
            console.log('Using global notification system');
            this.app.notify.info('Landing page loaded successfully!', 3000);
        } else {
            console.log('Using fallback notification system');
            this.showToast('Landing page loaded successfully!', 'info', 3000);
        }
    }

    async loadConfig() {
        try {
            // Use global HTTP utility if available
            if (this.app.http) {
                this.config = await this.app.http.get('landing/landing.json');
            } else {
                const response = await fetch('landing/landing.json');
                this.config = await response.json();
            }
            console.log('Config loaded successfully:', this.config);
        } catch (error) {
            console.warn('Could not load landing config, using defaults');
            this.config = {
                auth: {
                    fallback: {
                        credentials: {
                            username: 'admin',
                            password: 'admin'
                        }
                    },
                    config: {
                        sessionTimeout: 3600000, // 1 hour
                        redirectUrl: 'home/home.html'
                    }
                }
            };
        }
    }

    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Enter key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) loginBtn.click();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        console.log('Login attempt started');
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        console.log('Login data:', { username, hasPassword: !!password, rememberMe });

        // Validate inputs
        if (!username || !password) {
            console.log('Validation failed: missing credentials');
            
            // Force test both notification systems
            if (this.app && this.app.notify) {
                console.log('Using global notify for validation error');
                this.app.notify.warning('Please enter both username and password', 3000);
            } else {
                console.log('Using fallback toast for validation error');
                this.showToast('Please enter both username and password', 'warning', 3000);
            }
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        this.hideMessages();

        try {
            // Simulate authentication delay
            await this.delay(1000);

            // Authenticate user
            const isAuthenticated = await this.authenticateUser(username, password);
            console.log('Authentication result:', isAuthenticated);

            if (isAuthenticated) {
                console.log('Authentication successful - showing success toast');
                this.handleSuccessfulLogin(username, rememberMe);
            } else {
                console.log('Authentication failed - showing error toast');
                this.handleFailedLogin();
            }
        } catch (error) {
            console.error('Login error:', error);
            // Show appropriate error toast based on error type
            if (this.app.notify) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    this.app.notify.warning('Connection issue detected. Please check your internet and try again.', 5000);
                } else {
                    this.app.notify.error('An unexpected error occurred. Please try again in a moment.', 4000);
                }
            } else {
                // Fallback notification
                this.showToast('An unexpected error occurred. Please try again in a moment.', 'error');
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    async authenticateUser(username, password) {
        console.log('authenticateUser called with:', { username, password });
        
        // Check if Firebase Auth is available
        if (!window.FirebaseAuth || !window.FirebaseAuth.auth) {
            console.error('❌ Firebase Authentication not available');
            if (this.app.notify) {
                this.app.notify.error('Authentication service not available. Please contact support.', 4000);
            } else {
                this.showToast('Authentication service not available. Please contact support.', 'error', 4000);
            }
            return false;
        }
        
        console.log('🔥 Using Firebase Authentication');
        
        // Try Firebase authentication
        const result = await window.FirebaseAuth.signInWithEmail(username, password);
        
        if (result.success) {
            console.log('✅ Firebase authentication successful!');
            return true;
        } else {
            console.log('❌ Firebase authentication failed:', result.message);
            
            // Show specific error message
            if (this.app.notify) {
                this.app.notify.error(result.message, 4000);
            } else {
                this.showToast(result.message, 'error', 4000);
            }
            
            return false;
        }
    }

    handleSuccessfulLogin(username, rememberMe) {
        console.log('handleSuccessfulLogin called with:', { username, rememberMe });
        
        // Get session timeout (default to 1 hour if invalid)
        const sessionTimeout = this.config?.auth?.config?.sessionTimeout || 3600000; // 1 hour default
        console.log('Using session timeout:', sessionTimeout);
        
        // Create session using global storage utility if available
        const now = new Date();
        const expirationTime = new Date(now.getTime() + sessionTimeout);
        
        console.log('Session timing:', {
            now: now.toISOString(),
            timeout: sessionTimeout,
            expires: expirationTime.toISOString()
        });
        
        const sessionData = {
            username: username,
            loginTime: now.toISOString(),
            expiresAt: expirationTime.toISOString(),
            rememberMe: rememberMe
        };

        // Store session
        if (this.app.storage) {
            if (rememberMe) {
                this.app.storage.set(this.app.config?.STORAGE_KEYS?.SESSION || 'kasakolawole_session', sessionData);
            } else {
                this.app.storage.session.set(this.app.config?.STORAGE_KEYS?.SESSION || 'kasakolawole_session', sessionData);
            }
        } else {
            // Fallback to direct storage
            if (rememberMe) {
                localStorage.setItem('kasakolawole_session', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('kasakolawole_session', JSON.stringify(sessionData));
            }
        }

        // Show subtle success toast - test both systems
        const successMessage = `Welcome back, ${username}! Redirecting to dashboard...`;
        
        if (this.app && this.app.notify) {
            console.log('Showing success with global notify');
            this.app.notify.success(successMessage, 2000);
        } else {
            console.log('Showing success with fallback toast');
            this.showToast(successMessage, 'success', 2000);
        }

        // Redirect after delay
        setTimeout(() => {
            window.location.href = this.config?.auth?.config?.redirectUrl || 'home/home.html';
        }, 2000);
    }

    handleFailedLogin() {
        console.log('handleFailedLogin called');
        
        // Use subtle warning toast for retry
        const errorMessage = 'Invalid credentials. Please check your username and password and try again.';
        
        if (this.app && this.app.notify) {
            console.log('Showing error with global notify');
            this.app.notify.warning(errorMessage, 4000);
        } else {
            console.log('Showing error with fallback toast');
            this.showToast(errorMessage, 'warning', 4000);
        }
        
        // Clear password field
        document.getElementById('password').value = '';
        document.getElementById('password').focus();

        // Add subtle shake animation
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.classList.add('shake');
            setTimeout(() => {
                loginCard.classList.remove('shake');
            }, 500);
        }
    }

    checkExistingSession() {
        const sessionData = this.getSessionData();
        
        if (sessionData && this.isSessionValid(sessionData)) {
            // User is already logged in, show subtle welcome toast and redirect
            if (this.app.notify) {
                this.app.notify.info(`Welcome back, ${sessionData.username}! Redirecting to your dashboard...`, 2000);
            } else {
                this.showSuccess('Welcome back! Redirecting...');
            }
            setTimeout(() => {
                window.location.href = this.config.auth.redirectUrl || 'home/home.html';
            }, 2000);
        }
    }

    getSessionData() {
        // Use global storage utility if available
        if (this.app.storage) {
            const localSession = this.app.storage.get(this.app.config?.STORAGE_KEYS?.SESSION || 'kasakolawole_session');
            const sessionSession = this.app.storage.session.get(this.app.config?.STORAGE_KEYS?.SESSION || 'kasakolawole_session');
            return localSession || sessionSession || null;
        } else {
            // Fallback to direct storage
            const localSession = localStorage.getItem('kasakolawole_session');
            const sessionSession = sessionStorage.getItem('kasakolawole_session');
            
            if (localSession) {
                return JSON.parse(localSession);
            } else if (sessionSession) {
                return JSON.parse(sessionSession);
            }
            
            return null;
        }
    }

    isSessionValid(sessionData) {
        if (!sessionData || !sessionData.expiresAt) {
            return false;
        }
        
        const expirationTime = new Date(sessionData.expiresAt);
        const currentTime = new Date();
        
        return currentTime < expirationTime;
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    setLoadingState(isLoading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        
        if (isLoading) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-flex';
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        const successText = successDiv.querySelector('span');
        
        successText.textContent = message;
        successDiv.style.display = 'flex';
    }

    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fallback toast notification system
    showToast(message, type = 'info', duration = 5000) {
        // Remove any existing toasts
        const existingToasts = document.querySelectorAll('.fallback-toast');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fallback-toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            max-width: 350px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInFromRight 0.3s ease-out;
        `;

        // Add icon
        const icon = document.createElement('i');
        icon.className = `fas fa-${this.getToastIcon(type)}`;
        toast.appendChild(icon);

        // Add message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        toast.appendChild(messageSpan);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
            padding: 0;
            opacity: 0.8;
        `;
        closeBtn.onclick = () => this.hideToast(toast);
        toast.appendChild(closeBtn);

        // Add CSS animation
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutToRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                .fallback-toast:hover {
                    transform: translateY(-2px);
                    transition: transform 0.2s ease;
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(toast);

        // Auto-hide
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        }
    }

    hideToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOutToRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    getToastColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    // Future Firebase integration methods
    async initializeFirebase() {
        // TODO: Initialize Firebase
        // import { initializeApp } from 'firebase/app';
        // import { getAuth } from 'firebase/auth';
        
        console.log('Firebase initialization will be implemented here');
    }

    async firebaseAuth(email, password) {
        // TODO: Firebase authentication
        // import { signInWithEmailAndPassword } from 'firebase/auth';
        
        console.log('Firebase authentication will be implemented here');
        return false;
    }
}

// Utility functions
function addShakeAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is loaded OR immediately if DOM is already loaded
function initializeLandingAuth() {
    console.log('Landing.js initializeLandingAuth called!');
    addShakeAnimation();
    console.log('Creating new LandingPageAuth instance...');
    new LandingPageAuth();
}

if (document.readyState === 'loading') {
    console.log('DOM still loading, adding event listener...');
    document.addEventListener('DOMContentLoaded', initializeLandingAuth);
} else {
    console.log('DOM already loaded, initializing immediately...');
    initializeLandingAuth();
}

console.log('Landing.js script finished loading');

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingPageAuth;
}