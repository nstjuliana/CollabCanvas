# Vercel AI SDK Integration Guide

This document explains how the AI Agent is integrated using Vercel AI SDK and how to use it.

## Overview

The AI Agent for CollabCanvas is now powered by **Vercel AI SDK**, which provides:

✅ **Unified API** - Works with OpenAI, Anthropic, Google, Mistral, and more  
✅ **Streaming Support** - Real-time responses as they're generated  
✅ **Function Calling** - Seamless tool execution  
✅ **Type Safety** - Full TypeScript support  
✅ **Edge Ready** - Deploy to Vercel Edge Functions easily  

## What's Been Implemented

### 1. Core Integration (`src/services/agentExecutor.js`)

The agent executor now uses Vercel AI SDK's `streamText` function with:

- **Streaming responses** - Text appears in real-time as the AI generates it
- **Function calling** - All 15 agent actions are exposed as tools
- **Multi-step execution** - AI can chain multiple operations (maxSteps: 5)
- **Error handling** - Graceful fallbacks and user-friendly error messages

### 2. React UI (`src/components/AIAgentPanel.jsx`)

The AI Agent Panel features:

- **Real-time streaming** - See the AI's response as it types
- **Tool call visualization** - See which functions are executed
- **Blinking cursor** - Visual indicator during streaming
- **Test buttons** - Quick way to test agent actions without AI
- **Chat history** - Conversation persistence during session

### 3. Atomic Actions (`src/services/agentActions.js`)

15 atomic functions that the AI can use:

**Query Functions:**
- `getAllShapes()` - Get all shapes
- `findShapes(criteria)` - Find shapes by type, color, position, or text
- `getShapeInfo(shapeId)` - Get details about a specific shape

**Create Functions:**
- `createShape(type, x, y, properties)` - Create a single shape
- `createMultipleShapes(shapesArray)` - Create multiple shapes at once
- `createGrid(type, rows, cols, x, y, spacing)` - Create a grid of shapes

**Delete Functions:**
- `deleteShape(shapeId)` - Delete a shape by ID
- `deleteMultipleShapes(shapeIds)` - Delete multiple shapes
- `deleteShapesByCriteria(criteria)` - Delete shapes matching criteria

**Move Functions:**
- `moveShapeTo(shapeId, x, y)` - Move to absolute position
- `moveShapeBy(shapeId, deltaX, deltaY)` - Move by relative offset
- `moveMultipleShapesBy(shapeIds, deltaX, deltaY)` - Move multiple shapes

**Modify Functions:**
- `changeShapeColor(shapeId, color)` - Change a shape's color
- `changeMultipleShapesColor(shapeIds, color)` - Change multiple colors
- `resizeShape(shapeId, width, height)` - Resize a shape
- `rotateShape(shapeId, rotation)` - Rotate a shape
- `changeText(shapeId, text)` - Change text content

## Quick Start

### 1. Install Dependencies

Already done! The following packages are installed:
```bash
npm install ai @ai-sdk/openai
```

### 2. Configure API Key

Create a `.env` file in the project root:

```env
VITE_OPENAI_API_KEY=sk-proj-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Restart Dev Server

```bash
npm run dev
```

### 4. Test the AI Agent

1. Open the app in your browser
2. Log in (required for creating/modifying shapes)
3. Click the "🤖 AI Agent" button in the bottom-right corner
4. Try commands like:
   - "Create a red circle at position 300, 300"
   - "Create a 3x3 grid of blue squares"
   - "Move all red shapes 50 pixels to the right"
   - "Change all circles to green"
   - "Delete the leftmost rectangle"

## How It Works

### Command Flow

```
User: "Create a red circle and move it 100 pixels right"
    ↓
AIAgentPanel.handleSubmit()
    ↓
processAgentCommand() with streaming callbacks
    ↓
