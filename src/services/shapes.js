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
import { buildShapeObject } from '../utils/shapeBuilders';

/**
 * Create one or more shapes in Firestore
 * @param {object|Array<object>} shapeData - Single shape or array of shapes
 * @returns {Promise<string|Array<string>>} Created shape ID(s)
 * @throws {Error} Firestore error
 */
export async function createShapes(shapeData) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create shapes');
    }

    // Normalize to array for consistent processing
    const isArray = Array.isArray(shapeData);
    const shapesArray = isArray ? shapeData : [shapeData];

    // Use batch write for efficiency (works for single or multiple)
    const batch = writeBatch(db);
    const shapeIds = [];
    const shapesRef = collection(db, COLLECTIONS.SHAPES);

    for (const data of shapesArray) {
      // Create a new document reference with auto-generated ID
      const docRef = doc(shapesRef);
      shapeIds.push(docRef.id);

      // Use shared shape builder for consistency
      const baseShape = buildShapeObject(data.type, data.x, data.y, data);

      // Add Firestore metadata (locks are now in RTDB, not Firestore)
      const shape = {
        ...baseShape,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add to batch
      batch.set(docRef, shape);
    }

    // Commit batch
    await batch.commit();

    // Return single ID or array based on input
    return isArray ? shapeIds : shapeIds[0];
  } catch (error) {
    throw new Error(`Failed to create shape(s): ${error.message}`);
  }
}


/**
 * Update one or more shapes in Firestore
 * @param {string|Array<object>} shapeIdOrUpdates - Shape ID (with updates as 2nd param) or array of {id, ...updates}
 * @param {object} [updates] - Properties to update (only when first param is a string)
 * @returns {Promise<void>}
 * @throws {Error} Firestore error
 */
export async function updateShapes(shapeIdOrUpdates, updates) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to update shapes');
    }

    // Lock checking is done at the UI/hook layer using in-memory data
    
    // Normalize to array for consistent processing
    const isArray = Array.isArray(shapeIdOrUpdates);
    const updatesArray = isArray 
      ? shapeIdOrUpdates 
      : [{ id: shapeIdOrUpdates, ...updates }];

    // Use batch write for efficiency (works for single or multiple)
    const batch = writeBatch(db);

    for (const item of updatesArray) {
      const { id, ...updateData } = item;
      const shapeRef = doc(db, COLLECTIONS.SHAPES, id);
      
      // Add timestamp to updates
      batch.update(shapeRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    }

    // Commit batch
    await batch.commit();

  } catch (error) {
    throw new Error(`Failed to update shape(s): ${error.message}`);
  }
}

// Backward compatibility alias
export const updateShape = updateShapes;

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

    // Lock checking is done at the UI/hook layer using in-memory data
    // No need for redundant Firestore read here
    const shapeRef = doc(db, COLLECTIONS.SHAPES, shapeId);

    // Delete from Firestore
    await deleteDoc(shapeRef);

  } catch (error) {
    throw new Error(`Failed to delete shape: ${error.message}`);
  }
}

// Lock/unlock functions are now in shapeLocks.js (RTDB)
// Re-export them here for backward compatibility
export { 
  lockShapes, 
  unlockShapes,
  clearAllLocks as clearAllShapeLocks,
  unlockShapesForUser 
} from './shapeLocks';

// Backward compatibility - single shape wrappers
import { lockShapes as lockShapesRTDB, unlockShapes as unlockShapesRTDB } from './shapeLocks';

export async function lockShape(shapeId) {
  const locked = await lockShapesRTDB(shapeId);
  return locked.length > 0;
}

export async function unlockShape(shapeId) {
  await unlockShapesRTDB(shapeId);
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
          // Note: lock data is now in RTDB, not Firestore
          shapes.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          });
        });

        callback(shapes);
      },
      (error) => {
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
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
    };
  } catch (error) {
    throw new Error(`Failed to get shape: ${error.message}`);
  }
}

// Lock checking functions are now in shapeLocks.js (RTDB)
// Re-export them here for backward compatibility
export { 
  isShapeLockedByOther, 
  isShapeLockedByMe 
} from './shapeLocks';

// clearAllLocks and unlockShapesForUser are now in shapeLocks.js (RTDB)
// They are re-exported above

/**
 * Unlock all shapes locked by the current user (cleanup on disconnect)
 * @returns {Promise<void>}
 */
export async function unlockAllMyShapes() {
  try {
    const userId = getUserId();
    if (!userId) return;

    await unlockShapesForUser(userId);
  } catch (error) {
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
  } catch (error) {
    throw new Error(`Failed to clear shapes: ${error.message}`);
  }
}

