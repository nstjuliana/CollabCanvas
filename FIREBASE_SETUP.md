# Firebase Setup Guide

Follow these steps to set up Firebase for CollabCanvas:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `collabcanvas` (or your preferred name)
4. Accept the terms and click "Continue"
5. Disable Google Analytics (optional for MVP)
6. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

## 3. Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click "Create database"
3. Select **Start in test mode** (we'll deploy rules later)
4. Choose a location (select closest to your users)
5. Click "Enable"

## 4. Create Realtime Database

1. Go to **Build > Realtime Database**
2. Click "Create Database"
3. Select a location (use same as Firestore)
4. Start in **locked mode** (we'll deploy rules later)
5. Click "Enable"

## 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`) to add a web app
4. Register app with nickname: `collabcanvas-web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the `firebaseConfig` object values

## 6. Configure Environment Variables

1. In your project root, create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values with your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. Save the file (this file is gitignored)

## 7. Deploy Security Rules (Optional - After Development)

When ready to deploy security rules:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy rules
firebase deploy --only firestore:rules,database
```

## 8. Verify Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Check browser console for any Firebase errors
3. You should see no Firebase initialization errors

## Database Structure

### Firestore (Persistent Data)
- `/shapes/{shapeId}` - All canvas shapes (global collection)
  - Fields: `x`, `y`, `width`, `height`, `color`, `createdBy`, `lockedBy`, `createdAt`, `updatedAt`

### Realtime Database (Ephemeral Data)
- `/cursors/{userId}` - User cursor positions
  - Fields: `x`, `y`, `username`, `color`, `timestamp`
- `/presence/{userId}` - User online/offline status
  - Fields: `online`, `username`, `lastSeen`

## Troubleshooting

- **"Firebase: Error (auth/configuration-not-found)"**: Check your `.env.local` file exists and has correct values
- **"Firebase: Error (auth/api-key-not-valid)"**: Verify your API key in Firebase Console
- **Permission denied**: Make sure authentication is enabled and you're logged in
- **Database URL missing**: Ensure Realtime Database is created and URL is in `.env.local`

## Next Steps

Once Firebase is configured, you can proceed with implementing authentication (Task 4).

