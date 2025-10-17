/**
 * Agent Actions Service
 * Provides simple, atomic operations for AI agent to manipulate canvas
 * These functions are designed to be used via LLM function calling
 * 
 * Note: These are thin wrappers around the core services. The actual
 * shape building logic is shared with the UI via shapeBuilders.js
 */

import {
  createShape as createShapeService,
  updateShape as updateShapeService,
  deleteShape as deleteShapeService,
  getShape,
} from './shapes';
import { buildShapeObject, buildMultipleShapeObjects, buildGridShapeObjects, normalizeColor, normalizeShapeType } from '../utils/shapeBuilders';
import { SHAPE_TYPES } from '../utils/constants';

/**
 * Get all shapes from the canvas
 * Note: This should be called with shapes state passed in from useShapes hook
 * @param {Array} shapes - Current shapes array from useShapes
 * @returns {Array} Array of all shapes
 */
export function getAllShapes(shapes) {
  return shapes || [];
}

/**
 * Find shapes by criteria
 * @param {Array} shapes - Current shapes array from useShapes
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.type - Shape type (rectangle, circle, text, image)
 * @param {string} criteria.color - Shape color (hex or color name)
 * @param {string} criteria.position - Relative position (leftmost, rightmost, topmost, bottommost)
 * @param {string} criteria.text - Text content (for text shapes)
 * @returns {Array} Array of matching shapes
 */
export function findShapes(shapes, criteria = {}) {
  if (!shapes || shapes.length === 0) return [];
  
  let results = [...shapes];
  
  // Filter by type
  if (criteria.type) {
    const normalizedType = normalizeShapeType(criteria.type);
    results = results.filter(s => s.type === normalizedType);
  }
  
  // Filter by color
  if (criteria.color) {
    const normalizedColor = normalizeColor(criteria.color);
    results = results.filter(s => {
      const shapeColor = s.fill?.toLowerCase();
      return shapeColor === normalizedColor || 
             shapeColor?.includes(normalizedColor) ||
             normalizedColor.includes(shapeColor);
    });
  }
  
  // Filter by text content
  if (criteria.text && criteria.text.length > 0) {
    results = results.filter(s => 
      s.type === SHAPE_TYPES.TEXT && 
      s.text?.toLowerCase().includes(criteria.text.toLowerCase())
    );
  }
  
  // Filter by position (relative)
  if (criteria.position) {
    const position = criteria.position.toLowerCase();
    
    if (position === 'leftmost' || position === 'left') {
      results.sort((a, b) => a.x - b.x);
      results = results.length > 0 ? [results[0]] : [];
    } else if (position === 'rightmost' || position === 'right') {
      results.sort((a, b) => b.x - a.x);
      results = results.length > 0 ? [results[0]] : [];
    } else if (position === 'topmost' || position === 'top') {
      results.sort((a, b) => a.y - b.y);
      results = results.length > 0 ? [results[0]] : [];
    } else if (position === 'bottommost' || position === 'bottom') {
      results.sort((a, b) => b.y - a.y);
      results = results.length > 0 ? [results[0]] : [];
    }
  }
  
  return results;
}

/**
 * Create a shape on the canvas
 * Convenience wrapper that builds shape object and calls service
 * @param {string} type - Shape type: "rectangle", "circle", "text", or "image"
 * @param {number} x - X position on canvas
 * @param {number} y - Y position on canvas
 * @param {Object} properties - Additional properties
 * @param {string} properties.color - Shape color (hex or color name)
 * @param {number} properties.width - Width (optional, defaults to 100)
 * @param {number} properties.height - Height (optional, defaults to 100)
 * @param {string} properties.text - Text content (for text shapes)
 * @param {number} properties.fontSize - Font size (for text shapes)
 * @param {number} properties.rotation - Rotation in degrees
 * @returns {Promise<string>} Created shape ID
 */
export async function createShape(type, x, y, properties = {}) {
  const shapeData = buildShapeObject(type, x, y, properties);
  const shapeId = await createShapeService(shapeData);
  return shapeId;
}

/**
 * Create multiple shapes at once
 * @param {Array<Object>} shapes - Array of shape definitions
 * @param {string} shapes[].type - Shape type
 * @param {number} shapes[].x - X position
 * @param {number} shapes[].y - Y position
 * @param {Object} shapes[].properties - Additional properties
 * @returns {Promise<Array<string>>} Array of created shape IDs
 */
export async function createMultipleShapes(shapes) {
  const shapeObjects = buildMultipleShapeObjects(shapes);
  const promises = shapeObjects.map(shapeData => createShapeService(shapeData));
  return await Promise.all(promises);
}

