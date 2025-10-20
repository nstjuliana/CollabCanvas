/**
 * useShapes Hook
 * React hook for managing shapes state and interactions with Firestore
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createShapes as createShapesService,
  updateShapes as updateShapesService,
  deleteShape as deleteShapeService,
  clearAllShapes as clearAllShapesService,
  clearAllLocks as clearAllLocksService,
  subscribeToShapes,
  lockShapes as lockShapesService,
  unlockShapes as unlockShapesService,
  unlockShapesForUser,
  isShapeLockedByOther,
  isShapeLockedByMe,
} from '../services/shapes';
import { getUserId } from '../services/auth';

/**
 * Custom hook for managing shapes
 * @param {object} presence - Optional presence object to monitor for disconnections
 * @returns {object} Shapes state and methods
 */
function useShapes(presence = {}) {
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState([]);
  
  const unsubscribeRef = useRef(null);
  const userId = getUserId();
  const previousPresenceRef = useRef({});

  // Subscribe to real-time shape updates - only once on mount
  useEffect(() => {
    const unsubscribe = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
      setError(null);
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup subscription only on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []); // Empty deps - subscription should persist for component lifetime

  // Separate effect to unlock shapes on unmount
  useEffect(() => {
    return () => {
      // Unlock any selected shapes on cleanup (batch unlock)
      if (selectedShapeIds.length > 0) {
        unlockShapesService(selectedShapeIds).catch(err => {});
      }
    };
  }, [selectedShapeIds]);

  // Monitor presence changes and unlock shapes when users disconnect
  useEffect(() => {
    const previousPresence = previousPresenceRef.current;
    const currentPresence = presence;

    // Find users who were present before but are not present now (disconnected users)
    const disconnectedUserIds = Object.keys(previousPresence).filter(
      userId => !currentPresence[userId]
    );

    // Unlock shapes for each disconnected user
    if (disconnectedUserIds.length > 0) {
      
      disconnectedUserIds.forEach(async (disconnectedUserId) => {
        try {
          const count = await unlockShapesForUser(disconnectedUserId);
          if (count > 0) {
          }
        } catch (err) {
        }
      });
    }

    // Update the previous presence reference
    previousPresenceRef.current = currentPresence;
  }, [presence]);

  /**
   * Create one or more shapes
   * @param {object|Array<object>} shapeData - Single shape or array of shapes
   * @returns {Promise<string|Array<string>>} Created shape ID(s)
   */
  const createShapes = useCallback(async (shapeData) => {
    try {
      setError(null);
      const result = await createShapesService(shapeData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);


  /**
   * Update one or more shapes
   * @param {string|Array<object>} shapeIdOrUpdates - Shape ID or array of {id, ...updates}
   * @param {object} [updates] - Properties to update (when first param is string)
   * @returns {Promise<void>}
   */
  const updateShapes = useCallback(async (shapeIdOrUpdates, updates) => {
    try {
      setError(null);
      await updateShapesService(shapeIdOrUpdates, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Backward compatibility alias
  const updateShape = updateShapes;

  /**
   * Delete a shape
   * @param {string} shapeId - Shape ID
   * @returns {Promise<void>}
   */
  const deleteShape = useCallback(async (shapeId) => {
    try {
      setError(null);
      await deleteShapeService(shapeId);
      
      // Clear selection if deleted shape was selected
      if (selectedShapeIds.includes(shapeId)) {
        setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [selectedShapeIds]);

  /**
   * Delete multiple shapes
   * @param {string[]} shapeIds - Array of shape IDs to delete
   * @returns {Promise<void>}
   */
  const deleteMultipleShapes = useCallback(async (shapeIds) => {
    try {
      setError(null);
      
      // Delete each shape
      await Promise.all(shapeIds.map(id => deleteShapeService(id)));
      
      // Clear selection
      setSelectedShapeIds(prev => prev.filter(id => !shapeIds.includes(id)));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Clear all shapes from the canvas
   * @returns {Promise<void>}
   */
  const clearAllShapes = useCallback(async () => {
    try {
      setError(null);
      await clearAllShapesService();
      setSelectedShapeIds([]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Clear all locks from all shapes (fix orphaned locks)
   * @returns {Promise<number>} Number of shapes unlocked
   */
  const clearAllLocks = useCallback(async () => {
    try {
      setError(null);
      const count = await clearAllLocksService();
      return count;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Lock one or more shapes for editing
   * @param {string|string[]} shapeIds - Shape ID(s) to lock
   * @returns {Promise<string[]>} Array of successfully locked shape IDs
   */
  const lockShapes = useCallback(async (shapeIds) => {
    try {
      setError(null);
      const lockedIds = await lockShapesService(shapeIds);
      return lockedIds;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  // Backward compatibility
  const lockShape = useCallback(async (shapeId) => {
    const locked = await lockShapes(shapeId);
    return locked.length > 0;
  }, [lockShapes]);

  /**
   * Unlock one or more shapes
   * @param {string|string[]} shapeIds - Shape ID(s) to unlock
   * @returns {Promise<void>}
   */
  const unlockShapes = useCallback(async (shapeIds) => {
    try {
      setError(null);
      await unlockShapesService(shapeIds);
    } catch (err) {
      // Don't set error state for unlock failures (graceful degradation)
    }
  }, []);

  // Backward compatibility
  const unlockShape = useCallback(async (shapeId) => {
    await unlockShapes(shapeId);
  }, [unlockShapes]);

  /**
   * Select shapes (single or multiple)
   * @param {string|string[]|null} shapeIds - Shape ID(s) to select, or null to deselect all
   * @param {boolean} toggle - If true, toggle selection instead of replacing
   */
  const selectShapes = useCallback(async (shapeIds, toggle = false) => {
    try {
      // Handle null (deselect all)
      if (shapeIds === null) {
        setSelectedShapeIds([]);
        // Unlock in background (batch unlock)
        unlockShapesService(selectedShapeIds).catch(err => {});
        return;
      }

      // Normalize to array
      const idsToSelect = Array.isArray(shapeIds) ? shapeIds : [shapeIds];
      
      if (toggle) {
        // Toggle mode: add/remove from selection
        const newSelection = [...selectedShapeIds];
        
        for (const id of idsToSelect) {
          const index = newSelection.indexOf(id);
          if (index >= 0) {
            // Already selected, remove it
            newSelection.splice(index, 1);
            // Unlock in background
            unlockShapesService(id).catch(err => {});
          } else {
            // Not selected, add it optimistically
            newSelection.push(id);
            // Lock in background
            lockShapesService(id).then(lockedIds => {
              if (lockedIds.length === 0) {
                // Lock failed, remove from selection
                setSelectedShapeIds(prev => prev.filter(selectedId => selectedId !== id));
              }
            }).catch(err => {});
          }
        }
        
        setSelectedShapeIds(newSelection);
      } else {
        // Replace mode: replace current selection
        // Update UI immediately
        setSelectedShapeIds(idsToSelect);
        
        // Unlock previously selected shapes that aren't in the new selection (in background, batch)
        const shapesToUnlock = selectedShapeIds.filter(id => !idsToSelect.includes(id));
        if (shapesToUnlock.length > 0) {
          unlockShapesService(shapesToUnlock).catch(err => {});
        }
        
        // Lock newly selected shapes (in background, batch)
        const shapesToLock = idsToSelect.filter(id => !selectedShapeIds.includes(id));
        if (shapesToLock.length > 0) {
          lockShapesService(shapesToLock).then(lockedIds => {
            // Remove any shapes that failed to lock
            if (lockedIds.length !== shapesToLock.length) {
              const failedLocks = shapesToLock.filter(id => !lockedIds.includes(id));
              setSelectedShapeIds(prev => prev.filter(id => !failedLocks.includes(id)));
            }
          }).catch(err => {});
        }
      }
    } catch (err) {
    }
  }, [selectedShapeIds]);

  /**
   * Select a single shape (for backward compatibility)
   * @param {string|null} shapeId - Shape ID to select, or null to deselect
   */
  const selectShape = useCallback(async (shapeId) => {
    await selectShapes(shapeId, false);
  }, [selectShapes]);

  /**
   * Check if a shape is locked by another user
   * @param {string} shapeId - Shape ID
   * @returns {boolean} True if locked by another user
   */
  const isLockedByOther = useCallback((shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return false;
    return isShapeLockedByOther(shape, userId);
  }, [shapes, userId]);

  /**
   * Check if a shape is locked by the current user
   * @param {string} shapeId - Shape ID
   * @returns {boolean} True if locked by current user
   */
  const isLockedByMe = useCallback((shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return false;
    return isShapeLockedByMe(shape, userId);
  }, [shapes, userId]);

  /**
   * Get a shape by ID from local state
   * @param {string} shapeId - Shape ID
   * @returns {object|undefined} Shape object or undefined if not found
   */
  const getShapeById = useCallback((shapeId) => {
    return shapes.find(s => s.id === shapeId);
  }, [shapes]);

  /**
   * Handle shape drag start - lock the shape if not already locked
   * @param {string} shapeId - Shape ID
   * @returns {Promise<boolean>} True if shape was locked successfully
   */
  const handleDragStart = useCallback(async (shapeId) => {
    // Check if shape is already locked by another user
    if (isLockedByOther(shapeId)) {
      return false;
    }

    // If shape is already locked by us (from selection), just return success
    if (isLockedByMe(shapeId)) {
      return true;
    }

    // Lock the shape and select it
    const lockedIds = await lockShapes(shapeId);
    const success = lockedIds.length > 0;
    if (success) {
      // Use setSelectedShapeIds directly to avoid the async selectShapes logic
      setSelectedShapeIds([shapeId]);
    }
    return success;
  }, [isLockedByOther, isLockedByMe, lockShapes]);

  /**
   * Handle shape drag end - update position
   * @param {string} shapeId - Shape ID
   * @param {number} x - New x position
   * @param {number} y - New y position
   * @returns {Promise<void>}
   */
  const handleDragEnd = useCallback(async (shapeId, x, y) => {
    try {
      // Update position in Firestore
      await updateShapes(shapeId, { x, y });
      
      // Don't unlock - the shape remains selected and locked
      // It will be unlocked when the user deselects it
      
    } catch (err) {
      // If update failed, still keep the lock since it's selected
    }
  }, [updateShapes]);

  return {
    // State
    shapes,
    loading,
    error,
    selectedShapeIds,
    selectedShapeId: selectedShapeIds[0] || null, // For backward compatibility
    
    // Methods
    createShapes,           // Unified create function (1 or many)
    updateShapes,           // Unified update function (1 or many)
    updateShape,            // Backward compatibility
    deleteShape,
    deleteMultipleShapes,
    clearAllShapes,
    clearAllLocks,
    lockShapes,
    lockShape,      // Backward compatibility
    unlockShapes,
    unlockShape,    // Backward compatibility
    selectShape,
    selectShapes,
    
    // Helpers
    isLockedByOther,
    isLockedByMe,
    getShapeById,
    
    // Event handlers
    handleDragStart,
    handleDragEnd,
  };
}

export default useShapes;

