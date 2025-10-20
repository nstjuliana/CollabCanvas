/**
 * Shape Locks Service (RTDB)
 * Handles real-time shape locking using Firebase Realtime Database
 * 
 * Benefits of RTDB for locks:
 * - Automatic cleanup via onDisconnect()
 * - Lower latency than Firestore
 * - No orphaned locks when users disconnect
 */

import { ref, set, remove, onValue, onDisconnect, get, update } from 'firebase/database';
import { rtdb } from './firebase';
import { getUserId } from './auth';

/**
 * Lock one or more shapes
 * @param {string|string[]} shapeIds - Shape ID(s) to lock
 * @returns {Promise<string[]>} Array of successfully locked shape IDs
 */
export async function lockShapes(shapeIds) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to lock shapes');
    }

    const idsArray = Array.isArray(shapeIds) ? shapeIds : [shapeIds];
    
    // First, read all locks to check which can be locked
    const locksRef = ref(rtdb, 'shapeLocks');
    const snapshot = await get(locksRef);
    const existingLocks = snapshot.val() || {};
    
    // Filter to only shapes that can be locked
    const lockableIds = idsArray.filter(shapeId => {
      const existingLock = existingLocks[shapeId];
      return !existingLock || existingLock.userId === userId;
    });

    if (lockableIds.length === 0) {
      return [];
    }

    // Build multi-path update object (atomic operation)
    const updates = {};
    lockableIds.forEach(shapeId => {
      updates[`shapeLocks/${shapeId}`] = {
        userId,
        lockedAt: Date.now()
      };
    });

    // Single atomic update for all locks
    await update(ref(rtdb), updates);

    // Set up automatic cleanup on disconnect for each lock
    lockableIds.forEach(shapeId => {
      const lockRef = ref(rtdb, `shapeLocks/${shapeId}`);
      onDisconnect(lockRef).remove();
    });

    return lockableIds;
  } catch (error) {
    console.error('Error locking shapes:', error);
    throw new Error(`Failed to lock shape(s): ${error.message}`);
  }
}

/**
 * Unlock one or more shapes
 * @param {string|string[]} shapeIds - Shape ID(s) to unlock
 * @returns {Promise<void>}
 */
export async function unlockShapes(shapeIds) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to unlock shapes');
    }

    const idsArray = Array.isArray(shapeIds) ? shapeIds : [shapeIds];

    // Read all locks to check ownership
    const locksRef = ref(rtdb, 'shapeLocks');
    const snapshot = await get(locksRef);
    const existingLocks = snapshot.val() || {};
    
    // Filter to only shapes that can be unlocked by this user
    const unlockableIds = idsArray.filter(shapeId => {
      const existingLock = existingLocks[shapeId];
      return !existingLock || existingLock.userId === userId;
    });

    if (unlockableIds.length === 0) {
      return;
    }

    // Build multi-path update object (set to null to remove)
    const updates = {};
    unlockableIds.forEach(shapeId => {
      updates[`shapeLocks/${shapeId}`] = null;
    });

    // Single atomic update to remove all locks
    await update(ref(rtdb), updates);
  } catch (error) {
    console.error('Error unlocking shapes:', error);
    // Don't throw - graceful degradation for unlock failures
  }
}

/**
 * Subscribe to all shape locks
 * @param {Function} callback - Called with lock data whenever it changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToShapeLocks(callback) {
  try {
    const locksRef = ref(rtdb, 'shapeLocks');
    
    const unsubscribe = onValue(locksRef, (snapshot) => {
      const locks = snapshot.val() || {};
      callback(locks);
    }, (error) => {
      console.error('Error subscribing to locks:', error);
      callback({});
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up lock subscription:', error);
    return () => {}; // Return no-op unsubscribe
  }
}

/**
 * Unlock all shapes locked by a specific user
 * @param {string} targetUserId - User ID whose locks to clear
 * @returns {Promise<number>} Number of shapes unlocked
 */
export async function unlockShapesForUser(targetUserId) {
  try {
    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    const locksRef = ref(rtdb, 'shapeLocks');
    const snapshot = await get(locksRef);
    const locks = snapshot.val() || {};
    
    let count = 0;
    const unlockPromises = [];

    for (const [shapeId, lockData] of Object.entries(locks)) {
      if (lockData.userId === targetUserId) {
        const lockRef = ref(rtdb, `shapeLocks/${shapeId}`);
        unlockPromises.push(remove(lockRef));
        count++;
      }
    }

    await Promise.all(unlockPromises);
    
    return count;
  } catch (error) {
    console.error('Error unlocking shapes for user:', error);
    throw new Error(`Failed to unlock shapes: ${error.message}`);
  }
}

/**
 * Clear all locks (admin function)
 * @returns {Promise<number>} Number of locks cleared
 */
export async function clearAllLocks() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    const locksRef = ref(rtdb, 'shapeLocks');
    const snapshot = await get(locksRef);
    const locks = snapshot.val() || {};
    
    const count = Object.keys(locks).length;
    
    if (count > 0) {
      await remove(locksRef);
    }
    
    return count;
  } catch (error) {
    console.error('Error clearing all locks:', error);
    throw new Error(`Failed to clear locks: ${error.message}`);
  }
}

/**
 * Check if a shape is locked by another user
 * @param {string} shapeId - Shape ID
 * @param {object} locks - Locks object from RTDB
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean}
 */
export function isShapeLockedByOther(shapeId, locks, currentUserId) {
  const lock = locks[shapeId];
  return lock && lock.userId !== currentUserId;
}

/**
 * Check if a shape is locked by the current user
 * @param {string} shapeId - Shape ID
 * @param {object} locks - Locks object from RTDB
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean}
 */
export function isShapeLockedByMe(shapeId, locks, currentUserId) {
  const lock = locks[shapeId];
  return lock && lock.userId === currentUserId;
}

