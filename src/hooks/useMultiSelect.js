import { useState } from 'react';
import { SHAPE_TYPES, SHAPE_DEFAULTS, DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { screenToCanvas } from '../utils/helpers';

/**
 * Custom hook for managing multi-select functionality with selection box
 */
const useMultiSelect = ({
  stageRef,
  shapes,
  isLockedByOther,
  selectedShapeIds,
  selectShapes,
  setSelectedColor,
  isClickOnShape
}) => {
  // Multi-select state
  const [selectionBox, setSelectionBox] = useState(null); // { x1, y1, x2, y2 }
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  const [selectionPreviewIds, setSelectionPreviewIds] = useState([]); // Shapes currently in selection box

  /**
   * Check if a shape is within a selection box
   */
  const isShapeInBox = (shape, x1, y1, x2, y2) => {
    // Get shape bounds
    let shapeX1, shapeY1, shapeX2, shapeY2;

    if (shape.type === SHAPE_TYPES.CIRCLE) {
      // For circles, x/y is center
      const radius = Math.max(shape.width, shape.height) / 2;
      shapeX1 = shape.x - radius;
      shapeY1 = shape.y - radius;
      shapeX2 = shape.x + radius;
      shapeY2 = shape.y + radius;
    } else if (shape.type === SHAPE_TYPES.TEXT) {
      // For text, approximate bounds
      shapeX1 = shape.x;
      shapeY1 = shape.y;
      shapeX2 = shape.x + 100; // Approximate
      shapeY2 = shape.y + (shape.fontSize || 24);
    } else if (shape.type === SHAPE_TYPES.LINE) {
      // For lines, calculate bounds from points array
      const points = shape.points || [0, 0, 100, 0];

      // Extract all x and y coordinates from points array
      const coords = [];
      for (let i = 0; i < points.length; i += 2) {
        coords.push({
          x: shape.x + points[i],
          y: shape.y + points[i + 1]
        });
      }

      // Find min/max coordinates
      const minX = Math.min(...coords.map(c => c.x));
      const maxX = Math.max(...coords.map(c => c.x));
      const minY = Math.min(...coords.map(c => c.y));
      const maxY = Math.max(...coords.map(c => c.y));

      // Account for stroke width (lines have thickness)
      const strokeWidth = shape.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH * 2; // Default line stroke width is 4px
      const halfStroke = strokeWidth / 2;

      shapeX1 = minX - halfStroke;
      shapeY1 = minY - halfStroke;
      shapeX2 = maxX + halfStroke;
      shapeY2 = maxY + halfStroke;
    } else {
      // For rectangles and images, x/y is top-left
      shapeX1 = shape.x;
      shapeY1 = shape.y;
      shapeX2 = shape.x + shape.width;
      shapeY2 = shape.y + shape.height;
    }

    // Check if shape intersects with selection box
    return !(shapeX2 < x1 || shapeX1 > x2 || shapeY2 < y1 || shapeY1 > y2);
  };

  /**
   * Handle mouse down on canvas for selection box (Shift+Drag)
   */
  const handleCanvasMouseDown = (e, isShiftPressed) => {
    // Only start selection box on Shift+Drag
    if (!isShiftPressed) return;

    // Don't start selection box if clicking on a shape
    if (isClickOnShape(e)) return;

    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    const canvasPos = screenToCanvas(stage, pointerPosition);

    setIsDrawingSelection(true);
    setSelectionBox({
      x1: canvasPos.x,
      y1: canvasPos.y,
      x2: canvasPos.x,
      y2: canvasPos.y,
    });
  };

  /**
   * Handle mouse move on canvas for selection box
   */
  const handleCanvasMouseMove = (e) => {
    if (!isDrawingSelection || !selectionBox) return;

    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    const canvasPos = screenToCanvas(stage, pointerPosition);

    const newBox = {
      ...selectionBox,
      x2: canvasPos.x,
      y2: canvasPos.y,
    };

    setSelectionBox(newBox);

    // Calculate preview of shapes in selection box
    const x1 = Math.min(newBox.x1, newBox.x2);
    const y1 = Math.min(newBox.y1, newBox.y2);
    const x2 = Math.max(newBox.x1, newBox.x2);
    const y2 = Math.max(newBox.y1, newBox.y2);

    const shapesInBox = shapes
      .filter(shape => isShapeInBox(shape, x1, y1, x2, y2))
      .map(s => s.id)
      .filter(id => !isLockedByOther(id));

    setSelectionPreviewIds(shapesInBox);
  };

  /**
   * Handle mouse up on canvas for selection box
   */
  const handleCanvasMouseUp = async (isCtrlPressed) => {
    if (!isDrawingSelection || !selectionBox) return;

    setIsDrawingSelection(false);

    // Calculate selection box bounds
    const x1 = Math.min(selectionBox.x1, selectionBox.x2);
    const y1 = Math.min(selectionBox.y1, selectionBox.y2);
    const x2 = Math.max(selectionBox.x1, selectionBox.x2);
    const y2 = Math.max(selectionBox.y1, selectionBox.y2);

    // Find shapes within selection box using helper
    const shapesInBox = shapes.filter(shape => isShapeInBox(shape, x1, y1, x2, y2));

    // Filter out shapes locked by others
    const selectableShapes = shapesInBox
      .map(s => s.id)
      .filter(id => !isLockedByOther(id));

    // Clear selection box and preview immediately for instant feedback
    setSelectionBox(null);
    setSelectionPreviewIds([]);

    if (selectableShapes.length > 0) {
      if (isCtrlPressed) {
        // Add to existing selection
        const newSelection = [...new Set([...selectedShapeIds, ...selectableShapes])];
        // Don't await - let it happen in background for instant UI feedback
        selectShapes(newSelection, false);
      } else {
        // Replace selection
        // Don't await - let it happen in background for instant UI feedback
        selectShapes(selectableShapes, false);
      }

      // Update color picker to first selected shape's color (fallback to stroke for lines)
      const firstShape = shapes.find(s => s.id === selectableShapes[0]);
      if (firstShape) {
        const shapeColor = firstShape.fill || firstShape.stroke || DEFAULT_SHAPE_COLOR;
        setSelectedColor(shapeColor);
      }
    }
  };

  return {
    // State
    selectionBox,
    isDrawingSelection,
    selectionPreviewIds,

    // Functions
    isShapeInBox,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  };
};

export default useMultiSelect;