Vercel AI SDK streamText()
    ├─→ Streams text response chunks → onChunk callback → Update UI
    └─→ Executes tool calls → onToolCall callback → Update UI
        ├─ createShape('circle', x, y, { color: 'red' })
        └─ moveShapeBy(shapeId, 100, 0)
    ↓
Firebase updates propagate to all clients
    ↓
Canvas re-renders with new/updated shapes
```

### Streaming Example

```javascript
// User types: "Create a red circle"
// You'll see in real-time:

"I'll create" [streaming...]
"I'll create a red circle" [streaming...]
"I'll create a red circle for you." [streaming complete]

// Tools executed:
✓ createShape (1 item)
```

### Tool Execution Example

When you say: **"Move all blue shapes 20 pixels down"**

The AI executes:
1. `findShapes({ color: 'blue' })` → Returns array of blue shapes
2. `moveMultipleShapesBy([id1, id2, id3], 0, 20)` → Moves them all

You see both operations in the UI with their results.

## Switching AI Providers

### Using Anthropic Claude

```bash
npm install @ai-sdk/anthropic
```

In `src/services/agentExecutor.js`:

```javascript
// Add import
import { anthropic } from '@ai-sdk/anthropic';

// Change model
model: anthropic('claude-3-5-sonnet-20241022'),

// Update API key check
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

Add to `.env`:
```env
VITE_ANTHROPIC_API_KEY=your-anthropic-key
```

### Using Google Gemini

```bash
npm install @ai-sdk/google
```

```javascript
import { google } from '@ai-sdk/google';

model: google('gemini-1.5-pro'),
```

### Using Mistral

```bash
npm install @ai-sdk/mistral
```

```javascript
import { mistral } from '@ai-sdk/mistral';

model: mistral('mistral-large-latest'),
```

## Advanced Features

### Custom System Prompt

Modify the system prompt in `agentExecutor.js` to change the AI's behavior:

```javascript
{
  role: 'system',
  content: `You are a creative design assistant for a collaborative canvas.
You love making beautiful, well-organized layouts.
When asked to create shapes, make them visually appealing.
Always confirm what you've done in a friendly way.`,
}
```

### Adjusting Max Steps

Change how many sequential tool calls the AI can make:

```javascript
maxSteps: 5, // Default
maxSteps: 10, // For complex multi-step operations
maxSteps: 1, // For simple, single-action commands
```

### Custom Callbacks

You can add custom behavior to streaming and tool calls:

```javascript
await processAgentCommand(userCommand, shapes, {
  onChunk: (chunk) => {
    console.log('Streaming:', chunk);
    // Custom logic here
  },
  onToolCall: ({ function: fnName, args, result }) => {
    console.log(`Executed ${fnName} with:`, args);
    console.log('Result:', result);
    // Analytics, logging, etc.
  },
});
```

## Production Deployment

⚠️ **Security Warning**: The current setup exposes API keys in the frontend.

### Recommended: Backend Proxy

Create a backend endpoint (Next.js API route, Express, etc.):

```javascript
// pages/api/agent.js (Next.js example)
import { processAgentCommand } from '@/lib/agentExecutor';

export default async function handler(req, res) {
  // Verify authentication
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limiting
  await rateLimit(session.user.id);

  // Process command (API key is in server environment)
  const result = await processAgentCommand(
    req.body.command,
    req.body.shapes,
    // Callbacks can send Server-Sent Events for streaming
  );

  res.json(result);
}
```

### Vercel Edge Functions

Deploy as an edge function for low latency:

```javascript
// app/api/agent/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { command, shapes } = await req.json();
  
  // Process with Vercel AI SDK
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    // ... rest of configuration
  });

  return result.toDataStreamResponse();
}
```

## Monitoring & Debugging

### Enable Debug Logging

```javascript
// In agentExecutor.js
const result = await streamText({
  model: openai('gpt-4-turbo'),
  messages,
  tools,
  maxSteps: 5,
  onFinish: ({ text, toolCalls, finishReason }) => {
    console.log('Finished:', { text, toolCalls, finishReason });
  },
});
```

### Track Token Usage

```javascript
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const result = await streamText({
  model: openai('gpt-4-turbo'),
  // ...
});

