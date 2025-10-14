/**
 * useShapes Hook
 * React hook for managing shapes state and interactions with Firestore
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createShape as createShapeService,
  updateShape as updateShapeService,
  deleteShape as deleteShapeService,
  clearAllShapes as clearAllShapesService,
  subscribeToShapes,
  lockShape as lockShapeService,
  unlockShape as unlockShapeService,
  isShapeLockedByOther,
  isShapeLockedByMe,
} from '../services/shapes';
import { getUserId } from '../services/auth';

/**
 * Custom hook for managing shapes
 * @returns {object} Shapes state and methods
 */
function useShapes() {
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  
  const unsubscribeRef = useRef(null);
  const userId = getUserId();

  // Subscribe to real-time shape updates
  useEffect(() => {
    console.log('Setting up shapes subscription...');
    
    const unsubscribe = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
      setError(null);
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up shapes subscription');
        unsubscribeRef.current();
      }
    };
  }, []);

  /**
   * Create a new shape
   * @param {object} shapeData - Shape properties
   * @returns {Promise<string>} Created shape ID
   */
  const createShape = useCallback(async (shapeData) => {
    try {
      setError(null);
      const shapeId = await createShapeService(shapeData);
      return shapeId;
    } catch (err) {
      console.error('Error creating shape:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Update an existing shape
   * @param {string} shapeId - Shape ID
   * @param {object} updates - Properties to update
   * @returns {Promise<void>}
   */
  const updateShape = useCallback(async (shapeId, updates) => {
    try {
      setError(null);
      await updateShapeService(shapeId, updates);
    } catch (err) {
      console.error('Error updating shape:', err);
      setError(err.message);
      throw err;
    }
  }, []);

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
      if (selectedShapeId === shapeId) {
        setSelectedShapeId(null);
      }
    } catch (err) {
      console.error('Error deleting shape:', err);
      setError(err.message);
      throw err;
    }
  }, [selectedShapeId]);

  /**
   * Clear all shapes from the canvas
   * @returns {Promise<void>}
   */
  const clearAllShapes = useCallback(async () => {
    try {
      setError(null);
      await clearAllShapesService();
      setSelectedShapeId(null);
    } catch (err) {
      console.error('Error clearing shapes:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Lock a shape for editing
   * @param {string} shapeId - Shape ID
   * @returns {Promise<boolean>} True if lock was successful
   */
  const lockShape = useCallback(async (shapeId) => {
    try {
      setError(null);
      const success = await lockShapeService(shapeId);
      return success;
    } catch (err) {
      console.error('Error locking shape:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Unlock a shape
   * @param {string} shapeId - Shape ID
   * @returns {Promise<void>}
   */
  const unlockShape = useCallback(async (shapeId) => {
    try {
      setError(null);
      await unlockShapeService(shapeId);
    } catch (err) {
      console.error('Error unlocking shape:', err);
      // Don't set error state for unlock failures (graceful degradation)
    }
  }, []);

  /**
   * Select a shape
   * @param {string|null} shapeId - Shape ID to select, or null to deselect
   */
  const selectShape = useCallback((shapeId) => {
    setSelectedShapeId(shapeId);
  }, []);

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
   * Handle shape drag start - lock the shape
   * @param {string} shapeId - Shape ID
   * @returns {Promise<boolean>} True if shape was locked successfully
   */
  const handleDragStart = useCallback(async (shapeId) => {
    // Check if shape is already locked by another user
    if (isLockedByOther(shapeId)) {
      console.log('Cannot drag - shape is locked by another user');
      return false;
    }

    // Lock the shape
    const success = await lockShape(shapeId);
    if (success) {
      selectShape(shapeId);
    }
    return success;
  }, [isLockedByOther, lockShape, selectShape]);

  /**
   * Handle shape drag end - update position and unlock
   * @param {string} shapeId - Shape ID
   * @param {number} x - New x position
   * @param {number} y - New y position
   * @returns {Promise<void>}
   */
  const handleDragEnd = useCallback(async (shapeId, x, y) => {
    try {
      // Update position in Firestore
      await updateShape(shapeId, { x, y });
      
      // Unlock the shape
      await unlockShape(shapeId);
      
      // Keep shape selected after dragging
      // (no deselection here)
    } catch (err) {
      console.error('Error handling drag end:', err);
      // Still try to unlock even if update failed
      await unlockShape(shapeId);
    }
  }, [updateShape, unlockShape]);

  return {
    // State
    shapes,
    loading,
    error,
    selectedShapeId,
    
    // Methods
    createShape,
    updateShape,
    deleteShape,
    clearAllShapes,
    lockShape,
    unlockShape,
    selectShape,
    
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

