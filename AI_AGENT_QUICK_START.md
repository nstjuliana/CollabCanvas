# AI Agent Quick Start 🚀

**Your AI Agent is ready to go!** Here's how to start using it right now.

## Step 1: Add API Key (30 seconds)

Create a `.env` file in the project root:

```env
VITE_OPENAI_API_KEY=sk-proj-your-openai-key-here
```

Don't have an API key? Get one at: https://platform.openai.com/api-keys

## Step 2: Restart Dev Server

```bash
npm run dev
```

## Step 3: Open the App

1. Open http://localhost:5173 in your browser
2. **Log in** (required for creating/editing shapes)
3. Look for the **🤖 AI Agent** button in the bottom-right corner
4. Click it to open the AI Agent panel

## Step 4: Try It Out!

### Test Without AI (No API Key Needed)

Click any of the test buttons to see the agent actions in action:
- **Create Red Circle** - Creates a red circle
- **Create "Hello World" Text** - Adds text to the canvas
- **Create 2x2 Green Grid** - Makes a grid of squares
- **Move a Red Shape** - Finds and moves a red shape
- **Resize a Circle** - Resizes a circle
- **Rotate a Rectangle** - Rotates a rectangle

### Test With AI (Requires API Key)

Try these natural language commands:

**Basic Creation:**
```
Create a red circle
Create a blue square at position 500, 300
Create a text that says "Hello World"
```

**Grids and Patterns:**
```
Create a 3x3 grid of circles
Create a row of 5 blue squares
Make a grid of 4 red rectangles
```

**Moving Shapes:**
```
Move the red circle 100 pixels to the right
Move all blue shapes down by 50 pixels
Move the leftmost rectangle to position 600, 400
```

**Changing Colors:**
```
Change all circles to green
Make the rightmost square red
Change the color of all text to blue
```

**Resizing and Rotating:**
```
Resize the largest rectangle to 200x150
Rotate the red square by 45 degrees
Make all circles twice as big
```

**Deleting:**
```
Delete the red circle
Delete all blue shapes
Delete the text on the bottom
Remove all rectangles
```

**Complex Commands:**
```
Create 3 circles and make them all blue
Find all red shapes and move them 50 pixels right
Create a red square, then create a blue circle next to it
Delete all shapes on the left side of the canvas
```

## What You'll See

When you run a command with AI:

1. **Your message** appears in the chat (blue bubble)
2. **AI response streams** in real-time with a blinking cursor
3. **Tool calls** are shown below the response
4. **Canvas updates** immediately as actions are executed

Example:
```
You: Create a red circle and move it 100 pixels right

AI: I'll create a red circle and move it for you ▊

Tools executed:
✓ createShape (1 item)
✓ moveShapeBy ✓
```

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you created the `.env` file in the project root
- Check that the variable is named exactly `VITE_OPENAI_API_KEY`
- Restart the dev server after creating `.env`

### Commands aren't working
- Make sure you're **logged in** (shapes require authentication)
- Try simpler commands first like "create a red circle"
- Check the browser console for errors

### Test buttons work but AI doesn't
- Verify your API key is valid
- Check that you have API credits remaining
- Try a simpler model: change `gpt-4-turbo` to `gpt-3.5-turbo` in `agentExecutor.js`

## Next Steps

- ✅ Test basic commands
- ✅ Try complex multi-step operations
- ✅ Experiment with different shapes and colors
- 📖 Read [VERCEL_AI_SDK_INTEGRATION.md](./VERCEL_AI_SDK_INTEGRATION.md) for advanced features
- 🏗️ Read [AI_AGENT_ARCHITECTURE.md](./AI_AGENT_ARCHITECTURE.md) to understand how it works
- 🔧 Read [AI_AGENT_ENV_SETUP.md](./AI_AGENT_ENV_SETUP.md) for production deployment

## Cost Warning ⚠️

Each AI command costs money (usually $0.001-0.01 per request depending on the model).

**To reduce costs:**
- Use `gpt-3.5-turbo` instead of `gpt-4-turbo` (10x cheaper)
- Use test buttons when possible (they're free!)
- Set up rate limiting in production

## Have Fun! 🎉

The AI Agent can understand complex commands and execute multiple operations. Get creative and see what it can do!

Example creative commands to try:
- "Create a smiley face using circles"
- "Make a rainbow of colored squares"
- "Create a tic-tac-toe board"
- "Arrange all shapes in a circle"
- "Create a checkerboard pattern"

---

**Questions?** Check out the full documentation:
- [VERCEL_AI_SDK_INTEGRATION.md](./VERCEL_AI_SDK_INTEGRATION.md) - Complete guide
- [AI_AGENT_ARCHITECTURE.md](./AI_AGENT_ARCHITECTURE.md) - Architecture details
- [src/services/AI_AGENT_GUIDE.md](./src/services/AI_AGENT_GUIDE.md) - API reference

