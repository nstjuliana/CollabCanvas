/**
 * CollabCanvas - Helper Functions
 * Utility functions used throughout the application
 */

import { PRESENCE_COLORS, SHAPE_COLORS } from './constants';

/**
 * Generate a random color from the predefined palette
 * @param {string[]} palette - Color palette to choose from
 * @returns {string} Hex color code
 */
export function getRandomColor(palette = SHAPE_COLORS) {
  return palette[Math.floor(Math.random() * palette.length)];
}

/**
 * Assign a consistent color to a user based on their ID
 * Same user always gets the same color
 * @param {string} userId - User ID
 * @returns {string} Hex color code
 */
export function getUserColor(userId) {
  if (!userId) return PRESENCE_COLORS[0];
  
  // Generate a consistent index from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[index];
}

/**
 * Generate a unique ID (simple implementation)
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp to readable string
 * @param {number|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate distance between two points
 * @param {object} point1 - {x, y}
 * @param {object} point2 - {x, y}
 * @returns {number} Distance
 */
export function getDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is within a rectangle
 * @param {object} point - {x, y}
 * @param {object} rect - {x, y, width, height}
 * @returns {boolean} True if point is inside rectangle
 */
export function isPointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Clamp a number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay) {
  let timeoutId;
  let lastExec = 0;

  return function (...args) {
    const elapsed = Date.now() - lastExec;

    const execute = () => {
      lastExec = Date.now();
      func.apply(this, args);
    };

    clearTimeout(timeoutId);

    if (elapsed > delay) {
      execute();
    } else {
      timeoutId = setTimeout(execute, delay - elapsed);
    }
  };
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Get username from email
 * @param {string} email - User email
 * @returns {string} Username (part before @)
 */
export function getUsernameFromEmail(email) {
  if (!email) return 'Anonymous';
  return email.split('@')[0];
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if two rectangles intersect
 * @param {object} rect1 - {x, y, width, height}
 * @param {object} rect2 - {x, y, width, height}
 * @returns {boolean} True if rectangles intersect
 */
export function rectsIntersect(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Get the current viewport bounds relative to canvas
 * @param {object} stage - Konva stage
 * @returns {object} {x, y, width, height} in canvas coordinates
 */
export function getViewportBounds(stage) {
  if (!stage) return null;

  const scale = stage.scaleX(); // Assuming uniform scale
  const position = stage.position();

  return {
    x: -position.x / scale,
    y: -position.y / scale,
    width: stage.width() / scale,
    height: stage.height() / scale,
  };
}

/**
 * Convert screen coordinates to canvas coordinates
 * @param {object} stage - Konva stage
 * @param {object} screenPos - {x, y} in screen coordinates
 * @returns {object} {x, y} in canvas coordinates
 */
export function screenToCanvas(stage, screenPos) {
  if (!stage) return screenPos;

  const scale = stage.scaleX();
  const position = stage.position();

  return {
    x: (screenPos.x - position.x) / scale,
    y: (screenPos.y - position.y) / scale,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 * @param {object} stage - Konva stage
 * @param {object} canvasPos - {x, y} in canvas coordinates
 * @returns {object} {x, y} in screen coordinates
 */
export function canvasToScreen(stage, canvasPos) {
  if (!stage) return canvasPos;

  const scale = stage.scaleX();
  const position = stage.position();

  return {
    x: canvasPos.x * scale + position.x,
    y: canvasPos.y * scale + position.y,
  };
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get error message from Firebase error code
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
export function getFirebaseErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/operation-not-allowed': 'Operation not allowed.',
    'auth/weak-password': 'Password is too weak.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'permission-denied': 'Permission denied. Please ensure you are logged in.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred.';
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if user is on mobile device
 * @returns {boolean} True if mobile
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Get relative time string (e.g., "2 minutes ago")
 * @param {Date|number} date - Date or timestamp
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  const now = new Date();
  const timestamp = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Generate a random position within canvas bounds
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} padding - Padding from edges
 * @returns {object} {x, y} position
 */
export function getRandomPosition(canvasWidth, canvasHeight, padding = 100) {
  return {
    x: padding + Math.random() * (canvasWidth - padding * 2),
    y: padding + Math.random() * (canvasHeight - padding * 2),
  };
}

/**
 * Check if a shape is visible in the current viewport
 * @param {object} shape - Shape with {x, y, width, height}
 * @param {object} viewport - Viewport bounds {x, y, width, height}
 * @returns {boolean} True if shape is visible
 */
export function isShapeVisible(shape, viewport) {
  if (!viewport) return true;
  return rectsIntersect(shape, viewport);
}

/**
 * Safely parse JSON with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    return fallback;
  }
}

