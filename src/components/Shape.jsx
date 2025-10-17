import { useRef, useEffect, useState } from 'react';
import { Rect, Ellipse, Group, Text, Rect as KonvaRect } from 'react-konva';
import { SHAPE_TYPES, SHAPE_DEFAULTS, CURSOR_CONFIG } from '../utils/constants';

/**
 * TextShape Component  
 * Renders text with a bounding box for visual feedback when locked by others
 * Note: Scale is applied to the parent Group, not this component
 */
function TextShape({ 
  text, 
  fontSize, 
  fontFamily, 
  fill, 
  opacity, 
  isSelected, 
  isLocked, 
  lockerColor,
  finalStrokeWidth,
  textScaleX,
  textScaleY,
  shapeRef 
}) {
  const textRef = useRef(null);
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });
  
  // Measure text dimensions after render
  useEffect(() => {
    if (textRef.current) {
      const baseWidth = textRef.current.getTextWidth();
      const baseHeight = textRef.current.height();
      setTextDimensions({ 
        width: baseWidth, 
        height: baseHeight 
      });
    }
  }, [text, fontSize, fontFamily]);
  
  // Pass the text node ref to parent
  useEffect(() => {
    if (shapeRef && textRef.current) {
      shapeRef(textRef.current);
    }
  }, [shapeRef]);
  
  return (
    <>
      {/* Bounding box rectangle for locked state only (not when just selected) */}
      {/* For text, we only show the box when locked by another user */}
      {isLocked && textDimensions.width > 0 && (
        <KonvaRect
          x={0}
          y={0}
          width={textDimensions.width}
          height={textDimensions.height}
          fill="transparent"
          stroke={lockerColor || '#999999'}
          strokeWidth={finalStrokeWidth}
          listening={false}
        />
      )}
      {/* The actual text - scale is applied by parent Group */}
      <Text
        ref={textRef}
        x={0}
        y={0}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={fill}
        opacity={isLocked ? opacity * 0.5 : opacity}
      />
    </>
  );
}

/**
 * Shape Component
 * Renders a shape on the canvas (rectangle, circle, text, etc.)
 * 
 * @param {object} shapeData - Shape data including type, position, size, color, etc.
 * @param {boolean} isSelected - Whether the shape is currently selected
 * @param {boolean} isLocked - Whether the shape is locked by another user
 * @param {string} lockerColor - Color of the user who locked this shape (if locked)
 * @param {string} lockerName - Display name of the user who locked this shape (if locked)
 * @param {number} stageScale - Current zoom level of the canvas (for inverse scaling)
 * @param {function} onDragStart - Callback when drag starts
 * @param {function} onDragMove - Callback during drag
 * @param {function} onDragEnd - Callback when drag ends
 * @param {function} onClick - Callback when shape is clicked
 * @param {function} onDoubleClick - Callback when shape is double-clicked
 * @param {function} shapeRef - Ref callback for the shape node
 */
