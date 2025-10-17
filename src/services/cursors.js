/**
 * Cursors Service
 * Handles real-time cursor position tracking using Firebase Realtime Database
 * Cursors are stored at /cursors/{userId}
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
 * Publish the current user's cursor position to the Realtime Database
 * @param {number} x - X coordinate (canvas space)
 * @param {number} y - Y coordinate (canvas space)
 * @returns {Promise<void>}
 * @throws {Error} Database error
 */
export async function updateCursorPosition(x, y) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to update cursor position');
    }

    const displayName = getUserDisplayName();
    const cursorRef = ref(rtdb, `${RTDB_PATHS.CURSORS}/${userId}`);

    // Update cursor position
    await set(cursorRef, {
      x,
      y,
      userId,
      displayName: displayName || 'Anonymous',
      lastUpdate: serverTimestamp(),
    });
  } catch (error) {
    // Don't throw error for cursor updates (graceful degradation)
  }
}

/**
 * Subscribe to all users' cursor positions
 * @param {Function} callback - Called with cursor data whenever it changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCursors(callback) {
  try {
    const currentUserId = getUserId();
    const cursorsRef = ref(rtdb, RTDB_PATHS.CURSORS);

    const unsubscribe = onValue(
      cursorsRef,
      (snapshot) => {
        const cursors = {};
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Convert to array of cursor objects, excluding current user's cursor
          Object.entries(data).forEach(([userId, cursorData]) => {
            // Skip current user's cursor (we show native cursor for them)
            if (userId !== currentUserId) {
              cursors[userId] = {
                userId,
                ...cursorData,
              };
            }
          });
        }

        callback(cursors);
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
 * Remove the current user's cursor from the database
 * @returns {Promise<void>}
 */
export async function removeCursor() {
  try {
    const userId = getUserId();
    if (!userId) return;

    const cursorRef = ref(rtdb, `${RTDB_PATHS.CURSORS}/${userId}`);
    await remove(cursorRef);

  } catch (error) {
    // Don't throw error for cursor removal (graceful degradation)
  }
}

/**
 * Set up cursor cleanup on disconnect
 * This ensures the cursor is removed when the user loses connection
 * Should be called once when the user logs in or connects
 * @returns {Promise<void>}
 */
export async function setupCursorCleanup() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to set up cursor cleanup');
    }

    const cursorRef = ref(rtdb, `${RTDB_PATHS.CURSORS}/${userId}`);
    
    // Set up automatic removal on disconnect
    await onDisconnect(cursorRef).remove();

  } catch (error) {
    // Don't throw error for cleanup setup (graceful degradation)
  }
}

/**
 * Initialize cursor tracking for the current user
 * Sets up disconnect handlers and initial cursor state
 * @returns {Promise<void>}
 */
export async function initializeCursor() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to initialize cursor');
    }

    // Set up cleanup on disconnect
    await setupCursorCleanup();

  } catch (error) {
    // Don't throw error for cursor initialization (graceful degradation)
  }
}

/**
 * Clean up cursor when user logs out or navigates away
 * @returns {Promise<void>}
 */
export async function cleanupCursor() {
  try {
    await removeCursor();
  } catch (error) {
  }
}

/**
 * Get a color for a user's cursor based on their userId
 * @param {string} userId - User ID
 * @param {Array<string>} colors - Array of available colors
 * @returns {string} Hex color code
 */
export function getUserCursorColor(userId, colors) {
  // Simple hash function to consistently assign colors to users
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

