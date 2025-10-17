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
};

// Shape Types
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
  // Future: Add more shape types as needed
};

// Default shape type for MVP
export const DEFAULT_SHAPE_TYPE = SHAPE_TYPES.RECTANGLE;

// Tool Types (for toolbar)
export const TOOL_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
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

