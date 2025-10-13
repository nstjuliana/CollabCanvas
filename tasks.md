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
│   │   ├── __tests__/
│   │   │   ├── firebase.test.js
│   │   │   ├── auth.test.js
│   │   │   ├── shapes.test.js
│   │   │   ├── cursors.test.js
│   │   │   └── presence.test.js
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
│   ├── __tests__/
│   │   └── integration/
│   │       ├── shapeSync.test.js
│   │       └── statePersistence.test.js
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

- [ ] **Task 1: Initialize React project and install dependencies**
  - **Files Created:**
    - `package.json`
    - `public/index.html`
    - `src/index.js`
    - `src/App.jsx`
    - `src/index.css`
    - `.gitignore`
    - `README.md`
  - **Description:** Create React app, install Firebase SDK, Konva.js, and React-Konva

- [ ] **Task 2: Set up testing infrastructure**
  - **Files Created:**
    - `jest.config.js`
    - `setupTests.js`
  - **Files Updated:**
    - `package.json`
    - `firebase.json`
  - **Description:** Install Jest, React Testing Library, Firebase testing utilities, and configure Firebase Emulator Suite. Add test scripts to package.json

- [ ] **Task 3: Configure Firebase project and environment variables**
  - **Files Created:**
    - `src/services/firebase.js`
    - `.env.example`
    - `firebase.json`
    - `src/services/__tests__/firebase.test.js`
  - **Description:** Set up Firebase project, initialize Firestore, Realtime Database, and Auth. Configure environment variables
  - **Test:** Unit test to verify Firebase initialization and config validation

- [ ] **Task 4: Set up project constants and utilities**
  - **Files Created:**
    - `src/utils/constants.js`
    - `src/utils/helpers.js`
  - **Description:** Define canvas dimensions (5000x5000), colors, shape defaults, and helper functions

---

### Phase 2: Authentication

- [ ] **Task 5: Implement authentication service layer**
  - **Files Created:**
    - `src/services/auth.js`
    - `src/services/__tests__/auth.test.js`
  - **Description:** Create auth functions: signup, login, logout, getCurrentUser, onAuthStateChanged
  - **Test:** Unit tests for auth service functions with mocked Firebase Auth

- [ ] **Task 6: Build authentication UI components**
  - **Files Created:**
    - `src/components/AuthForm.jsx`
  - **Files Updated:**
    - `src/App.jsx`
  - **Description:** Create login/signup form with email/password, handle auth state in App

---

### Phase 3: Canvas Infrastructure

- [ ] **Task 7: Create basic canvas component with pan and zoom**
  - **Files Created:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useCanvas.js`
  - **Files Updated:**
    - `src/App.jsx`
  - **Description:** Implement Konva Stage with 5000x5000 workspace, mouse-based pan (drag), and zoom (wheel)

- [ ] **Task 8: Implement shape rendering component**
  - **Files Created:**
    - `src/components/Shape.jsx`
  - **Files Updated:**
    - `src/components/Canvas.jsx`
  - **Description:** Create reusable Shape component that renders rectangles (or chosen shape type) with Konva

---

### Phase 4: Shape Creation & Manipulation

- [ ] **Task 9: Build shape service layer for Firestore**
  - **Files Created:**
    - `src/services/shapes.js`
    - `src/hooks/useShapes.js`
    - `src/services/__tests__/shapes.test.js`
  - **Description:** Create CRUD functions: createShape, updateShape, deleteShape, subscribeToShapes
  - **Test:** Unit tests for shape CRUD operations with mocked Firestore

- [ ] **Task 10: Implement shape creation on canvas**
  - **Files Updated:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useShapes.js`
  - **Description:** Add click-to-create or drag-to-create shape functionality, save to Firestore

- [ ] **Task 11: Implement shape dragging and position updates**
  - **Files Updated:**
    - `src/components/Shape.jsx`
    - `src/services/shapes.js`
  - **Description:** Enable drag interaction on shapes, update position in Firestore on dragEnd

---

### Phase 5: Real-Time Synchronization

- [ ] **Task 12: Set up real-time shape sync from Firestore**
  - **Files Updated:**
    - `src/hooks/useShapes.js`
    - `src/components/Canvas.jsx`
  - **Description:** Subscribe to Firestore changes, update local state when other users create/modify shapes

