# AI Agent Integration Guide

This guide explains how to integrate an AI agent with CollabCanvas using the agent actions API.

## Overview

The agent actions provide simple, atomic functions that an AI agent can use to manipulate the canvas. These are designed for LLM function calling (e.g., OpenAI Function Calling, Anthropic Tool Use).

## Available Actions

### Query Functions

#### `getAllShapes()`
Returns all shapes currently on the canvas.

```javascript
const shapes = getAllShapes();
// Returns: [{ id, type, x, y, width, height, fill, ... }, ...]
```

#### `findShapes(criteria)`
Find shapes matching specific criteria.

**Parameters:**
- `criteria.type` - Shape type: "rectangle", "circle", "text", "image"
- `criteria.color` - Color (hex or name): "red", "#FF6B6B"
- `criteria.position` - Relative position: "leftmost", "rightmost", "topmost", "bottommost"
- `criteria.text` - Text content (for text shapes)

**Examples:**
```javascript
// Find all red rectangles
const redSquares = findShapes({ type: 'rectangle', color: 'red' });

// Find the leftmost circle
const leftCircle = findShapes({ type: 'circle', position: 'leftmost' });

// Find text containing "hello"
const textShapes = findShapes({ type: 'text', text: 'hello' });

// Find all blue shapes
const blueShapes = findShapes({ color: 'blue' });
```

#### `getShapeInfo(shapeId)`
Get detailed information about a specific shape.

```javascript
const shape = await getShapeInfo('shape-id-123');
```

---

### Create Functions

#### `createShape(type, x, y, properties)`
Create a single shape.

**Parameters:**
- `type` - "rectangle", "circle", "text", or "image"
- `x` - X position on canvas
- `y` - Y position on canvas
- `properties` (optional):
  - `color` - Color (hex or name)
  - `width` - Width in pixels
  - `height` - Height in pixels
  - `text` - Text content (for text shapes)
  - `fontSize` - Font size (for text shapes)
  - `rotation` - Rotation in degrees

**Examples:**
```javascript
// Create a red rectangle at (100, 100)
await createShape('rectangle', 100, 100, { color: 'red' });

// Create a blue circle
await createShape('circle', 200, 200, { color: 'blue', width: 150, height: 150 });

// Create text
await createShape('text', 300, 300, { text: 'Hello World', fontSize: 32, color: 'black' });
```

#### `createMultipleShapes(shapesArray)`
Create multiple shapes at once.

**Example:**
```javascript
await createMultipleShapes([
  { type: 'circle', x: 100, y: 100, properties: { color: 'red' } },
  { type: 'circle', x: 200, y: 100, properties: { color: 'blue' } },
  { type: 'circle', x: 300, y: 100, properties: { color: 'green' } },
]);
```

#### `createGrid(type, rows, cols, startX, startY, spacingX, spacingY, properties)`
Create a grid of shapes.

**Example:**
```javascript
// Create a 2x2 grid of red circles starting at (100, 100)
await createGrid('circle', 2, 2, 100, 100, 150, 150, { color: 'red' });
```

---

### Delete Functions

#### `deleteShape(shapeId)`
Delete a single shape by ID.

```javascript
await deleteShape('shape-id-123');
```

#### `deleteMultipleShapes(shapeIds)`
Delete multiple shapes by their IDs.

```javascript
await deleteMultipleShapes(['id1', 'id2', 'id3']);
```

#### `deleteShapesByCriteria(criteria)`
Delete all shapes matching criteria. Returns number of deleted shapes.

**Examples:**
```javascript
// Delete all red rectangles
await deleteShapesByCriteria({ type: 'rectangle', color: 'red' });

// Delete the bottommost text
await deleteShapesByCriteria({ type: 'text', position: 'bottommost' });
```

---

### Move Functions

#### `moveShapeTo(shapeId, x, y)`
Move a shape to an absolute position.

```javascript
await moveShapeTo('shape-id-123', 500, 300);
```

#### `moveShapeBy(shapeId, deltaX, deltaY)`
Move a shape by a relative offset.

**Note:** Positive X = right, Negative X = left, Positive Y = down, Negative Y = up

**Examples:**
```javascript
// Move 10 pixels to the right
await moveShapeBy('shape-id-123', 10, 0);

// Move 20 pixels up
await moveShapeBy('shape-id-123', 0, -20);

// Move diagonally
await moveShapeBy('shape-id-123', 10, 10);
```

#### `moveMultipleShapesBy(shapeIds, deltaX, deltaY)`
Move multiple shapes by the same offset.

```javascript
await moveMultipleShapesBy(['id1', 'id2', 'id3'], 50, 0);
```

---

### Modify Functions

