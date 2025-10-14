import { useState, useRef, useCallback } from 'react';
import { CANVAS_CONFIG } from '../utils/constants';
import { clamp } from '../utils/helpers';

/**
 * Custom hook for managing canvas state (pan and zoom)
 * @returns {object} Canvas state and handlers
 */
function useCanvas() {
  const stageRef = useRef(null);
  
  // Canvas position and scale
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(CANVAS_CONFIG.INITIAL_SCALE);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    // Calculate new scale
    const scaleBy = CANVAS_CONFIG.SCALE_BY;
    const newScale = e.evt.deltaY < 0 
      ? oldScale * scaleBy 
      : oldScale / scaleBy;

    // Clamp scale to min/max
    const clampedScale = clamp(
      newScale,
      CANVAS_CONFIG.MIN_SCALE,
      CANVAS_CONFIG.MAX_SCALE
    );

    // Calculate new position to zoom toward pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageScale(clampedScale);
    setStagePosition(newPos);
  }, []);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
  }, []);

  /**
   * Reset canvas to initial position and scale
   */
  const resetCanvas = useCallback(() => {
    setStagePosition({ x: 0, y: 0 });
    setStageScale(CANVAS_CONFIG.INITIAL_SCALE);
  }, []);

  /**
   * Center canvas on a specific point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  const centerOn = useCallback((x, y) => {
    const stage = stageRef.current;
    if (!stage) return;

    const newPos = {
      x: stage.width() / 2 - x * stageScale,
      y: stage.height() / 2 - y * stageScale,
    };

    setStagePosition(newPos);
  }, [stageScale]);

  /**
   * Fit canvas to view (show entire canvas)
   */
  const fitToView = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleX = stage.width() / CANVAS_CONFIG.WIDTH;
    const scaleY = stage.height() / CANVAS_CONFIG.HEIGHT;
    const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

    const clampedScale = clamp(
      newScale,
      CANVAS_CONFIG.MIN_SCALE,
      CANVAS_CONFIG.MAX_SCALE
    );

    setStageScale(clampedScale);
    setStagePosition({
      x: (stage.width() - CANVAS_CONFIG.WIDTH * clampedScale) / 2,
      y: (stage.height() - CANVAS_CONFIG.HEIGHT * clampedScale) / 2,
    });
  }, []);

  return {
    stageRef,
    stagePosition,
    stageScale,
    isDragging,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    resetCanvas,
    centerOn,
    fitToView,
  };
}

export default useCanvas;

