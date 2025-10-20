/**
 * Agent Executor
 * Executes AI agent commands using Vercel AI SDK
 * Supports streaming responses and function calling
 */

import { streamText, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import * as agentActions from './agentActions';
import { buildShapeObject } from '../utils/shapeBuilders';

/**
 * Legacy tool definitions array (kept for reference)
 * Now using Zod schemas with tool() function below
 */
export const AGENT_TOOLS_LEGACY = [
  {
    name: 'findShapes',
    description: 'Find shapes matching specific criteria (type, color, position, or text content). Call with empty criteria {} to get all shapes.',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['rectangle', 'circle', 'text', 'image', 'square', 'line', 'star'],
              description: 'Shape type to filter by',
            },
            color: {
              type: 'string',
              description: 'Color to filter by (hex code or color name like "red", "blue", etc.)',
            },
            position: {
              type: 'string',
              enum: ['leftmost', 'rightmost', 'topmost', 'bottommost', 'left', 'right', 'top', 'bottom'],
              description: 'Find the shape in a specific relative position',
            },
            text: {
              type: 'string',
              description: 'Text content to search for (only for text shapes)',
            },
          },
          description: 'Search criteria. Pass empty object {} to get all shapes.',
        },
      },
      required: [],
    },
  },
  {
    name: 'createShape',
    description: 'Create a single shape on the canvas',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['rectangle', 'circle', 'text', 'square', 'line', 'star'],
          description: 'Type of shape to create',
        },
        x: {
          type: 'number',
          description: 'X position on canvas (0 is left)',
        },
        y: {
          type: 'number',
          description: 'Y position on canvas (0 is top)',
        },
        properties: {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              description: 'Shape color (hex or name like "red", "blue")',
            },
            width: {
              type: 'number',
              description: 'Width in pixels (default: 100)',
            },
            height: {
              type: 'number',
              description: 'Height in pixels (default: 100)',
            },
            text: {
              type: 'string',
              description: 'Text content (for text shapes)',
            },
            fontSize: {
              type: 'number',
              description: 'Font size (for text shapes, default: 24)',
            },
            rotation: {
              type: 'number',
              description: 'Rotation in degrees (default: 0)',
            },
          },
        },
      },
      required: ['type', 'x', 'y'],
    },
  },
  {
    name: 'createGrid',
    description: 'Create a grid of shapes',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['rectangle', 'circle', 'square', 'line', 'star'],
          description: 'Type of shapes to create',
        },
        rows: {
          type: 'number',
          description: 'Number of rows',
        },
        cols: {
          type: 'number',
          description: 'Number of columns',
        },
        startX: {
          type: 'number',
          description: 'Starting X position',
        },
        startY: {
          type: 'number',
          description: 'Starting Y position',
        },
        spacingX: {
          type: 'number',
          description: 'Horizontal spacing between shapes (default: 150)',
        },
        spacingY: {
          type: 'number',
          description: 'Vertical spacing between shapes (default: 150)',
        },
        properties: {
          type: 'object',
          description: 'Additional properties for each shape',
        },
      },
      required: ['type', 'rows', 'cols', 'startX', 'startY'],
    },
  },
  {
    name: 'deleteShape',
    description: 'Delete a single shape by its ID',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to delete',
        },
      },
      required: ['shapeId'],
    },
  },
  {
    name: 'deleteMultipleShapes',
    description: 'Delete multiple shapes by their IDs',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to delete',
        },
      },
      required: ['shapeIds'],
    },
  },
  {
    name: 'deleteShapesByCriteria',
    description: 'Delete all shapes matching specific criteria',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Shape type' },
            color: { type: 'string', description: 'Color filter' },
            position: { type: 'string', description: 'Position filter' },
            text: { type: 'string', description: 'Text content filter' },
          },
        },
      },
      required: ['criteria'],
    },
  },
  {
    name: 'moveShapeTo',
    description: 'Move a shape to an absolute position',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape ID' },
        x: { type: 'number', description: 'New X position' },
        y: { type: 'number', description: 'New Y position' },
      },
      required: ['shapeId', 'x', 'y'],
    },
  },
  {
    name: 'moveShapeBy',
    description: 'Move a shape by a relative offset. Positive X moves right, negative left. Positive Y moves down, negative up.',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape ID' },
        deltaX: { type: 'number', description: 'Horizontal offset in pixels (positive = right, negative = left)' },
        deltaY: { type: 'number', description: 'Vertical offset in pixels (positive = down, negative = up)' },
      },
      required: ['shapeId', 'deltaX', 'deltaY'],
    },
  },
  {
    name: 'moveMultipleShapesBy',
    description: 'Move multiple shapes by the same relative offset',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs' },
        deltaX: { type: 'number', description: 'Horizontal offset (positive = right)' },
        deltaY: { type: 'number', description: 'Vertical offset (positive = down)' },
      },
      required: ['shapeIds', 'deltaX', 'deltaY'],
    },
  },
  {
    name: 'changeShapeColor',
    description: 'Change the color of a single shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape ID' },
        color: { type: 'string', description: 'New color (hex or color name)' },
      },
      required: ['shapeId', 'color'],
    },
  },
  {
    name: 'changeMultipleShapesColor',
    description: 'Change the color of multiple shapes',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs' },
        color: { type: 'string', description: 'New color' },
      },
      required: ['shapeIds', 'color'],
    },
  },
  {
    name: 'resizeShape',
    description: 'Resize a shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string' },
        width: { type: 'number', description: 'New width in pixels' },
        height: { type: 'number', description: 'New height in pixels' },
      },
      required: ['shapeId', 'width', 'height'],
    },
  },
  {
    name: 'rotateShape',
    description: 'Rotate a shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string' },
        rotation: { type: 'number', description: 'Rotation in degrees (0-360)' },
      },
      required: ['shapeId', 'rotation'],
    },
  },
  {
    name: 'changeText',
    description: 'Change text content of a text shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape ID (must be a text shape)' },
        text: { type: 'string', description: 'New text content' },
      },
      required: ['shapeId', 'text'],
    },
  },
];

