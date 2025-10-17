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
  
  // Text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextPosition, setEditingTextPosition] = useState({ x: 0, y: 0 });
  const [editingTextCanvasPosition, setEditingTextCanvasPosition] = useState({ x: 0, y: 0 }); // Canvas coordinates
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

  // Attach transformer to selected shape (hide during text editing)
  useEffect(() => {
    if (transformerRef.current && selectedShapeId && !isEditingText) {
      const selectedNode = shapeRefs.current[selectedShapeId];
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedShapeId, shapes, isEditingText]);

  // Update text editing position when canvas zooms or pans
  useEffect(() => {
    if (isEditingText) {
      // Recalculate screen position from canvas position
      const screenX = editingTextCanvasPosition.x * stageScale + stagePosition.x;
      const screenY = editingTextCanvasPosition.y * stageScale + stagePosition.y;
      setEditingTextPosition({ x: screenX, y: screenY });
    }
  }, [stageScale, stagePosition, isEditingText, editingTextCanvasPosition]);

  // Ensure stage dragging is always enabled on mount and cleanup
  useEffect(() => {
    return () => {
      // Re-enable stage dragging on unmount
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
    };
  }, []);

  // Handle keyboard events (Delete to delete, Escape to deselect)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Don't handle if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Escape key - deselect active shape
      if (e.key === 'Escape' && selectedShapeId) {
        selectShape(null);
        console.log('Shape deselected with Escape key');
        return;
      }

      // Delete or Backspace key - delete selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
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
  }, [selectedShapeId, isLockedByOther, deleteShape, selectShape]);

  /**
   * Create a shape at the given position
   */
  const createShapeAtPosition = async (canvasPos, text = SHAPE_DEFAULTS.TEXT_DEFAULT) => {
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
      } else if (selectedTool === TOOL_TYPES.TEXT) {
        // For text, x/y is the top-left corner
        newShape = {
          type: SHAPE_TYPES.TEXT,
          x: canvasPos.x,
          y: canvasPos.y,
          text: text,
          fontSize: SHAPE_DEFAULTS.TEXT_FONT_SIZE,
          fontFamily: SHAPE_DEFAULTS.TEXT_FONT_FAMILY,
          fill: selectedColor,
          opacity: SHAPE_DEFAULTS.OPACITY,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
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

      const shapeId = await createShape(newShape);
      console.log('Shape created at', canvasPos);
      return shapeId;
    } catch (err) {
      console.error('Failed to create shape:', err);
      return null;
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
   * Handle shape double-click for text editing
   */
  const onShapeDoubleClick = async (e, shape) => {
    e.cancelBubble = true; // Prevent canvas double-click
    
    // Only allow editing text shapes
    if (shape.type !== SHAPE_TYPES.TEXT) return;
    
    // Check if shape is locked by another user
    if (isLockedByOther(shape.id)) {
      console.log('Cannot edit - text is locked by another user');
      return;
    }
    
    // Lock the shape for editing
    const success = await handleShapeDragStart(shape.id);
    if (!success) {
      console.log('Could not lock text shape for editing');
      return;
    }
    
    // Start text editing
    startTextEditing(shape.x, shape.y, shape);
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
   * Handle canvas click for text tool or deselecting shapes
   */
  const handleCanvasClick = async (e) => {
    // Check if we clicked on a user-created shape (they have string IDs matching Firestore)
    const clickedOnShape = e.target.attrs && e.target.attrs.id && typeof e.target.attrs.id === 'string' && shapes.some(s => s.id === e.target.attrs.id);
    
    // If text tool is selected and we didn't click on a shape, start text editing
    if (selectedTool === TOOL_TYPES.TEXT && !clickedOnShape) {
      const stage = stageRef.current;
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = screenToCanvas(stage, pointerPosition);
      
      // Start text editing at click position
      startTextEditing(canvasPos.x, canvasPos.y);
      return;
    }
    
    // If we didn't click on a shape and have a selection, deselect it
    if (!clickedOnShape && selectedShapeId) {
      selectShape(null);
      console.log('Shape deselected');
    }
  };
  
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
    
    // Store canvas coordinates (not screen coordinates)
    setEditingTextCanvasPosition({ x, y });
    
    // Convert canvas position to screen position for textarea
    const scale = stageScale;
    const screenX = x * scale + stagePosition.x;
    const screenY = y * scale + stagePosition.y;
    
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
        try {
          await updateShape(editingShapeId, { text });
          console.log('Text shape updated:', editingShapeId);
        } catch (err) {
          console.error('Failed to update text shape:', err);
        }
      } else {
        // Create new text shape at the clicked position
        const stage = stageRef.current;
        if (stage) {
          // Convert screen position back to canvas position
          const canvasX = (editingTextPosition.x - stagePosition.x) / stageScale;
          const canvasY = (editingTextPosition.y - stagePosition.y) / stageScale;
          
          await createShapeAtPosition({ x: canvasX, y: canvasY }, text);
        }
      }
    } else if (editingShapeId) {
      // If text is empty and we're editing an existing shape, delete it
      try {
        await deleteShape(editingShapeId);
        console.log('Empty text shape deleted:', editingShapeId);
      } catch (err) {
        console.error('Failed to delete text shape:', err);
      }
    }
    
    // Unlock the shape if we were editing an existing one
    if (wasEditingExisting && editingShapeId) {
      try {
        await unlockShape(editingShapeId);
        console.log('Text shape unlocked after editing');
      } catch (err) {
        console.error('Failed to unlock text shape:', err);
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
        console.log('Text shape unlocked after canceling edit');
      } catch (err) {
        console.error('Failed to unlock text shape:', err);
      }
    }
    
    setIsEditingText(false);
    setEditingTextValue('');
    setEditingShapeId(null);
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
      } else if (shape.type === SHAPE_TYPES.TEXT) {
        // For text, preserve independent scaleX and scaleY for distortion
        // The node already has the accumulated scale (from prop + transformer delta)
        // So we can use it directly
        const newScaleX = node.scaleX();
        const newScaleY = node.scaleY();
        
        updates.scaleX = newScaleX;
        updates.scaleY = newScaleY;
        
        // Node already has the correct scale, no need to update it
        // (this prevents flicker since it stays consistent until React re-renders)
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
        <button
          onClick={() => setSelectedTool(TOOL_TYPES.TEXT)}
          className={`toolbar-button ${selectedTool === TOOL_TYPES.TEXT ? 'active' : ''}`}
          title="Text Tool (Click to add text)"
        >
          T
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
            : selectedTool === TOOL_TYPES.TEXT
            ? ' Click to add text • Double-click text to edit'
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
            // Hide the shape if it's currently being edited
            if (isEditingText && editingShapeId === shape.id) {
              return null;
            }
            
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
                onDoubleClick={onShapeDoubleClick}
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
      
      {/* Text editing overlay - positioned and transformed to match text */}
      {isEditingText && (() => {
        // Calculate the actual visual dimensions (text dimensions * scale * stage zoom)
        const visualWidth = editingTextTransform.width * editingTextTransform.scaleX * stageScale;
        const visualHeight = editingTextTransform.height * editingTextTransform.scaleY * stageScale;
        const avgScale = (editingTextTransform.scaleX + editingTextTransform.scaleY) / 2;
        const visualFontSize = editingTextTransform.fontSize * avgScale * stageScale;
        
        return (
          <textarea
            ref={textareaRef}
            className="text-editor"
            value={editingTextValue}
            onChange={(e) => setEditingTextValue(e.target.value)}
            onBlur={finishTextEditing}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelTextEditing();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                finishTextEditing();
              }
            }}
            style={{
              position: 'absolute',
              left: `${editingTextPosition.x}px`,
              top: `${editingTextPosition.y}px`,
              fontSize: `${visualFontSize}px`,
              fontFamily: SHAPE_DEFAULTS.TEXT_FONT_FAMILY,
              color: selectedColor,
              background: 'transparent',
              border: '1px solid #0066ff',
              padding: '0',
              margin: '0',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              whiteSpace: 'pre',
              lineHeight: '1',
              transformOrigin: 'top left',
              transform: `rotate(${editingTextTransform.rotation}deg)`,
              zIndex: 1000,
              boxSizing: 'border-box',
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
              minWidth: '20px',
              minHeight: '20px',
            }}
          />
        );
      })()}
    </div>
  );
}

export default Canvas;

