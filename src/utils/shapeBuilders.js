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
  if (normalized === 'line') {
    return SHAPE_TYPES.LINE;
  }
  if (normalized === 'star') {
    return SHAPE_TYPES.STAR;
  }
  
  return SHAPE_TYPES.RECTANGLE; // Default
}

/**
 * RGB color ranges for the 20 most popular colors
 * Each range defines min/max values for R, G, B channels
 */
const COLOR_RANGES = {
  red: { r: [128, 255], g: [0, 100], b: [0, 100] },
  orange: { r: [200, 255], g: [80, 180], b: [0, 80] },
  yellow: { r: [200, 255], g: [200, 255], b: [0, 100] },
  green: { r: [0, 150], g: [100, 255], b: [0, 150] },
  cyan: { r: [0, 150], g: [200, 255], b: [200, 255] },
  aqua: { r: [0, 150], g: [200, 255], b: [200, 255] },
  blue: { r: [0, 100], g: [0, 100], b: [128, 255] },
  purple: { r: [100, 200], g: [0, 100], b: [150, 255] },
  violet: { r: [100, 200], g: [0, 100], b: [150, 255] },
  pink: { r: [200, 255], g: [100, 180], b: [150, 220] },
  brown: { r: [80, 180], g: [40, 120], b: [0, 80] },
  gray: { r: [80, 220], g: [80, 220], b: [80, 220] },
  grey: { r: [80, 220], g: [80, 220], b: [80, 220] },
  black: { r: [0, 60], g: [0, 60], b: [0, 60] },
  white: { r: [220, 255], g: [220, 255], b: [220, 255] },
  magenta: { r: [180, 255], g: [0, 100], b: [180, 255] },
  fuchsia: { r: [180, 255], g: [0, 100], b: [180, 255] },
  teal: { r: [0, 100], g: [100, 200], b: [100, 180] },
  olive: { r: [100, 180], g: [100, 180], b: [0, 80] },
  gold: { r: [200, 255], g: [160, 210], b: [0, 80] },
  beige: { r: [200, 245], g: [180, 220], b: [130, 180] },
  tan: { r: [200, 245], g: [180, 220], b: [130, 180] },
  maroon: { r: [80, 150], g: [0, 60], b: [0, 60] },
  burgundy: { r: [80, 150], g: [0, 60], b: [0, 60] },
  lavender: { r: [180, 230], g: [150, 200], b: [220, 255] },
  lilac: { r: [180, 230], g: [150, 200], b: [220, 255] },
  turquoise: { r: [0, 120], g: [180, 255], b: [180, 255] },
};

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color (e.g., "#FF6B6B")
 * @returns {Object} RGB object with r, g, b properties
 */
export function hexToRgb(hex) {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Check if an RGB value falls within a color range
 * @param {Object} rgb - RGB object with r, g, b properties
 * @param {Object} range - Color range with r, g, b arrays [min, max]
 * @returns {boolean} True if RGB is within range
 */
export function isColorInRange(rgb, range) {
  return (
    rgb.r >= range.r[0] && rgb.r <= range.r[1] &&
    rgb.g >= range.g[0] && rgb.g <= range.g[1] &&
    rgb.b >= range.b[0] && rgb.b <= range.b[1]
  );
}

/**
 * Match a hex color against a color name using RGB ranges
 * @param {string} hexColor - Hex color to check (e.g., "#FF6B6B")
 * @param {string} colorName - Color name to match against (e.g., "red")
 * @returns {boolean} True if the hex color matches the color name range
 */
export function matchesColorRange(hexColor, colorName) {
  if (!hexColor || !colorName) return false;
  
  // Normalize color name
  const normalized = colorName.toLowerCase().trim().replace(/\s+/g, '');
  
  // Get the color range
  const range = COLOR_RANGES[normalized];
  if (!range) return false;
  
  // Convert hex to RGB
  const rgb = hexToRgb(hexColor);
  
  // Check if RGB is in range
  return isColorInRange(rgb, range);
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
  
  // Map color names to hex (for creating new shapes)
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
  } else if (normalizedType === SHAPE_TYPES.LINE) {
    // Line uses points array [x1, y1, x2, y2] relative to shape position
    shapeData.points = properties.points || [0, 0, shapeData.width, 0]; // Default horizontal line
    shapeData.stroke = properties.stroke || color;
    shapeData.strokeWidth = properties.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH * 2;
    shapeData.scaleX = 1; // Lines should always have scale = 1, transformations baked into points
    shapeData.scaleY = 1;
    delete shapeData.fill; // Lines don't have fill
  } else if (normalizedType === SHAPE_TYPES.STAR) {
    shapeData.stroke = properties.stroke || '#333333';
    shapeData.strokeWidth = properties.strokeWidth || SHAPE_DEFAULTS.STROKE_WIDTH;
    shapeData.numPoints = properties.numPoints || 5;
    shapeData.innerRadius = properties.innerRadius || (Math.min(shapeData.width, shapeData.height) / 2) * 0.5;
    shapeData.outerRadius = properties.outerRadius || Math.min(shapeData.width, shapeData.height) / 2;
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