console.log('Usage:', await result.usage);
// { promptTokens, completionTokens, totalTokens }
```

## Testing Without AI

The AIAgentPanel includes test buttons that directly call agent actions:

- **Create Red Circle** - Tests createShape()
- **Create "Hello World" Text** - Tests text creation
- **Create 2x2 Green Grid** - Tests createGrid()
- **Move a Red Shape** - Tests findShapes() + moveShapeBy()
- **Resize a Circle** - Tests resizeShape()
- **Rotate a Rectangle** - Tests rotateShape()

These bypass the AI and directly execute functions, useful for:
- Testing without API calls
- Debugging specific functions
- Demonstrating capabilities
- Development without API keys

## Cost Optimization

### Model Selection

```javascript
// Most capable but expensive (~$0.01/request)
model: openai('gpt-4-turbo'),

// Fast and cheap (~$0.001/request)
model: openai('gpt-3.5-turbo'),

// Balance of speed and capability
model: anthropic('claude-3-haiku-20240307'),
```

### Reduce Token Usage

```javascript
// Shorter system prompt
content: `You help users edit shapes on a canvas. Be concise.`

// Limit response length
maxTokens: 100,

// Reduce max steps for simple tasks
maxSteps: 2,
```

### Implement Caching

Cache common queries on the backend:

```javascript
const cache = new Map();

function getCachedResponse(command) {
  const normalized = command.toLowerCase().trim();
  if (cache.has(normalized)) {
    return cache.get(normalized);
  }
  // ... call AI
  cache.set(normalized, result);
  return result;
}
```

## Extending the Agent

### Add New Actions

1. **Create the function** in `src/services/agentActions.js`:

```javascript
export async function duplicateShape(shapeId) {
  const original = await getShape(shapeId);
  const duplicate = {
    ...original,
    x: original.x + 50,
    y: original.y + 50,
  };
  return await createShapeService(duplicate);
}
```

2. **Add tool definition** in `src/services/agentExecutor.js`:

```javascript
{
  name: 'duplicateShape',
  description: 'Create a copy of an existing shape',
  parameters: {
    type: 'object',
    properties: {
      shapeId: { type: 'string', description: 'ID of shape to duplicate' },
    },
    required: ['shapeId'],
  },
},
```

3. **Add to executor switch**:

```javascript
case 'duplicateShape':
  return await agentActions.duplicateShape(args.shapeId);
```

4. **Export from hook** (`useAgentActions.js`):

```javascript
const duplicateShape = useCallback(async (shapeId) => {
  return await agentActions.duplicateShape(shapeId);
}, []);

return {
  // ... other functions
  duplicateShape,
};
```

That's it! The AI will automatically learn to use the new function.

## Resources

- **Vercel AI SDK Docs**: https://sdk.vercel.ai/docs
- **OpenAI Platform**: https://platform.openai.com/
- **Anthropic Console**: https://console.anthropic.com/
- **Example Applications**: https://sdk.vercel.ai/examples

## Troubleshooting

### "OpenAI API key not configured"
- Check `.env` file exists
- Verify `VITE_OPENAI_API_KEY` is set
- Restart dev server

### Streaming not working
- Check browser console for errors
- Verify API key is valid
- Try non-streaming first (remove `onChunk`)

### Tool calls failing
- Check Firebase authentication
- Verify user has permission to modify shapes
- Check browser console for Firebase errors

### High costs
- Switch to GPT-3.5 or Claude Haiku
- Implement rate limiting
- Add usage warnings in UI
- Consider backend proxy with quotas

---

**You're all set!** 🎉

The AI Agent is now fully integrated with Vercel AI SDK. Try it out and see the magic happen!

