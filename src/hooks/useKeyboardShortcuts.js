import { useEffect, useRef } from 'react';
import { ACTION_TYPES } from './useUndoRedo';

/**
 * Custom hook for handling keyboard shortcuts in the canvas
 * Handles undo/redo, delete, escape, copy/paste, and arrow key nudging
 */
const useKeyboardShortcuts = ({
  selectedShapeIds,
  shapes,
  isLockedByOther,
  deleteShape,
  deleteMultipleShapes,
  selectShape,
  updateShapes,
  addToHistory,
  handleUndo,
  handleRedo,
  createShapes,
  selectShapes
}) => {
  // Clipboard for copy/paste
  const clipboardRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Don't handle if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl+C or Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedShapeIds.length > 0) {
        e.preventDefault();
        // Copy selected shapes to clipboard
        const shapesToCopy = selectedShapeIds
          .map(id => shapes.find(s => s.id === id))
          .filter(Boolean);
        
        if (shapesToCopy.length > 0) {
          clipboardRef.current = shapesToCopy;
        }
        return;
      }

      // Ctrl+V or Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        
        const offset = 20; // Offset for pasted shapes
        const activeShape = shapes.find(s => s.id === selectedShapeIds[0]);

        try {
          // Calculate the bounding box of the copied shapes to maintain relative positions
          const copiedShapes = clipboardRef.current;
          const minX = Math.min(...copiedShapes.map(s => s.x));
          const minY = Math.min(...copiedShapes.map(s => s.y));
          
          // Determine the paste location (use active shape if available, otherwise use original position + offset)
          const pasteX = activeShape ? activeShape.x + offset : minX + offset;
          const pasteY = activeShape ? activeShape.y + offset : minY + offset;
          
          // Prepare all shapes for batch creation, maintaining relative positions
          const shapesToCreate = copiedShapes.map(shapeToCopy => {
            const { id, lockedBy, lockedAt, createdAt, updatedAt, ...shapeProps } = shapeToCopy;
            // Calculate the offset from the top-left of the group
            const relativeX = shapeToCopy.x - minX;
            const relativeY = shapeToCopy.y - minY;
            return {
              ...shapeProps,
              x: pasteX + relativeX,
              y: pasteY + relativeY,
            };
          });

          // Use createShapes - automatically handles single or multiple
          const result = await createShapes(shapesToCreate);
          // Normalize to array
          const newShapeIds = Array.isArray(result) ? result : [result];

          // Select the newly pasted shapes
          if (newShapeIds.length > 0) {
            selectShapes(newShapeIds, false);
            
            // Add to history for undo
            if (newShapeIds.length === 1) {
              addToHistory({
                type: ACTION_TYPES.CREATE,
                data: { shapeId: newShapeIds[0], shapeData: shapesToCreate[0] }
              });
            } else {
              // For multiple shapes, store as CREATE_MULTIPLE
              const shapesData = newShapeIds.map((id, index) => ({
                shapeId: id,
                shapeData: shapesToCreate[index]
              }));
              addToHistory({
                type: ACTION_TYPES.CREATE_MULTIPLE,
                data: { shapes: shapesData }
              });
            }
            
          }
        } catch (err) {
          console.error('Error pasting shapes:', err);
        }
        return;
      }

      // Ctrl+Z or Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        await handleUndo();
        return;
      }

      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        await handleRedo();
        return;
      }

      // Escape key - deselect all shapes
      if (e.key === 'Escape' && selectedShapeIds.length > 0) {
        selectShape(null);
        return;
      }

      // Delete or Backspace key - delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeIds.length > 0) {
        selectShape(null);
        // Filter out shapes locked by others
        const shapesToDelete = selectedShapeIds.filter(id => !isLockedByOther(id));

        if (shapesToDelete.length === 0) {
          return;
        }

        // Store shapes for undo before deleting
        const deletedShapes = shapesToDelete.map(id => shapes.find(s => s.id === id)).filter(Boolean);

        try {
          if (shapesToDelete.length === 1) {
            await deleteShape(shapesToDelete[0]);
            // Add to history
            addToHistory({
              type: ACTION_TYPES.DELETE,
              data: { shape: deletedShapes[0] }
            });
          } else {
            await deleteMultipleShapes(shapesToDelete);
            // Add to history
            addToHistory({
              type: ACTION_TYPES.DELETE_MULTIPLE,
              data: { shapes: deletedShapes }
            });
          }
        } catch (err) {
          console.error('Error deleting shapes:', err);
        }
      }

      // Arrow keys - nudge selected shapes by 1 pixel
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedShapeIds.length > 0) {
        e.preventDefault(); // Prevent page scrolling

        // Filter out shapes locked by others
        const shapesToMove = selectedShapeIds.filter(id => !isLockedByOther(id));

        if (shapesToMove.length === 0) {
          return;
        }

        // Calculate offset based on arrow key
        let offsetX = 0;
        let offsetY = 0;

        switch (e.key) {
          case 'ArrowUp':
            offsetY = -1;
            break;
          case 'ArrowDown':
            offsetY = 1;
            break;
          case 'ArrowLeft':
            offsetX = -1;
            break;
          case 'ArrowRight':
            offsetX = 1;
            break;
        }

        // Store previous positions for undo
        const previousStates = shapesToMove.map(id => {
          const shape = shapes.find(s => s.id === id);
          return shape ? { id, x: shape.x, y: shape.y } : null;
        }).filter(Boolean);

        // Update all selected shapes with a single batch write
        try {
          const updatesToApply = shapesToMove.map(id => {
            const shape = shapes.find(s => s.id === id);
            return {
              id,
              x: shape.x + offsetX,
              y: shape.y + offsetY
            };
          });

          // Single batch write for all shapes
          await updateShapes(updatesToApply);

          // Add to history
          addToHistory({
            type: ACTION_TYPES.UPDATE,
            data: {
              shapeIds: shapesToMove,
              previousStates: previousStates.map(s => ({ id: s.id, updates: { x: s.x, y: s.y } })),
              newStates: previousStates.map(s => ({
                id: s.id,
                updates: { x: s.x + offsetX, y: s.y + offsetY }
              }))
            }
          });
        } catch (err) {
          console.error('Error moving shapes:', err);
        }
      }

      // [ key - Send backward (decrease z-index by 1)
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && selectedShapeIds.length > 0) {
        e.preventDefault();

        // Filter out shapes locked by others
        const shapesToUpdate = selectedShapeIds.filter(id => !isLockedByOther(id));

        if (shapesToUpdate.length === 0) {
          return;
        }

        // Store previous states for undo
        const previousStates = shapesToUpdate.map(id => {
          const shape = shapes.find(s => s.id === id);
          return shape ? { id, updates: { zIndex: shape.zIndex ?? 0 } } : null;
        }).filter(Boolean);

        try {
          // Decrease z-index by 1 for each selected shape
          const updatesToApply = shapesToUpdate.map(id => {
            const shape = shapes.find(s => s.id === id);
            const currentZIndex = shape.zIndex ?? 0;
            return {
              id,
              zIndex: currentZIndex - 1
            };
          });

          // Single batch write for all shapes
          await updateShapes(updatesToApply);

          // Add to history
          addToHistory({
            type: ACTION_TYPES.UPDATE,
            data: {
              shapeIds: shapesToUpdate,
              previousStates,
              newStates: previousStates.map(s => ({
                id: s.id,
                updates: { zIndex: s.updates.zIndex - 1 }
              }))
            }
          });
        } catch (err) {
          console.error('Error updating z-index:', err);
        }
      }

      // ] key - Bring forward (increase z-index by 1)
      if (e.key === ']' && !e.ctrlKey && !e.metaKey && selectedShapeIds.length > 0) {
        e.preventDefault();

        // Filter out shapes locked by others
        const shapesToUpdate = selectedShapeIds.filter(id => !isLockedByOther(id));

        if (shapesToUpdate.length === 0) {
          return;
        }

        // Store previous states for undo
        const previousStates = shapesToUpdate.map(id => {
          const shape = shapes.find(s => s.id === id);
          return shape ? { id, updates: { zIndex: shape.zIndex ?? 0 } } : null;
        }).filter(Boolean);

        try {
          // Increase z-index by 1 for each selected shape
          const updatesToApply = shapesToUpdate.map(id => {
            const shape = shapes.find(s => s.id === id);
            const currentZIndex = shape.zIndex ?? 0;
            return {
              id,
              zIndex: currentZIndex + 1
            };
          });

          // Single batch write for all shapes
          await updateShapes(updatesToApply);

          // Add to history
          addToHistory({
            type: ACTION_TYPES.UPDATE,
            data: {
              shapeIds: shapesToUpdate,
              previousStates,
              newStates: previousStates.map(s => ({
                id: s.id,
                updates: { zIndex: s.updates.zIndex + 1 }
              }))
            }
          });
        } catch (err) {
          console.error('Error updating z-index:', err);
        }
      }

      // Ctrl+[ or Cmd+[ - Send to back (set to lowest z-index - 1)
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && selectedShapeIds.length > 0) {
        e.preventDefault();

        // Filter out shapes locked by others
        const shapesToUpdate = selectedShapeIds.filter(id => !isLockedByOther(id));

        if (shapesToUpdate.length === 0) {
          return;
        }

        // Store previous states for undo
        const previousStates = shapesToUpdate.map(id => {
          const shape = shapes.find(s => s.id === id);
          return shape ? { id, updates: { zIndex: shape.zIndex ?? 0 } } : null;
        }).filter(Boolean);

        try {
          // Find the minimum z-index among all shapes
          const minZIndex = Math.min(...shapes.map(s => s.zIndex ?? 0));
          
          // Set selected shapes to below the minimum
          const updatesToApply = shapesToUpdate.map(id => ({
            id,
            zIndex: minZIndex - 1
          }));

          // Single batch write for all shapes
          await updateShapes(updatesToApply);

          // Add to history
          addToHistory({
            type: ACTION_TYPES.UPDATE,
            data: {
              shapeIds: shapesToUpdate,
              previousStates,
              newStates: shapesToUpdate.map(id => ({
                id,
                updates: { zIndex: minZIndex - 1 }
              }))
            }
          });
        } catch (err) {
          console.error('Error updating z-index:', err);
        }
      }

      // Ctrl+] or Cmd+] - Bring to front (set to highest z-index + 1)
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && selectedShapeIds.length > 0) {
        e.preventDefault();

        // Filter out shapes locked by others
        const shapesToUpdate = selectedShapeIds.filter(id => !isLockedByOther(id));

        if (shapesToUpdate.length === 0) {
          return;
        }

        // Store previous states for undo
        const previousStates = shapesToUpdate.map(id => {
          const shape = shapes.find(s => s.id === id);
          return shape ? { id, updates: { zIndex: shape.zIndex ?? 0 } } : null;
        }).filter(Boolean);

        try {
          // Find the maximum z-index among all shapes
          const maxZIndex = Math.max(...shapes.map(s => s.zIndex ?? 0));
          
          // Set selected shapes to above the maximum
          const updatesToApply = shapesToUpdate.map(id => ({
            id,
            zIndex: maxZIndex + 1
          }));

          // Single batch write for all shapes
          await updateShapes(updatesToApply);

          // Add to history
          addToHistory({
            type: ACTION_TYPES.UPDATE,
            data: {
              shapeIds: shapesToUpdate,
              previousStates,
              newStates: shapesToUpdate.map(id => ({
                id,
                updates: { zIndex: maxZIndex + 1 }
              }))
            }
          });
        } catch (err) {
          console.error('Error updating z-index:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedShapeIds,
    shapes,
    isLockedByOther,
    deleteShape,
    deleteMultipleShapes,
    selectShape,
    updateShapes,
    addToHistory,
    handleUndo,
    handleRedo,
    createShapes,
    selectShapes
  ]);
};

export default useKeyboardShortcuts;
