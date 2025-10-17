/**
 * Agent Executor
 * Executes AI agent commands using Vercel AI SDK
 * Supports streaming responses and function calling
 */

import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import * as agentActions from './agentActions';

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
              enum: ['rectangle', 'circle', 'text', 'image', 'square'],
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
          enum: ['rectangle', 'circle', 'text', 'square'],
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
          enum: ['rectangle', 'circle', 'square'],
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
        return await agentActions.createShape(args.type, args.x, args.y, args.properties || {});
      
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
 * @param {Function} onChunk - Callback for streaming text chunks
 * @param {Function} onToolCall - Callback for tool call execution
 * @returns {Promise<Object>} Result with success status and message
 */
export async function processAgentCommand(userCommand, shapes, { onChunk, onToolCall } = {}) {
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
      findShapes: tool({
        description: 'Find shapes matching specific criteria (type, color, position, or text content). Call with empty criteria to get all shapes.',
        inputSchema: z.object({
          criteria: z.object({
            type: z.enum(['rectangle', 'circle', 'text', 'image', 'square']).optional().describe('Shape type to filter by'),
            color: z.string().optional().describe('Color to filter by (hex code or color name like "red", "blue")'),
            position: z.enum(['leftmost', 'rightmost', 'topmost', 'bottommost', 'left', 'right', 'top', 'bottom']).optional().describe('Find shape in specific relative position'),
            text: z.string().optional().describe('Text content to search for (only for text shapes)'),
          }).optional().describe('Search criteria. Omit or pass empty object to get all shapes'),
        }),
        execute: async ({ criteria }) => {
          const result = await agentActions.findShapes(shapes, criteria || {});
          if (onToolCall) onToolCall({ function: 'findShapes', args: { criteria }, result });
          return result;
        },
      }),
      
      createShape: tool({
        description: 'Create a single shape on the canvas',
        inputSchema: z.object({
          type: z.enum(['rectangle', 'circle', 'text', 'square']).describe('Type of shape to create'),
          x: z.number().describe('X position on canvas (0 is left)'),
          y: z.number().describe('Y position on canvas (0 is top)'),
          properties: z.object({
            color: z.string().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            text: z.string().optional(),
            fontSize: z.number().optional(),
            rotation: z.number().optional(),
          }).optional(),
        }),
        execute: async ({ type, x, y, properties }) => {
          const result = await agentActions.createShape(type, x, y, properties || {});
          if (onToolCall) onToolCall({ function: 'createShape', args: { type, x, y, properties }, result });
          return result;
        },
      }),
      
      moveShapeBy: tool({
        description: 'Move a shape by a relative offset. Positive X moves right, negative left. Positive Y moves down, negative up.',
        inputSchema: z.object({
          shapeId: z.string().describe('Shape ID'),
          deltaX: z.number().describe('Horizontal offset (positive = right, negative = left)'),
          deltaY: z.number().describe('Vertical offset (positive = down, negative = up)'),
        }),
        execute: async ({ shapeId, deltaX, deltaY }) => {
          const result = await agentActions.moveShapeBy(shapeId, deltaX, deltaY);
          if (onToolCall) onToolCall({ function: 'moveShapeBy', args: { shapeId, deltaX, deltaY }, result });
          return result;
        },
      }),
      
      changeShapeColor: tool({
        description: 'Change the color of a single shape',
        inputSchema: z.object({
          shapeId: z.string().describe('Shape ID'),
          color: z.string().describe('New color (hex or color name)'),
        }),
        execute: async ({ shapeId, color }) => {
          const result = await agentActions.changeShapeColor(shapeId, color);
          if (onToolCall) onToolCall({ function: 'changeShapeColor', args: { shapeId, color }, result });
          return result;
        },
      }),
      
      deleteShape: tool({
        description: 'Delete a single shape by its ID',
        inputSchema: z.object({
          shapeId: z.string().describe('ID of the shape to delete'),
        }),
        execute: async ({ shapeId }) => {
          const result = await agentActions.deleteShape(shapeId);
          if (onToolCall) onToolCall({ function: 'deleteShape', args: { shapeId }, result });
          return result;
        },
      }),
    };

    // Stream the response with function calling
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps users manipulate shapes on a canvas. 
The canvas is 5000x5000 pixels with origin at top-left (0,0).
When asked to move shapes "left", use negative X. "Right" uses positive X. 
"Up" uses negative Y. "Down" uses positive Y.
To find shapes, use findShapes with appropriate criteria. To get all shapes, call findShapes with empty criteria {}.
Always query for shapes using findShapes before operating on them.
When you execute tool calls, provide a brief confirmation of what you did.
Be helpful and execute the user's intent accurately.`,
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


