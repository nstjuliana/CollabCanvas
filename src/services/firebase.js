import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

// Firestore collections and paths
export const COLLECTIONS = {
  SHAPES: 'shapes' // Global shapes collection: /shapes/{shapeId}
};

// Realtime Database paths
export const RTDB_PATHS = {
  CURSORS: 'cursors',   // /cursors/{userId}
  PRESENCE: 'presence'  // /presence/{userId}
};

/**
 * Monitor Firebase Realtime Database connection status
 * @param {Function} callback - Called with connection status (true/false)
 * @returns {Function} Unsubscribe function
 */
export function onConnectionStateChange(callback) {
  try {
    const connectedRef = ref(rtdb, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      console.log('Firebase connection status:', isConnected ? 'Connected' : 'Disconnected');
      callback(isConnected);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up connection monitoring:', error);
    // Return no-op function if monitoring fails
    return () => {};
  }
}

/**
 * Get current connection status (one-time check)
 * Note: This uses the subscription method but unsubscribes after first value
 * @returns {Promise<boolean>} Connection status
 */
export function getConnectionStatus() {
  return new Promise((resolve) => {
    try {
      const connectedRef = ref(rtdb, '.info/connected');
      const unsubscribe = onValue(connectedRef, (snapshot) => {
        unsubscribe();
        resolve(snapshot.val() === true);
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
      resolve(false);
    }
  });
}

export default app;

