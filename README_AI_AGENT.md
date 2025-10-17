# 🤖 AI Agent for CollabCanvas

> Natural language control for your collaborative canvas, powered by Vercel AI SDK

## What is it?

The AI Agent lets you control CollabCanvas using natural language commands. Just type what you want, and the AI figures out how to do it.

**Example:**
```
You: "Create a red circle and move it 100 pixels to the right"

AI: I'll create a red circle and move it for you.

✓ createShape (created circle)
✓ moveShapeBy (moved 100px right)
```

## Features

- 🎨 **15 Shape Operations** - Create, move, modify, delete shapes
- 💬 **Streaming Responses** - See AI thinking in real-time
- 🔧 **Multi-Step Execution** - Chain multiple operations
- 🎯 **Smart Queries** - Find shapes by color, position, type
- 🧪 **Test Mode** - Try functions without AI
- 🔄 **Real-Time Sync** - Works with Firebase real-time updates

## Quick Start

### 1. Add Your API Key

Create `.env` in project root:

```env
VITE_OPENAI_API_KEY=sk-proj-your-key-here
```

Get your key: https://platform.openai.com/api-keys

### 2. Start the App

```bash
npm run dev
```

### 3. Try It!

1. Open the app and log in
2. Click the **🤖 AI Agent** button (bottom-right)
3. Type: "Create a red circle"

## Example Commands

### Creating Shapes
```
Create a red circle
Create a blue square at 500, 300
Make a text that says "Hello World"
Create a 3x3 grid of green circles
```

### Moving Shapes
```
Move the red circle 100 pixels right
Move all blue shapes down by 50
Move the leftmost rectangle to 600, 400
```

### Changing Colors
```
Change all circles to green
Make the red square blue
Change the color of all text to purple
```

### Deleting Shapes
```
Delete the red circle
Delete all blue shapes
Remove the text on the bottom
```

### Complex Operations
```
Create 5 circles in a row and make them rainbow colors
Find all red shapes and move them to the right side
Create a tic-tac-toe board
Arrange all shapes in a circle
```

## What You Can Do

### Query Functions
- **Get all shapes** - `getAllShapes()`
- **Find shapes** - By type, color, position, or text
- **Get shape info** - Details about specific shape

### Create Functions
- **Create single shape** - Any type at any position
- **Create multiple** - Many shapes at once
- **Create grid** - Automatic grid layout

### Move Functions
- **Move to position** - Absolute positioning
- **Move by offset** - Relative movement
- **Move multiple** - Batch operations

### Modify Functions
- **Change color** - Single or multiple shapes
- **Resize** - Change dimensions
- **Rotate** - Any angle
- **Change text** - Update text content

### Delete Functions
- **Delete by ID** - Specific shape
- **Delete multiple** - Many shapes at once
- **Delete by criteria** - Filter and delete

## How It Works

```
User Command
    ↓
Vercel AI SDK (GPT-4)
    ↓
Function Calls (findShapes, moveShape, etc.)
    ↓
Firebase Update
    ↓
Canvas Re-renders
```

The AI:
1. Understands your natural language command
2. Decides which functions to call
3. Executes them in the right order
4. Shows you what it did

## Documentation

- 📖 **[AI_AGENT_QUICK_START.md](./AI_AGENT_QUICK_START.md)** - Quick 30-second setup
- 🔧 **[VERCEL_AI_SDK_INTEGRATION.md](./VERCEL_AI_SDK_INTEGRATION.md)** - Complete integration guide
- 🏗️ **[AI_AGENT_ARCHITECTURE.md](./AI_AGENT_ARCHITECTURE.md)** - How it's built
- 📝 **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was built
- ⚙️ **[AI_AGENT_ENV_SETUP.md](./AI_AGENT_ENV_SETUP.md)** - Environment setup

## Technology Stack

- **[Vercel AI SDK](https://sdk.vercel.ai/)** - LLM integration
- **OpenAI GPT-4** - Natural language understanding
- **React** - UI framework
- **Firebase** - Real-time database
- **Konva** - Canvas rendering

## Switch AI Providers

Want to use a different AI? Easy!

### Anthropic Claude
```bash
npm install @ai-sdk/anthropic
```

### Google Gemini
```bash
npm install @ai-sdk/google
```

### Mistral
```bash
npm install @ai-sdk/mistral
```

See [VERCEL_AI_SDK_INTEGRATION.md](./VERCEL_AI_SDK_INTEGRATION.md) for details.

## Production Deployment

⚠️ **Important:** Current setup is for **development only**.

For production:
- Use backend proxy for API calls
- Hide API keys on server
- Implement rate limiting
- Add authentication
- Monitor costs

See [AI_AGENT_ENV_SETUP.md](./AI_AGENT_ENV_SETUP.md#production-deployment) for details.

## Cost

Using the AI Agent costs money (OpenAI charges per request):

- **GPT-4 Turbo:** ~$0.01 per request
- **GPT-3.5 Turbo:** ~$0.001 per request (10x cheaper)

**Tips to save money:**
- Use test buttons (free!)
- Switch to GPT-3.5 for simple tasks
- Implement rate limiting
- Cache common queries

## Troubleshooting

### "OpenAI API key not configured"
→ Create `.env` file with `VITE_OPENAI_API_KEY`
→ Restart dev server

### Commands don't work
→ Make sure you're logged in
→ Try simpler commands
→ Check browser console for errors

### API errors
→ Check API key is valid
→ Verify you have credits
→ Check OpenAI status page

## Examples Gallery

### Create Patterns
```
Create a checkerboard pattern
Make a rainbow of colored circles
Create a border around the canvas
```

### Organize Shapes
```
Arrange all circles in a line
Stack all rectangles vertically
Group shapes by color
```

### Complex Operations
```
Create a smiley face
Make a house using shapes
Create a traffic light pattern
Draw a flower using circles
```

## Contributing

Want to add new capabilities?

1. Add function to `src/services/agentActions.js`
2. Add tool definition to `src/services/agentExecutor.js`
3. Export from `src/hooks/useAgentActions.js`
4. Done! AI learns it automatically

See [VERCEL_AI_SDK_INTEGRATION.md#extending-the-agent](./VERCEL_AI_SDK_INTEGRATION.md#extending-the-agent)

## License

Same as CollabCanvas project.

## Support

- 📖 Check the documentation
- 🐛 Open an issue
- 💬 Ask in discussions

---

**Built with ❤️ using Vercel AI SDK**

Ready to start? → [AI_AGENT_QUICK_START.md](./AI_AGENT_QUICK_START.md)

