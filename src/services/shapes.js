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
 * Create one or more shapes in Firestore
 * @param {object|Array<object>} shapeData - Single shape or array of shapes
 * @returns {Promise<string|Array<string>>} Created shape ID(s)
 * @throws {Error} Firestore error
 */
export async function createShapes(shapeData) {
  // Handle array of shapes - use batch write
  if (Array.isArray(shapeData)) {
    return await createMultipleShapesInternal(shapeData);
  }
  
  // Handle single shape
  return await createSingleShapeInternal(shapeData);
}

/**
 * Internal: Create a single shape in Firestore
 * @param {object} shapeData - Shape properties (x, y, width, height, fill, etc.)
 * @returns {Promise<string>} Created shape ID
 * @throws {Error} Firestore error
 */
async function createSingleShapeInternal(shapeData) {
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
      fill: shapeData.fill || DEFAULT_SHAPE_COLOR,
      opacity: shapeData.opacity ?? SHAPE_DEFAULTS.OPACITY,
      rotation: shapeData.rotation || 0,
      
      // Metadata
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lockedBy: null, // For object locking
      lockedAt: null,
    };

    // Add type-specific properties
    if (shapeData.type === SHAPE_TYPES.TEXT) {
      // Text-specific properties
      shape.text = shapeData.text || SHAPE_DEFAULTS.TEXT_DEFAULT;
      shape.fontSize = shapeData.fontSize || SHAPE_DEFAULTS.TEXT_FONT_SIZE;
      shape.fontFamily = shapeData.fontFamily || SHAPE_DEFAULTS.TEXT_FONT_FAMILY;
    } else if (shapeData.type === SHAPE_TYPES.IMAGE) {
      // Image-specific properties
      shape.imageUrl = shapeData.imageUrl;
      shape.width = shapeData.width || SHAPE_DEFAULTS.WIDTH;
      shape.height = shapeData.height || SHAPE_DEFAULTS.HEIGHT;
    } else if (shapeData.type === SHAPE_TYPES.LINE) {
      // Line-specific properties
      shape.points = shapeData.points || [0, 0, SHAPE_DEFAULTS.WIDTH, 0];
      shape.stroke = shapeData.stroke || shape.fill || '#333333';
      shape.strokeWidth = shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH * 2;
      // Lines don't use fill, width, or height in the traditional sense
      delete shape.fill;
    } else if (shapeData.type === SHAPE_TYPES.STAR) {
      // Star-specific properties
      shape.width = shapeData.width || SHAPE_DEFAULTS.WIDTH;
      shape.height = shapeData.height || SHAPE_DEFAULTS.HEIGHT;
      shape.numPoints = shapeData.numPoints || 5;
      shape.innerRadius = shapeData.innerRadius || (Math.min(shape.width, shape.height) / 2) * 0.5;
      shape.outerRadius = shapeData.outerRadius || Math.min(shape.width, shape.height) / 2;
      shape.stroke = shapeData.stroke || '#333333';
      shape.strokeWidth = shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
    } else {
      // Shape-specific properties (rectangle, circle)
      shape.width = shapeData.width || SHAPE_DEFAULTS.WIDTH;
      shape.height = shapeData.height || SHAPE_DEFAULTS.HEIGHT;
      shape.stroke = shapeData.stroke || '#333333';
      shape.strokeWidth = shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
      
      if (shapeData.type === SHAPE_TYPES.RECTANGLE) {
        shape.cornerRadius = shapeData.cornerRadius || SHAPE_DEFAULTS.CORNER_RADIUS;
      }
    }

    // Add to Firestore
    const shapesRef = collection(db, COLLECTIONS.SHAPES);
    const docRef = await addDoc(shapesRef, shape);

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create shape: ${error.message}`);
  }
}

/**
 * Internal: Create multiple shapes at once using batch write
 * @param {Array<object>} shapesData - Array of shape properties
 * @returns {Promise<Array<string>>} Array of created shape IDs
 * @throws {Error} Firestore error
 */
async function createMultipleShapesInternal(shapesData) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create shapes');
    }

    // Generate IDs and prepare shapes
    const batch = writeBatch(db);
    const shapeIds = [];
    const shapesRef = collection(db, COLLECTIONS.SHAPES);

    for (const shapeData of shapesData) {
      // Create a new document reference with auto-generated ID
      const docRef = doc(shapesRef);
      shapeIds.push(docRef.id);

      // Prepare shape document with defaults (same logic as createShape)
      const shape = {
        type: shapeData.type || SHAPE_TYPES.RECTANGLE,
        x: shapeData.x || 0,
        y: shapeData.y || 0,
        fill: shapeData.fill || DEFAULT_SHAPE_COLOR,
        opacity: shapeData.opacity ?? SHAPE_DEFAULTS.OPACITY,
        rotation: shapeData.rotation || 0,
        
        // Metadata
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lockedBy: null,
        lockedAt: null,
      };

      // Add type-specific properties (same as createShape)
      if (shapeData.type === SHAPE_TYPES.TEXT) {
        shape.text = shapeData.text || SHAPE_DEFAULTS.TEXT_DEFAULT;
        shape.fontSize = shapeData.fontSize || SHAPE_DEFAULTS.TEXT_FONT_SIZE;
        shape.fontFamily = shapeData.fontFamily || SHAPE_DEFAULTS.TEXT_FONT_FAMILY;
      } else if (shapeData.type === SHAPE_TYPES.IMAGE) {
        shape.imageUrl = shapeData.imageUrl;
        shape.width = shapeData.width || SHAPE_DEFAULTS.WIDTH;
        shape.height = shapeData.height || SHAPE_DEFAULTS.HEIGHT;
      } else if (shapeData.type === SHAPE_TYPES.LINE) {
        shape.points = shapeData.points || [0, 0, SHAPE_DEFAULTS.WIDTH, 0];
        shape.stroke = shapeData.stroke || shape.fill || '#333333';
        shape.strokeWidth = shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH * 2;
        delete shape.fill;
      } else if (shapeData.type === SHAPE_TYPES.STAR) {
        shape.width = shapeData.width || SHAPE_DEFAULTS.WIDTH;
        shape.height = shapeData.height || SHAPE_DEFAULTS.HEIGHT;
        shape.numPoints = shapeData.numPoints || 5;
        shape.innerRadius = shapeData.innerRadius || (Math.min(shape.width, shape.height) / 2) * 0.5;
        shape.outerRadius = shapeData.outerRadius || Math.min(shape.width, shape.height) / 2;
        shape.stroke = shapeData.stroke || '#333333';
        shape.strokeWidth = shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
      } else {
        shape.width = shapeData.width || SHAPE_DEFAULTS.WIDTH;
        shape.height = shapeData.height || SHAPE_DEFAULTS.HEIGHT;
        shape.stroke = shapeData.stroke || '#333333';
        shape.strokeWidth = shapeData.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
        
        if (shapeData.type === SHAPE_TYPES.RECTANGLE) {
          shape.cornerRadius = shapeData.cornerRadius || SHAPE_DEFAULTS.CORNER_RADIUS;
        }
      }

      // Add to batch
      batch.set(docRef, shape);
    }

    // Commit all writes at once
    await batch.commit();

    return shapeIds;
  } catch (error) {
    throw new Error(`Failed to create shapes: ${error.message}`);
  }
}

// Backward compatibility exports
export const createShape = createShapes; // Alias for single shape
export const createMultipleShapes = createShapes; // Alias for multiple shapes

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

  } catch (error) {
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

  } catch (error) {
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
      return false;
    }

    // Lock the shape
    await updateDoc(shapeRef, {
      lockedBy: userId,
      lockedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
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
      return;
    }

    const shapeData = shapeDoc.data();

    // Only the user who locked it can unlock it (or if it's not locked)
    if (!shapeData.lockedBy || shapeData.lockedBy === userId) {
      await updateDoc(shapeRef, {
        lockedBy: null,
        lockedAt: null,
      });

    } else {
    }
  } catch (error) {
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
      lockedAt: data.lockedAt instanceof Timestamp ? data.lockedAt.toDate() : data.lockedAt,
    };
  } catch (error) {
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
    return count;
  } catch (error) {
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
    const unlockedShapeIds = [];

    snapshot.forEach((doc) => {
      const shape = doc.data();
      if (shape.lockedBy === targetUserId) {
        batch.update(doc.ref, {
          lockedBy: null,
          lockedAt: null,
        });
        count++;
        unlockedShapeIds.push(doc.id);
      }
    });

    if (count > 0) {
      await batch.commit();
    } else {
    }
    
    return count;
  } catch (error) {
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

