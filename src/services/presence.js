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
 * Force reset of all color assignments (for debugging or recovery)
 */
export function forceResetAllColors() {
  userColors.clear();
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
  // Also check against all base colors to avoid similar colors
  let isColorInUse = false;
  const usedColorsSet = new Set();

  // First, collect all currently used colors (including variations)
  for (const [otherUserId, color] of userColors) {
    usedColorsSet.add(color.toUpperCase());
  }

  // Check if the base color is already in use
  if (usedColorsSet.has(baseColor.toUpperCase())) {
    isColorInUse = true;
  }

  let assignedColor;

  // If color is available, assign it
  if (!isColorInUse) {
    assignedColor = baseColor;
  } else {
    // If color is in use, try to find an available color from the palette
    let foundAlternative = false;
    for (let i = 0; i < colors.length; i++) {
      const alternativeColor = colors[i];
      if (!usedColorsSet.has(alternativeColor.toUpperCase())) {
        assignedColor = alternativeColor;
        foundAlternative = true;
        break;
      }
    }

    // If all colors are used, generate a variation of the base color
    if (!foundAlternative) {
      assignedColor = generateColorVariation(baseColor, userId + '_var');
    }
  }

  // Store the assigned color for this user
  userColors.set(userId, assignedColor);
  return assignedColor;
}

/**
 * Generate a distinct color variation for collision resolution
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

  // Apply larger variation (±40-60) to ensure distinct colors
  const variation = Math.abs(hash) % 80 - 40; // -40 to +40

  // Apply different variation patterns based on hash to ensure diversity
  const hashPattern = Math.abs(hash) % 3;

  let newR, newG, newB;

  switch (hashPattern) {
    case 0: // Vary red and green more
      newR = Math.max(0, Math.min(255, r + variation));
      newG = Math.max(0, Math.min(255, g + (variation * 0.8)));
      newB = Math.max(0, Math.min(255, b + (variation * 0.3)));
      break;
    case 1: // Vary green and blue more
      newR = Math.max(0, Math.min(255, r + (variation * 0.3)));
      newG = Math.max(0, Math.min(255, g + variation));
      newB = Math.max(0, Math.min(255, b + (variation * 0.8)));
      break;
    case 2: // Vary all components equally but with different ratios
      newR = Math.max(0, Math.min(255, r + (variation * 0.7)));
      newG = Math.max(0, Math.min(255, g + (variation * 0.9)));
      newB = Math.max(0, Math.min(255, b + (variation * 0.5)));
      break;
    default:
      newR = Math.max(0, Math.min(255, r + variation));
      newG = Math.max(0, Math.min(255, g + variation));
      newB = Math.max(0, Math.min(255, b + variation));
  }

  // Ensure minimum difference from original color (at least 30 points difference in any component)
  const maxComponent = Math.max(newR, newG, newB);
  const minComponent = Math.min(newR, newG, newB);

  if (maxComponent - minComponent < 30) {
    // If colors are too similar, adjust to make them more distinct
    if (newR === maxComponent) newR = Math.min(255, newR + 20);
    if (newG === maxComponent) newG = Math.min(255, newG + 20);
    if (newB === maxComponent) newB = Math.min(255, newB + 20);
  }

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

