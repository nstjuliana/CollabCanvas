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
import { getUserColor, PRESENCE_COLORS } from '../utils/constants';

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

// Global cache to track used colors and ensure uniqueness
const usedColors = new Map();
const userColors = new Map(); // Maps userId to color for persistence

/**
 * Reset the color cache (useful for testing or when users disconnect)
 */
export function resetColorCache() {
  usedColors.clear();
  userColors.clear();
}

/**
 * Remove a specific user's color from the cache when they disconnect
 * @param {string} userId - User ID whose color should be freed
 */
export function removeUserColor(userId) {
  userColors.delete(userId);
  // Note: We don't remove from usedColors as other users might still be using it
}

/**
 * Get a color for a user's presence indicator based on their userId
 * Ensures color uniqueness by tracking used colors
 * @param {string} userId - User ID
 * @param {Array<string>} colors - Array of available colors
 * @returns {string} Hex color code
 */
export function getUserPresenceColor(userId, colors = PRESENCE_COLORS) {
  // If we've already assigned a color to this user, return it
  if (userColors.has(userId)) {
    return userColors.get(userId);
  }

  // Use the shared color assignment function
  const baseColor = getUserColor(userId, colors);

  // Check if this color is currently in use by any active user
  let isColorInUse = false;
  for (const [otherUserId, color] of userColors) {
    if (color.toUpperCase() === baseColor.toUpperCase()) {
      isColorInUse = true;
      break;
    }
  }

  if (!isColorInUse) {
    // Color is available, assign it
    userColors.set(userId, baseColor);
    return baseColor;
  }

  // If color is in use, generate a variation
  const variedColor = generateColorVariation(baseColor, userId + '_var');
  userColors.set(userId, variedColor);
  return variedColor;
}

/**
 * Generate a slight color variation for collision resolution
 * @param {string} baseColor - Hex color code
 * @param {string} userId - User ID for variation seed
 * @returns {string} Varied hex color code
 */
function generateColorVariation(baseColor, userId) {
  // Convert hex to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Generate variation based on userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
  }

  // Apply small variation (±20) to each RGB component
  const variation = Math.abs(hash) % 40 - 20; // -20 to +20
  const newR = Math.max(0, Math.min(255, r + variation));
  const newG = Math.max(0, Math.min(255, g + (variation * 0.7))); // Less variation on green
  const newB = Math.max(0, Math.min(255, b + (variation * 0.5))); // Even less on blue

  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

/**
 * Get a unique key for a color (for collision detection)
 * @param {string} color - Hex color code
 * @returns {string} Color key
 */
function getColorKey(color) {
  // Normalize color to uppercase for consistent comparison
  return color.toUpperCase();
}

