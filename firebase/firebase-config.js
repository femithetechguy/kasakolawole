/**
 * Firebase Configuration
 * Initialize Firebase services
 */

// Firebase configuration object
// Casa Kolawole Firebase Project
const firebaseConfig = {
    apiKey: "AIzaSyAvohjQO0w4uEje95ayMnlF4MW2Yd13B-g",
    authDomain: "casakolawole.firebaseapp.com",
    projectId: "casakolawole",
    storageBucket: "casakolawole.firebasestorage.app",
    messagingSenderId: "490571300795",
    appId: "1:490571300795:web:164b0bf42022fe98864e9e",
    measurementId: "G-W5R14J0CLW"
};

// Initialize Firebase
let firebaseApp;
let firebaseAuth;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Export Firebase instances
window.FirebaseAuth = {
    app: firebaseApp,
    auth: firebaseAuth,
    
    /**
     * Sign in with email and password
     */
    signInWithEmail: async function(email, password) {
        try {
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('✅ User signed in:', userCredential.user.email);
            return {
                success: true,
                user: {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: userCredential.user.displayName
                }
            };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    },
    
    /**
     * Sign up with email and password
     */
    signUpWithEmail: async function(email, password) {
        try {
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('✅ User created:', userCredential.user.email);
            return {
                success: true,
                user: {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email
                }
            };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    },
    
    /**
     * Sign out current user
     */
    signOut: async function() {
        try {
            await firebaseAuth.signOut();
            console.log('✅ User signed out');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.code };
        }
    },
    
    /**
     * Get current user
     */
    getCurrentUser: function() {
        return firebaseAuth.currentUser;
    },
    
    /**
     * Check if user is signed in
     */
    isSignedIn: function() {
        return firebaseAuth.currentUser !== null;
    },
    
    /**
     * Listen to auth state changes
     */
    onAuthStateChanged: function(callback) {
        return firebaseAuth.onAuthStateChanged(callback);
    },
    
    /**
     * Send password reset email
     */
    sendPasswordResetEmail: async function(email) {
        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            console.log('✅ Password reset email sent');
            return { success: true };
        } catch (error) {
            console.error('❌ Password reset error:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    },
    
    /**
     * Get user-friendly error messages
     */
    getErrorMessage: function(errorCode) {
        const errorMessages = {
            'auth/invalid-email': 'Invalid email address format.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account already exists with this email.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid credentials. Please check your email and password.'
        };
        
        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }
};

console.log('🔥 Firebase Auth module loaded');
