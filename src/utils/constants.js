/**
 * CollabCanvas - Constants
 * Defines canvas dimensions, colors, shape defaults, and other constants
 */

// Canvas Configuration
export const CANVAS_CONFIG = {
  WIDTH: 5000,
  HEIGHT: 5000,
  INITIAL_SCALE: 1,
  MIN_SCALE: 0.1,
  MAX_SCALE: 3,
  SCALE_BY: 1.1, // Zoom factor per scroll
};

// Shape Defaults
export const SHAPE_DEFAULTS = {
  WIDTH: 100,
  HEIGHT: 100,
  STROKE_WIDTH: 2,
  CORNER_RADIUS: 0,
  OPACITY: 1,
  TEXT_FONT_SIZE: 24,
  TEXT_FONT_FAMILY: 'Inter, system-ui, sans-serif',
  TEXT_DEFAULT: 'Text',
  IMAGE_MAX_WIDTH: 800,
  IMAGE_MAX_HEIGHT: 800,
};

// Shape Types
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
  IMAGE: 'image',
  LINE: 'line',
  STAR: 'star',
};

// Default shape type for MVP
export const DEFAULT_SHAPE_TYPE = SHAPE_TYPES.RECTANGLE;

// Tool Types (for toolbar)
export const TOOL_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
  LINE: 'line',
  STAR: 'star',
  DELETE: 'delete',
};

// Default tool
export const DEFAULT_TOOL = TOOL_TYPES.RECTANGLE;

// Predefined colors for shapes
export const SHAPE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
];

// Default color for new shapes
export const DEFAULT_SHAPE_COLOR = SHAPE_COLORS[0];

// Cursor Configuration
export const CURSOR_CONFIG = {
  SIZE: 12,
  UPDATE_THROTTLE: 50, // milliseconds between cursor updates
  LABEL_OFFSET_X: 15,
  LABEL_OFFSET_Y: -10,
  LABEL_PADDING: 6,
  LABEL_FONT_SIZE: 12,
  LABEL_FONT_FAMILY: 'Inter, system-ui, sans-serif',
};

// User presence colors (assigned to users for cursors)
export const PRESENCE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#F8B739', // Orange
  '#BB8FCE', // Purple
  '#52B788', // Green
  '#FF8ED4', // Pink
  '#FFD93D', // Bright Yellow
  '#6BCF7F', // Light Green
  '#A8DADC', // Light Blue
  '#FF8B94', // Coral Pink
  '#00B8A9', // Dark Teal
  '#F8333C', // Bright Red
  '#44AF69', // Dark Green
  '#FCAB10', // Golden Yellow
  '#2B9EB3', // Steel Blue
  '#DBD5B5', // Beige
  '#007F5F', // Forest Green
  '#8B5A2B', // Brown
  '#E91E63', // Hot Pink
  '#2196F3', // Material Blue
  '#4CAF50', // Material Green
  '#FF9800', // Material Orange
  '#9C27B0', // Material Purple
  '#607D8B', // Blue Grey
  '#795548', // Brown
  '#00BCD4', // Cyan
  '#CDDC39', // Lime
  '#FFC107', // Amber
  '#FF5722', // Deep Orange
  '#8BC34A', // Light Green
  '#03A9F4', // Light Blue
  '#673AB7', // Deep Purple
  '#E67E22', // Carrot Orange
  '#3498DB', // Peter River Blue
  '#2ECC71', // Emerald Green
  '#E74C3C', // Alizarin Red
  '#F39C12', // Sunflower Yellow
  '#9B59B6', // Amethyst Purple
  '#1ABC9C', // Turquoise
  '#34495E', // Wet Asphalt Grey
  '#F1C40F', // Sun Yellow
  '#E67E22', // Carrot Orange
  '#ECF0F1', // Clouds White
  '#95A5A6', // Concrete Grey
  '#16A085', // Green Sea
  '#27AE60', // Nephritis Green
  '#2980B9', // Belize Hole Blue
  '#8E44AD', // Wisteria Purple
  '#D35400', // Pumpkin Orange
  '#C0392B', // Pomegranate Red
  '#BDC3C7', // Silver Grey
];

// Firestore Collection Names (from firebase.js, duplicated for easy access)
export const COLLECTIONS = {
  SHAPES: 'shapes',
};

// Realtime Database Paths
export const RTDB_PATHS = {
  CURSORS: 'cursors',
  PRESENCE: 'presence',
};

// Lock timeout (milliseconds) - auto-unlock if user doesn't interact
export const LOCK_TIMEOUT = 30000; // 30 seconds

// Authentication
export const AUTH_CONFIG = {
  MIN_PASSWORD_LENGTH: 6,
  SESSION_PERSISTENCE: 'local', // Keep user logged in
};

// UI Configuration
export const UI_CONFIG = {
  PRESENCE_PANEL_WIDTH: 250,
  TOOLBAR_HEIGHT: 60,
  TOAST_DURATION: 3000, // milliseconds
  LOADING_DEBOUNCE: 300, // milliseconds
};

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  WEAK_PASSWORD: 'Password must be at least 6 characters long.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_DENIED: 'Permission denied. You may need to log in.',
  SHAPE_LOCKED: 'This shape is currently being edited by another user.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  SHAPE_CREATED: 'Shape created.',
  SHAPE_DELETED: 'Shape deleted.',
};

// Canvas Navigation
export const CANVAS_NAVIGATION = {
  PAN_BUTTON: 0, // Left mouse button (0 = primary)
  ENABLE_TOUCH_PAN: true,
  DRAG_BOUNDS: {
    // Allow panning slightly beyond canvas edges
    PADDING: 500,
  },
};

// Performance
export const PERFORMANCE_CONFIG = {
  SHAPE_RENDER_LIMIT: 1000, // Max shapes to render at once (for future optimization)
  CURSOR_CLEANUP_INTERVAL: 5000, // milliseconds
  PRESENCE_HEARTBEAT: 3000, // milliseconds
};

// Z-Index layers (for proper stacking)
export const Z_INDEX = {
  CANVAS: 1,
  SHAPES: 2,
  CURSORS: 3,
  UI_OVERLAY: 4,
  MODAL: 100,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_COLOR: 'collabcanvas_user_color',
  LAST_CANVAS_POSITION: 'collabcanvas_last_position',
  PREFERENCES: 'collabcanvas_preferences',
};

// Animation Durations (milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Development/Debug
export const DEBUG = import.meta.env.DEV; // true in development mode
export const LOG_REALTIME_EVENTS = false; // Set to true for debugging real-time features

/**
 * Get a consistent color for a user across all components (cursors, presence, etc.)
 * Uses the same algorithm as both cursor and presence systems for consistency
 * @param {string} userId - User ID
 * @param {Array<string>} colors - Array of available colors
 * @returns {string} Hex color code
 */
export function getUserColor(userId, colors = PRESENCE_COLORS) {
  // Enhanced hash function for better color distribution
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

