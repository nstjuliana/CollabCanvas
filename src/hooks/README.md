# Hooks Module

This module contains custom React hooks for managing component state and logic.

## Files

### useCanvas.js
Custom hook for managing canvas pan and zoom functionality.

**Features:**
- Stage position management (x, y coordinates)
- Zoom level management (scale)
- Mouse wheel zoom toward pointer
- Drag to pan with state tracking
- Helper functions for canvas manipulation

**Returns:**
```javascript
{
  stageRef,        // Ref for Konva Stage
  stagePosition,   // { x, y } position
  stageScale,      // Zoom scale (1 = 100%)
  isDragging,      // Boolean drag state
  handleWheel,     // Mouse wheel handler
  handleDragStart, // Drag start handler
  handleDragEnd,   // Drag end handler
  resetCanvas,     // Reset to initial state
  centerOn,        // Center on specific coords
  fitToView,       // Fit entire canvas to view
}
```

**Usage:**
```jsx
import useCanvas from './hooks/useCanvas';

function Canvas() {
  const {
    stageRef,
    stagePosition,
    stageScale,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    resetCanvas,
    fitToView,
  } = useCanvas();

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      x={stagePosition.x}
      y={stagePosition.y}
      scaleX={stageScale}
      scaleY={stageScale}
      draggable={true}
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Layers and shapes */}
    </Stage>
  );
}
```

## Pan & Zoom Implementation

### Zoom Algorithm
The zoom functionality zooms toward the mouse pointer position:

1. Get pointer position relative to stage
2. Calculate point in canvas coordinates
3. Apply new scale
4. Adjust position to keep pointer point fixed

This creates a natural zoom experience where you zoom toward where you're pointing.

### Pan Implementation
Panning is handled by Konva's built-in draggable functionality:

- `draggable={true}` enables stage dragging
- `onDragStart` and `onDragEnd` track drag state
- Position is managed by React state

### Scale Clamping
Zoom is clamped to prevent extreme values:
- Minimum scale: 0.1x (10%)
- Maximum scale: 3x (300%)
- Configurable in `CANVAS_CONFIG`

## Helper Functions

### resetCanvas()
Resets canvas to initial state:
- Position: (0, 0)
- Scale: 1.0 (100%)

### centerOn(x, y)
Centers the canvas on specific coordinates:
```javascript
centerOn(2500, 2500); // Center on middle of 5000x5000 canvas
```

### fitToView()
Automatically scales and positions canvas to fit entire workspace in view:
- Calculates optimal scale
- Centers canvas
- Adds 10% padding

## Future Hooks

Hooks to be implemented in later tasks:
- `useShapes.js` - Shape state management
- `useCursors.js` - Multiplayer cursor tracking
- `usePresence.js` - User presence tracking

## Performance Considerations

- Uses `useCallback` to memoize handlers
- Prevents unnecessary re-renders
- Efficient state updates
- Clamps values to valid ranges
- Uses refs for direct DOM access where needed

