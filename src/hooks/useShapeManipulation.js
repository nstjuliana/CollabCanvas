import { useRef } from 'react';
import { SHAPE_TYPES, SHAPE_DEFAULTS, TOOL_TYPES, DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { buildShapeObject } from '../utils/shapeBuilders';
import { ACTION_TYPES } from './useUndoRedo';

/**
 * Custom hook for managing shape creation and manipulation
 */
const useShapeManipulation = ({
  stageRef,
  selectedTool,
  selectedColor,
  shapes,
  isLockedByOther,
  createShapes,
  deleteShape,
  selectShape,
  selectShapes,
  updateShape,
  handleShapeDragStart,
  handleShapeDragEnd,
  addToHistory,
  startTextEditing,
  setSelectedColor
}) => {
  // Track shape position before drag for undo
  const shapeDragStartPosition = useRef({});
  const isDraggingShapeRef = useRef(false);

  /**
   * Create a shape at the given position
   * Uses shared buildShapeObject to ensure consistency between UI and agent
   */
  const createShapeAtPosition = async (canvasPos, text = SHAPE_DEFAULTS.TEXT_DEFAULT) => {
    try {
      let x, y;
      let properties = { color: selectedColor };

      if (selectedTool === TOOL_TYPES.CIRCLE) {
        // For circles, x/y is the center point, so use canvasPos directly
        x = canvasPos.x;
        y = canvasPos.y;
      } else if (selectedTool === TOOL_TYPES.STAR) {
        // For stars, x/y is the center point, so use canvasPos directly
        x = canvasPos.x;
        y = canvasPos.y;
      } else if (selectedTool === TOOL_TYPES.TEXT) {
        // For text, x/y is the top-left corner
        x = canvasPos.x;
        y = canvasPos.y;
        properties.text = text;
      } else if (selectedTool === TOOL_TYPES.LINE) {
        // For lines, x/y is the start point, offset to center the line on cursor
        x = canvasPos.x - SHAPE_DEFAULTS.WIDTH / 2;
        y = canvasPos.y;
      } else {
        // For rectangles, x/y is top-left corner, so offset by half width/height to center on cursor
        x = canvasPos.x - SHAPE_DEFAULTS.WIDTH / 2;
        y = canvasPos.y - SHAPE_DEFAULTS.HEIGHT / 2;
      }

      // Use shared shape builder - ONE source of truth!
      const newShape = buildShapeObject(selectedTool, x, y, properties);
      const shapeId = await createShapes(newShape);

      // Add to history
      addToHistory({
        type: ACTION_TYPES.CREATE,
        data: { shapeId, shapeData: newShape }
      });

      // Automatically select the newly created shape
      selectShape(shapeId);

      return shapeId;
    } catch (err) {
      return null;
    }
  };

  /**
   * Check if a click event is on a user-created shape
   */
  const isClickOnShape = (e) => {
    // Check the target and its ancestors for a shape ID
    let node = e.target;
    while (node) {
      if (node.attrs && node.attrs.id && typeof node.attrs.id === 'string') {
        // Verify it's actually one of our shapes
        if (shapes.some(s => s.id === node.attrs.id)) {
          return true;
        }
      }
      node = node.parent;
    }
    return false;
  };

  /**
   * Handle shape drag start
   */
  const onShapeDragStart = async (e, shape) => {
    e.cancelBubble = true; // Prevent canvas drag

    // Store initial position for undo
    shapeDragStartPosition.current[shape.id] = { x: shape.x, y: shape.y };

    // Mark that we're dragging a shape
    isDraggingShapeRef.current = true;

    // Disable stage dragging while dragging a shape
    if (stageRef.current) {
      stageRef.current.draggable(false);
    }

    // Try to lock the shape
    const success = await handleShapeDragStart(shape.id);

    // If couldn't lock, prevent drag
    if (!success) {
      e.target.stopDrag();
      isDraggingShapeRef.current = false;
      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
      // Clean up stored position
      delete shapeDragStartPosition.current[shape.id];
    } else {
      // Update color picker to dragged shape's color (fallback to stroke for lines)
      const shapeColor = shape.fill || shape.stroke || DEFAULT_SHAPE_COLOR;
      setSelectedColor(shapeColor);
    }
  };

  /**
   * Handle shape drag end
   */
  const onShapeDragEnd = async (e, shape) => {
    e.cancelBubble = true; // Prevent event from bubbling to canvas

    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    const previousPos = shapeDragStartPosition.current[shape.id];

    try {
      await handleShapeDragEnd(shape.id, newX, newY);

      // Add to history if position actually changed
      if (previousPos && (previousPos.x !== newX || previousPos.y !== newY)) {
        addToHistory({
          type: ACTION_TYPES.UPDATE,
          data: {
            shapeIds: [shape.id],
            previousStates: [{ id: shape.id, updates: { x: previousPos.x, y: previousPos.y } }],
            newStates: [{ id: shape.id, updates: { x: newX, y: newY } }]
          }
        });
      }
    } finally {
      // Mark that we're done dragging
      isDraggingShapeRef.current = false;

      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }

      // Clean up stored position
      delete shapeDragStartPosition.current[shape.id];
    }
  };

  /**
   * Handle shape click
   */
  const onShapeClick = async (e, shape, isCtrlPressed) => {
    e.cancelBubble = true; // Prevent canvas click

    // If delete tool is active, delete the shape
    if (selectedTool === TOOL_TYPES.DELETE) {
      if (isLockedByOther(shape.id)) {
        return;
      }

      try {
        await deleteShape(shape.id);
      } catch (err) {
      }
    } else {
      // Check if shape is locked by another user
      if (isLockedByOther(shape.id)) {
        return;
      }

      // Update color picker to clicked shape's color (fallback to stroke for lines)
      const shapeColor = shape.fill || shape.stroke || DEFAULT_SHAPE_COLOR;
      setSelectedColor(shapeColor);

      // Handle multi-select with Ctrl/Cmd key
      if (isCtrlPressed) {
        // Toggle selection
        await selectShapes(shape.id, true);
      } else {
        // Single selection
        await selectShape(shape.id);
      }
    }
  };

  /**
   * Handle shape double-click for text editing
   */
  const onShapeDoubleClick = async (e, shape) => {
    e.cancelBubble = true; // Prevent canvas double-click

    // Only allow editing text shapes
    if (shape.type !== SHAPE_TYPES.TEXT) return;

    // Check if shape is locked by another user
    if (isLockedByOther(shape.id)) {
      return;
    }

    // Lock the shape for editing
    const success = await handleShapeDragStart(shape.id);
    if (!success) {
      return;
    }

    // Start text editing
    startTextEditing(shape.x, shape.y, shape);
  };

  return {
    // State
    isDraggingShapeRef,

    // Functions
    createShapeAtPosition,
    isClickOnShape,
    onShapeDragStart,
    onShapeDragEnd,
    onShapeClick,
    onShapeDoubleClick,
  };
};

export default useShapeManipulation;
