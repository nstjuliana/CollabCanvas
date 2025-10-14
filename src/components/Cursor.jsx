/**
 * Cursor Component
 * Displays a remote user's cursor position with username label
 */

import { useRef, useEffect, useState } from 'react';
import { Circle, Text, Rect, Group } from 'react-konva';
import { CURSOR_CONFIG } from '../utils/constants';

function Cursor({ cursor, stageScale = 1 }) {
  const { x, y, displayName, color } = cursor;
  const textRef = useRef(null);
  const [textWidth, setTextWidth] = useState(0);

  // Calculate label dimensions
  const labelText = displayName || 'Anonymous';
  const labelFontSize = CURSOR_CONFIG.LABEL_FONT_SIZE;
  const labelPadding = CURSOR_CONFIG.LABEL_PADDING;
  
  // Measure actual text width dynamically
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.getTextWidth();
      setTextWidth(width);
    }
  }, [labelText]);

  const labelWidth = textWidth + labelPadding * 2;
  const labelHeight = labelFontSize + labelPadding * 2;

  // Scale inversely to stage scale to maintain fixed visual size
  const inverseScale = 1 / stageScale;

  return (
    <Group x={x} y={y} scaleX={inverseScale} scaleY={inverseScale}>
      {/* Cursor dot */}
      <Circle
        radius={CURSOR_CONFIG.SIZE / 2}
        fill={color}
        shadowBlur={3}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowOffset={{ x: 0, y: 1 }}
      />

      {/* Cursor outline for better visibility */}
      <Circle
        radius={CURSOR_CONFIG.SIZE / 2}
        stroke="#ffffff"
        strokeWidth={2}
      />

      {/* Username label background */}
      <Rect
        x={CURSOR_CONFIG.LABEL_OFFSET_X}
        y={CURSOR_CONFIG.LABEL_OFFSET_Y - labelHeight / 2}
        width={labelWidth}
        height={labelHeight}
        fill={color}
        cornerRadius={4}
        shadowBlur={2}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowOffset={{ x: 0, y: 1 }}
      />

      {/* Username label text */}
      <Text
        ref={textRef}
        x={CURSOR_CONFIG.LABEL_OFFSET_X + labelPadding}
        y={CURSOR_CONFIG.LABEL_OFFSET_Y - labelHeight / 2 + labelPadding}
        text={labelText}
        fontSize={labelFontSize}
        fontFamily={CURSOR_CONFIG.LABEL_FONT_FAMILY}
        fill="#ffffff"
        fontStyle="500"
      />
    </Group>
  );
}

export default Cursor;

