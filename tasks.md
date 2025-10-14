# CollabCanvas MVP - Task List

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Canvas.jsx
│   │   ├── Shape.jsx
│   │   ├── Cursor.jsx
│   │   ├── PresencePanel.jsx
│   │   └── AuthForm.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   ├── shapes.js
│   │   ├── cursors.js
│   │   └── presence.js
│   ├── hooks/
│   │   ├── useCanvas.js
│   │   ├── useShapes.js
│   │   ├── useCursors.js
│   │   └── usePresence.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── firebase.json
```

---

## Task Checklist

### Phase 1: Project Setup & Infrastructure

- [x] **Task 1: Initialize React project and install dependencies**
  - **Files Created:**
    - `package.json`
    - `public/index.html`
    - `src/index.js`
    - `src/App.jsx`
    - `src/index.css`
    - `.gitignore`
    - `README.md`
  - **Description:** Create React app, install Firebase SDK, Konva.js, and React-Konva

- [x] **Task 2: Configure Firebase project and environment variables**
  - **Files Created:**
    - `src/services/firebase.js`
    - `.env.example`
    - `firebase.json`
    - `firestore.rules`
    - `firestore.indexes.json`
    - `database.rules.json`
    - `FIREBASE_SETUP.md`
  - **Description:** Set up Firebase project (single global canvas), initialize Firestore, Realtime Database, and Auth. Configure environment variables. Firestore path: `/shapes/{shapeId}`, RTDB paths: `/cursors/{userId}`, `/presence/{userId}`

- [x] **Task 3: Set up project constants and utilities**
  - **Files Created:**
    - `src/utils/constants.js`
    - `src/utils/helpers.js`
  - **Description:** Define canvas dimensions (5000x5000), colors, shape defaults, and helper functions

---

### Phase 2: Authentication

- [x] **Task 4: Implement authentication service layer**
  - **Files Created:**
    - `src/services/auth.js`
  - **Description:** Create auth functions: signup, login, logout, getCurrentUser, onAuthStateChanged

- [x] **Task 5: Build authentication UI components**
  - **Files Created:**
    - `src/components/AuthForm.jsx`
    - `src/components/AuthForm.css`
    - `src/App.css`
  - **Files Updated:**
    - `src/App.jsx`
  - **Description:** Create login/signup form with email/password. Require authentication before accessing canvas. Handle auth state in App

---

### Phase 3: Canvas Infrastructure

- [x] **Task 6: Create basic canvas component with pan and zoom**
  - **Files Created:**
    - `src/components/Canvas.jsx`
    - `src/components/Canvas.css`
    - `src/hooks/useCanvas.js`
  - **Files Updated:**
    - `src/App.jsx`
  - **Description:** Implement Konva Stage with 5000x5000 workspace, mouse-based pan (drag), and zoom (wheel)

- [x] **Task 7: Implement shape rendering component**
  - **Files Created:**
    - `src/components/Shape.jsx`
  - **Files Updated:**
    - `src/components/Canvas.jsx`
  - **Description:** Create reusable Shape component that renders rectangles (or chosen shape type) with Konva

---

### Phase 4: Shape Creation & Manipulation

- [x] **Task 8: Build shape service layer for Firestore**
  - **Files Created:**
    - `src/services/shapes.js`
    - `src/hooks/useShapes.js`
  - **Description:** Create CRUD functions: createShape, updateShape, deleteShape, subscribeToShapes, lockShape, unlockShape. All shapes stored in global `/shapes/{shapeId}` collection

- [x] **Task 9: Implement shape creation on canvas**
  - **Files Updated:**
    - `src/components/Canvas.jsx`
    - `src/components/Canvas.css`
  - **Description:** Add click-to-create or drag-to-create shape functionality, save to Firestore

- [x] **Task 10: Implement shape dragging and position updates**
  - **Files Updated:**
    - `src/components/Shape.jsx`
    - `src/services/shapes.js`
    - `src/components/Canvas.jsx`
    - `src/hooks/useShapes.js`
  - **Description:** Enable drag interaction on shapes, update position in Firestore on dragEnd

---

### Phase 5: Real-Time Synchronization & Object Locking

- [x] **Task 11: Set up real-time shape sync from Firestore**
  - **Files Updated:**
    - `src/hooks/useShapes.js`
    - `src/components/Canvas.jsx`
    - `src/services/shapes.js`
  - **Description:** Subscribe to Firestore changes, update local state when other users create/modify shapes

- [x] **Task 12: Implement object locking for concurrent edits**
  - **Files Updated:**
    - `src/services/shapes.js`
    - `src/components/Shape.jsx`
    - `src/hooks/useShapes.js`
  - **Description:** Add `lockedBy` field to shapes. On dragStart, lock shape to current user. On dragEnd, unlock. Prevent other users from dragging locked shapes. First user to interact gets priority

- [x] **Task 13: Manual testing of multi-user synchronization**
  - **Files Updated:**
    - (Bug fixes as needed)
  - **Description:** Test with multiple browser tabs/windows. Verify shape creation, movement, and locking work correctly across users

---

### Phase 6: Multiplayer Cursors

- [x] **Task 14: Build cursor service layer for Realtime Database**
  - **Files Created:**
    - `src/services/cursors.js`
    - `src/hooks/useCursors.js`
  - **Description:** Create functions to publish cursor position to `/cursors/{userId}` and subscribe to other users' cursors

- [x] **Task 15: Implement cursor component and rendering**
  - **Files Created:**
    - `src/components/Cursor.jsx`
  - **Files Updated:**
    - `src/components/Canvas.jsx`
    - `src/components/Canvas.css`
  - **Description:** Display cursor position with username label for each connected user

- [x] **Task 16: Add cursor position updates on mouse move**
  - **Files Updated:**
    - `src/components/Canvas.jsx`
    - `src/services/cursors.js`
  - **Description:** Publish cursor position to Realtime Database on mouse move

---

### Phase 7: Presence Awareness

- [x] **Task 17: Build presence service layer**
  - **Files Created:**
    - `src/services/presence.js`
    - `src/hooks/usePresence.js`
  - **Description:** Track online/offline status at `/presence/{userId}` using Firebase Realtime Database presence system

- [x] **Task 18: Create presence panel UI component**
  - **Files Created:**
    - `src/components/PresencePanel.jsx`
    - `src/components/PresencePanel.css`
  - **Files Updated:**
    - `src/App.jsx`
    - `src/App.css`
  - **Description:** Display list of currently online users with visual indicators

- [x] **Task 19: Connect presence to auth and cleanup on disconnect**
  - **Files Updated:**
    - `src/services/presence.js`
    - `src/hooks/usePresence.js`
    - `src/App.jsx`
  - **Description:** Set user online on login, handle disconnection, clean up presence data

---

### Phase 8: State Persistence & Polish

- [x] **Task 20: Implement canvas state persistence on load**
  - **Files Updated:**
    - `src/hooks/useShapes.js`
    - `src/components/Canvas.jsx`
  - **Description:** Load all shapes from global Firestore collection when canvas mounts, handle loading states

- [x] **Task 21: Add reconnection handling and error states**
  - **Files Updated:**
    - `src/services/firebase.js`
    - `src/App.jsx`
    - `src/App.css`
    - `src/utils/helpers.js`
  - **Description:** Handle Firebase connection errors, show user feedback for offline/reconnecting states. Added connection monitoring, offline banner, and reconnection toast notifications.

- [ ] **Task 22: Polish UI/UX and add basic styling**
  - **Files Updated:**
    - `src/index.css`
    - `src/components/Canvas.jsx`
    - `src/components/PresencePanel.jsx`
    - `src/components/AuthForm.jsx`
  - **Description:** Improve visual design, add loading indicators, error messages, and responsive layout

---

### Phase 9: Deployment

- [ ] **Task 23: Configure deployment settings for Vercel/Firebase Hosting**
  - **Files Created:**
    - `vercel.json` (if using Vercel)
  - **Files Updated:**
    - `firebase.json` (if using Firebase Hosting)
    - `README.md`
  - **Description:** Set up build configuration, environment variables for production

- [ ] **Task 24: Deploy to production and test with public URL**
  - **Files Updated:**
    - `README.md`
  - **Description:** Deploy application, verify authentication works, test with 2+ users from different locations accessing the same global canvas

- [ ] **Task 25: Final manual testing and bug fixes**
  - **Files Updated:**
    - (Various files as needed for bug fixes)
  - **Description:** Multi-user testing in separate browser tabs/windows. Verify: cursor sync, shape creation/movement, object locking, presence indicators, state persistence. Fix any critical bugs

---

## Task Summary

**Total Tasks:** 25
**Testing Approach:** Manual testing in multiple browser tabs/windows

### Task Breakdown by Phase:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Auth): 2 tasks
- Phase 3 (Canvas): 2 tasks
- Phase 4 (Shapes): 3 tasks
- Phase 5 (Sync & Locking): 3 tasks
- Phase 6 (Cursors): 3 tasks
- Phase 7 (Presence): 3 tasks
- Phase 8 (Polish): 3 tasks
- Phase 9 (Deploy): 3 tasks

### Critical Path:
1. Setup → Auth → Canvas → Shapes → Real-time Sync → Object Locking → Cursors → Presence → Deploy

### Key Implementation Notes:
- **Single Global Canvas:** All users access the same `/shapes` collection
- **Object Locking:** First user to drag a shape locks it; others cannot edit until released
- **Manual Testing:** Use multiple browser tabs/windows to verify real-time features
- **No Performance Optimization:** Focus on functionality for MVP

### Parallel Work Opportunities:
- Tasks 14-16 (Cursors) can be worked on after Task 11 (Real-time sync) is complete
- Tasks 17-19 (Presence) can be worked on in parallel with cursor implementation