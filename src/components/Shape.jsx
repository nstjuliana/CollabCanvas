import { Rect, Circle } from 'react-konva';
import { SHAPE_TYPES, SHAPE_DEFAULTS } from '../utils/constants';

/**
 * Shape Component
 * Renders a shape on the canvas (rectangle, circle, etc.)
 * 
 * @param {object} shapeData - Shape data including type, position, size, color, etc.
 * @param {boolean} isSelected - Whether the shape is currently selected
 * @param {boolean} isLocked - Whether the shape is locked by another user
 * @param {function} onDragStart - Callback when drag starts
 * @param {function} onDragMove - Callback during drag
 * @param {function} onDragEnd - Callback when drag ends
 * @param {function} onClick - Callback when shape is clicked
 */
function Shape({
  shapeData,
  isSelected = false,
  isLocked = false,
  onDragStart = null,
  onDragMove = null,
  onDragEnd = null,
  onClick = null,
}) {
  const {
    id,
    type = SHAPE_TYPES.RECTANGLE,
    x = 0,
    y = 0,
    width = SHAPE_DEFAULTS.WIDTH,
    height = SHAPE_DEFAULTS.HEIGHT,
    fill = '#FF6B6B',
    stroke = '#333333',
    strokeWidth = SHAPE_DEFAULTS.STROKE_WIDTH,
    cornerRadius = SHAPE_DEFAULTS.CORNER_RADIUS,
    opacity = SHAPE_DEFAULTS.OPACITY,
    rotation = 0,
  } = shapeData;

  // Common props for all shape types
  const commonProps = {
    id,
    x,
    y,
    fill,
    stroke: isSelected ? '#0066ff' : (isLocked ? '#999999' : stroke),
    strokeWidth: isSelected ? strokeWidth + 2 : strokeWidth,
    opacity: isLocked ? opacity * 0.5 : opacity,
    rotation,
    draggable: !isLocked,
    onDragStart: (e) => {
      if (onDragStart && !isLocked) {
        onDragStart(e, shapeData);
      }
    },
    onDragMove: (e) => {
      if (onDragMove && !isLocked) {
        onDragMove(e, shapeData);
      }
    },
    onDragEnd: (e) => {
      if (onDragEnd && !isLocked) {
        const node = e.target;
        onDragEnd(e, {
          ...shapeData,
          x: node.x(),
          y: node.y(),
        });
      }
    },
    onClick: (e) => {
      if (onClick) {
        onClick(e, shapeData);
      }
    },
    onTap: (e) => {
      if (onClick) {
        onClick(e, shapeData);
      }
    },
    // Visual feedback
    shadowColor: isSelected ? '#0066ff' : 'black',
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: isSelected ? 0.5 : 0,
    // Cursor styling
    onMouseEnter: (e) => {
      const container = e.target.getStage().container();
      if (isLocked) {
        container.style.cursor = 'not-allowed';
      } else {
        container.style.cursor = 'move';
      }
    },
    onMouseLeave: (e) => {
      const container = e.target.getStage().container();
      container.style.cursor = 'default';
    },
  };

  // Render different shape types
  switch (type) {
    case SHAPE_TYPES.CIRCLE:
      return (
        <Circle
          {...commonProps}
          radius={width / 2} // Use width as diameter
        />
      );

    case SHAPE_TYPES.RECTANGLE:
    default:
      return (
        <Rect
          {...commonProps}
          width={width}
          height={height}
          cornerRadius={cornerRadius}
        />
      );
  }
}

export default Shape;

