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

    // Set user as online (no status field needed since presence = online)
    await set(presenceRef, {
      userId,
      displayName: displayName || 'Anonymous',
      lastSeen: serverTimestamp(),
    });

  } catch (error) {
    throw error;
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

  } catch (error) {
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

        callback(presenceData);
      },
      (error) => {
        callback({});
      }
    );

    return unsubscribe;
  } catch (error) {
    return () => {}; // Return no-op unsubscribe function
  }
}

/**
 * Set up presence cleanup on disconnect
 * This ensures the user is removed from the presence list when they lose connection
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
    
    // Set up automatic removal on disconnect
    await onDisconnect(presenceRef).remove();

  } catch (error) {
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

  } catch (error) {
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
  } catch (error) {
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