/**
 * Execute a function call from the LLM
 * @param {string} functionName - Name of the function to call
 * @param {object} args - Arguments for the function
 * @param {Array} shapes - Current shapes array (for query functions)
 * @returns {Promise<any>} Result of the function call
 */
export async function executeFunctionCall(functionName, args, shapes) {
  try {
    // Map function name to actual implementation
    switch (functionName) {
      case 'findShapes':
        return agentActions.findShapes(shapes, args.criteria || {});
      
      case 'createShape':
        return await agentActions.createShapes(args.type, args.x, args.y, args.properties || {});
      
      case 'createGrid':
        return await agentActions.createGrid(
          args.type,
          args.rows,
          args.cols,
          args.startX,
          args.startY,
          args.spacingX,
          args.spacingY,
          args.properties || {}
        );
      
      case 'deleteShape':
        return await agentActions.deleteShape(args.shapeId);
      
      case 'deleteMultipleShapes':
        return await agentActions.deleteMultipleShapes(args.shapeIds);
      
      case 'deleteShapesByCriteria':
        return await agentActions.deleteShapesByCriteria(shapes, args.criteria);
      
      case 'moveShapeTo':
        return await agentActions.moveShapeTo(args.shapeId, args.x, args.y);
      
      case 'moveShapeBy':
        return await agentActions.moveShapeBy(args.shapeId, args.deltaX, args.deltaY);
      
      case 'moveMultipleShapesBy':
        return await agentActions.moveMultipleShapesBy(args.shapeIds, args.deltaX, args.deltaY);
      
      case 'changeShapeColor':
        return await agentActions.changeShapeColor(args.shapeId, args.color);
      
      case 'changeMultipleShapesColor':
        return await agentActions.changeMultipleShapesColor(args.shapeIds, args.color);
      
      case 'resizeShape':
        return await agentActions.resizeShape(args.shapeId, args.width, args.height);
      
      case 'rotateShape':
        return await agentActions.rotateShape(args.shapeId, args.rotation);
      
      case 'changeText':
        return await agentActions.changeText(args.shapeId, args.text);
      
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error) {
    throw new Error(`Error executing ${functionName}: ${error.message}`);
  }
}

/**
 * Process a user command through the AI agent using Vercel AI SDK
 * Supports streaming responses and function calling
 * 
 * @param {string} userCommand - Natural language command from user
 * @param {Array} shapes - Current shapes array
 * @param {Array} selectedShapeIds - Currently selected shape IDs
 * @param {Object} hookFunctions - Hook-level functions that manage UI state (deleteShape, selectShape)
 * @param {Function} onChunk - Callback for streaming text chunks
 * @param {Function} onToolCall - Callback for tool call execution
 * @returns {Promise<Object>} Result with success status and message
 */
export async function processAgentCommand(userCommand, shapes, selectedShapeIds = [], hookFunctions = {}, { onChunk, onToolCall } = {}) {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env or .env.local file.');
    }

    // Create OpenAI instance with explicit API key (required for browser environment)
    const openai = createOpenAI({
      apiKey: apiKey,
    });

    // Define tools using Zod schemas (proper AI SDK format)
    const tools = {
      getActiveShapes: tool({
        description: 'Get the currently selected/active shapes. Use this when user says "active shape", "selected shape", "current shape", etc. Returns the same format as findShapes.',
        inputSchema: z.object({}),
        execute: async () => {
          // Filter shapes by selectedShapeIds
          const activeShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
          if (onToolCall) onToolCall({ function: 'getActiveShapes', args: {}, result: activeShapes });
          return activeShapes.map(shape => ({
            id: shape.id,
            type: shape.type,
            x: shape.x,
            y: shape.y,
            fill: shape.fill,
            width: shape.width,
            height: shape.height,
          }));
        },
      }),
      
      findShapes: tool({
        description: 'Find shapes on the canvas. Returns an array of shape objects, each with an "id" field that you MUST use in subsequent operations. Example return: [{id: "abc123", type: "circle", x: 100, y: 200, fill: "red"}]',
        inputSchema: z.object({
          criteria: z.object({
            type: z.enum(['rectangle', 'circle', 'text', 'image', 'square', 'line', 'star']).optional().describe('Shape type to filter by'),
            color: z.string().optional().describe('Color to filter by. Supports: red, orange, yellow, green, cyan, aqua, blue, purple, violet, pink, brown, gray, black, white, magenta, fuchsia, teal, olive, gold, beige, tan, maroon, burgundy, lavender, lilac, turquoise, or hex codes. Uses RGB range matching to find all shades of a color.'),
            position: z.enum(['leftmost', 'rightmost', 'topmost', 'bottommost', 'left', 'right', 'top', 'bottom']).optional().describe('Find shape in specific relative position'),
            text: z.string().optional().describe('Text content to search for (only for text shapes)'),
          }).optional().describe('Search criteria. Omit or pass empty object to get all shapes'),
        }),
        execute: async ({ criteria }) => {
          const result = await agentActions.findShapes(shapes, criteria || {});
          if (onToolCall) onToolCall({ function: 'findShapes', args: { criteria }, result });
          // Return simplified data focusing on what the AI needs
          return result.map(shape => ({
            id: shape.id,
            type: shape.type,
            x: shape.x,
            y: shape.y,
            fill: shape.fill,
            width: shape.width,
            height: shape.height,
          }));
        },
      }),
      
      createShapes: tool({
        description: 'Create one or more shapes on the canvas. Supports both single shape and batch creation. Use for any creation task.',
        inputSchema: z.object({
          shapes: z.array(z.object({
            type: z.enum(['rectangle', 'circle', 'text', 'square', 'line', 'star']),
            x: z.number(),
            y: z.number(),
            color: z.string().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            text: z.string().optional(),
            fontSize: z.number().optional(),
            rotation: z.number().optional(),
          })).describe('Array of shape definitions. Can be a single shape [{}] or multiple shapes [{}, {}, ...]'),
        }),
        execute: async ({ shapes: shapesToCreate }) => {
          // Build shape objects using the shared builder
          const shapeObjects = shapesToCreate.map(s => {
            const { type, x, y, ...properties } = s;
            return buildShapeObject(type, x, y, properties);
          });
          const result = await agentActions.createShapes(shapeObjects);
          if (onToolCall) onToolCall({ function: 'createShapes', args: { shapes: shapesToCreate }, result });
          const shapeIds = Array.isArray(result) ? result : [result];
          return { success: true, shapeIds, count: shapeIds.length };
        },
      }),
      
      moveShapeTo: tool({
        description: 'Move a shape to an absolute position on the canvas. You MUST call findShapes first to get the shape ID. Canvas is 5000x5000. Middle = (2500, 2500). Use this for "move to middle", "move to top-left", etc.',
        inputSchema: z.object({
          shapeId: z.string().describe('Shape ID from findShapes result'),
          x: z.number().describe('Absolute X position (0 = left edge, 2500 = center, 5000 = right edge)'),
          y: z.number().describe('Absolute Y position (0 = top edge, 2500 = center, 5000 = bottom edge)'),
        }),
        execute: async ({ shapeId, x, y }) => {
          const result = await agentActions.moveShapeTo(shapeId, x, y);
          if (onToolCall) onToolCall({ function: 'moveShapeTo', args: { shapeId, x, y }, result });
          return { success: true, message: `Moved shape ${shapeId} to (${x}, ${y})` };
        },
      }),
      
      moveShapeBy: tool({
        description: 'Move a shape by a relative offset. You MUST call findShapes first to get the shape ID. Positive X moves right, negative left. Positive Y moves down, negative up.',
        inputSchema: z.object({
          shapeId: z.string().describe('Shape ID from findShapes result'),
          deltaX: z.number().describe('Horizontal offset (positive = right, negative = left)'),
          deltaY: z.number().describe('Vertical offset (positive = down, negative = up)'),
        }),
        execute: async ({ shapeId, deltaX, deltaY }) => {
          const result = await agentActions.moveShapeBy(shapeId, deltaX, deltaY);
          if (onToolCall) onToolCall({ function: 'moveShapeBy', args: { shapeId, deltaX, deltaY }, result });
          return { success: true, message: `Moved shape ${shapeId}` };
        },
      }),
      
      changeShapeColor: tool({
        description: 'Change the color of a single shape. You MUST call findShapes first to get the shape ID.',
        inputSchema: z.object({
          shapeId: z.string().describe('Shape ID from findShapes result'),
          color: z.string().describe('New color (hex or color name)'),
        }),
        execute: async ({ shapeId, color }) => {
          const result = await agentActions.changeShapeColor(shapeId, color);
          if (onToolCall) onToolCall({ function: 'changeShapeColor', args: { shapeId, color }, result });
          return { success: true, message: `Changed color of shape ${shapeId} to ${color}` };
        },
      }),
      
      updateMultipleShapes: tool({
        description: 'Update multiple shapes at once (batch operation). Use for "change all active shapes to red", "resize shapes", etc. More efficient than updating one by one.',
        inputSchema: z.object({
          updates: z.array(z.object({
            shapeId: z.string().describe('Shape ID from findShapes or getActiveShapes'),
            color: z.string().optional().describe('New color'),
            x: z.number().optional().describe('New X position'),
            y: z.number().optional().describe('New Y position'),
            width: z.number().optional().describe('New width'),
            height: z.number().optional().describe('New height'),
            rotation: z.number().optional().describe('New rotation'),
          })).describe('Array of shape updates. Each must have shapeId and at least one property to update'),
        }),
        execute: async ({ updates }) => {
          // Convert to format expected by updateShapes: [{id, ...properties}]
          const updateObjects = updates.map(({ shapeId, ...properties }) => ({
            id: shapeId,
            ...properties
          }));
          const result = await agentActions.updateShapes(updateObjects);
          if (onToolCall) onToolCall({ function: 'updateMultipleShapes', args: { updates }, result });
          return { success: true, message: `Updated ${updates.length} shape(s)`, count: updates.length };
        },
      }),
      
      deleteMultipleShapes: tool({
        description: 'Delete multiple shapes at once (batch operation). Use for "delete all active shapes", "delete all red circles", etc. More efficient than deleting one by one.',
        inputSchema: z.object({
          shapeIds: z.array(z.string()).describe('Array of shape IDs to delete from findShapes or getActiveShapes'),
        }),
        execute: async ({ shapeIds }) => {
          const result = await agentActions.deleteMultipleShapes(shapeIds);
          if (onToolCall) onToolCall({ function: 'deleteMultipleShapes', args: { shapeIds }, result });
          return { success: true, message: `Deleted ${shapeIds.length} shape(s)`, count: shapeIds.length };
        },
      }),
      
      deleteShape: tool({
        description: 'Delete a single shape by its ID. You MUST call findShapes first to get the shape ID.',
        inputSchema: z.object({
          shapeId: z.string().describe('Shape ID from findShapes result'),
        }),
        execute: async ({ shapeId }) => {
          // Use hook-level deleteShape if available (clears selection), otherwise use service-level
          const deleteFunc = hookFunctions.deleteShape || agentActions.deleteShape;
          const result = await deleteFunc(shapeId);
          if (onToolCall) onToolCall({ function: 'deleteShape', args: { shapeId }, result });
          return { success: true, message: `Deleted shape ${shapeId}` };
        },
      }),
    };

    // Stream the response with function calling
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      stopWhen: stepCountIs(5), // Allow up to 5 steps for multi-tool workflows (e.g., find then move)
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps users manipulate shapes on a canvas. 

AVAILABLE SHAPE TYPES:
rectangle, square, circle, text, line, star, image
Note: "rectangle" and "square" both use type "rectangle"

CANVAS INFORMATION:
- Size: 5000 x 5000 pixels
- Origin: (0, 0) at top-left
- Center: (2500, 2500)
- Coordinates: X increases right, Y increases down

DEFAULTS - Use these when user doesn't specify:
- Position: Center (2500, 2500) or random if multiple
- Size: 
  - "tiny" = 30-50px
  - "small" = 80-100px
  - "normal" = 100-150px (default)
  - "large" = 200-300px
  - "huge"/"gigantic" = 400-500px
- Color: User's color name or pick a vibrant color
- NEVER ask for clarification - make reasonable choices!

POSITIONAL REFERENCE:
When positioning at edges/corners, ALWAYS account for shape dimensions:
- "top" = y: 250 (no width/height adjustment)
- "bottom" = y: 5000 - shape.height (keeps shape on canvas)
- "left" = x: 250 (no width/height adjustment)
- "right" = x: 5000 - shape.width (keeps shape on canvas)
- "middle"/"center" = (2500 - shape.width/2, 2500 - shape.height/2)
- "top-left" = (250, 250)
- "top-right" = (5000 - shape.width, 250)
- "bottom-left" = (250, 5000 - shape.height)
- "bottom-right" = (5000 - shape.width, 5000 - shape.height)

ACTIVE/SELECTED SHAPES:
When user says "active shape", "selected shape", "current shape":
- Use getActiveShapes() to get currently selected shapes
- No filtering needed - returns what user has selected
- Then perform actions on those shapes

WORKFLOW - Multi-step approach:

1. FIND shapes:
   a) For "active"/"selected" → getActiveShapes()
   b) For criteria-based → findShapes({criteria: {...}})
   - Both return array with: {id, type, x, y, fill, width, height}
   - Use this data to make intelligent decisions!

