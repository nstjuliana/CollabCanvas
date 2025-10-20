# CollabCanvas

A real-time collaborative design tool that enables multiple users to work together on a shared canvas with AI-powered assistance.

## ✨ Features

### 🎨 Real-Time Collaboration
- **Live Cursors**: See where your teammates are working with real-time cursor positions and user labels
- **Instant Synchronization**: All shape creations, movements, and modifications sync immediately across all users
- **Presence Awareness**: Visual indicators showing who's currently online and collaborating
- **Smart Locking**: Automatic shape locking prevents concurrent edits—first user to interact gets priority

### 🖼️ Canvas & Shapes
- **Infinite Canvas**: 5,000 x 5,000 pixel workspace with smooth pan and zoom capabilities
- **Multiple Shape Types**: Create and manipulate rectangles, circles, lines, arrows, and text
- **Image Upload**: Drag and drop or paste images directly onto the canvas
- **Multi-Selection**: Select and manipulate multiple shapes at once
- **Property Editing**: Adjust colors, sizes, opacity, and other properties in real-time

### 🤖 AI Agent
- **Natural Language Commands**: Control the canvas using plain English (e.g., "create a red circle")
- **Smart Shape Creation**: AI understands context and creates shapes with appropriate properties
- **Bulk Operations**: Perform complex multi-shape operations with simple commands
- **Streaming Responses**: Real-time feedback as the AI processes your requests

### ⌨️ Developer Experience
- **Keyboard Shortcuts**: Efficient workflow with comprehensive keyboard shortcuts
- **Undo/Redo**: Full undo/redo support for all canvas operations
- **Persistent State**: Canvas state automatically saves and restores across sessions
- **Graceful Reconnection**: Seamlessly handles network interruptions

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI component library
- **Vite** - Lightning-fast build tool and dev server
- **Konva.js** - High-performance HTML5 canvas rendering
- **React-Konva** - React wrapper for Konva

### Backend & Real-Time
- **Firebase Authentication** - Secure user authentication
- **Cloud Firestore** - Persistent canvas state storage
- **Firebase Realtime Database** - Low-latency cursor and presence tracking
- **Firebase Storage** - Image uploads and storage

### AI Integration
- **Vercel AI SDK** - AI agent orchestration
- **OpenAI GPT-4** - Natural language processing and command interpretation
- **Zod** - Schema validation for AI responses

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Authentication, Firestore, Realtime Database, and Storage enabled
- OpenAI API key (for AI agent features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nstjuliana/collabcanvas.git
   cd collabcanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Deploy Firebase rules**
   ```bash
   firebase deploy --only firestore:rules,database:rules,storage:rules
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📖 Usage

### Authentication
1. Create an account or sign in using the authentication form
2. All authenticated users join the same global canvas workspace

### Creating Shapes
- **Rectangle**: Click the rectangle tool and drag on the canvas
- **Circle**: Click the circle tool and drag on the canvas
- **Line/Arrow**: Click the line/arrow tool and drag to define endpoints
- **Text**: Click the text tool and click on the canvas to add text
- **Images**: Drag and drop images or use Ctrl/Cmd+V to paste

### Manipulating Shapes
- **Move**: Click and drag shapes to reposition them
- **Multi-Select**: Hold Shift and click multiple shapes, or drag a selection box
- **Edit Properties**: Select a shape and use the properties panel to adjust colors, sizes, etc.
- **Delete**: Select shapes and press Delete or Backspace

### Canvas Navigation
- **Pan**: Click and drag on empty canvas space, or use middle mouse button
- **Zoom**: Mouse wheel, or pinch gesture on trackpad
- **Reset View**: Double-click on empty canvas space

### AI Agent
1. Click the "AI Agent" button in the toolbar
2. Type natural language commands like:
   - "Create a blue rectangle"
   - "Add a red circle next to the square"
   - "Make all shapes 50% transparent"
   - "Create a grid of 5 yellow circles"
3. Watch as the AI executes your commands in real-time

### Keyboard Shortcuts
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` - Redo
- `Delete` or `Backspace` - Delete selected shapes
- `Ctrl/Cmd + A` - Select all shapes
- `Escape` - Deselect all shapes
- `?` - Show all keyboard shortcuts

## 🏗️ Project Structure

```
CollabCanvas/
├── src/
│   ├── components/        # React components
│   │   ├── Canvas.jsx     # Main canvas component
│   │   ├── Toolbar.jsx    # Tool selection
│   │   ├── PropertiesPanel.jsx
│   │   ├── PresencePanel.jsx
│   │   └── AIAgentPanel.jsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useShapes.js   # Shape state management
│   │   ├── useCursors.js  # Cursor synchronization
│   │   ├── usePresence.js # User presence
│   │   └── useAgentActions.js
│   ├── services/          # Firebase and external services
│   │   ├── firebase.js    # Firebase configuration
│   │   ├── shapes.js      # Shape CRUD operations
│   │   ├── cursors.js     # Cursor sync
│   │   ├── presence.js    # Presence tracking
│   │   └── agentExecutor.js # AI agent logic
│   └── utils/             # Utility functions
│       ├── constants.js   # App constants
│       ├── helpers.js     # Helper functions
│       └── shapeBuilders.js # Shape creation utilities
├── public/                # Static assets
└── firebase.json          # Firebase configuration
```

## 🔧 Build & Deploy

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Live Demo](https://collab-canvas-lilac.vercel.app/)
- [Product Requirements Document](prd.md)

---

Built with ❤️ using React, Firebase, and the Vercel AI SDK
