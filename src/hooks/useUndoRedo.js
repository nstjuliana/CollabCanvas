/**
 * useUndoRedo Hook
 * React hook for managing undo/redo history for canvas operations
 */

import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 10;

// Action types
export const ACTION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  DELETE_MULTIPLE: 'DELETE_MULTIPLE',
};

/**
 * Custom hook for managing undo/redo history
 * @returns {object} History state and methods
 */
function useUndoRedo() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isUndoRedoInProgress = useRef(false);

  /**
   * Add an action to the history
   * @param {object} action - Action to add to history
   * @param {string} action.type - Action type (CREATE, UPDATE, DELETE, etc.)
   * @param {object} action.data - Action-specific data
   */
  const addToHistory = useCallback((action) => {
    // Don't add to history if we're currently undoing/redoing
    if (isUndoRedoInProgress.current) {
      return;
    }

    setUndoStack(prev => {
      const newStack = [...prev, action];
      // Keep only the last MAX_HISTORY_SIZE items
      if (newStack.length > MAX_HISTORY_SIZE) {
        newStack.shift();
      }
      return newStack;
    });

    // Clear redo stack when a new action is performed
    setRedoStack([]);
  }, []);

  /**
   * Undo the last action
   * @returns {object|null} The action that was undone
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) {
      return null;
    }

    const action = undoStack[undoStack.length - 1];
    
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);

    return action;
  }, [undoStack]);

  /**
   * Redo the last undone action
   * @returns {object|null} The action that was redone
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      return null;
    }

    const action = redoStack[redoStack.length - 1];
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => {
      const newStack = [...prev, action];
      // Keep only the last MAX_HISTORY_SIZE items
      if (newStack.length > MAX_HISTORY_SIZE) {
        newStack.shift();
      }
      return newStack;
    });

    return action;
  }, [redoStack]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /**
   * Start undo/redo operation (prevents adding to history during the operation)
   */
  const startUndoRedo = useCallback(() => {
    isUndoRedoInProgress.current = true;
  }, []);

  /**
   * End undo/redo operation
   */
  const endUndoRedo = useCallback(() => {
    isUndoRedoInProgress.current = false;
  }, []);

  return {
    // State
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStack,
    redoStack,
    
    // Methods
    addToHistory,
    undo,
    redo,
    clearHistory,
    startUndoRedo,
    endUndoRedo,
  };
}

export default useUndoRedo;