function Shape({
  shapeData,
  isSelected = false,
  isLocked = false,
  lockerColor = null,
  lockerName = null,
  stageScale = 1,
  onDragStart = null,
  onDragMove = null,
  onDragEnd = null,
  onClick = null,
  onDoubleClick = null,
  shapeRef = null,
}) {
  const nodeRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
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
    // Text-specific properties
    text = SHAPE_DEFAULTS.TEXT_DEFAULT,
    fontSize = SHAPE_DEFAULTS.TEXT_FONT_SIZE,
    fontFamily = SHAPE_DEFAULTS.TEXT_FONT_FAMILY,
    scaleX = 1,
    scaleY = 1,
  } = shapeData;

  // Update cursor when selection state changes while hovering
  useEffect(() => {
    if (isHovering && nodeRef.current) {
      const stage = nodeRef.current.getStage();
      if (stage) {
        const container = stage.container();
        if (isLocked) {
          container.style.cursor = 'not-allowed';
        } else if (isSelected) {
          container.style.cursor = 'move';
        } else if (type === SHAPE_TYPES.TEXT) {
          container.style.cursor = 'text';
        } else {
          container.style.cursor = 'grab';
        }
      }
    }
  }, [isSelected, isLocked, isHovering, type]);

  // Calculate stroke width - only apply inverse scaling to locked shapes
  const inverseScale = 1 / stageScale;
  
  // Determine stroke width based on state
  let finalStrokeWidth;
  if (isLocked) {
    // Locked shapes: inverse scale to maintain constant visual thickness
    finalStrokeWidth = (strokeWidth + 2) * inverseScale;
  } else if (isSelected) {
    // Selected shapes: normal scaling (zoom-dependent)
    finalStrokeWidth = strokeWidth + 2;
  } else {
    // Regular shapes: normal scaling (zoom-dependent)
    finalStrokeWidth = strokeWidth;
  }

  // Common props for all shape types
  const commonProps = {
    id,
    x,
    y,
    fill,
    stroke: isSelected ? '#0066ff' : (isLocked && lockerColor ? lockerColor : (isLocked ? '#999999' : stroke)),
    strokeWidth: finalStrokeWidth,
    opacity: isLocked ? opacity * 0.5 : opacity,
    rotation,
    draggable: !isLocked,
    ref: (node) => {
      nodeRef.current = node;
      if (shapeRef) shapeRef(node);
    },
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
    onDblClick: (e) => {
      if (onDoubleClick) {
        onDoubleClick(e, shapeData);
      }
    },
    onDblTap: (e) => {
      if (onDoubleClick) {
        onDoubleClick(e, shapeData);
      }
    },
    // Visual feedback
    shadowColor: isSelected ? '#0066ff' : 'black',
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: isSelected ? 0.5 : 0,
    // Cursor styling
    onMouseEnter: (e) => {
      setIsHovering(true);
      const container = e.target.getStage().container();
      if (isLocked) {
        container.style.cursor = 'not-allowed';
      } else if (isSelected) {
        // Show move cursor for selected/active shapes
        container.style.cursor = 'move';
      } else if (type === SHAPE_TYPES.TEXT) {
        container.style.cursor = 'text';
      } else {
        container.style.cursor = 'grab';
      }
    },
    onMouseLeave: (e) => {
      setIsHovering(false);
      const container = e.target.getStage().container();
      container.style.cursor = 'default';
    },
  };

  // Render the appropriate shape element
  let shapeElement;
  switch (type) {
    case SHAPE_TYPES.CIRCLE:
      shapeElement = (
        <Ellipse
          {...commonProps}
          radiusX={width / 2}  // Horizontal radius
          radiusY={height / 2} // Vertical radius (allows ellipse)
        />
      );
      break;

    case SHAPE_TYPES.TEXT:
      shapeElement = (
        <Group
          {...commonProps}
          ref={shapeRef}
          stroke={undefined}
          strokeWidth={undefined}
          scaleX={scaleX}
          scaleY={scaleY}
        >
          <TextShape
            text={text}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={fill}
            opacity={opacity}
            isSelected={isSelected}
            isLocked={isLocked}
            lockerColor={lockerColor}
            finalStrokeWidth={finalStrokeWidth}
            textScaleX={scaleX}
            textScaleY={scaleY}
            shapeRef={null}
          />
        </Group>
      );
      break;

    case SHAPE_TYPES.RECTANGLE:
    default:
      shapeElement = (
        <Rect
          {...commonProps}
          width={width}
          height={height}
          cornerRadius={cornerRadius}
        />
      );
      break;
  }

  // If shape is locked and we have a locker name, add a name tag
  if (isLocked && lockerName) {
    return <ShapeWithNameTag 
      shapeElement={shapeElement}
      lockerName={lockerName}
      lockerColor={lockerColor}
      x={x}
      y={y}
      width={width}
      height={height}
      radius={type === SHAPE_TYPES.CIRCLE ? width / 2 : 0}
      type={type}
      inverseScale={inverseScale}
    />;
  }

  // Otherwise, just return the shape element
  return shapeElement;
}

/**
 * ShapeWithNameTag Component
 * Wrapper that adds a dynamically-sized name tag above a locked shape
 * Matches the cursor name tag styling exactly
 */
function ShapeWithNameTag({ 
  shapeElement, 
  lockerName, 
  lockerColor, 
  x, 
  y, 
  width, 
  height,
  radius,
  type, 
  inverseScale 
}) {
  const textRef = useRef(null);
  const [textWidth, setTextWidth] = useState(0);

  // Use same styling as cursor name tags
  const labelFontSize = CURSOR_CONFIG.LABEL_FONT_SIZE;
  const labelPadding = CURSOR_CONFIG.LABEL_PADDING;
  const gap = 8; // Gap above shape
  
  // Measure actual text width dynamically (same as Cursor component)
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.getTextWidth();
      setTextWidth(width);
    }
  }, [lockerName]);

  const labelWidth = textWidth + labelPadding * 2;
  const labelHeight = labelFontSize + labelPadding * 2;

  // Position the name tag Group at the shape's position
  let groupX, groupY, tagOffsetX, tagOffsetY;

  groupX = type === SHAPE_TYPES.CIRCLE ? x - (labelWidth * inverseScale) / 2 : x + (width / 2) - (labelWidth * inverseScale) / 2;
  groupY = type === SHAPE_TYPES.CIRCLE ? y - radius : y;
  tagOffsetX = 0;
  tagOffsetY = -(labelHeight + gap);


  return (
    <Group>
      {shapeElement}
      {/* Name tag with inverse scaling to maintain constant size */}
      <Group x={groupX} y={groupY} scaleX={inverseScale} scaleY={inverseScale}>
        {/* Name tag background */}
        <KonvaRect
          x={tagOffsetX}
          y={tagOffsetY}
          width={labelWidth}
          height={labelHeight}
          fill={lockerColor || '#666666'}
          cornerRadius={4}
          shadowBlur={2}
          shadowColor="rgba(0, 0, 0, 0.2)"
          shadowOffset={{ x: 0, y: 1 }}
        />
        {/* Name tag text */}
        <Text
          ref={textRef}
          x={tagOffsetX + labelPadding}
          y={tagOffsetY + labelPadding}
          text={lockerName}
          fontSize={labelFontSize}
          fontFamily={CURSOR_CONFIG.LABEL_FONT_FAMILY}
          fill="#ffffff"
          fontStyle="500"
        />
      </Group>
    </Group>
  );
}

export default Shape;