2. EXTRACT the shape ID(s) and properties from results

3. PERFORM action with the ID(s):
   Single operations:
   - moveShapeTo, moveShapeBy
   - changeShapeColor
   - resizeShape, rotateShape
   - deleteShape
   
   Batch operations (pass arrays for multiple shapes):
   - createShapes (handles single or multiple)
   - updateMultipleShapes (update properties of many)
   - deleteMultipleShapes (delete many at once)

EXAMPLES:

User: "Move the active shape to the top"
Step 1: getActiveShapes()
       → Get: [{id: "s1", width: 100, height: 100, ...}]
Step 2: moveShapeTo({shapeId: "s1", x: 2500, y: 250})

User: "Change the selected shape to red"
Step 1: getActiveShapes()
       → Get: [{id: "s1", ...}]
Step 2: changeShapeColor({shapeId: "s1", color: "red"})

User: "Move the blue square to the top"
Step 1: findShapes({criteria: {type: "rectangle", color: "blue"}})
       → Get: {id: "s1", width: 100, height: 100, ...}
Step 2: moveShapeTo({shapeId: "s1", x: 2500, y: 250})

User: "Move the blue square to the bottom-right"
Step 1: findShapes({criteria: {type: "rectangle", color: "blue"}})
       → Get: {id: "s1", width: 500, height: 500, ...}
