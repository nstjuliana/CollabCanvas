import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva';
import useCanvas from '../hooks/useCanvas';
import useShapes from '../hooks/useShapes';
import useCursors from '../hooks/useCursors';
import usePresence from '../hooks/usePresence';
import Shape from './Shape';
import Cursor from './Cursor';
import ColorPicker from './ColorPicker';
import { CANVAS_CONFIG, SHAPE_TYPES, SHAPE_COLORS, SHAPE_DEFAULTS, TOOL_TYPES, DEFAULT_TOOL, DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { screenToCanvas, getRandomColor } from '../utils/helpers';
import './Canvas.css';

function Canvas() {
  const {
    stageRef,
    stagePosition,
    stageScale,
    isDragging,
    handleWheel,
    handleDragStart: handleCanvasDragStart,
    handleDragEnd: handleCanvasDragEnd,
    resetCanvas,
    fitToView,
  } = useCanvas();

  // Get presence data to monitor disconnections
  const { presence } = usePresence();

  const {
    shapes,
    loading,
    error,
    selectedShapeId,
    createShape,
    updateShape,
    deleteShape,
    clearAllShapes,
    selectShape,
    unlockShape,
    isLockedByOther,
    handleDragStart: handleShapeDragStart,
    handleDragEnd: handleShapeDragEnd,
  } = useShapes(presence);

  const {
    cursorsList,
    updateCursorPosition,
    activeCursorCount,
  } = useCursors();

  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const shapeRefs = useRef({});
  const isDraggingShapeRef = useRef(false);
  
  // Track touch events for double-tap detection on mobile
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  const [selectedTool, setSelectedTool] = useState(DEFAULT_TOOL);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SHAPE_COLOR);

  // Handle window resize and measure container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Listen for window resize
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Fit to view on mount and when dimensions change
  useEffect(() => {
    // Small delay to ensure stage is properly sized
    const timer = setTimeout(() => {
      fitToView();
    }, 100);
    return () => clearTimeout(timer);
  }, [fitToView, dimensions]);

  // Attach transformer to selected shape
  useEffect(() => {
    if (transformerRef.current && selectedShapeId) {
      const selectedNode = shapeRefs.current[selectedShapeId];
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedShapeId, shapes]);

  // Ensure stage dragging is always enabled on mount and cleanup
  useEffect(() => {
    return () => {
      // Re-enable stage dragging on unmount
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
    };
  }, []);

  // Handle keyboard events (Delete key to delete selected shape)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        // Don't delete if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        // Check if shape is locked
        if (isLockedByOther(selectedShapeId)) {
          console.log('Cannot delete - shape is locked by another user');
          return;
        }

        try {
          await deleteShape(selectedShapeId);
          console.log('Shape deleted with keyboard:', selectedShapeId);
        } catch (err) {
          console.error('Failed to delete shape:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, isLockedByOther, deleteShape]);

  /**
   * Create a shape at the given position
   */
  const createShapeAtPosition = async (canvasPos) => {
    try {
      let newShape;
      
      if (selectedTool === TOOL_TYPES.CIRCLE) {
        // For circles, x/y is the center point, so use canvasPos directly
        newShape = {
          type: SHAPE_TYPES.CIRCLE,
          x: canvasPos.x,
          y: canvasPos.y,
          width: SHAPE_DEFAULTS.WIDTH, // Width is used as diameter
          height: SHAPE_DEFAULTS.HEIGHT,
          fill: selectedColor,
          stroke: '#333333',
          strokeWidth: SHAPE_DEFAULTS.STROKE_WIDTH,
          opacity: SHAPE_DEFAULTS.OPACITY,
          rotation: 0,
        };
      } else {
        // For rectangles, x/y is top-left corner, so offset by half width/height to center on cursor
        newShape = {
          type: selectedTool,
          x: canvasPos.x - SHAPE_DEFAULTS.WIDTH / 2,
          y: canvasPos.y - SHAPE_DEFAULTS.HEIGHT / 2,
          width: SHAPE_DEFAULTS.WIDTH,
          height: SHAPE_DEFAULTS.HEIGHT,
          fill: selectedColor,
          stroke: '#333333',
          strokeWidth: SHAPE_DEFAULTS.STROKE_WIDTH,
          cornerRadius: 5,
          opacity: SHAPE_DEFAULTS.OPACITY,
          rotation: 0,
        };
      }

      await createShape(newShape);
      console.log('Shape created at', canvasPos);
    } catch (err) {
      console.error('Failed to create shape:', err);
    }
  };

  /**
   * Handle double-click on canvas to create a new shape
   */
  const handleCanvasDoubleClick = async (e) => {
    // Don't create shapes when delete tool is active
    if (selectedTool === TOOL_TYPES.DELETE) {
      return;
    }

    // Ignore if clicking on a user-created shape
    // Shapes have an 'id' attribute that matches our Firestore shape IDs
    const hasShapeId = e.target.attrs && e.target.attrs.id && typeof e.target.attrs.id === 'string';
    
    // Don't create if clicking on an existing shape
    if (hasShapeId) {
      console.log('Clicked on existing shape, not creating new one');
      return;
    }

    // Get click position in canvas coordinates
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    const canvasPos = screenToCanvas(stage, pointerPosition);
    
    console.log('Creating shape at', canvasPos);
    await createShapeAtPosition(canvasPos);
  };

  /**
   * Handle touch/tap on canvas for mobile double-tap detection
   */
  const handleCanvasTap = async (e) => {
    // Don't create shapes when delete tool is active
    if (selectedTool === TOOL_TYPES.DELETE) {
      return;
    }

    // Ignore if clicking on a user-created shape
    const hasShapeId = e.target.attrs && e.target.attrs.id && typeof e.target.attrs.id === 'string';
    if (hasShapeId) {
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    // If tapped within 300ms of last tap, it's a double-tap
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double-tap detected!
      const stage = stageRef.current;
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = screenToCanvas(stage, pointerPosition);
      
      console.log('Double-tap detected, creating shape at', canvasPos);
      await createShapeAtPosition(canvasPos);
      
      // Reset to prevent triple-tap from creating another shape
      lastTapRef.current = 0;
      
      // Clear any pending timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
    } else {
      // First tap - record the time
      lastTapRef.current = now;
      
      // Clear after 300ms to reset double-tap detection
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0;
      }, 300);
    }
  };

  /**
   * Handle shape drag start
   */
  const onShapeDragStart = async (e, shape) => {
    e.cancelBubble = true; // Prevent canvas drag
    
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
    }
  };

  /**
   * Handle shape drag end
   */
  const onShapeDragEnd = async (e, shape) => {
    e.cancelBubble = true; // Prevent event from bubbling to canvas
    
    const node = e.target;
    
    try {
      await handleShapeDragEnd(shape.id, node.x(), node.y());
    } finally {
      // Mark that we're done dragging
      isDraggingShapeRef.current = false;
      
      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
    }
  };

  /**
   * Handle shape click
   */
  const onShapeClick = async (e, shape) => {
    e.cancelBubble = true; // Prevent canvas click
    
    // If delete tool is active, delete the shape
    if (selectedTool === TOOL_TYPES.DELETE) {
      if (isLockedByOther(shape.id)) {
        console.log('Cannot delete - shape is locked by another user');
        return;
      }
      
      try {
        await deleteShape(shape.id);
        console.log('Shape deleted:', shape.id);
      } catch (err) {
        console.error('Failed to delete shape:', err);
      }
    } else {
      // Otherwise, select the shape for color editing
      if (isLockedByOther(shape.id)) {
        console.log('Cannot select - shape is locked by another user');
        return;
      }
      
      selectShape(shape.id);
      setSelectedColor(shape.fill);
      console.log('Shape selected:', shape.id);
    }
  };

  /**
   * Handle color change from color picker
   */
  const handleColorChange = async (newColor) => {
    setSelectedColor(newColor);
    
    // If a shape is selected, update its color
    if (selectedShapeId) {
      const shape = shapes.find(s => s.id === selectedShapeId);
      if (shape && !isLockedByOther(selectedShapeId)) {
        try {
          await updateShape(selectedShapeId, { fill: newColor });
          console.log('Shape color updated:', selectedShapeId, newColor);
        } catch (err) {
          console.error('Failed to update shape color:', err);
        }
      }
    }
  };

  /**
   * Handle canvas click to deselect shapes
   */
  const handleCanvasClick = (e) => {
    // Check if we clicked on a user-created shape (they have string IDs matching Firestore)
    const clickedOnShape = e.target.attrs && e.target.attrs.id && typeof e.target.attrs.id === 'string' && shapes.some(s => s.id === e.target.attrs.id);
    
    // If we didn't click on a shape and have a selection, deselect it
    if (!clickedOnShape && selectedShapeId) {
      selectShape(null);
      console.log('Shape deselected');
    }
  };

  /**
   * Handle mouse move to update cursor position
   */
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position in screen coordinates
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert to canvas coordinates
    const canvasPos = screenToCanvas(stage, pointerPosition);
    
    // Update cursor position in Realtime Database (throttled in hook)
    updateCursorPosition(canvasPos.x, canvasPos.y);
  };

  /**
   * Handle clear canvas button click
   */
  const handleClearCanvas = async () => {
    if (shapes.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to clear all ${shapes.length} shape${shapes.length !== 1 ? 's' : ''} from the canvas? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await clearAllShapes();
        console.log('Canvas cleared');
      } catch (err) {
        console.error('Failed to clear canvas:', err);
      }
    }
  };

  /**
   * Handle transform start - lock the shape
   */
  const handleTransformStart = async () => {
    if (!selectedShapeId) return;
    
    // Mark that we're transforming a shape
    isDraggingShapeRef.current = true;
    
    // Disable stage dragging during transformation
    if (stageRef.current) {
      stageRef.current.draggable(false);
    }
    
    // Try to lock the shape
    const success = await handleShapeDragStart(selectedShapeId);
    
    // If couldn't lock, cancel the transform
    if (!success && transformerRef.current) {
      transformerRef.current.nodes([]);
      selectShape(null);
      isDraggingShapeRef.current = false;
      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
    }
  };

  /**
   * Handle transform end - update shape and unlock
   */
  const handleTransformEnd = async (e) => {
    if (!selectedShapeId) return;
    
    const node = e.target;
    const shape = shapes.find(s => s.id === selectedShapeId);
    
    if (!shape) return;

    try {
      // Get the transformed dimensions and rotation
      const updates = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      // For rectangles, update width and height
      if (shape.type === SHAPE_TYPES.RECTANGLE) {
        const newWidth = node.width() * node.scaleX();
        const newHeight = node.height() * node.scaleY();
        
        updates.width = newWidth;
        updates.height = newHeight;
        
        // Update the node's dimensions immediately to prevent flicker
        node.width(newWidth);
        node.height(newHeight);
        
        // Reset scale to 1 after applying it to width/height
        node.scaleX(1);
        node.scaleY(1);
      } else if (shape.type === SHAPE_TYPES.CIRCLE) {
        // For circles, allow ellipse transformation (independent width/height)
        const newWidth = node.width() * node.scaleX();
        const newHeight = node.height() * node.scaleY();
        
        updates.width = newWidth;
        updates.height = newHeight;
        
        // Update the node's dimensions immediately to prevent flicker
        node.width(newWidth);
        node.height(newHeight);
        
        // Reset scale to 1
        node.scaleX(1);
        node.scaleY(1);
      }

      // Update shape in Firestore
      await updateShape(selectedShapeId, updates);
      
      // Don't unlock - the shape remains selected and locked
      
      console.log('Shape transformed:', selectedShapeId, updates);
    } catch (err) {
      console.error('Failed to update shape after transform:', err);
      // Don't unlock on error - shape remains selected
    } finally {
      // Mark that we're done transforming
      isDraggingShapeRef.current = false;
      
      // Re-enable stage dragging
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
    }
  };

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      {/* Unified Toolbar */}
      <div className="toolbar">
        {/* Shapes */}
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.RECTANGLE)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.RECTANGLE ? 'active' : ''}`}
          title="Rectangle Tool (Double-click to create)"
        >
          ■
        </button>
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.CIRCLE)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.CIRCLE ? 'active' : ''}`}
          title="Circle Tool (Double-click to create)"
        >
          ⬤
        </button>
        
        <div className="toolbar-divider"></div>
        
        {/* Color Picker */}
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          disabled={false}
        />
        
        <div className="toolbar-divider"></div>
        
        {/* Deletion Tools */}
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.DELETE)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.DELETE ? 'active' : ''}`}
          title="Delete Tool (Click shapes to delete)"
        >
          🗑️
        </button>
        <button
          onClick={handleClearCanvas}
          className="toolbar-button"
          disabled={shapes.length === 0}
          title={shapes.length === 0 ? "No shapes to clear" : "Clear all shapes from canvas"}
        >
          💣
        </button>
        
        <div className="toolbar-divider"></div>
        
        {/* Zoom Settings */}
        <button
          onClick={resetCanvas}
          className="toolbar-button"
          title="Reset View"
        >
          🔄
        </button>
        <button
          onClick={fitToView}
          className="toolbar-button"
          title="Fit to View"
        >
          ⛶
        </button>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-info">
          <span className="zoom-value">{Math.round(stageScale * 100)}%</span>
        </div>

        {loading && (
          <div className="toolbar-status loading">
            <span>⏳</span>
          </div>
        )}

        {error && (
          <div className="toolbar-status error" title={error}>
            <span>⚠️</span>
          </div>
        )}
      </div>

      {/* Canvas Instructions */}
      <div className="canvas-instructions">
        <p>
          🖱️ Drag to pan • 🖲️ Scroll to zoom • 
          {selectedTool === TOOL_TYPES.DELETE 
            ? ' Click shapes to delete' 
            : selectedShapeId
            ? ' Selected shape - change color in toolbar'
            : ` Double-click to create ${selectedTool} • Click shapes to edit`}
        </p>
      </div>

      {/* Shape Count */}
      <div className="shape-count">
        <span>{shapes.length} shape{shapes.length !== 1 ? 's' : ''}</span>
        {activeCursorCount > 0 && (
          <span className="cursor-count">
            • {activeCursorCount} user{activeCursorCount !== 1 ? 's' : ''} online
          </span>
        )}
      </div>

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={true}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onDragStart={(e) => {
          // Only allow canvas drag if we're not dragging a shape
          if (!isDraggingShapeRef.current) {
            handleCanvasDragStart(e);
          }
        }}
        onDragEnd={(e) => {
          // Only update canvas position if we're not dragging a shape
          if (!isDraggingShapeRef.current) {
            handleCanvasDragEnd(e);
          }
        }}
        onDblClick={handleCanvasDoubleClick}
        onTap={handleCanvasTap}
        onClick={handleCanvasClick}
        className={isDragging ? 'dragging' : ''}
      >
        {/* Background Layer */}
        <Layer>
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_CONFIG.WIDTH}
            height={CANVAS_CONFIG.HEIGHT}
            fill="#ffffff"
            shadowBlur={10}
            shadowColor="rgba(0,0,0,0.2)"
            shadowOffset={{ x: 0, y: 0 }}
          />

          {/* Grid lines (optional - every 500px) */}
          {Array.from({ length: Math.floor(CANVAS_CONFIG.WIDTH / 500) }).map((_, i) => (
            <Rect
              key={`grid-v-${i}`}
              x={(i + 1) * 500}
              y={0}
              width={1}
              height={CANVAS_CONFIG.HEIGHT}
              fill="#f0f0f0"
            />
          ))}
          {Array.from({ length: Math.floor(CANVAS_CONFIG.HEIGHT / 500) }).map((_, i) => (
            <Rect
              key={`grid-h-${i}`}
              x={0}
              y={(i + 1) * 500}
              width={CANVAS_CONFIG.WIDTH}
              height={1}
              fill="#f0f0f0"
            />
          ))}

          {/* Canvas Border */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_CONFIG.WIDTH}
            height={CANVAS_CONFIG.HEIGHT}
            stroke="#ccc"
            strokeWidth={2}
          />

          {/* Canvas Info Text */}
          <Text
            x={CANVAS_CONFIG.WIDTH / 2 - 200}
            y={CANVAS_CONFIG.HEIGHT / 2 - 50}
            text="CollabCanvas"
            fontSize={60}
            fontFamily="Inter, system-ui, sans-serif"
            fontStyle="bold"
            fill="#e0e0e0"
            align="center"
            width={400}
          />
          
          <Text
            x={CANVAS_CONFIG.WIDTH / 2 - 200}
            y={CANVAS_CONFIG.HEIGHT / 2 + 20}
            text={`${CANVAS_CONFIG.WIDTH} × ${CANVAS_CONFIG.HEIGHT} pixels`}
            fontSize={24}
            fontFamily="Inter, system-ui, sans-serif"
            fill="#ccc"
            align="center"
            width={400}
          />

          {/* Corner markers for visual reference */}
          <Rect x={50} y={50} width={100} height={100} fill="#667eea" opacity={0.3} cornerRadius={10} />
          <Rect x={CANVAS_CONFIG.WIDTH - 150} y={50} width={100} height={100} fill="#764ba2" opacity={0.3} cornerRadius={10} />
          <Rect x={50} y={CANVAS_CONFIG.HEIGHT - 150} width={100} height={100} fill="#4ECDC4" opacity={0.3} cornerRadius={10} />
          <Rect x={CANVAS_CONFIG.WIDTH - 150} y={CANVAS_CONFIG.HEIGHT - 150} width={100} height={100} fill="#FFA07A" opacity={0.3} cornerRadius={10} />
        </Layer>

        {/* Shapes Layer */}
        <Layer>
          {/* Real-time shapes from Firestore */}
          {shapes.map((shape) => {
            // Get the color and name of the user who locked this shape
            const lockedByUser = shape.lockedBy ? presence[shape.lockedBy] : null;
            const lockerColor = lockedByUser?.color || null;
            const lockerName = lockedByUser?.displayName || null;
            
            return (
              <Shape
                key={shape.id}
                shapeData={shape}
                isSelected={shape.id === selectedShapeId}
                isLocked={isLockedByOther(shape.id)}
                lockerColor={lockerColor}
                lockerName={lockerName}
                stageScale={stageScale}
                onDragStart={onShapeDragStart}
                onDragEnd={onShapeDragEnd}
                onClick={onShapeClick}
                shapeRef={(node) => {
                  if (node) {
                    shapeRefs.current[shape.id] = node;
                  } else {
                    delete shapeRefs.current[shape.id];
                  }
                }}
              />
            );
          })}
          
          {/* Transformer for selected shape */}
          <Transformer
            ref={transformerRef}
            onTransformStart={handleTransformStart}
            onTransformEnd={handleTransformEnd}
            rotateEnabled={true}
            enabledAnchors={[
              'top-left', 'top-center', 'top-right',
              'middle-left', 'middle-right',
              'bottom-left', 'bottom-center', 'bottom-right'
            ]}
          />
        </Layer>

        {/* Cursors Layer - rendered on top of shapes */}
        <Layer listening={false}>
          {cursorsList.map((cursor) => (
            <Cursor key={cursor.userId} cursor={cursor} stageScale={stageScale} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default Canvas;

