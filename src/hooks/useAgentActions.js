/**
 * useAgentActions Hook
 * Provides AI agent actions with access to current shapes state
 * This is a wrapper around agentActions service that injects shapes state
 */

import { useCallback } from 'react';
import * as agentActions from '../services/agentActions';

/**
 * Hook for AI agent actions
 * @param {Array} shapes - Current shapes array from useShapes
 * @returns {Object} Agent action functions
 */
function useAgentActions(shapes) {
  // Functions that need shapes state injected
  const getAllShapes = useCallback(() => {
    return agentActions.getAllShapes(shapes);
  }, [shapes]);

  const findShapes = useCallback((criteria) => {
    return agentActions.findShapes(shapes, criteria);
  }, [shapes]);

  const deleteShapesByCriteria = useCallback(async (criteria) => {
    return await agentActions.deleteShapesByCriteria(shapes, criteria);
  }, [shapes]);

  // Pass-through functions that don't need shapes state
  const createShape = useCallback(async (type, x, y, properties = {}) => {
    return await agentActions.createShape(type, x, y, properties);
  }, []);

  const createMultipleShapes = useCallback(async (shapesArray) => {
    return await agentActions.createMultipleShapes(shapesArray);
  }, []);

  const deleteShape = useCallback(async (shapeId) => {
    return await agentActions.deleteShape(shapeId);
  }, []);

  const deleteMultipleShapes = useCallback(async (shapeIds) => {
    return await agentActions.deleteMultipleShapes(shapeIds);
  }, []);

  const moveShapeTo = useCallback(async (shapeId, x, y) => {
    return await agentActions.moveShapeTo(shapeId, x, y);
  }, []);

  const moveShapeBy = useCallback(async (shapeId, deltaX, deltaY) => {
    return await agentActions.moveShapeBy(shapeId, deltaX, deltaY);
  }, []);

  const moveMultipleShapesBy = useCallback(async (shapeIds, deltaX, deltaY) => {
    return await agentActions.moveMultipleShapesBy(shapeIds, deltaX, deltaY);
  }, []);

  const changeShapeColor = useCallback(async (shapeId, color) => {
    return await agentActions.changeShapeColor(shapeId, color);
  }, []);

  const changeMultipleShapesColor = useCallback(async (shapeIds, color) => {
    return await agentActions.changeMultipleShapesColor(shapeIds, color);
  }, []);

  const resizeShape = useCallback(async (shapeId, width, height) => {
    return await agentActions.resizeShape(shapeId, width, height);
  }, []);

  const rotateShape = useCallback(async (shapeId, rotation) => {
    return await agentActions.rotateShape(shapeId, rotation);
  }, []);

  const changeText = useCallback(async (shapeId, text) => {
    return await agentActions.changeText(shapeId, text);
  }, []);

  const createGrid = useCallback(async (type, rows, cols, startX, startY, spacingX = 150, spacingY = 150, properties = {}) => {
    return await agentActions.createGrid(type, rows, cols, startX, startY, spacingX, spacingY, properties);
  }, []);

  const getShapeInfo = useCallback(async (shapeId) => {
    return await agentActions.getShapeInfo(shapeId);
  }, []);

  return {
    // Query functions
    getAllShapes,
    findShapes,
    getShapeInfo,
    
    // Create functions
    createShape,
    createMultipleShapes,
    createGrid,
    
    // Delete functions
    deleteShape,
    deleteMultipleShapes,
    deleteShapesByCriteria,
    
    // Move functions
    moveShapeTo,
    moveShapeBy,
    moveMultipleShapesBy,
    
    // Modify functions
    changeShapeColor,
    changeMultipleShapesColor,
    resizeShape,
    rotateShape,
    changeText,
  };
}

export default useAgentActions;


