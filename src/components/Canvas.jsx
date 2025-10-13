import { useEffect } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import useCanvas from '../hooks/useCanvas';
import { CANVAS_CONFIG } from '../utils/constants';
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

        {/* Shapes Layer - will be populated in future tasks */}
        <Layer>
          {/* Shapes will go here */}
        </Layer>
      </Stage>
    </div>
  );
}

export default Canvas;

