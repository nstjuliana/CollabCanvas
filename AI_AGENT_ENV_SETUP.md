# AI Agent Environment Setup

## Required Environment Variables

To use the AI Agent feature, you need to set up your OpenAI API key.

### Step 1: Create a .env file

Create a `.env` file in the root of your project (if it doesn't exist already):

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Or create it manually with the following content:

```env
# OpenAI API Key (Required for AI Agent)
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

### Step 2: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the API key

### Step 3: Add Your API Key to .env

Replace `your-openai-api-key-here` with your actual OpenAI API key:

```env
VITE_OPENAI_API_KEY=sk-proj-...your-actual-key...
```

### Step 4: Restart Your Dev Server

After adding the API key, restart your Vite dev server:

```bash
npm run dev
```

## Alternative: Use Anthropic Claude

If you prefer to use Claude instead of GPT-4:

### Step 1: Install Anthropic SDK

```bash
npm install @ai-sdk/anthropic
```

### Step 2: Add API Key to .env

```env
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### Step 3: Update agentExecutor.js

In `src/services/agentExecutor.js`:

1. Import Anthropic:
```javascript
import { anthropic } from '@ai-sdk/anthropic';
```

2. Replace the model in `processAgentCommand`:
```javascript
// Replace this line:
model: openai('gpt-4-turbo'),

// With this:
model: anthropic('claude-3-5-sonnet-20241022'),
```

3. Update the API key check:
```javascript
// Replace:
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// With:
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

## Security Notes

⚠️ **IMPORTANT:** The current setup exposes API keys in the frontend, which is **ONLY FOR DEVELOPMENT**.

### For Production:

**Option 1: Backend Proxy (Recommended)**

Create a backend API endpoint that handles LLM calls:

```javascript
// Backend (Node.js/Express/Next.js API Route)
app.post('/api/agent/execute', async (req, res) => {
  const { command, shapes } = req.body;
  
  // Validate user authentication
  // Rate limit requests
  
  const result = await processAgentCommand(command, shapes);
  res.json(result);
});
```

**Option 2: Vercel Edge Functions**

Deploy your LLM calls as serverless functions on Vercel.

**Option 3: Firebase Functions**

Use Firebase Cloud Functions to proxy LLM calls.

## Supported AI Models

The Vercel AI SDK supports many providers:

- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google**: Gemini Pro, Gemini Pro Vision
- **Mistral**: Mistral Large, Mistral Medium, Mistral Small
- **Cohere**: Command, Command Light
- And many more!

See the [Vercel AI SDK documentation](https://sdk.vercel.ai/providers/ai-sdk-providers) for a complete list.

## Testing the AI Agent

Once your API key is configured:

1. Open the CollabCanvas app
2. Click the "AI Agent" button in the bottom-right corner
3. Try these test commands:
   - "Create a red circle"
   - "Create a 3x3 grid of blue squares"
   - "Move all red shapes 50 pixels to the right"
   - "Change all circles to green"
   - "Delete all text shapes"

## Troubleshooting

### "OpenAI API key not configured" error

- Make sure you've created the `.env` file
- Verify the environment variable is named exactly `VITE_OPENAI_API_KEY`
- Restart your dev server after adding the `.env` file
- Check that the API key is valid

### Commands not working

- Check the browser console for errors
- Verify your API key has credits/quota remaining
- Try simpler commands first (e.g., "create a red circle")
- Make sure you're authenticated in the app

### API rate limits

If you're hitting rate limits:
- Reduce the number of requests
- Upgrade your OpenAI account
- Implement a backend proxy with request queuing

## Cost Considerations

Using the AI Agent incurs API costs from OpenAI or your chosen provider:

- **GPT-4 Turbo**: ~$0.01 per request (varies by token usage)
- **GPT-3.5 Turbo**: ~$0.001 per request (cheaper alternative)
- **Claude 3.5 Sonnet**: Similar pricing to GPT-4

Tips to reduce costs:
- Use GPT-3.5 instead of GPT-4 for simpler tasks
- Implement caching for common queries
- Set up usage limits in your provider dashboard
- Use a backend proxy with rate limiting

---

For more information, see:
- [AI_AGENT_ARCHITECTURE.md](./AI_AGENT_ARCHITECTURE.md) - Architecture overview
- [AI_AGENT_SETUP.md](./AI_AGENT_SETUP.md) - Detailed setup guide
- [src/services/AI_AGENT_GUIDE.md](./src/services/AI_AGENT_GUIDE.md) - API documentation

