import { useState, useRef, useEffect } from 'react';
import { SHAPE_DEFAULTS, SHAPE_TYPES } from '../utils/constants';
import { ACTION_TYPES } from './useUndoRedo';

/**
 * Custom hook for managing text editing functionality
 */
const useTextEditing = ({
  stageRef,
  stageScale,
  stagePosition,
  shapeRefs,
  shapes,
  updateShape,
  deleteShape,
  unlockShape,
  createShapeAtPosition,
  addToHistory
}) => {
  // Text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextPosition, setEditingTextPosition] = useState({ x: 0, y: 0 });
  const [editingTextCanvasPosition, setEditingTextCanvasPosition] = useState({ x: 0, y: 0 });
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingShapeId, setEditingShapeId] = useState(null);
  const [editingTextTransform, setEditingTextTransform] = useState({
    fontSize: SHAPE_DEFAULTS.TEXT_FONT_SIZE,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    width: 100,
    height: 32,
  });
  const textareaRef = useRef(null);

  // Update text editing position when canvas zooms or pans
  useEffect(() => {
    if (isEditingText && stageRef.current) {
      // Get current stage transform directly
      const currentScale = stageRef.current.scaleX();
      const currentPosition = stageRef.current.position();

      // Recalculate screen position from canvas position
      const screenX = editingTextCanvasPosition.x * currentScale + currentPosition.x;
      const screenY = editingTextCanvasPosition.y * currentScale + currentPosition.y;
      setEditingTextPosition({ x: screenX, y: screenY });
    }
  }, [stageScale, stagePosition, isEditingText, editingTextCanvasPosition, stageRef]);

  /**
   * Start text editing at a position
   */
  const startTextEditing = (x, y, existingShape = null) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get the actual text node to measure dimensions
    let textWidth = 100;
    let textHeight = 32;
    if (existingShape?.id) {
      const textNode = shapeRefs.current[existingShape.id];
      if (textNode) {
        // For text in a Group, find the actual Text node
        const actualTextNode = textNode.findOne('Text');
        if (actualTextNode) {
          textWidth = actualTextNode.width();
          textHeight = actualTextNode.height();
        }
      }
    }

    // Get current stage transform directly from the stage (most up-to-date)
    const currentScale = stage.scaleX();
    const currentPosition = stage.position();

    // Store canvas coordinates for new text creation
    setEditingTextCanvasPosition({ x, y });

    // Convert canvas position to screen position for textarea
    const screenX = x * currentScale + currentPosition.x;
    const screenY = y * currentScale + currentPosition.y;

    // Capture transformation properties for inline editing
    const transform = {
      fontSize: existingShape?.fontSize || SHAPE_DEFAULTS.TEXT_FONT_SIZE,
      rotation: existingShape?.rotation || 0,
      scaleX: existingShape?.scaleX || 1,
      scaleY: existingShape?.scaleY || 1,
      width: textWidth,
      height: textHeight,
    };

    setEditingTextPosition({ x: screenX, y: screenY });
    setEditingTextValue(existingShape?.text || '');
    setEditingShapeId(existingShape?.id || null);
    setEditingTextTransform(transform);
    setIsEditingText(true);

    // Focus textarea after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  };

  /**
   * Finish text editing and save
   */
  const finishTextEditing = async () => {
    if (!isEditingText) return;

    const text = editingTextValue.trim();
    const wasEditingExisting = editingShapeId !== null;

    // Only save if there's text
    if (text) {
      if (editingShapeId) {
        // Update existing text shape
        const shape = shapes.find(s => s.id === editingShapeId);
        const previousText = shape?.text || '';

        try {
          await updateShape(editingShapeId, { text });

          // Add to history only if text actually changed
          if (previousText !== text) {
            addToHistory({
              type: ACTION_TYPES.UPDATE,
              data: {
                shapeIds: [editingShapeId],
                previousStates: [{ id: editingShapeId, updates: { text: previousText } }],
                newStates: [{ id: editingShapeId, updates: { text } }]
              }
            });
          }
        } catch (err) {
          console.error('Error updating text shape:', err);
        }
      } else {
        // Create new text shape at the stored canvas position
        await createShapeAtPosition(editingTextCanvasPosition, text);
      }
    } else if (editingShapeId) {
      // If text is empty and we're editing an existing shape, delete it
      const shape = shapes.find(s => s.id === editingShapeId);

      try {
        await deleteShape(editingShapeId);

        // Add to history
        if (shape) {
          addToHistory({
            type: ACTION_TYPES.DELETE,
            data: { shape }
          });
        }
      } catch (err) {
        console.error('Error deleting text shape:', err);
      }
    }

    // Unlock the shape if we were editing an existing one
    if (wasEditingExisting && editingShapeId) {
      try {
        await unlockShape(editingShapeId);
      } catch (err) {
        console.error('Error unlocking shape:', err);
      }
    }

    // Reset editing state
    setIsEditingText(false);
    setEditingTextValue('');
    setEditingShapeId(null);
  };

  /**
   * Cancel text editing
   */
  const cancelTextEditing = async () => {
    // Unlock the shape if we were editing an existing one
    if (editingShapeId) {
      try {
        await unlockShape(editingShapeId);
      } catch (err) {
        console.error('Error unlocking shape:', err);
      }
    }

    setIsEditingText(false);
    setEditingTextValue('');
    setEditingShapeId(null);
  };

  return {
    // State
    isEditingText,
    editingTextPosition,
    editingTextValue,
    setEditingTextValue,
    editingShapeId,
    editingTextTransform,
    textareaRef,

    // Functions
    startTextEditing,
    finishTextEditing,
    cancelTextEditing,
  };
};

export default useTextEditing;
