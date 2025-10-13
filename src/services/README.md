# Services Module

This module contains service layer functions for interacting with Firebase and other external services.

## Files

### firebase.js
Firebase initialization and configuration.

**Exports:**
- `app` - Firebase app instance
- `auth` - Firebase Authentication instance
- `db` - Firestore database instance
- `rtdb` - Realtime Database instance
- `COLLECTIONS` - Firestore collection names
- `RTDB_PATHS` - Realtime Database path constants

### auth.js
Authentication service using Firebase Auth.

**Core Functions:**
- `signup(email, password)` - Create new user account
- `login(email, password)` - Sign in existing user
- `logout()` - Sign out current user
- `getCurrentUser()` - Get current authenticated user
- `onAuthStateChanged(callback)` - Subscribe to auth state changes

**Additional Functions:**
- `sendPasswordReset(email)` - Send password reset email
- `updateDisplayName(displayName)` - Update user's display name
- `changePassword(currentPassword, newPassword)` - Change user password
- `reauthenticate(password)` - Re-authenticate for sensitive operations
- `waitForAuth(timeout)` - Wait for auth initialization

**Utility Functions:**
- `isAuthenticated()` - Check if user is logged in
- `getUserId()` - Get current user ID
- `getUserEmail()` - Get current user email
- `getUserDisplayName()` - Get current user display name

## Usage Examples

### Authentication

```javascript
import { signup, login, logout, onAuthStateChanged, getCurrentUser } from './services/auth';

// Sign up a new user
try {
  const result = await signup('user@example.com', 'password123');
  console.log('Signed up:', result.user);
} catch (error) {
  console.error('Signup failed:', error.message);
}

// Log in existing user
try {
  const result = await login('user@example.com', 'password123');
  console.log('Logged in:', result.user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Log out
await logout();

// Get current user (synchronous)
const user = getCurrentUser();
if (user) {
  console.log('Current user:', user.email);
}

// Listen for auth state changes
const unsubscribe = onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('User logged out');
  }
});

// Later: unsubscribe when component unmounts
unsubscribe();
```

### In React Components

```javascript
import { useEffect, useState } from 'react';
import { onAuthStateChanged, login, logout } from './services/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to auth changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```

### Firebase Configuration

```javascript
import { db, rtdb, COLLECTIONS, RTDB_PATHS } from './services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

// Add document to Firestore
const shapesRef = collection(db, COLLECTIONS.SHAPES);
await addDoc(shapesRef, {
  x: 100,
  y: 100,
  width: 50,
  height: 50,
});

// Update Realtime Database
const cursorRef = ref(rtdb, `${RTDB_PATHS.CURSORS}/${userId}`);
await set(cursorRef, {
  x: 200,
  y: 150,
  timestamp: Date.now(),
});
```

## Error Handling

All auth functions throw user-friendly error messages:

```javascript
import { login } from './services/auth';

try {
  await login(email, password);
} catch (error) {
  // Error messages are already user-friendly:
  // - "Invalid email or password."
  // - "This email is already registered."
  // - "Password is too weak."
  alert(error.message);
}
```

## Authentication Flow

1. **App Initialization**: Use `onAuthStateChanged` to detect auth state
2. **User Login/Signup**: Call `login()` or `signup()`
3. **Protected Actions**: Check `isAuthenticated()` before sensitive operations
4. **User Logout**: Call `logout()` when user wants to sign out

## Security Notes

- Passwords must be at least 6 characters (Firebase requirement)
- User display names are automatically set from email username
- All sensitive operations are handled securely by Firebase
- Re-authentication required for password changes

## Next Services

Future services to be implemented:
- `shapes.js` - Shape CRUD operations with Firestore
- `cursors.js` - Real-time cursor tracking with RTDB
- `presence.js` - User presence/online status with RTDB

