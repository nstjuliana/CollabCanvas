# AI Agent Setup Guide

## ✅ What's Been Integrated

The AI Agent is now fully integrated with **Vercel AI SDK**! Here's what's included:

### 1. **Core Agent Actions** (`src/services/agentActions.js`)
Basic functions for manipulating shapes:

- **Query**: `getAllShapes()`, `findShapes()`, `getShapeInfo()`
- **Create**: `createShape()`, `createMultipleShapes()`, `createGrid()`
- **Delete**: `deleteShape()`, `deleteMultipleShapes()`, `deleteShapesByCriteria()`
- **Move**: `moveShapeTo()`, `moveShapeBy()`, `moveMultipleShapesBy()`
- **Modify**: `changeShapeColor()`, `resizeShape()`, `rotateShape()`, `changeText()`

### 2. **React Hook** (`src/hooks/useAgentActions.js`)
Easy-to-use hook that wraps the agent actions with shapes state.

### 3. **Agent Executor** (`src/services/agentExecutor.js`)
- **✨ NEW**: Fully integrated with Vercel AI SDK
- Tool definitions for LLM function calling (OpenAI/Anthropic compatible)
- Function execution router with streaming support
- Real-time response streaming
- Multi-step execution (chains multiple operations)

### 4. **UI Component** (`src/components/AIAgentPanel.jsx`)
**✨ NEW**: Enhanced with streaming support
- Beautiful, collapsible chat interface
- Real-time streaming responses with cursor animation
- Tool call visualization
- Test buttons for trying actions without AI
- Chat history persistence

### 5. **Documentation** (`src/services/AI_AGENT_GUIDE.md`)
Complete guide with examples for every function.

---

## 🚀 How to Use It

### Quick Start (2 steps):

#### Step 1: Add Your OpenAI API Key

Create a `.env` file in the project root:

```env
VITE_OPENAI_API_KEY=sk-proj-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

#### Step 2: Restart Dev Server

```bash
npm run dev
```

That's it! The AI Agent is ready to use. 🎉

### Alternative Providers

Want to use a different AI provider? See [VERCEL_AI_SDK_INTEGRATION.md](./VERCEL_AI_SDK_INTEGRATION.md) for:
- Anthropic Claude
- Google Gemini
- Mistral
- And more!

**For OpenAI:**
```javascript
export async function callOpenAI({ messages, tools }) {
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // Use backend in production!
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
}
```

**For Anthropic:**
```javascript
export async function callAnthropic({ messages, tools }) {
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

  const toolCalls = response.content
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      function: {
        name: block.name,
        arguments: JSON.stringify(block.input),
      },
    }));

  return { tool_calls: toolCalls };
}
```

---

## 📋 Example Commands

Once integrated, users can type commands like:

- ✅ "Create a red square at position 200, 200"
- ✅ "Create a grid of 4 circles"
- ✅ "Select the red square on the left and move it 10px to the right"
- ✅ "Change all blue rectangles to green"
- ✅ "Delete the text on the bottom"
- ✅ "Create 5 circles in a row"
- ✅ "Move all red shapes 20 pixels down"
- ✅ "Resize the largest rectangle to 200x150"

---

## 🏗️ Architecture

```
User Command
    ↓
AIAgentPanel (UI)
    ↓
agentExecutor.processAgentCommand()
    ↓
LLM API (OpenAI/Anthropic)
    ↓ (returns function calls)
agentExecutor.executeFunctionCall()
    ↓
agentActions.* (atomic operations)
    ↓
Firebase/Firestore (real-time updates)
```

---

## 🔧 Advanced Usage

### Using Agent Actions Programmatically

You can also use agent actions directly in your code:

```javascript
import { useAgentActions } from '../hooks/useAgentActions';