Step 2: Calculate: x = 5000 - 500 = 4500, y = 5000 - 500 = 4500
Step 3: moveShapeTo({shapeId: "s1", x: 4500, y: 4500})
       // Now entire shape stays on canvas!

User: "Delete all red circles"
Step 1: findShapes({criteria: {type: "circle", color: "red"}})
Step 2: Loop through results and call deleteShape for each ID

User: "Change the green star to blue"
Step 1: findShapes({criteria: {type: "star", color: "green"}})
Step 2: Extract shapes[0].id
Step 3: changeShapeColor({shapeId: shapes[0].id, color: "blue"})

User: "Move any square 100px right"
Step 1: findShapes({criteria: {type: "rectangle"}})
Step 2: Extract shapes[0] → {id: "abc", x: 500, y: 300, ...}
Step 3: moveShapeBy({shapeId: "abc", deltaX: 100, deltaY: 0})

User: "Move the red circle below the blue square"
Step 1: findShapes({criteria: {type: "rectangle", color: "blue"}})
       → Get blue square: {id: "s1", x: 1000, y: 500, height: 100}
Step 2: findShapes({criteria: {type: "circle", color: "red"}})
       → Get red circle: {id: "c1", x: 800, y: 600}
Step 3: moveShapeTo({shapeId: "c1", x: 1000, y: 650}) // blue.y + blue.height + gap

