/**
 * Shape Builders
 * Shared functions for constructing shape objects
 * Used by both UI (Canvas) and AI Agent
 */

import { SHAPE_TYPES, SHAPE_DEFAULTS, SHAPE_COLORS } from './constants';

/**
 * Normalize shape type to match SHAPE_TYPES constants
 * @param {string} type - Shape type input
 * @returns {string} Normalized shape type
 */
export function normalizeShapeType(type) {
  const normalized = type.toLowerCase();
  
  if (normalized === 'square' || normalized === 'rectangle' || normalized === 'rect' || normalized === 'box') {
    return SHAPE_TYPES.RECTANGLE;
  }
  if (normalized === 'circle' || normalized === 'ellipse' || normalized === 'oval') {
    return SHAPE_TYPES.CIRCLE;
  }
  if (normalized === 'text' || normalized === 'label') {
    return SHAPE_TYPES.TEXT;
  }
  if (normalized === 'image' || normalized === 'img' || normalized === 'picture') {
    return SHAPE_TYPES.IMAGE;
  }
  
  return SHAPE_TYPES.RECTANGLE; // Default
}

/**
 * Normalize color to hex format
 * @param {string} color - Color input (hex or color name)
 * @returns {string} Hex color
 */
export function normalizeColor(color) {
  if (!color) return SHAPE_COLORS[0];
  
  // If already hex, return as-is
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }
  
  // Map color names to hex
  const colorMap = {
    'red': '#FF6B6B',
    'blue': '#45B7D1',
    'green': '#52B788',
    'yellow': '#F7DC6F',
    'orange': '#F8B739',
    'purple': '#BB8FCE',
    'pink': '#FF8ED4',
    'teal': '#4ECDC4',
    'mint': '#98D8C8',
    'salmon': '#FFA07A',
    'skyblue': '#85C1E2',
    'sky': '#85C1E2',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#999999',
    'grey': '#999999',
  };
  
  const normalized = color.toLowerCase().replace(/\s+/g, '');
  return colorMap[normalized] || color;
}

/**
 * Build a shape object from parameters
 * Single source of truth for shape construction
 * 
 * @param {string} type - Shape type
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} properties - Additional properties
 * @returns {Object} Complete shape object ready for createShape service
 */
export function buildShapeObject(type, x, y, properties = {}) {
  const normalizedType = normalizeShapeType(type);
  const color = properties.color ? normalizeColor(properties.color) : (properties.fill || SHAPE_COLORS[0]);
  
  const shapeData = {
    type: normalizedType,
    x,
    y,
    fill: color,
    width: properties.width || SHAPE_DEFAULTS.WIDTH,
    height: properties.height || SHAPE_DEFAULTS.HEIGHT,
    rotation: properties.rotation || 0,
    opacity: properties.opacity ?? SHAPE_DEFAULTS.OPACITY,
  };
  
  // Add type-specific properties
  if (normalizedType === SHAPE_TYPES.TEXT) {
    shapeData.text = properties.text || SHAPE_DEFAULTS.TEXT_DEFAULT;
    shapeData.fontSize = properties.fontSize || SHAPE_DEFAULTS.TEXT_FONT_SIZE;
    shapeData.fontFamily = properties.fontFamily || SHAPE_DEFAULTS.TEXT_FONT_FAMILY;
  } else if (normalizedType === SHAPE_TYPES.RECTANGLE) {
    shapeData.stroke = properties.stroke || '#333333';
    shapeData.strokeWidth = properties.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
    shapeData.cornerRadius = properties.cornerRadius || SHAPE_DEFAULTS.CORNER_RADIUS;
  } else if (normalizedType === SHAPE_TYPES.CIRCLE) {
    shapeData.stroke = properties.stroke || '#333333';
    shapeData.strokeWidth = properties.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
  }
  
  return shapeData;
}

/**
 * Build multiple shape objects (e.g., for a grid)
 * @param {Array} shapeDefinitions - Array of {type, x, y, properties}
 * @returns {Array} Array of shape objects
 */
export function buildMultipleShapeObjects(shapeDefinitions) {
  return shapeDefinitions.map(def => 
    buildShapeObject(def.type, def.x, def.y, def.properties || {})
  );
}

/**
 * Build a grid of shape objects
 * @param {string} type - Shape type
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} spacingX - Horizontal spacing
 * @param {number} spacingY - Vertical spacing
 * @param {Object} properties - Properties for each shape
 * @returns {Array} Array of shape objects
 */
export function buildGridShapeObjects(type, rows, cols, startX, startY, spacingX = 150, spacingY = 150, properties = {}) {
  const shapes = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      shapes.push(
        buildShapeObject(
          type,
          startX + (col * spacingX),
          startY + (row * spacingY),
          properties
        )
      );
    }
  }
  
  return shapes;
}