/**
 * Delete a shape by ID
 * @param {string} shapeId - Shape ID to delete
 * @returns {Promise<void>}
 */
export async function deleteShape(shapeId) {
  await deleteShapeService(shapeId);
}

/**
 * Delete multiple shapes by IDs
 * @param {Array<string>} shapeIds - Array of shape IDs to delete
 * @returns {Promise<void>}
 */
export async function deleteMultipleShapes(shapeIds) {
  const promises = shapeIds.map(id => deleteShapeService(id));
  await Promise.all(promises);
}

/**
 * Delete shapes matching criteria
 * @param {Array} shapes - Current shapes array
 * @param {Object} criteria - Search criteria (same as findShapes)
 * @returns {Promise<number>} Number of shapes deleted
 */
export async function deleteShapesByCriteria(shapes, criteria) {
  const matchingShapes = findShapes(shapes, criteria);
  if (matchingShapes.length === 0) return 0;
  
  await deleteMultipleShapes(matchingShapes.map(s => s.id));
  return matchingShapes.length;
}

/**
 * Move a shape to absolute position
 * @param {string} shapeId - Shape ID to move
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @returns {Promise<void>}
 */
export async function moveShapeTo(shapeId, x, y) {
  await updateShapeService(shapeId, { x, y });
}

/**
 * Move a shape by relative offset
 * @param {string} shapeId - Shape ID to move
 * @param {number} deltaX - X offset (positive = right, negative = left)
 * @param {number} deltaY - Y offset (positive = down, negative = up)
 * @returns {Promise<void>}
 */
export async function moveShapeBy(shapeId, deltaX, deltaY) {
  const shape = await getShape(shapeId);
  if (!shape) throw new Error('Shape not found');
  
  await updateShapeService(shapeId, {
    x: shape.x + deltaX,
    y: shape.y + deltaY,
  });
}

/**
 * Move multiple shapes by the same offset
 * @param {Array<string>} shapeIds - Shape IDs to move
 * @param {number} deltaX - X offset
 * @param {number} deltaY - Y offset
 * @returns {Promise<void>}
 */
export async function moveMultipleShapesBy(shapeIds, deltaX, deltaY) {
  const promises = shapeIds.map(id => moveShapeBy(id, deltaX, deltaY));
  await Promise.all(promises);
}

/**
 * Change shape color
 * @param {string} shapeId - Shape ID
 * @param {string} color - New color (hex or color name)
 * @returns {Promise<void>}
 */
export async function changeShapeColor(shapeId, color) {
  const normalizedColor = normalizeColor(color);
  await updateShapeService(shapeId, { fill: normalizedColor });
}

/**
 * Change color for multiple shapes
 * @param {Array<string>} shapeIds - Shape IDs
 * @param {string} color - New color
 * @returns {Promise<void>}
 */
export async function changeMultipleShapesColor(shapeIds, color) {
  const normalizedColor = normalizeColor(color);
  const promises = shapeIds.map(id => 
    updateShapeService(id, { fill: normalizedColor })
  );
  await Promise.all(promises);
}

/**
 * Resize a shape
 * @param {string} shapeId - Shape ID
 * @param {number} width - New width
 * @param {number} height - New height
 * @returns {Promise<void>}
 */
export async function resizeShape(shapeId, width, height) {
  await updateShapeService(shapeId, { width, height });
}

/**
 * Rotate a shape
 * @param {string} shapeId - Shape ID
 * @param {number} rotation - Rotation in degrees (0-360)
 * @returns {Promise<void>}
 */
export async function rotateShape(shapeId, rotation) {
  await updateShapeService(shapeId, { rotation });
}

/**
 * Change text content
 * @param {string} shapeId - Shape ID (must be a text shape)
 * @param {string} text - New text content
 * @returns {Promise<void>}
 */
export async function changeText(shapeId, text) {
  await updateShapeService(shapeId, { text });
}

/**
 * Create a grid of shapes
 * @param {string} type - Shape type
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} spacingX - Horizontal spacing between shapes
 * @param {number} spacingY - Vertical spacing between shapes
 * @param {Object} properties - Additional properties for each shape
 * @returns {Promise<Array<string>>} Array of created shape IDs
 */
export async function createGrid(type, rows, cols, startX, startY, spacingX = 150, spacingY = 150, properties = {}) {
  const shapeObjects = buildGridShapeObjects(type, rows, cols, startX, startY, spacingX, spacingY, properties);
  const promises = shapeObjects.map(shapeData => createShapeService(shapeData));
  return await Promise.all(promises);
}

/**
 * Get shape information by ID
 * @param {string} shapeId - Shape ID
 * @returns {Promise<Object>} Shape data
 */
export async function getShapeInfo(shapeId) {
  return await getShape(shapeId);
}
