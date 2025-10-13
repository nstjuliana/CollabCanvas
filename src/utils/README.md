# Utils Module

This module contains constants and helper functions used throughout CollabCanvas.

## Files

### constants.js
Defines all application constants including:

- **Canvas Configuration**: Dimensions (5000x5000), zoom settings
- **Shape Defaults**: Default sizes, colors, stroke widths
- **Color Palettes**: Predefined colors for shapes and user presence
- **Cursor Configuration**: Cursor appearance and update settings
- **Error & Success Messages**: Consistent user-facing messages
- **Performance Settings**: Throttle/debounce timings, limits
- **Storage Keys**: Local storage key names

### helpers.js
Utility functions including:

- **Color Management**: `getRandomColor()`, `getUserColor()`
- **Coordinate Conversion**: `screenToCanvas()`, `canvasToScreen()`
- **Geometry**: `getDistance()`, `isPointInRect()`, `rectsIntersect()`
- **Performance**: `throttle()`, `debounce()`
- **Validation**: `isValidEmail()`, `getFirebaseErrorMessage()`
- **Formatting**: `formatTimestamp()`, `getRelativeTime()`
- **User Helpers**: `getUsernameFromEmail()`

## Usage Examples

```javascript
// Import constants
import { CANVAS_CONFIG, SHAPE_COLORS } from './utils/constants';

// Use canvas dimensions
const canvasWidth = CANVAS_CONFIG.WIDTH; // 5000

// Get default shape color
const color = SHAPE_COLORS[0]; // '#FF6B6B'

// Import helpers
import { getUserColor, throttle, isValidEmail } from './utils/helpers';

// Get consistent color for user
const userColor = getUserColor('user123');

// Throttle a function
const handleMouseMove = throttle((e) => {
  console.log(e.clientX, e.clientY);
}, 50);

// Validate email
if (isValidEmail(email)) {
  // proceed with signup
}
```

## Key Constants

- **Canvas Size**: 5000x5000 pixels
- **Default Shape Size**: 100x100 pixels
- **Zoom Range**: 0.1x to 3x
- **Cursor Update Rate**: 50ms (20 updates/second)
- **Lock Timeout**: 30 seconds

## Color Palettes

### Shape Colors (10 colors)
Used for shapes when created by users.

### Presence Colors (10 colors)
Assigned to users for cursors and identification.

## Performance Settings

- **Cursor Update Throttle**: 50ms
- **Presence Heartbeat**: 3000ms (3 seconds)
- **Cursor Cleanup Interval**: 5000ms (5 seconds)

