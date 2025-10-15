/**
 * Shapes Service
 * Handles CRUD operations and real-time synchronization for shapes in Firestore
 * All shapes are stored in the global /shapes/{shapeId} collection
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import { getUserId } from './auth';
import { generateId } from '../utils/helpers';
import { SHAPE_DEFAULTS, DEFAULT_SHAPE_COLOR, SHAPE_TYPES } from '../utils/constants';

/**
 * Create a new shape in Firestore
 * @param {object} shapeData - Shape properties (x, y, width, height, fill, etc.)
 * @returns {Promise<string>} Created shape ID
 * @throws {Error} Firestore error
 */
export async function createShape(shapeData) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create shapes');
    }

    // Prepare shape document with defaults
    const shape = {
      type: shapeData.type || SHAPE_TYPES.RECTANGLE,
      x: shapeData.x || 0,
      y: shapeData.y || 0,
      width: shapeData.width || SHAPE_DEFAULTS.WIDTH,
      height: shapeData.height || SHAPE_DEFAULTS.HEIGHT,
      fill: shapeData.fill || DEFAULT_SHAPE_COLOR,
      stroke: shapeData.stroke || '#333333',
      strokeWidth: shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH,
      cornerRadius: shapeData.cornerRadius || SHAPE_DEFAULTS.CORNER_RADIUS,
      opacity: shapeData.opacity ?? SHAPE_DEFAULTS.OPACITY,
      rotation: shapeData.rotation || 0,
      
      // Metadata
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lockedBy: null, // For object locking
      lockedAt: null,
    };

    // Add to Firestore
    const shapesRef = collection(db, COLLECTIONS.SHAPES);
    const docRef = await addDoc(shapesRef, shape);

    console.log('Shape created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating shape:', error);
    throw new Error(`Failed to create shape: ${error.message}`);
  }
}

/**
 * Update an existing shape in Firestore
 * @param {string} shapeId - Shape ID to update
 * @param {object} updates - Properties to update
 * @returns {Promise<void>}
 * @throws {Error} Firestore error
 */
export async function updateShape(shapeId, updates) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to update shapes');
    }

    // Check if shape is locked by another user
    const shapeRef = doc(db, COLLECTIONS.SHAPES, shapeId);
    const shapeDoc = await getDoc(shapeRef);
    
    if (!shapeDoc.exists()) {
      throw new Error('Shape not found');
    }

    const shapeData = shapeDoc.data();
    if (shapeData.lockedBy && shapeData.lockedBy !== userId) {
      throw new Error('Shape is locked by another user');
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Update in Firestore
    await updateDoc(shapeRef, updateData);

    console.log('Shape updated:', shapeId);
  } catch (error) {
    console.error('Error updating shape:', error);
    throw new Error(`Failed to update shape: ${error.message}`);
  }
}

/**
 * Delete a shape from Firestore
 * @param {string} shapeId - Shape ID to delete
 * @returns {Promise<void>}
 * @throws {Error} Firestore error
 */
export async function deleteShape(shapeId) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to delete shapes');
    }

    // Check if shape is locked by another user
    const shapeRef = doc(db, COLLECTIONS.SHAPES, shapeId);
    const shapeDoc = await getDoc(shapeRef);
    
    if (!shapeDoc.exists()) {
      throw new Error('Shape not found');
    }

    const shapeData = shapeDoc.data();
    if (shapeData.lockedBy && shapeData.lockedBy !== userId) {
      throw new Error('Shape is locked by another user');
    }

    // Delete from Firestore
    await deleteDoc(shapeRef);

    console.log('Shape deleted:', shapeId);
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw new Error(`Failed to delete shape: ${error.message}`);
  }
}

/**
 * Lock a shape for editing (prevents other users from editing)
 * First user to lock gets priority
 * @param {string} shapeId - Shape ID to lock
 * @returns {Promise<boolean>} True if lock was successful, false if already locked
 * @throws {Error} Firestore error
 */
export async function lockShape(shapeId) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to lock shapes');
    }

    const shapeRef = doc(db, COLLECTIONS.SHAPES, shapeId);
    const shapeDoc = await getDoc(shapeRef);
    
    if (!shapeDoc.exists()) {
      throw new Error('Shape not found');
    }

    const shapeData = shapeDoc.data();

    // Check if already locked by another user
    if (shapeData.lockedBy && shapeData.lockedBy !== userId) {
      console.log('Shape already locked by another user:', shapeData.lockedBy);
      return false;
    }

    // Lock the shape
    await updateDoc(shapeRef, {
      lockedBy: userId,
      lockedAt: serverTimestamp(),
    });

    console.log('Shape locked:', shapeId);
    return true;
  } catch (error) {
    console.error('Error locking shape:', error);
    throw new Error(`Failed to lock shape: ${error.message}`);
  }
}

/**
 * Unlock a shape (allow other users to edit)
 * @param {string} shapeId - Shape ID to unlock
 * @returns {Promise<void>}
 * @throws {Error} Firestore error
 */
