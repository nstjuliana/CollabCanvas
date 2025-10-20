import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva';
import useCanvas from '../hooks/useCanvas';
import useShapes from '../hooks/useShapes';
import useCursors from '../hooks/useCursors';
import usePresence from '../hooks/usePresence';
import useUndoRedo, { ACTION_TYPES } from '../hooks/useUndoRedo';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useTextEditing from '../hooks/useTextEditing';
import useImageUpload from '../hooks/useImageUpload';
import useMultiSelect from '../hooks/useMultiSelect';
import useShapeManipulation from '../hooks/useShapeManipulation';
import useUndoRedoActions from '../hooks/useUndoRedoActions';
import Shape from './Shape';
import Cursor from './Cursor';
import ColorPicker from './ColorPicker';
import { CANVAS_CONFIG, SHAPE_TYPES, SHAPE_COLORS, SHAPE_DEFAULTS, TOOL_TYPES, DEFAULT_TOOL, DEFAULT_SHAPE_COLOR } from '../utils/constants';
import { screenToCanvas, getRandomColor } from '../utils/helpers';
import { buildShapeObject } from '../utils/shapeBuilders';
import { uploadImage, loadImage, calculateScaledDimensions } from '../services/images';
import './Canvas.css';

import Toolbar from './Toolbar';
import ShapeCount from './ShapeCount';
import TextEditor from './TextEditor';
import UploadIndicator from './UploadIndicator';
import BackgroundLayer from './BackgroundLayer';
import ShapesLayer from './ShapesLayer';
import CursorsLayer from './CursorsLayer';
import AIAgentPanel from './AIAgentPanel';
import PropertiesPanel from './PropertiesPanel';

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
    shapeLocks,
    loading,
    error,
    selectedShapeIds,
    selectedShapeId,
    createShapes,
    updateShapes,
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

  const {
    canUndo,
    canRedo,
    addToHistory,
    undo: undoHistory,
    redo: redoHistory,
    startUndoRedo,
    endUndoRedo,
  } = useUndoRedo();

  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const shapeRefs = useRef({});

  // Use undo/redo actions hook first to get handleUndo/handleRedo
  const {
    undoRedoIdMap,
    handleUndo,
    handleRedo,
  } = useUndoRedoActions({
    canUndo,
    canRedo,
    shapes,
    createShapes,
    deleteShape,
    deleteMultipleShapes,
    selectShape,
    selectShapes,
    updateShapes,
    undoHistory,
    redoHistory,
    startUndoRedo,
    endUndoRedo
  });

  // Use keyboard shortcuts hook after getting handleUndo/handleRedo
  useKeyboardShortcuts({
    selectedShapeIds,
    shapes,
    isLockedByOther,
    deleteShape,
    deleteMultipleShapes,
    selectShape,
    updateShapes,
    addToHistory,
    handleUndo,
    handleRedo,
    createShapes,
    selectShapes
  });

  // Define state variables before hooks that depend on them
  const [selectedTool, setSelectedTool] = useState(DEFAULT_TOOL);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SHAPE_COLOR);

  // Track touch events for double-tap detection on mobile
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  // Create shape at position function (shared between hooks)
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

  // Use text editing hook first
  const {
    isEditingText,
    editingTextPosition,
    editingTextValue,
    setEditingTextValue,
    editingShapeId,
    editingTextTransform,
    textareaRef,
    startTextEditing,
    finishTextEditing,
    cancelTextEditing,
  } = useTextEditing({
    stageRef,
    stageScale,
    stagePosition,
    shapeRefs,
    shapes,
    updateShapes,
    deleteShape,
    unlockShape,
    createShapeAtPosition,
    addToHistory
  });

  // Use shape manipulation hook (depends on startTextEditing from text editing hook)
  const {
    isDraggingShapeRef,
    isClickOnShape,
    onShapeDragStart,
    onShapeDragEnd,
    onShapeClick,
    onShapeDoubleClick,
  } = useShapeManipulation({
    stageRef,
    selectedTool,
    selectedColor,
    shapes,
    isLockedByOther,
    createShapes,
    deleteShape,
    selectShape,
    selectShapes,
    updateShapes,
    handleShapeDragStart,
    handleShapeDragEnd,
    addToHistory,
    startTextEditing,
    setSelectedColor,
    createShapeAtPosition
  });

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Multi-select state
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Use multi-select hook
  const {
    selectionBox,
    isDrawingSelection,
    selectionPreviewIds,
    isShapeInBox,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  } = useMultiSelect({
    stageRef,
    shapes,
    isLockedByOther,
    selectedShapeIds,
    selectShapes,
    setSelectedColor,
    isClickOnShape
  });

  // Use image upload hook
  const {
    isUploadingImage,
    handleDrop,
    handleDragOver,
  } = useImageUpload({
    stageRef,
    containerRef,
    createShapes,
    selectShape,
    addToHistory
  });

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




  /**
   * Handle double-click on canvas to create a new shape or start text editing
   */
  const handleCanvasDoubleClick = async (e) => {
    // Don't create shapes when delete tool is active
    if (selectedTool === TOOL_TYPES.DELETE) {
      return;
    }

    // Don't create if clicking on an existing shape (check target and parents)
    if (isClickOnShape(e)) {
      return;
    }

    // Get click position in canvas coordinates
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    const canvasPos = screenToCanvas(stage, pointerPosition);

    // If text tool is selected, start text editing instead of creating shape
    if (selectedTool === TOOL_TYPES.TEXT) {
      startTextEditing(canvasPos.x, canvasPos.y);
      return;
    }

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

    // Don't create if clicking on an existing shape
    if (isClickOnShape(e)) {
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

      // If text tool is selected, start text editing instead of creating shape
      if (selectedTool === TOOL_TYPES.TEXT) {
        startTextEditing(canvasPos.x, canvasPos.y);
      } else {
        await createShapeAtPosition(canvasPos);
      }

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

      // Store previous colors for undo
      const previousStates = shapesToUpdate.map(id => {
        const shape = shapes.find(s => s.id === id);
        return shape ? { id, updates: { fill: shape.fill } } : null;
      }).filter(Boolean);

      try {
        // Update all selected shapes with a single batch write
        await updateShapes(
          shapesToUpdate.map(id => ({ id, fill: newColor }))
        );

        // Add to history
        addToHistory({
          type: ACTION_TYPES.UPDATE,
          data: {
            shapeIds: shapesToUpdate,
            previousStates,
            newStates: shapesToUpdate.map(id => ({ id, updates: { fill: newColor } }))
          }
        });
      } catch (err) {
      }
    }
  };

  /**
   * Handle canvas click for deselecting shapes
   */
  const handleCanvasClick = async (e) => {
    // Check if we clicked on a user-created shape
    const clickedOnShape = isClickOnShape(e);

    // If we didn't click on a shape and have a selection, deselect it (unless Ctrl is pressed)
    if (!clickedOnShape && selectedShapeIds.length > 0 && !isCtrlPressed) {
      selectShape(null);
    }
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
    
    try {
      // When multiple shapes are selected, we need to update all of them
      const allPreviousStates = [];
      const allNewStates = [];
      const updatesToApply = [];

      // Iterate through all selected shapes
      for (const shapeId of selectedShapeIds) {
        const shape = shapes.find(s => s.id === shapeId);
        const node = shapeRefs.current[shapeId];
        
        if (!shape || !node) continue;

        // Store previous state for undo
        const previousState = {
          x: shape.x,
          y: shape.y,
          rotation: shape.rotation,
          width: shape.width,
          height: shape.height,
          scaleX: shape.scaleX,
          scaleY: shape.scaleY,
          // Include star-specific properties
          ...(shape.type === SHAPE_TYPES.STAR && {
            innerRadius: shape.innerRadius,
            outerRadius: shape.outerRadius,
          }),
          // Include line-specific properties
          ...(shape.type === SHAPE_TYPES.LINE && {
            points: shape.points,
            strokeWidth: shape.strokeWidth,
          }),
        };

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
        } else if (shape.type === SHAPE_TYPES.STAR) {
          // For stars, calculate new radius values from the applied scaling
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const avgScale = (scaleX + scaleY) / 2; // Use average scale for uniform scaling

          // Get current radius values or calculate from dimensions
          const currentInnerRadius = shape.innerRadius || (Math.min(shape.width, shape.height) / 2) * 0.5;
          const currentOuterRadius = shape.outerRadius || Math.min(shape.width, shape.height) / 2;

          // Apply scaling to radii
          const newInnerRadius = currentInnerRadius * avgScale;
          const newOuterRadius = currentOuterRadius * avgScale;

          updates.innerRadius = newInnerRadius;
          updates.outerRadius = newOuterRadius;

          // Update the node's scale back to 1
          node.scaleX(1);
          node.scaleY(1);

          // Update width/height to match the new scaled dimensions for consistency
          const newWidth = node.width() * scaleX;
          const newHeight = node.height() * scaleY;
          updates.width = newWidth;
          updates.height = newHeight;
          node.width(newWidth);
          node.height(newHeight);

        } else if (shape.type === SHAPE_TYPES.LINE) {
          // For lines, we need to bake the scale into the points array
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const originalPoints = node.points();

          // Ensure we have valid points
          if (!originalPoints || originalPoints.length < 2) {
            continue; // Skip this shape if no valid points
          }

          // Apply scale to each point coordinate
          const scaledPoints = [];
          for (let i = 0; i < originalPoints.length; i += 2) {
            scaledPoints.push(originalPoints[i] * scaleX);      // x coordinate
            scaledPoints.push(originalPoints[i + 1] * scaleY);  // y coordinate
          }

          updates.points = scaledPoints;
          // Reset scale to 1 since we baked it into the points
          updates.scaleX = 1;
          updates.scaleY = 1;

          // For lines, calculate the new stroke width based on scaling
          // Use average of scaleX and scaleY for uniform stroke width scaling
          const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
          const newStrokeWidth = shape.strokeWidth * avgScale;
          updates.strokeWidth = newStrokeWidth;

          // For lines, calculate width/height based on the scaled points span
          // This ensures the line's bounding box is correct
          const xs = [];
          const ys = [];
          for (let i = 0; i < scaledPoints.length; i += 2) {
            xs.push(scaledPoints[i]);
            ys.push(scaledPoints[i + 1]);
          }

          if (xs.length > 0 && ys.length > 0) {
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            const calculatedWidth = Math.abs(maxX - minX) || 1;
            const calculatedHeight = Math.abs(maxY - minY) || 1;

            updates.width = calculatedWidth;
            updates.height = calculatedHeight;

            // Update the node's width/height to match the calculated dimensions
            node.width(calculatedWidth);
            node.height(calculatedHeight);
          }

          // Reset scale to 1 and update node for immediate visual feedback
          node.scaleX(1);
          node.scaleY(1);
          node.points(scaledPoints);
          node.strokeWidth(newStrokeWidth);

        } else if (shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.IMAGE) {
          // For text and images, preserve independent scaleX and scaleY for distortion/resizing
          updates.scaleX = node.scaleX();
          updates.scaleY = node.scaleY();
        }

        // Store for batch update
        allPreviousStates.push({ id: shapeId, updates: previousState });
        allNewStates.push({ id: shapeId, updates });
        updatesToApply.push({ id: shapeId, ...updates });
      }

      // Batch update all shapes in Firestore
      if (updatesToApply.length > 0) {
        await updateShapes(updatesToApply);

        // Add to history
        addToHistory({
          type: ACTION_TYPES.UPDATE,
          data: {
            shapeIds: selectedShapeIds,
            previousStates: allPreviousStates,
            newStates: allNewStates
          }
        });
      }
      
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

      <ShapeCount shapesLength={shapes.length} />

      <AIAgentPanel 
        shapes={shapes} 
        selectedShapeIds={selectedShapeIds}
        deleteShape={deleteShape}
        selectShape={selectShape}
      />

      <PropertiesPanel
        selectedShapeIds={selectedShapeIds}
        shapes={shapes}
        updateShapes={updateShapes}
        isLockedByOther={isLockedByOther}
        addToHistory={addToHistory}
      />

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={!isShiftPressed && !isDrawingSelection}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => handleCanvasMouseDown(e, isShiftPressed)}
        onMouseUp={() => handleCanvasMouseUp(isCtrlPressed)}
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
          shapeLocks={shapeLocks}
          selectedShapeIds={selectedShapeIds}
          isLockedByOther={isLockedByOther}
          presence={presence}
          stageScale={stageScale}
          transformerRef={transformerRef}
          shapeRefs={shapeRefs}
          selectionBox={selectionBox}
          selectionPreviewIds={selectionPreviewIds}
          onShapeDragStart={onShapeDragStart}
          onShapeDragEnd={onShapeDragEnd}
          onShapeClick={(e, shape) => onShapeClick(e, shape, isCtrlPressed)}
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

