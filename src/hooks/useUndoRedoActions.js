import { useRef } from 'react';
import { ACTION_TYPES } from './useUndoRedo';

/**
 * Custom hook for managing undo/redo actions
 */
const useUndoRedoActions = ({
  canUndo,
  canRedo,
  shapes,
  createShapes,
  deleteShape,
  deleteMultipleShapes,
  selectShape,
  selectShapes,
  updateShapes,
  undoHistory,
  redoHistory,
  startUndoRedo,
  endUndoRedo
}) => {
  // Track ID mappings for undo/redo (oldId -> currentId)
  const undoRedoIdMap = useRef({});

  /**
   * Handle undo operation
   */
  const handleUndo = async () => {
    if (!canUndo) return;

    startUndoRedo();

    try {
      const action = undoHistory();
      if (!action) {
        endUndoRedo();
        return;
      }

      switch (action.type) {
        case ACTION_TYPES.CREATE: {
          // Undo create by deleting the shape
          let { shapeId } = action.data;
          // Use mapped ID if available
          const currentId = undoRedoIdMap.current[shapeId] || shapeId;
          const shape = shapes.find(s => s.id === currentId);

          if (shape) {
            await deleteShape(currentId);
            // Store the full shape data for redo (without ID/locks)
            const { id, lockedBy, lockedAt, ...shapeData } = shape;
            if (!action.data.shapeData) {
              action.data.shapeData = shapeData;
            }
          }
          break;
        }

        case ACTION_TYPES.DELETE: {
          // Undo delete by recreating the shape
          const { shape } = action.data;
          // Remove id and locks to create fresh shape
          const { id, lockedBy, lockedAt, ...shapeData} = shape;
          const newShapeId = await createShapes(shapeData);
          // Map old ID to new ID
          undoRedoIdMap.current[id] = newShapeId;
          // Auto-select the restored shape
          selectShape(newShapeId);
          break;
        }

        case ACTION_TYPES.DELETE_MULTIPLE: {
          // Undo multiple deletes by recreating all shapes
          const { shapes: deletedShapes } = action.data;
          const newShapeIds = [];
          for (const shape of deletedShapes) {
            const { id, lockedBy, lockedAt, ...shapeData } = shape;
            const newShapeId = await createShapes(shapeData);
            // Map old ID to new ID
            undoRedoIdMap.current[id] = newShapeId;
            newShapeIds.push(newShapeId);
          }
          // Auto-select all restored shapes
          selectShapes(newShapeIds);
          break;
        }

        case ACTION_TYPES.UPDATE: {
          // Undo update by restoring previous state
          const { previousStates } = action.data;
          // Use mapped IDs and filter to only shapes that still exist
          const validUpdates = previousStates
            .map(({ id, updates }) => ({
              id: undoRedoIdMap.current[id] || id,
              updates
            }))
            .filter(({ id }) => shapes.find(s => s.id === id));

          // Single batch write for all updates
          await updateShapes(
            validUpdates.map(({ id, updates }) => ({ id, ...updates }))
          );
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Undo error:', err);
    } finally {
      endUndoRedo();
    }
  };

  /**
   * Handle redo operation
   */
  const handleRedo = async () => {
    if (!canRedo) return;

    startUndoRedo();

    try {
      const action = redoHistory();
      if (!action) {
        endUndoRedo();
        return;
      }

      switch (action.type) {
        case ACTION_TYPES.CREATE: {
          // Redo create by creating the shape again
          const { shapeData, shapeId: originalId } = action.data;
          if (shapeData) {
            const newShapeId = await createShapes(shapeData);
            // Map original ID to new ID
            undoRedoIdMap.current[originalId] = newShapeId;
            // Auto-select the recreated shape
            selectShape(newShapeId);
          }
          break;
        }

        case ACTION_TYPES.DELETE: {
          // Redo delete by deleting the recreated shape
          const { shape } = action.data;
          const originalId = shape.id;
          const currentId = undoRedoIdMap.current[originalId] || originalId;

          if (shapes.find(s => s.id === currentId)) {
            await deleteShape(currentId);
          }
          break;
        }

        case ACTION_TYPES.DELETE_MULTIPLE: {
          // Redo multiple deletes by deleting the recreated shapes
          const { shapes: deletedShapes } = action.data;
          const idsToDelete = deletedShapes
            .map(shape => undoRedoIdMap.current[shape.id] || shape.id)
            .filter(id => shapes.find(s => s.id === id));

          if (idsToDelete.length > 0) {
            await deleteMultipleShapes(idsToDelete);
          }
          break;
        }

        case ACTION_TYPES.UPDATE: {
          // Redo update by applying new state
          const { newStates } = action.data;
          // Use mapped IDs and filter to only shapes that still exist
          const validUpdates = newStates
            .map(({ id, updates }) => ({
              id: undoRedoIdMap.current[id] || id,
              updates
            }))
            .filter(({ id }) => shapes.find(s => s.id === id));

          // Single batch write for all updates
          await updateShapes(
            validUpdates.map(({ id, updates }) => ({ id, ...updates }))
          );
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Redo error:', err);
    } finally {
      endUndoRedo();
    }
  };

  return {
    // State
    undoRedoIdMap,

    // Functions
    handleUndo,
    handleRedo,
  };
};

export default useUndoRedoActions;
