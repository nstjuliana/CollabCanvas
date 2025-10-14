import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import useCanvas from '../hooks/useCanvas';
import useShapes from '../hooks/useShapes';
import Shape from './Shape';
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
    isLockedByOther,
    handleDragStart: handleShapeDragStart,
    handleDragEnd: handleShapeDragEnd,
  } = useShapes();

  const containerRef = useRef(null);
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

    // Create shape at click position
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
   * Handle shape drag start
   */
  const onShapeDragStart = async (e, shape) => {
    e.cancelBubble = true; // Prevent canvas drag
    
    // Try to lock the shape
    const success = await handleShapeDragStart(shape.id);
    
    // If couldn't lock, prevent drag
    if (!success) {
      e.target.stopDrag();
    }
  };

  /**
   * Handle shape drag end
   */
  const onShapeDragEnd = async (e, shape) => {
    e.cancelBubble = true; // Prevent event from bubbling to canvas
    const node = e.target;
    await handleShapeDragEnd(shape.id, node.x(), node.y());
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

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      {/* Unified Toolbar */}
      <div className="toolbar">
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.RECTANGLE)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.RECTANGLE ? 'active' : ''}`}
          title="Rectangle Tool (Double-click to create)"
        >
          ▭
        </button>
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.CIRCLE)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.CIRCLE ? 'active' : ''}`}
          title="Circle Tool (Double-click to create)"
        >
          ⬤
        </button>
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.DELETE)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.DELETE ? 'active' : ''}`}
          title="Delete Tool (Click shapes to delete)"
        >
          🗑️
        </button>
        
        <div className="toolbar-divider"></div>
        
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          disabled={false}
        />
        
        <div className="toolbar-divider"></div>
        
        <button
          onClick={handleClearCanvas}
          className="toolbar-button"
          disabled={shapes.length === 0}
          title={shapes.length === 0 ? "No shapes to clear" : "Clear all shapes from canvas"}
        >
          💣
        </button>
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
        onDragStart={handleCanvasDragStart}
        onDragEnd={handleCanvasDragEnd}
        onDblClick={handleCanvasDoubleClick}
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
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shapeData={shape}
              isSelected={shape.id === selectedShapeId}
              isLocked={isLockedByOther(shape.id)}
              onDragStart={onShapeDragStart}
              onDragEnd={onShapeDragEnd}
              onClick={onShapeClick}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default Canvas;

