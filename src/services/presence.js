/**
 * Presence Service
 * Handles user online/offline status tracking using Firebase Realtime Database
 * Presence data is stored at /presence/{userId}
 */

import {
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { rtdb, RTDB_PATHS } from './firebase';
import { getUserId, getUserDisplayName } from './auth';

/**
 * Set the current user as online in the Realtime Database
 * @returns {Promise<void>}
 * @throws {Error} Database error
 */
export async function setUserOnline() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to set online status');
    }

    const displayName = getUserDisplayName();
    const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);

    // Set user as online
    await set(presenceRef, {
      userId,
      displayName: displayName || 'Anonymous',
      status: 'online',
      lastSeen: serverTimestamp(),
    });

    console.log('User set to online:', userId);
  } catch (error) {
    console.error('Error setting user online:', error);
    throw error;
  }
}

/**
 * Set the current user as offline in the Realtime Database
 * @returns {Promise<void>}
 */
export async function setUserOffline() {
  try {
    const userId = getUserId();
    if (!userId) return;

    const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);
    
    // Set user as offline (or remove completely)
    await set(presenceRef, {
      userId,
      displayName: getUserDisplayName() || 'Anonymous',
      status: 'offline',
      lastSeen: serverTimestamp(),
    });

    console.log('User set to offline:', userId);
  } catch (error) {
    console.error('Error setting user offline:', error);
    // Don't throw error for offline status (graceful degradation)
  }
}

/**
 * Remove the current user's presence data from the database
 * @returns {Promise<void>}
 */
export async function removePresence() {
  try {
    const userId = getUserId();
    if (!userId) return;

    const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);
    await remove(presenceRef);

    console.log('Presence removed for user:', userId);
  } catch (error) {
    console.error('Error removing presence:', error);
    // Don't throw error for presence removal (graceful degradation)
  }
}

/**
 * Subscribe to all users' presence status
 * @param {Function} callback - Called with presence data whenever it changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPresence(callback) {
  try {
    const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);

    const unsubscribe = onValue(
      presenceRef,
      (snapshot) => {
        const presenceData = {};
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Convert to object of presence data
          Object.entries(data).forEach(([userId, userData]) => {
            presenceData[userId] = {
              userId,
              ...userData,
            };
          });
        }

        console.log('Presence updated:', Object.keys(presenceData).length, 'users');
        callback(presenceData);
      },
      (error) => {
        console.error('Error subscribing to presence:', error);
        callback({});
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up presence subscription:', error);
    return () => {}; // Return no-op unsubscribe function
  }
}

/**
 * Set up presence cleanup on disconnect
 * This ensures the user is marked offline when they lose connection
 * Should be called once when the user logs in or connects
 * @returns {Promise<void>}
 */
export async function setupPresenceCleanup() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to set up presence cleanup');
    }

    const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);
    
    // Set up automatic status change on disconnect
    await onDisconnect(presenceRef).set({
      userId,
      displayName: getUserDisplayName() || 'Anonymous',
      status: 'offline',
      lastSeen: serverTimestamp(),
    });

    console.log('Presence cleanup configured for user:', userId);
  } catch (error) {
    console.error('Error setting up presence cleanup:', error);
    // Don't throw error for cleanup setup (graceful degradation)
  }
}

/**
 * Initialize presence tracking for the current user
 * Sets up disconnect handlers and sets user as online
 * @returns {Promise<void>}
 */
export async function initializePresence() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to initialize presence');
    }

    // Set up cleanup on disconnect first
    await setupPresenceCleanup();

    // Then set user as online
    await setUserOnline();

    console.log('Presence initialized for user:', userId);
  } catch (error) {
    console.error('Error initializing presence:', error);
    throw error;
  }
}

/**
 * Clean up presence when user logs out or navigates away
 * @returns {Promise<void>}
 */
export async function cleanupPresence() {
  try {
    // Remove presence data completely on logout
    await removePresence();
    console.log('Presence cleaned up');
  } catch (error) {
    console.error('Error cleaning up presence:', error);
  }
}

/**
 * Get a color for a user's presence indicator based on their userId
 * @param {string} userId - User ID
 * @param {Array<string>} colors - Array of available colors
 * @returns {string} Hex color code
 */
export function getUserPresenceColor(userId, colors) {
  // Simple hash function to consistently assign colors to users
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

