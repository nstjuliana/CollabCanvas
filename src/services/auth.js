/**
 * Authentication Service
 * Handles user authentication using Firebase Auth
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth } from './firebase';
import { getUsernameFromEmail, getFirebaseErrorMessage } from '../utils/helpers';
import { AUTH_CONFIG } from '../utils/constants';

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User credential object
 * @throws {Error} Firebase auth error
 */
export async function signup(email, password) {
  try {
    // Validate password length
    if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    }

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set display name from email
    const username = getUsernameFromEmail(email);
    await updateProfile(user, {
      displayName: username,
    });

    console.log('User signed up successfully:', user.uid);

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: username,
      },
      credential: userCredential,
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Log in an existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User credential object
 * @throws {Error} Firebase auth error
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('User logged in successfully:', user.uid);

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || getUsernameFromEmail(user.email),
      },
      credential: userCredential,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Log out the current user
 * @returns {Promise<void>}
 * @throws {Error} Firebase auth error
 */
export async function logout() {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Get the currently authenticated user
 * @returns {object|null} Current user object or null if not authenticated
 */
export function getCurrentUser() {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || getUsernameFromEmail(user.email),
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime,
    lastLoginAt: user.metadata.lastSignInTime,
  };
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || getUsernameFromEmail(user.email),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
      });
    } else {
      // User is signed out
      callback(null);
    }
  });
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 * @throws {Error} Firebase auth error
 */
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Update user's display name
 * @param {string} displayName - New display name
 * @returns {Promise<void>}
 * @throws {Error} Firebase auth error
 */
export async function updateDisplayName(displayName) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    await updateProfile(user, { displayName });
    console.log('Display name updated to:', displayName);
  } catch (error) {
    console.error('Update display name error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Re-authenticate user with their password (required for sensitive operations)
 * @param {string} password - User's current password
 * @returns {Promise<void>}
 * @throws {Error} Firebase auth error
 */
export async function reauthenticate(password) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    console.log('User re-authenticated successfully');
  } catch (error) {
    console.error('Re-authentication error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Change user's password (requires recent authentication)
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 * @throws {Error} Firebase auth error
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    // Validate new password length
    if (newPassword.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    }

    // Re-authenticate first
    await reauthenticate(currentPassword);

    // Update password
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    await updatePassword(user, newPassword);
    console.log('Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
}

/**
 * Check if a user is currently authenticated
 * @returns {boolean} True if user is authenticated
 */
export function isAuthenticated() {
  return auth.currentUser !== null;
}

/**
 * Get user ID of currently authenticated user
 * @returns {string|null} User ID or null if not authenticated
 */
export function getUserId() {
  return auth.currentUser?.uid || null;
}

/**
 * Get user email of currently authenticated user
 * @returns {string|null} User email or null if not authenticated
 */
export function getUserEmail() {
  return auth.currentUser?.email || null;
}

/**
 * Get user display name of currently authenticated user
 * @returns {string|null} Display name or null if not authenticated
 */
export function getUserDisplayName() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.displayName || getUsernameFromEmail(user.email);
}

/**
 * Wait for auth to initialize (useful for checking auth state on app load)
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<object|null>} Current user or null
 */
export function waitForAuth(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Auth initialization timeout'));
    }, timeout);

    const unsubscribe = onAuthStateChanged((user) => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });
  });
}

// Export auth instance for direct access if needed
export { auth };

