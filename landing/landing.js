// Landing Page JavaScript
// Uses global utilities from assets/js/global.js

class LandingPageAuth {
    constructor() {
        this.config = null;
        this.app = window.KasaKolawole || {};
        this.init();
    }

    async init() {
        try {
            // Load configuration
            await this.loadConfig();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Check if user is already logged in
            this.checkExistingSession();
            
            console.log('Landing page initialized successfully');
        } catch (error) {
            console.error('Error initializing landing page:', error);
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
        } catch (error) {
            console.warn('Could not load landing config, using defaults');
            this.config = {
                auth: {
                    username: 'admin',
                    password: 'admin',
                    redirectUrl: 'home/index.html',
                    sessionTimeout: 3600000,
                    maxAttempts: 3
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

        // Auto-fill demo credentials (for development)
        this.addDemoCredentialsFill();

        // Enter key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) loginBtn.click();
            }
        });
    }

    addDemoCredentialsFill() {
        const demoCard = document.querySelector('.demo-card');
        if (demoCard) {
            demoCard.addEventListener('click', () => {
                document.getElementById('username').value = 'admin';
                document.getElementById('password').value = 'admin';
                
                // Add visual feedback
                const inputs = [document.getElementById('username'), document.getElementById('password')];
                inputs.forEach(input => {
                    input.style.background = '#e8f5e8';
                    setTimeout(() => {
                        input.style.background = '';
                    }, 1000);
                });
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!username || !password) {
            this.showError('Please enter both username and password');
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

            if (isAuthenticated) {
                this.handleSuccessfulLogin(username, rememberMe);
            } else {
                this.handleFailedLogin();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    async authenticateUser(username, password) {
        // For now, use simple credential check
        // TODO: Integrate with Firebase Authentication
        const validUsername = this.config.auth.username;
        const validPassword = this.config.auth.password;

        // Simulate Firebase authentication
        if (username === validUsername && password === validPassword) {
            return true;
        }

        // In future, this will call Firebase Auth
        // return await this.firebaseAuth(username, password);
        
        return false;
    }

    handleSuccessfulLogin(username, rememberMe) {
        // Create session using global storage utility if available
        const sessionData = {
            username: username,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.config.auth.sessionTimeout).toISOString(),
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

        // Show success message using global notification if available
        if (this.app.notify) {
            this.app.notify.success('Login successful! Redirecting...');
        } else {
            this.showSuccess('Login successful! Redirecting...');
        }

        // Redirect after delay
        setTimeout(() => {
            window.location.href = this.config.auth.redirectUrl || 'home/index.html';
        }, 1500);
    }

    handleFailedLogin() {
        // Use global notification if available
        if (this.app.notify) {
            this.app.notify.error('Invalid username or password. Please try again.');
        } else {
            this.showError('Invalid username or password. Please try again.');
        }
        
        // Clear password field
        document.getElementById('password').value = '';
        document.getElementById('password').focus();

        // Add shake animation
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
            // User is already logged in, redirect
            this.showSuccess('Welcome back! Redirecting...');
            setTimeout(() => {
                window.location.href = this.config.auth.redirectUrl || 'home/index.html';
            }, 1000);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addShakeAnimation();
    new LandingPageAuth();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingPageAuth;
}