BATCH OPERATIONS (pass arrays):

User: "Create a red circle at 500, 500"
Step 1: createShapes({shapes: [
  {type: "circle", x: 500, y: 500, color: "red"}
]})

User: "Create a gigantic pink star"
Step 1: createShapes({shapes: [
  {type: "star", x: 2500, y: 2500, color: "pink", width: 400, height: 400}
]})
// Used center position and 400px for "gigantic"

User: "Create 5 blue circles in a row"
Step 1: createShapes({shapes: [
  {type: "circle", x: 100, y: 500, color: "blue"},
  {type: "circle", x: 300, y: 500, color: "blue"},
  {type: "circle", x: 500, y: 500, color: "blue"},
  {type: "circle", x: 700, y: 500, color: "blue"},
  {type: "circle", x: 900, y: 500, color: "blue"}
]})

User: "Change all active shapes to red"
Step 1: getActiveShapes() → [{id: "s1"}, {id: "s2"}, {id: "s3"}]
Step 2: updateMultipleShapes({updates: [
  {shapeId: "s1", color: "red"},
  {shapeId: "s2", color: "red"},
  {shapeId: "s3", color: "red"}
]})

User: "Delete all red circles"
Step 1: findShapes({criteria: {type: "circle", color: "red"}})
       → Get: [{id: "c1"}, {id: "c2"}, {id: "c3"}]
