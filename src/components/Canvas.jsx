import { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import useCanvas from '../hooks/useCanvas';
import Shape from './Shape';
import { CANVAS_CONFIG, SHAPE_TYPES, DEFAULT_SHAPE_COLOR, SHAPE_DEFAULTS } from '../utils/constants';
import './Canvas.css';

function Canvas() {
  const {
    stageRef,
    stagePosition,
    stageScale,
    isDragging,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    resetCanvas,
    fitToView,
  } = useCanvas();

  // Demo shapes for testing - will be replaced with Firestore data in Task 8
  const [demoShapes] = useState([
    {
      id: 'demo-1',
      type: SHAPE_TYPES.RECTANGLE,
      x: 500,
      y: 500,
      width: 150,
      height: 100,
      fill: '#FF6B6B',
      stroke: '#333333',
      strokeWidth: 2,
      cornerRadius: 5,
      opacity: 1,
      rotation: 0,
    },
    {
      id: 'demo-2',
      type: SHAPE_TYPES.RECTANGLE,
      x: 800,
      y: 600,
      width: SHAPE_DEFAULTS.WIDTH,
      height: SHAPE_DEFAULTS.HEIGHT,
      fill: '#4ECDC4',
      stroke: '#333333',
      strokeWidth: 2,
      cornerRadius: 0,
      opacity: 1,
      rotation: 15,
    },
    {
      id: 'demo-3',
      type: SHAPE_TYPES.CIRCLE,
      x: 1200,
      y: 700,
      width: 120, // Used as diameter
      height: 120,
      fill: '#45B7D1',
      stroke: '#333333',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
    },
    {
      id: 'demo-4',
      type: SHAPE_TYPES.RECTANGLE,
      x: 1500,
      y: 500,
      width: 200,
      height: 80,
      fill: DEFAULT_SHAPE_COLOR,
      stroke: '#333333',
      strokeWidth: 3,
      cornerRadius: 10,
      opacity: 0.8,
      rotation: -10,
    },
  ]);

  // Fit to view on mount
  useEffect(() => {
    // Small delay to ensure stage is properly sized
    const timer = setTimeout(() => {
      fitToView();
    }, 100);
    return () => clearTimeout(timer);
  }, [fitToView]);

  return (
    <div className="canvas-wrapper">
      {/* Canvas Controls */}
      <div className="canvas-controls">
        <div className="control-group">
          <button
            onClick={resetCanvas}
            className="control-button"
            title="Reset View"
          >
            🔄 Reset
          </button>
          <button
            onClick={fitToView}
            className="control-button"
            title="Fit to View"
          >
            ⛶ Fit
          </button>
        </div>
        
        <div className="zoom-indicator">
          <span className="zoom-label">Zoom:</span>
          <span className="zoom-value">{Math.round(stageScale * 100)}%</span>
        </div>
      </div>

      {/* Canvas Instructions */}
      <div className="canvas-instructions">
        <p>🖱️ Drag to pan • 🖲️ Scroll to zoom</p>
      </div>

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 60} // Account for header
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={true}
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
          {/* Demo shapes - will be replaced with real-time data in future tasks */}
          {demoShapes.map((shape) => (
            <Shape
              key={shape.id}
              shapeData={shape}
              isSelected={false}
              isLocked={false}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default Canvas;

