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
  updateShape,
  addToHistory,
  handleUndo,
  handleRedo,
  createShape,
  createMultipleShapes,
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
          console.log(`Copied ${shapesToCopy.length} shape(s)`);
        }
        return;
      }

      // Ctrl+V or Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        
        const offset = 20; // Offset for pasted shapes

        try {
          // Prepare all shapes for batch creation
          const shapesToCreate = clipboardRef.current.map(shapeToCopy => {
            const { id, lockedBy, lockedAt, createdAt, updatedAt, ...shapeProps } = shapeToCopy;
            return {
              ...shapeProps,
              x: shapeProps.x + offset,
              y: shapeProps.y + offset,
            };
          });

          // Use batch creation if pasting multiple shapes, otherwise use single create
          let newShapeIds;
          if (shapesToCreate.length > 1) {
            // Batch create for multiple shapes - much faster!
            newShapeIds = await createMultipleShapes(shapesToCreate);
          } else {
            // Single create for one shape
            const shapeId = await createShape(shapesToCreate[0]);
            newShapeIds = [shapeId];
          }

          // Select the newly pasted shapes
          if (newShapeIds.length > 0) {
            selectShapes(newShapeIds, false);
            
            // Prepare shapes for history
            const pastedShapes = newShapeIds.map((id, index) => ({
              id,
              ...shapesToCreate[index]
            }));
            
            // Add to history for undo
            if (pastedShapes.length === 1) {
              addToHistory({
                type: ACTION_TYPES.CREATE,
                data: { shape: pastedShapes[0] }
              });
            } else {
              addToHistory({
                type: ACTION_TYPES.DELETE_MULTIPLE, // Use this for multi-create undo
                data: { shapes: pastedShapes }
              });
            }
            
            console.log(`Pasted ${pastedShapes.length} shape(s) using ${shapesToCreate.length > 1 ? 'batch write' : 'single write'}`);
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

        // Update all selected shapes
        try {
          await Promise.all(
            shapesToMove.map(id => {
              const shape = shapes.find(s => s.id === id);
              if (shape) {
                return updateShape(id, {
                  x: shape.x + offsetX,
                  y: shape.y + offsetY
                });
              }
            })
          );

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
    updateShape,
    addToHistory,
    handleUndo,
    handleRedo,
    createShape,
    createMultipleShapes,
    selectShapes
  ]);
};

export default useKeyboardShortcuts;
