/**
 * Agent Executor
 * Executes AI agent commands using LLM function calling
 * 
 * This is an example implementation that shows how to integrate
 * with an LLM API (OpenAI, Anthropic, etc.)
 */

import * as agentActions from './agentActions';

/**
 * Function definitions for LLM tool use
 * These describe the available functions to the LLM
 */
export const AGENT_TOOLS = [
  {
    name: 'getAllShapes',
    description: 'Get all shapes currently on the canvas',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'findShapes',
    description: 'Find shapes matching specific criteria (type, color, position, or text content)',
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
        },
      },
      required: ['criteria'],
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
      case 'getAllShapes':
        return agentActions.getAllShapes(shapes);
      
      case 'findShapes':
        return agentActions.findShapes(shapes, args.criteria);
      
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
 * Process a user command through the AI agent
 * This is a template - you'll need to integrate with your chosen LLM API
 * 
 * @param {string} userCommand - Natural language command from user
 * @param {Array} shapes - Current shapes array
 * @param {Function} llmApiCall - Function that calls your LLM API
 * @returns {Promise<Object>} Result with success status and message
 */
export async function processAgentCommand(userCommand, shapes, llmApiCall) {
  try {
    // Step 1: Send command + tools to LLM
    const llmResponse = await llmApiCall({
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps users manipulate shapes on a canvas. 
The canvas is 5000x5000 pixels with origin at top-left (0,0).
When asked to move shapes "left", use negative X. "Right" uses positive X. 
"Up" uses negative Y. "Down" uses positive Y.
Always query for shapes using findShapes before operating on them.
Be helpful and execute the user's intent accurately.`,
        },
        {
          role: 'user',
          content: userCommand,
        },
      ],
      tools: AGENT_TOOLS,
    });

    // Step 2: Execute function calls returned by LLM
    const results = [];
    for (const toolCall of llmResponse.tool_calls || []) {
      const result = await executeFunctionCall(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        shapes
      );
      results.push({
        function: toolCall.function.name,
        result,
      });
    }

    // Step 3: Return results
    return {
      success: true,
      message: `Executed ${results.length} action(s)`,
      results,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
}

/**
 * Example: OpenAI API integration
 * 
 * To use with OpenAI:
 * 1. Install: npm install openai
 * 2. Set environment variable: VITE_OPENAI_API_KEY
 * 3. Use this function
 */
export async function callOpenAI({ messages, tools }) {
  // Example implementation (requires OpenAI SDK)
  /*
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // Only for demo - use backend in production
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    tools: tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),
    tool_choice: 'auto',
  });

  return {
    tool_calls: response.choices[0].message.tool_calls || [],
  };
  */
  
  throw new Error('LLM API not configured. Please implement callOpenAI or use another LLM provider.');
}

/**
 * Example: Anthropic Claude API integration
 * 
 * To use with Anthropic:
 * 1. Install: npm install @anthropic-ai/sdk
 * 2. Set environment variable: VITE_ANTHROPIC_API_KEY
 * 3. Use this function
 */
export async function callAnthropic({ messages, tools }) {
  // Example implementation (requires Anthropic SDK)
  /*
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    })),
    messages,
  });

  // Parse tool use from response
  const toolCalls = response.content
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      function: {
        name: block.name,
        arguments: JSON.stringify(block.input),
      },
    }));

  return { tool_calls: toolCalls };
  */
  
  throw new Error('LLM API not configured. Please implement callAnthropic or use another LLM provider.');
}