- [ ] **Task 13: Test and debug multi-user shape synchronization**
  - **Files Created:**
    - `src/__tests__/integration/shapeSync.test.js`
  - **Files Updated:**
    - `src/services/shapes.js`
    - `src/components/Canvas.jsx`
  - **Description:** Test with multiple browser windows, fix race conditions, ensure last-write-wins behavior
  - **Test:** Integration test simulating multiple users creating and updating shapes concurrently

---

### Phase 6: Multiplayer Cursors

- [ ] **Task 14: Build cursor service layer for Realtime Database**
  - **Files Created:**
    - `src/services/cursors.js`
    - `src/hooks/useCursors.js`
    - `src/services/__tests__/cursors.test.js`
  - **Description:** Create functions to publish cursor position and subscribe to other users' cursors
  - **Test:** Unit tests for cursor publishing and subscription with mocked Realtime Database

- [ ] **Task 15: Implement cursor component and rendering**
  - **Files Created:**
    - `src/components/Cursor.jsx`
  - **Files Updated:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useCursors.js`
  - **Description:** Display cursor position with username label for each connected user

- [ ] **Task 16: Add cursor position updates on mouse move**
  - **Files Updated:**
    - `src/components/Canvas.jsx`
    - `src/services/cursors.js`
  - **Description:** Throttle mouse move events and publish to Realtime Database

---

### Phase 7: Presence Awareness

- [ ] **Task 17: Build presence service layer**
  - **Files Created:**
    - `src/services/presence.js`
    - `src/hooks/usePresence.js`
    - `src/services/__tests__/presence.test.js`
  - **Description:** Track online/offline status using Firebase Realtime Database presence system
  - **Test:** Unit tests for presence tracking with mocked Realtime Database

- [ ] **Task 18: Create presence panel UI component**
  - **Files Created:**
    - `src/components/PresencePanel.jsx`
  - **Files Updated:**
    - `src/App.jsx`
  - **Description:** Display list of currently online users with visual indicators

- [ ] **Task 19: Connect presence to auth and cleanup on disconnect**
  - **Files Updated:**
    - `src/services/presence.js`
    - `src/App.jsx`
  - **Description:** Set user online on login, handle disconnection, clean up presence data

---

### Phase 8: State Persistence & Polish

- [ ] **Task 20: Implement canvas state persistence on load**
  - **Files Created:**
    - `src/__tests__/integration/statePersistence.test.js`
  - **Files Updated:**
    - `src/hooks/useShapes.js`
    - `src/components/Canvas.jsx`
  - **Description:** Load all shapes from Firestore when canvas mounts, handle loading states
  - **Test:** Integration test verifying shapes persist and reload correctly after page refresh

- [ ] **Task 21: Add reconnection handling and error states**
  - **Files Updated:**
    - `src/services/firebase.js`
    - `src/App.jsx`
  - **Description:** Handle Firebase connection errors, show user feedback for offline/reconnecting states

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
  - **Description:** Deploy application, verify authentication works, test with 2+ users from different locations

- [ ] **Task 25: Final testing and bug fixes**
  - **Files Updated:**
    - (Various files as needed for bug fixes)
  - **Description:** Multi-user stress test, fix any critical bugs, verify all MVP requirements met

---

## Task Summary

**Total Tasks:** 25
**Estimated PRs:** 25

### Task Breakdown by Phase:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Auth): 2 tasks
- Phase 3 (Canvas): 2 tasks
- Phase 4 (Shapes): 3 tasks
- Phase 5 (Sync): 2 tasks
- Phase 6 (Cursors): 3 tasks
- Phase 7 (Presence): 3 tasks
- Phase 8 (Polish): 3 tasks
- Phase 9 (Deploy): 3 tasks

### Critical Path:
1. Setup → Auth → Canvas → Shapes → Real-time Sync → Cursors → Presence → Deploy

### Parallel Work Opportunities:
- Tasks 14-16 (Cursors) can be worked on after Task 12 (Real-time sync) is complete
- Tasks 17-19 (Presence) can be worked on in parallel with cursor implementation
- Task 2 (Testing infrastructure) must be completed before any test-related tasks