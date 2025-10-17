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
import { uploadImage, loadImage, calculateScaledDimensions } from '../services/images';
import './Canvas.css';

import Toolbar from './Toolbar';
import ShapeCount from './ShapeCount';
import TextEditor from './TextEditor';
import UploadIndicator from './UploadIndicator';
import BackgroundLayer from './BackgroundLayer';
import ShapesLayer from './ShapesLayer';
import CursorsLayer from './CursorsLayer';

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
    selectedShapeIds,
    selectedShapeId,
    createShape,
    updateShape,
    deleteShape,
    deleteMultipleShapes,
    clearAllShapes,
    selectShape,
    selectShapes,
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
  
  // Multi-select state
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null); // { x1, y1, x2, y2 }
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  
  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  // Attach transformer to selected shapes (hide during text editing)
  useEffect(() => {
    if (transformerRef.current && selectedShapeIds.length > 0 && !isEditingText) {
      const selectedNodes = selectedShapeIds
        .map(id => shapeRefs.current[id])
        .filter(node => node !== undefined);
      
      if (selectedNodes.length > 0) {
        transformerRef.current.nodes(selectedNodes);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedShapeIds, shapes, isEditingText]);

  // Update text editing position when canvas zooms or pans
  useEffect(() => {
    if (isEditingText && stageRef.current) {
      // Get current stage transform directly
      const currentScale = stageRef.current.scaleX();
      const currentPosition = stageRef.current.position();
      
      // Recalculate screen position from canvas position
      const screenX = editingTextCanvasPosition.x * currentScale + currentPosition.x;
      const screenY = editingTextCanvasPosition.y * currentScale + currentPosition.y;
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

  // Track Ctrl/Cmd and Shift key state for multi-select
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      }
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      }
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Reset on blur
    const handleBlur = () => {
      setIsCtrlPressed(false);
      setIsShiftPressed(false);
    };
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Handle keyboard events (Delete to delete, Escape to deselect)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Don't handle if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Escape key - deselect all shapes
      if (e.key === 'Escape' && selectedShapeIds.length > 0) {
        selectShape(null);
        return;
      }

      // Delete or Backspace key - delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeIds.length > 0) {
        // Filter out shapes locked by others
        const shapesToDelete = selectedShapeIds.filter(id => !isLockedByOther(id));
        
        if (shapesToDelete.length === 0) {
          return;
        }

        try {
          if (shapesToDelete.length === 1) {
            await deleteShape(shapesToDelete[0]);
          } else {
            await deleteMultipleShapes(shapesToDelete);
          }
        } catch (err) {
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeIds, isLockedByOther, deleteShape, deleteMultipleShapes, selectShape]);

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
      return shapeId;
    } catch (err) {
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
      return;
    }

    // Get click position in canvas coordinates
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    const canvasPos = screenToCanvas(stage, pointerPosition);
    
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
      
      // Handle multi-select with Ctrl/Cmd key
      if (isCtrlPressed) {
        // Toggle selection
        await selectShapes(shape.id, true);
      } else {
        // Single selection
        await selectShape(shape.id);
        setSelectedColor(shape.fill);
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

  /**
   * Handle color change from color picker
   */
  const handleColorChange = async (newColor) => {
    setSelectedColor(newColor);
    
    // If shapes are selected, update their colors
    if (selectedShapeIds.length > 0) {
      // Filter out shapes locked by others
      const shapesToUpdate = selectedShapeIds.filter(id => !isLockedByOther(id));
      
      if (shapesToUpdate.length === 0) {
        return;
      }

      try {
        // Update all selected shapes
        await Promise.all(
          shapesToUpdate.map(id => updateShape(id, { fill: newColor }))
        );
      } catch (err) {
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
    
    // If we didn't click on a shape and have a selection, deselect it (unless Ctrl is pressed)
    if (!clickedOnShape && selectedShapeIds.length > 0 && !isCtrlPressed) {
      selectShape(null);
    }
  };

  /**
   * Handle mouse down on canvas for selection box (Shift+Drag)
   */
  const handleCanvasMouseDown = (e) => {
    // Only start selection box on Shift+Drag
    if (!isShiftPressed) return;
    
    // Don't start selection box if clicking on a shape
    const clickedOnShape = e.target.attrs && e.target.attrs.id && typeof e.target.attrs.id === 'string';
    if (clickedOnShape) return;

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

    setSelectionBox(prev => ({
      ...prev,
      x2: canvasPos.x,
      y2: canvasPos.y,
    }));
  };

  /**
   * Handle mouse up on canvas for selection box
   */
  const handleCanvasMouseUp = async () => {
    if (!isDrawingSelection || !selectionBox) return;

    setIsDrawingSelection(false);

    // Calculate selection box bounds
    const x1 = Math.min(selectionBox.x1, selectionBox.x2);
    const y1 = Math.min(selectionBox.y1, selectionBox.y2);
    const x2 = Math.max(selectionBox.x1, selectionBox.x2);
    const y2 = Math.max(selectionBox.y1, selectionBox.y2);

    // Find shapes within selection box
    const shapesInBox = shapes.filter(shape => {
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
      } else {
        // For rectangles, x/y is top-left
        shapeX1 = shape.x;
        shapeY1 = shape.y;
        shapeX2 = shape.x + shape.width;
        shapeY2 = shape.y + shape.height;
      }

      // Check if shape intersects with selection box
      return !(shapeX2 < x1 || shapeX1 > x2 || shapeY2 < y1 || shapeY1 > y2);
    });

    // Filter out shapes locked by others
    const selectableShapes = shapesInBox
      .map(s => s.id)
      .filter(id => !isLockedByOther(id));

    // Clear selection box immediately for instant feedback
    setSelectionBox(null);

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
    
    // Get current stage transform directly from the stage (most up-to-date)
    const currentScale = stage.scaleX();
    const currentPosition = stage.position();
    
    // Store canvas coordinates (not screen coordinates)
    setEditingTextCanvasPosition({ x, y });
    
    // Convert canvas position to screen position for textarea
    const screenX = x * currentScale + currentPosition.x;
    const screenY = y * currentScale + currentPosition.y;
    
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
        } catch (err) {
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
      } catch (err) {
      }
    }
    
    // Unlock the shape if we were editing an existing one
    if (wasEditingExisting && editingShapeId) {
      try {
        await unlockShape(editingShapeId);
      } catch (err) {
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
      } catch (err) {
      }
    }
    
    setIsEditingText(false);
    setEditingTextValue('');
    setEditingShapeId(null);
  };

  /**
   * Handle mouse move to update cursor position and selection box
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

    // Update selection box if drawing
    handleCanvasMouseMove(e);
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
      } catch (err) {
      }
    }
  };

  /**
   * Load image from file and get dimensions
   */
  const loadImageFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handle image drop
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    
    // Get the dropped files
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      return;
    }

    // Get drop position on canvas
    const stage = stageRef.current;
    if (!stage) return;

    // Get the drop position relative to the canvas
    const canvasContainer = containerRef.current;
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasPos = screenToCanvas(stage, { x, y });

    // Upload and create shapes for each image
    for (const file of imageFiles) {
      try {
        setIsUploadingImage(true);

        // Get image dimensions from file BEFORE uploading (avoids CORS issue)
        const { width: imgWidth, height: imgHeight } = await loadImageFromFile(file);

        // Calculate scaled dimensions
        const { width, height } = calculateScaledDimensions(
          imgWidth,
          imgHeight,
          SHAPE_DEFAULTS.IMAGE_MAX_WIDTH,
          SHAPE_DEFAULTS.IMAGE_MAX_HEIGHT
        );

        // Upload to Firebase Storage
        const imageUrl = await uploadImage(file);

        // Create image shape at drop position
        const newShape = {
          type: SHAPE_TYPES.IMAGE,
          x: canvasPos.x - width / 2, // Center on cursor
          y: canvasPos.y - height / 2,
          width,
          height,
          imageUrl,
          opacity: SHAPE_DEFAULTS.OPACITY,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };

        await createShape(newShape);
      } catch (err) {
        alert(`Failed to upload ${file.name}: ${err.message}`);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  /**
   * Handle drag over (required to enable drop)
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  /**
   * Handle transform start - lock the shapes
   */
  const handleTransformStart = async () => {
    if (selectedShapeIds.length === 0) return;
    
    // Mark that we're transforming shapes
    isDraggingShapeRef.current = true;
    
    // Disable stage dragging during transformation
    if (stageRef.current) {
      stageRef.current.draggable(false);
    }
    
    // Shapes should already be locked since they're selected
    // Just verify they're locked
    const allLocked = selectedShapeIds.every(id => !isLockedByOther(id));
    
    // If any couldn't be locked, cancel the transform
    if (!allLocked && transformerRef.current) {
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
   * Handle transform end - update shapes
   */
  const handleTransformEnd = async (e) => {
    if (selectedShapeIds.length === 0) return;
    
    const node = e.target;
    
    try {
      // Find which shape was transformed
      const transformedShapeId = node.attrs?.id;
      const shape = shapes.find(s => s.id === transformedShapeId);
      
      if (!shape) return;

      // Get the transformed dimensions and rotation
      const updates = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };


      // Bake scaling into dimensions for rectangles and circles; preserve scale for text
  if (shape.type === SHAPE_TYPES.RECTANGLE || shape.type === SHAPE_TYPES.CIRCLE) {
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
  } else if (shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.IMAGE) {
    // For text and images, preserve independent scaleX and scaleY for distortion/resizing
    updates.scaleX = node.scaleX();
    updates.scaleY = node.scaleY();
  }

      // Update shape in Firestore
      await updateShape(transformedShapeId, updates);
      
    } catch (err) {
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
    <div 
      className="canvas-wrapper" 
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Toolbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        selectedColor={selectedColor}
        handleColorChange={handleColorChange}
        shapesLength={shapes.length}
        loading={loading}
        error={error}
        resetCanvas={resetCanvas}
        fitToView={fitToView}
        stageScale={stageScale}
        handleClearCanvas={handleClearCanvas}
      />

      <ShapeCount shapesLength={shapes.length} activeCursorCount={activeCursorCount} />

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={!isDrawingSelection}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onDragStart={(e) => {
          if (!isDraggingShapeRef.current && !isDrawingSelection) {
            handleCanvasDragStart(e);
          }
        }}
        onDragEnd={(e) => {
          if (!isDraggingShapeRef.current) {
            handleCanvasDragEnd(e);
          }
        }}
        onDblClick={handleCanvasDoubleClick}
        onTap={handleCanvasTap}
        onClick={handleCanvasClick}
        className={isDragging ? 'dragging' : ''}
      >
        <BackgroundLayer />

        <ShapesLayer
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          isLockedByOther={isLockedByOther}
          presence={presence}
          stageScale={stageScale}
          transformerRef={transformerRef}
          shapeRefs={shapeRefs}
          selectionBox={selectionBox}
          onShapeDragStart={onShapeDragStart}
          onShapeDragEnd={onShapeDragEnd}
          onShapeClick={onShapeClick}
          onShapeDoubleClick={onShapeDoubleClick}
          handleTransformStart={handleTransformStart}
          handleTransformEnd={handleTransformEnd}
          isEditingText={isEditingText}
          editingShapeId={editingShapeId}
        />

        <CursorsLayer cursorsList={cursorsList} stageScale={stageScale} />
      </Stage>
      
      <TextEditor
        isEditingText={isEditingText}
        editingTextPosition={editingTextPosition}
        editingTextValue={editingTextValue}
        setEditingTextValue={setEditingTextValue}
        finishTextEditing={finishTextEditing}
        cancelTextEditing={cancelTextEditing}
        selectedColor={selectedColor}
        editingTextTransform={editingTextTransform}
        stageRef={stageRef}
      />

      <UploadIndicator isUploadingImage={isUploadingImage} />
    </div>
  );
}

export default Canvas;