#### `changeShapeColor(shapeId, color)`
Change a shape's color.

```javascript
await changeShapeColor('shape-id-123', 'blue');
await changeShapeColor('shape-id-123', '#FF6B6B');
```

#### `changeMultipleShapesColor(shapeIds, color)`
Change color for multiple shapes.

```javascript
await changeMultipleShapesColor(['id1', 'id2'], 'green');
```

#### `resizeShape(shapeId, width, height)`
Resize a shape.

```javascript
await resizeShape('shape-id-123', 200, 150);
```

#### `rotateShape(shapeId, rotation)`
Rotate a shape (in degrees).

```javascript
await rotateShape('shape-id-123', 45);
```

#### `changeText(shapeId, text)`
Change text content (for text shapes only).

```javascript
await changeText('text-shape-id', 'New text content');
```

---

## Integration Pattern: LLM Function Calling

### Step 1: Define Tool Schemas

For OpenAI/Anthropic, define each function as a tool:

```javascript
const tools = [
  {
    name: "findShapes",
    description: "Find shapes on the canvas matching criteria",
    parameters: {
      type: "object",
      properties: {
        criteria: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["rectangle", "circle", "text", "image"] },
            color: { type: "string", description: "Color name or hex code" },
            position: { type: "string", enum: ["leftmost", "rightmost", "topmost", "bottommost"] },
            text: { type: "string", description: "Text content to search for" }
          }
        }
      }
    }
  },
  {
    name: "moveShapeBy",
    description: "Move a shape by a relative offset. Positive X moves right, negative left. Positive Y moves down, negative up.",
    parameters: {
      type: "object",
      properties: {
        shapeId: { type: "string", description: "ID of the shape to move" },
        deltaX: { type: "number", description: "Horizontal offset in pixels" },
        deltaY: { type: "number", description: "Vertical offset in pixels" }
      },
      required: ["shapeId", "deltaX", "deltaY"]
    }
  },
  // ... define other tools
];
```

### Step 2: Example User Commands

**Command:** "Select the red square on the left and move it 10px to the right"

**Agent Execution:**
1. Call `findShapes({ type: 'rectangle', color: 'red', position: 'leftmost' })`
2. Get shape ID from results
3. Call `moveShapeBy(shapeId, 10, 0)`

**Command:** "Create a grid of 4 circles"

**Agent Execution:**
1. Call `createGrid('circle', 2, 2, 100, 100, 150, 150, {})`

**Command:** "Delete the text on the bottom"

**Agent Execution:**
1. Call `deleteShapesByCriteria({ type: 'text', position: 'bottommost' })`

**Command:** "Change all blue rectangles to green"

**Agent Execution:**
1. Call `findShapes({ type: 'rectangle', color: 'blue' })`
2. Extract shape IDs
3. Call `changeMultipleShapesColor(shapeIds, 'green')`

---

## Supported Colors

### Color Names
- red, blue, green, yellow, orange, purple, pink
- teal, mint, salmon, skyblue
- black, white, gray

### Hex Colors
Any valid hex color (e.g., `#FF6B6B`, `#45B7D1`)

---

## Coordinate System

- **Origin (0, 0):** Top-left corner
- **X-axis:** Increases to the right (positive = right, negative = left)
- **Y-axis:** Increases downward (positive = down, negative = up)
- **Canvas size:** 5000 x 5000 pixels
- **Default viewport:** Centered on canvas

---

## Best Practices

1. **Always query first:** Use `findShapes()` to locate shapes before operating on them
2. **Batch operations:** Use `createMultipleShapes()` or `moveMultipleShapesBy()` for efficiency
3. **Handle empty results:** Check if `findShapes()` returns any results before proceeding
4. **Use relative movement:** `moveShapeBy()` is better than `moveShapeTo()` for user commands like "move 10px right"
5. **Flexible matching:** The system supports fuzzy color matching and shape type aliases

---

## Error Handling

All async functions may throw errors. Common errors:
- `"Shape not found"` - Shape ID doesn't exist
- `"User must be authenticated"` - User is not logged in
- `"Shape is locked by another user"` - Shape is being edited by someone else

Always wrap agent actions in try-catch blocks:

```javascript
try {
  const shapes = findShapes({ color: 'red' });
  if (shapes.length > 0) {
    await moveShapeBy(shapes[0].id, 10, 0);
  }
} catch (error) {
  console.error('Agent action failed:', error.message);
}
```

---

## Next Steps

To implement the AI agent:

1. Create an API endpoint that receives user commands
2. Send command + tool schemas to LLM API
3. Execute the function calls returned by LLM
4. Return results/feedback to user

See `src/services/agentExecutor.js` for a complete implementation example.

