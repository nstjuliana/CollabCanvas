# AI Agent Architecture

## 📁 New Files Created

```
CollabCanvas/
├── AI_AGENT_SETUP.md              ← Setup guide & quick start
├── src/
│   ├── services/
│   │   ├── agentActions.js        ← Core atomic functions (15 functions)
│   │   ├── agentExecutor.js       ← LLM integration & tool definitions
│   │   └── AI_AGENT_GUIDE.md      ← Complete API documentation
│   ├── hooks/
│   │   └── useAgentActions.js     ← React hook wrapper
│   └── components/
│       ├── AIAgentPanel.jsx       ← Beautiful chat UI
│       └── AIAgentPanel.css       ← Styling
```

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         AIAgentPanel.jsx (Chat UI)                  │    │
│  │  • Text input for commands                          │    │
│  │  • Command history                                  │    │
│  │  • Example commands                                 │    │
│  │  • Collapsible panel                                │    │
│  └─────────────────┬───────────────────────────────────┘    │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   AGENT ORCHESTRATION                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │      agentExecutor.js                               │    │
│  │  • processAgentCommand()                            │    │
│  │  • executeFunctionCall()                            │    │
│  │  • AGENT_TOOLS definitions                          │    │
│  └──────────┬──────────────────────────┬───────────────┘    │
└─────────────┼──────────────────────────┼────────────────────┘
              │                          │
              ▼                          ▼
    ┌─────────────────┐       ┌──────────────────┐
    │   LLM API       │       │  agentActions.js  │
    │ (OpenAI/Claude) │       │  (15 functions)   │
    │                 │       │                   │
    │ • Understands   │       │ Query Functions:  │
    │   natural lang  │       │  • findShapes     │
    │ • Returns       │       │  • getAllShapes   │
    │   function      │       │                   │
    │   calls         │       │ Create Functions: │
    └─────────────────┘       │  • createShape    │
                              │  • createGrid     │
                              │                   │
                              │ Delete Functions: │
                              │  • deleteShape    │
                              │  • deleteByCrit.  │
                              │                   │
                              │ Move Functions:   │
                              │  • moveShapeTo    │
                              │  • moveShapeBy    │
                              │                   │
                              │ Modify Functions: │
                              │  • changeColor    │
                              │  • resizeShape    │
                              │  • rotateShape    │
                              └─────────┬─────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   shapes.js      │
                              │ (Existing CRUD)  │
                              │                  │
                              │ • createShape    │
                              │ • updateShape    │
                              │ • deleteShape    │
                              │ • lockShape      │
                              └─────────┬────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   Firebase       │
                              │  • Firestore     │
                              │  • Real-time DB  │
                              └──────────────────┘
```

## 🔄 Command Flow Example

**User Command:** "Select the red square on the left and move it 10px to the right"

```
1. User types command in AIAgentPanel
   │
2. processAgentCommand() sends to LLM with tool definitions
   │
3. LLM analyzes command and returns function calls:
   │  Call #1: findShapes({ type: 'rectangle', color: 'red', position: 'leftmost' })
   │  Call #2: moveShapeBy(shapeId, 10, 0)
   │
4. executeFunctionCall() executes each call:
   │  → findShapes() queries current shapes state
   │  → Returns: [{ id: 'abc123', x: 100, y: 200, ... }]
   │  
   │  → moveShapeBy('abc123', 10, 0) calculates new position
   │  → Calls updateShape() in shapes.js
   │  → Updates Firestore
   │
5. Firestore broadcasts update to all connected clients
   │
6. Canvas re-renders with updated shape position
   │
7. User sees result + success message in AIAgentPanel
```

## 🧩 Function Categories

### Query Functions (Read-only)
```javascript
getAllShapes()                  // Get all shapes
findShapes(criteria)            // Find by type/color/position
getShapeInfo(shapeId)          // Get single shape details
```

### Create Functions
```javascript
createShape(type, x, y, props)                 // Single shape
createMultipleShapes(shapesArray)              // Multiple shapes
createGrid(type, rows, cols, x, y, spacing)    // Shape grid
```

### Delete Functions
```javascript
deleteShape(shapeId)                   // Delete by ID
deleteMultipleShapes(shapeIds)         // Delete multiple
deleteShapesByCriteria(criteria)       // Delete by search
```

### Move Functions
```javascript
moveShapeTo(shapeId, x, y)                    // Absolute position
moveShapeBy(shapeId, deltaX, deltaY)          // Relative movement
moveMultipleShapesBy(shapeIds, dx, dy)        // Move multiple
```

### Modify Functions
```javascript
changeShapeColor(shapeId, color)              // Change color
changeMultipleShapesColor(shapeIds, color)    // Change multiple
resizeShape(shapeId, width, height)           // Resize
rotateShape(shapeId, degrees)                 // Rotate
changeText(shapeId, text)                     // Change text content
```

## 🎯 Design Principles

### 1. Atomic Operations
Each function does ONE thing well. The LLM composes them into complex actions.

### 2. Intelligent Query System
`findShapes()` supports flexible criteria:
- **Type**: 'rectangle', 'circle', 'text', 'square'
- **Color**: 'red', 'blue', '#FF6B6B' (fuzzy matching)
- **Position**: 'leftmost', 'rightmost', 'topmost', 'bottommost'
- **Text**: Search text content

### 3. Batch Operations
Efficient operations on multiple shapes at once.

### 4. Consistent API
All async operations return Promises. All functions have clear JSDoc.

## 🔧 Integration Points

### Existing Systems
The AI agent integrates cleanly with your existing architecture:

✅ **Uses existing services**: Built on top of `shapes.js`  
✅ **Works with hooks**: Uses `useShapes` data via `useAgentActions`  
✅ **Respects permissions**: Uses existing auth and locking  
✅ **Real-time sync**: All changes go through Firestore  
✅ **Multi-user safe**: Honors shape locks  

### New Capabilities
Adds these new capabilities without breaking anything:

✨ **Natural language**: Convert text commands to actions  
✨ **Smart querying**: Find shapes by description  
✨ **Batch operations**: Create/modify/delete multiple shapes  
✨ **Complex commands**: Multi-step operations in one command  

## 📊 Complexity Analysis

### What the LLM Handles:
- Natural language understanding
- Breaking complex commands into steps
- Choosing the right functions
- Handling ambiguity
- Error recovery

### What Your Code Handles:
- Atomic shape operations
- Shape querying and filtering
- Position calculations
- Firebase synchronization
- Permission checking

### Result:
✅ **Clean separation of concerns**  
✅ **Easy to maintain**  
✅ **Easy to extend**  
✅ **Transparent execution**  

## 🚀 Ready to Use

Everything is implemented and ready. Just need to:

1. **Add AIAgentPanel to Canvas component** (1 line of code)
2. **Choose and configure LLM provider** (OpenAI/Anthropic/other)
3. **Test with example commands**

See `AI_AGENT_SETUP.md` for step-by-step instructions!

## 🎨 UI Preview

The AIAgentPanel provides:
- 💬 Chat-style interface
- 🎯 Example commands for quick start
- 📜 Command history
- ✅ Success/error feedback
- 🔄 Real-time execution status
- 📱 Responsive design
- 🎨 Beautiful gradient styling

Collapsible button in bottom-right corner when not in use.

## 📈 Extensibility

To add new capabilities:

1. Add function to `agentActions.js`
2. Export from `useAgentActions.js`
3. Add tool definition to `AGENT_TOOLS`
4. Add case to `executeFunctionCall()`

That's it! The LLM will automatically learn to use it.

---

**Your canvas app is now AI-ready! 🎉**