function MyComponent() {
  const { shapes } = useShapes();
  const agent = useAgentActions(shapes);
  
  // Example: Find and move red shapes
  const handleMoveRedShapes = async () => {
    const redShapes = agent.findShapes({ color: 'red' });
    const shapeIds = redShapes.map(s => s.id);
    await agent.moveMultipleShapesBy(shapeIds, 50, 0);
  };
  
  return (
    <button onClick={handleMoveRedShapes}>
      Move Red Shapes
    </button>
  );
}
```

### Adding Custom Functions

To add new agent actions:

1. Add function to `src/services/agentActions.js`
2. Export it from `src/hooks/useAgentActions.js`
3. Add tool definition to `AGENT_TOOLS` in `src/services/agentExecutor.js`
4. Add case to `executeFunctionCall()` switch statement

---

## 🔐 Security Notes

**⚠️ IMPORTANT:** The example implementations use `dangerouslyAllowBrowser: true` for OpenAI, which exposes your API key in the frontend. This is **ONLY FOR DEVELOPMENT**.

### For Production:

**Option 1: Backend Proxy (Recommended)**
```
User → Your Backend API → LLM API → Your Backend → User
```

Create an endpoint like `/api/agent/execute`:
```javascript
// Backend (Node.js/Express)
app.post('/api/agent/execute', async (req, res) => {
  const { command, shapes } = req.body;
  
  // Validate user authentication
  // Rate limit requests
  
  const result = await processAgentCommand(
    command,
    shapes,
    callOpenAI // API key stored in backend env vars
  );
  
  res.json(result);
});
```

**Option 2: Edge Functions**
Use Vercel Edge Functions, Cloudflare Workers, or Firebase Functions to proxy LLM calls.

---

## 📊 Function Reference

### Query Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `getAllShapes()` | Get all shapes | `const shapes = getAllShapes()` |
| `findShapes(criteria)` | Find by type/color/position | `findShapes({ color: 'red', position: 'left' })` |
| `getShapeInfo(id)` | Get single shape | `await getShapeInfo('shape-123')` |

### Create Functions

| Function | Purpose |
|----------|---------|
| `createShape(type, x, y, props)` | Create single shape |
| `createMultipleShapes(array)` | Create multiple shapes |
| `createGrid(type, rows, cols, x, y, spacing)` | Create shape grid |

### Delete Functions

| Function | Purpose |
|----------|---------|
| `deleteShape(id)` | Delete by ID |
| `deleteMultipleShapes(ids)` | Delete multiple by IDs |
| `deleteShapesByCriteria(criteria)` | Delete matching criteria |

### Move Functions

| Function | Purpose | Notes |
|----------|---------|-------|
| `moveShapeTo(id, x, y)` | Absolute position | - |
| `moveShapeBy(id, dx, dy)` | Relative movement | +X=right, -X=left, +Y=down, -Y=up |
| `moveMultipleShapesBy(ids, dx, dy)` | Move multiple | - |

### Modify Functions

| Function | Purpose |
|----------|---------|
| `changeShapeColor(id, color)` | Change color |
| `changeMultipleShapesColor(ids, color)` | Change multiple colors |
| `resizeShape(id, width, height)` | Resize shape |
| `rotateShape(id, degrees)` | Rotate shape |
| `changeText(id, text)` | Change text content |

---

## 🧪 Testing

Test individual functions:

```javascript
// In browser console or component
const agent = useAgentActions(shapes);

// Create a shape
await agent.createShape('rectangle', 100, 100, { color: 'blue' });

// Find it
const blueShapes = agent.findShapes({ color: 'blue' });

// Move it
await agent.moveShapeBy(blueShapes[0].id, 50, 0);

// Change color
await agent.changeShapeColor(blueShapes[0].id, 'green');

// Delete it
await agent.deleteShape(blueShapes[0].id);
```

---

## 🐛 Troubleshooting

### "LLM API not configured" error
- Implement `callOpenAI` or `callAnthropic` in `agentExecutor.js`
- Add API key to `.env` file
- Restart dev server after adding env variables

### Commands not working
- Check browser console for errors
- Verify shapes are being found with `findShapes()`
- Check Firebase permissions

### Agent doesn't understand commands
- Make sure your LLM API key is valid
- Check the system prompt in `processAgentCommand()`
- Try more explicit commands

---

## 📚 Next Steps

1. **Integrate LLM API** (choose OpenAI/Anthropic/other)
2. **Add AI Agent Panel to Canvas component**
3. **Test with example commands**
4. **Set up backend proxy for production**
5. **Customize the UI to match your design**
6. **Add more advanced functions as needed**

---

## 🎯 Design Philosophy

This system follows a simple philosophy:

> **Provide simple, atomic tools. Let the LLM figure out how to use them.**

Instead of creating complex, multi-step functions, we give the AI basic building blocks. The LLM's intelligence handles:
- Natural language understanding
- Breaking complex commands into steps
- Querying for shapes before operating on them
- Error handling and retries

This makes the system:
- ✅ Easy to maintain
- ✅ Easy to extend
- ✅ Flexible for any command
- ✅ Transparent (you see what functions are called)

---

## 📞 Support

For detailed documentation on each function, see:
- `src/services/AI_AGENT_GUIDE.md` - Complete function reference
- `src/services/agentActions.js` - Implementation and JSDoc comments
- `src/services/agentExecutor.js` - LLM integration examples

Happy building! 🚀


