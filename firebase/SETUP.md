# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Kasa Kolawole application.

## Prerequisites

- A Google account
- Access to Firebase Console

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter your project name (e.g., "kasa-kolawole")
4. Click **Continue**
5. (Optional) Enable Google Analytics
6. Click **Create project**
7. Wait for the project to be created, then click **Continue**

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (</>) to add Firebase to your web app
2. Register app:
   - **App nickname**: "Kasa Kolawole Web" (or any name you prefer)
   - **Firebase Hosting**: Check this box if you plan to use Firebase Hosting
3. Click **Register app**
4. You'll see your Firebase configuration object - **SAVE THIS**

## Step 3: Enable Email/Password Authentication

1. In the Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started** if this is your first time
3. Click on the **Sign-in method** tab
4. Click on **Email/Password**
5. **Enable** the first toggle (Email/Password)
6. Click **Save**

## Step 4: Create Your First User

1. Still in **Authentication**, click on the **Users** tab
2. Click **Add user**
3. Enter:
   - **Email**: Your email address
   - **Password**: A secure password (minimum 6 characters)
4. Click **Add user**

## Step 5: Update Firebase Configuration

1. Open the file: `assets/js/firebase-config.js`

2. Replace the placeholder values with your actual Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",                    // Replace with your API key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // Replace with your auth domain
    projectId: "YOUR_PROJECT_ID",              // Replace with your project ID
    storageBucket: "YOUR_PROJECT_ID.appspot.com",   // Replace with your storage bucket
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // Replace with your sender ID
    appId: "YOUR_APP_ID"                       // Replace with your app ID
};
```

3. Example of what it should look like:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC8x9F_abc123xyz789...",
    authDomain: "kasa-kolawole.firebaseapp.com",
    projectId: "kasa-kolawole",
    storageBucket: "kasa-kolawole.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123xyz789..."
};
```

## Step 6: Test the Authentication

1. Save all your changes
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Add Firebase Authentication"
   git push origin develop
   ```

3. Once deployed, visit your site and try logging in with:
   - **Email**: The email you created in Step 4
   - **Password**: The password you set

## Features Implemented

✅ **Email/Password Authentication**
- Sign in with email and password
- Automatic Firebase authentication
- Falls back to local authentication if Firebase is unavailable

✅ **Session Management**
- Firebase handles authentication state
- Session persists across page refreshes
- Secure sign out

✅ **Error Handling**
- User-friendly error messages
- Network error handling
- Invalid credential detection

## Firebase Security Rules (Optional)

For additional security, you can set up Firestore rules in the Firebase Console:

1. Go to **Firestore Database** > **Rules**
2. Use these basic rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Issue: "Firebase is not defined"
- Make sure Firebase SDK scripts are loaded before firebase-config.js
- Check the browser console for script loading errors

### Issue: "Invalid credentials"
- Verify the user exists in Firebase Console > Authentication > Users
- Check that Email/Password authentication is enabled
- Ensure password is at least 6 characters

### Issue: "Network error"
- Check your internet connection
- Verify Firebase project is active in Firebase Console
- Check browser console for CORS errors

## Fallback Authentication

If Firebase is not configured or unavailable, the app will automatically fall back to the local authentication using:
- **Username**: admin
- **Password**: admin

To disable fallback, remove or comment out the fallback code in `landing/landing.js`.

## Next Steps

- [ ] Add user registration form
- [ ] Implement password reset functionality  
- [ ] Add social authentication (Google, GitHub, etc.)
- [ ] Set up user profiles
- [ ] Add email verification

## Support

For more information, visit:
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase JavaScript SDK Reference](https://firebase.google.com/docs/reference/js/auth)