export async function unlockShape(shapeId) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to unlock shapes');
    }

    const shapeRef = doc(db, COLLECTIONS.SHAPES, shapeId);
    const shapeDoc = await getDoc(shapeRef);
    
    if (!shapeDoc.exists()) {
      console.warn('Shape not found, may have been deleted:', shapeId);
      return;
    }

    const shapeData = shapeDoc.data();

    // Only the user who locked it can unlock it (or if it's not locked)
    if (!shapeData.lockedBy || shapeData.lockedBy === userId) {
      await updateDoc(shapeRef, {
        lockedBy: null,
        lockedAt: null,
      });

      console.log('Shape unlocked:', shapeId);
    } else {
      console.warn('Cannot unlock shape locked by another user');
    }
  } catch (error) {
    console.error('Error unlocking shape:', error);
    // Don't throw error for unlock failures (graceful degradation)
  }
}

/**
 * Subscribe to real-time updates for all shapes
 * @param {Function} callback - Called with array of shapes whenever data changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToShapes(callback) {
  try {
    const shapesRef = collection(db, COLLECTIONS.SHAPES);
    const q = query(shapesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shapes = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert Firestore Timestamps to JavaScript Date objects
          shapes.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
            lockedAt: data.lockedAt instanceof Timestamp ? data.lockedAt.toDate() : data.lockedAt,
          });
        });

        console.log('Shapes updated:', shapes.length);
        callback(shapes);
      },
      (error) => {
        console.error('Error subscribing to shapes:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up shapes subscription:', error);
    return () => {}; // Return no-op unsubscribe function
  }
}

/**
 * Get a single shape by ID (one-time read)
 * @param {string} shapeId - Shape ID
 * @returns {Promise<object|null>} Shape data or null if not found
 */
export async function getShape(shapeId) {
  try {
    const shapeRef = doc(db, COLLECTIONS.SHAPES, shapeId);
    const shapeDoc = await getDoc(shapeRef);
    
    if (!shapeDoc.exists()) {
      return null;
    }

    const data = shapeDoc.data();
    return {
      id: shapeDoc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      lockedAt: data.lockedAt instanceof Timestamp ? data.lockedAt.toDate() : data.lockedAt,
    };
  } catch (error) {
    console.error('Error getting shape:', error);
    throw new Error(`Failed to get shape: ${error.message}`);
  }
}

/**
 * Check if a shape is locked by another user
 * @param {object} shape - Shape object
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean} True if locked by another user
 */
export function isShapeLockedByOther(shape, currentUserId) {
  return shape.lockedBy && shape.lockedBy !== currentUserId;
}

/**
 * Check if a shape is locked by the current user
 * @param {object} shape - Shape object
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean} True if locked by current user
 */
export function isShapeLockedByMe(shape, currentUserId) {
  return shape.lockedBy === currentUserId;
}

/**
 * Clear all locks from all shapes (admin function)
 * Use this to fix orphaned locks when users disconnect unexpectedly
 * @returns {Promise<number>} Number of shapes unlocked
 */
export async function clearAllLocks() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to clear locks');
    }

    const shapesRef = collection(db, COLLECTIONS.SHAPES);
    const q = query(shapesRef);
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      const shape = doc.data();
      if (shape.lockedBy) {
        batch.update(doc.ref, {
          lockedBy: null,
          lockedAt: null,
        });
        count++;
      }
    });

    await batch.commit();
    console.log(`Cleared locks from ${count} shapes`);
    return count;
  } catch (error) {
    console.error('Error clearing all locks:', error);
    throw new Error(`Failed to clear locks: ${error.message}`);
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
      throw new Error('User ID is required to unlock shapes');
    }

    const shapesRef = collection(db, COLLECTIONS.SHAPES);
    const snapshot = await getDocs(shapesRef);
    
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      const shape = doc.data();
      if (shape.lockedBy === targetUserId) {
        batch.update(doc.ref, {
          lockedBy: null,
          lockedAt: null,
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Unlocked ${count} shapes for user: ${targetUserId}`);
    }
    
    return count;
  } catch (error) {
    console.error('Error unlocking shapes for user:', error);
    throw new Error(`Failed to unlock shapes: ${error.message}`);
  }
}

/**
 * Unlock all shapes locked by the current user (cleanup on disconnect)
 * @returns {Promise<void>}
 */
export async function unlockAllMyShapes() {
  try {
    const userId = getUserId();
    if (!userId) return;

    console.log('Unlocking all shapes for current user:', userId);
    await unlockShapesForUser(userId);
  } catch (error) {
    console.error('Error unlocking all shapes:', error);
  }
}

/**
 * Clear all shapes from the canvas (delete all shapes)
 * Uses batch writes for efficiency
 * @returns {Promise<void>}
 */
export async function clearAllShapes() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to clear shapes');
    }

    // Get all shapes
    const shapesRef = collection(db, COLLECTIONS.SHAPES);
    const snapshot = await getDocs(shapesRef);

    if (snapshot.empty) {
      console.log('No shapes to clear');
      return;
    }

    // Use batch write for efficiency (max 500 operations per batch)
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`Cleared ${count} shapes from canvas`);
  } catch (error) {
    console.error('Error clearing shapes:', error);
    throw new Error(`Failed to clear shapes: ${error.message}`);
  }
}