Step 2: deleteMultipleShapes({shapeIds: ["c1", "c2", "c3"]})

MOVEMENT DIRECTIONS:
- Right: deltaX positive
- Left: deltaX negative
- Down: deltaY positive
- Up: deltaY negative

IMPORTANT:
- ALWAYS call findShapes FIRST to get shape IDs
- NEVER use findShapes alone - always follow with an action
- Handle "the" (singular) by using first result: shapes[0]
- Handle "all" (plural) by processing all results
- NEVER ask for clarification - use sensible defaults
- Be decisive and proactive
- Confirm what you did after completion`,
        },
        {
          role: 'user',
          content: userCommand,
        },
      ],
      tools,
      maxSteps: 5, // Allow multiple tool calls in sequence
    });

    // Collect all text chunks
    let fullText = '';
    const toolCalls = [];
    
    for await (const chunk of result.textStream) {
      fullText += chunk;
      if (onChunk) {
        onChunk(chunk);
      }
    }

    // Wait for all tool calls to complete
    await result.toolCalls;

    return {
      success: true,
      message: fullText || 'Command executed successfully',
      text: fullText,
    };
  } catch (error) {
    console.error('Agent command error:', error);
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
}

/**
 * Alternative: Use Anthropic Claude with Vercel AI SDK
 * 
 * To use Anthropic instead of OpenAI:
 * 1. Install: npm install @ai-sdk/anthropic
 * 2. Set environment variable: VITE_ANTHROPIC_API_KEY
 * 3. Import: import { anthropic } from '@ai-sdk/anthropic';
 * 4. Replace openai('gpt-4-turbo') with anthropic('claude-3-5-sonnet-20241022')
 */

/**
 * Alternative: Use any other provider supported by Vercel AI SDK
 * 
 * Supported providers:
 * - OpenAI: @ai-sdk/openai
 * - Anthropic: @ai-sdk/anthropic
 * - Google: @ai-sdk/google
 * - Mistral: @ai-sdk/mistral
 * - Cohere: @ai-sdk/cohere
 * - And many more!
 * 
 * See: https://sdk.vercel.ai/providers/ai-sdk-providers
 */


