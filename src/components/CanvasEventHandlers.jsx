import { useRef } from 'react';

/**
 * Component that handles canvas-related event logic
 * Groups together event handlers that coordinate between different canvas features
 */
const CanvasEventHandlers = ({
  // Refs
  stageRef,
  containerRef,

  // Canvas state
  selectedTool,
  isShiftPressed,
  isCtrlPressed,
  isDraggingShapeRef,
  isDrawingSelection,
  dimensions,

  // Canvas actions
  handleWheel,
  handleCanvasDragStart,
  handleCanvasDragEnd,
  handleCanvasDoubleClick,
  handleCanvasTap,
  handleCanvasClick,
  handleMouseMove,
  handleTransformStart,
  handleTransformEnd,

  // Multi-select
  handleCanvasMouseDown,
  handleCanvasMouseUp,

  // Tool state
  TOOL_TYPES,

  // Shape interaction
  isClickOnShape,

  // Text editing
  isEditingText,
  editingShapeId,

  // Hooks data
  selectionBox,
  selectionPreviewIds,
  shapeRefs,

  // Shapes data
  shapes,
  selectedShapeIds,
  isLockedByOther,
  presence,
  stageScale,
  transformerRef,
}) => {
  return null; // This component is purely for organization, no UI rendering
};

export default CanvasEventHandlers;
