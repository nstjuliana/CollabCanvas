# CollabCanvas MVP - Product Requirements Document

## Project Overview
CollabCanvas is a real-time collaborative design tool that enables multiple users to work together on a shared canvas. This PRD focuses exclusively on the 24-hour MVP checkpoint requirements.

**MVP Deadline:** Tuesday (24 hours from project start)

---

## User Stories

### Primary User: Designer
- As a designer, I want to **see other users' cursors in real-time** so that I know where my teammates are working
- As a designer, I want to **create basic shapes on the canvas** so that I can start building my design
- As a designer, I want to **move objects around the canvas** so that I can arrange my design elements
- As a designer, I want to **pan and zoom the canvas** so that I can navigate a large workspace
- As a designer, I want to **see changes instantly when teammates edit** so that we can collaborate without confusion
- As a designer, I want to **see who else is online** so that I know who I'm collaborating with
- As a designer, I want to **authenticate with my account** so that my work is associated with my identity

### Secondary User: Collaborator
- As a collaborator, I want to **join an existing canvas session** so that I can work with my team
- As a collaborator, I want to **see all existing shapes when I join** so that I understand the current state of the design
- As a collaborator, I want to **edit shapes created by others** so that we can build on each other's work
- As a collaborator, I want to **see who created what** so that I can coordinate with my team

### System Requirements
- As the system, I must **persist canvas state** so that work isn't lost when users disconnect
- As the system, I must **handle concurrent edits** so that multiple users can work simultaneously

---

## Key MVP Features

### 1. Canvas Infrastructure
**Priority:** Critical
- 5,000 x 5,000 pixel workspace with smooth pan capability
- Zoom in/out functionality (mouse wheel or pinch gestures)
- Tech decisions should support achieving 60 FPS performance targets in future iterations

### 2. Shape Creation & Manipulation
**Priority:** Critical
- Support for at least ONE shape type (rectangle, circle, or text)
- Click-to-create or drag-to-create shapes
- Click-and-drag to move objects
- Visual feedback during manipulation

### 3. Real-Time Synchronization
**Priority:** Critical
- WebSocket or real-time database connection
- Broadcast shape creation events
- Broadcast shape movement/modification events

### 4. Multiplayer Cursors
**Priority:** Critical
- Display cursor position for all connected users
- Show username label next to each cursor
- Distinct visual identifier per user

### 5. Presence Awareness
**Priority:** Critical
- Display list of currently online users
- Visual indicator when users join/leave
- Clear "who's here now" UI component

### 6. User Authentication
**Priority:** Critical
- User signup/login flow
- Persistent user accounts with usernames
- Associate canvas actions with authenticated users

### 7. State Persistence
**Priority:** Critical
- Save canvas state to database
- Restore canvas state on page load
- Handle graceful reconnection after disconnect

### 8. Deployment
**Priority:** Critical
- Publicly accessible URL
- Supports 2+ concurrent users minimum
- Stable hosting environment

---

## Recommended Tech Stack

### Frontend
**Framework:** React
- Fast development with component model
- Excellent real-time state management with hooks
- Large ecosystem for canvas libraries

**Canvas Library:** Konva.js
- High-performance HTML5 canvas wrapper
- Built-in shape primitives
- Smooth transformations and animations
- Good documentation

**Alternative:** Fabric.js (similar capabilities, different API)

### Backend & Real-Time Sync
**Confirmed Choice: Firebase**

**Components:**
- **Firebase Authentication** - User accounts and session management
- **Firestore** - Canvas state persistence (shapes, properties)
- **Firebase Realtime Database** - Cursor positions and presence (lower latency)

**Why Firebase for MVP:**
- Fastest time-to-market for real-time features
- Built-in authentication with minimal setup
- Real-time listeners out of the box
- Generous free tier for MVP testing
- Excellent React integration via Firebase SDK

**Architecture:**
- Firestore for durable state (shapes persist after refresh)
- Realtime Database for ephemeral state (cursors, presence indicators)
- Firebase Auth for user identity management

### Deployment
**Frontend:** Vercel or Netlify
**Backend (if custom):** Render or Railway

---

## Potential Pitfalls & Considerations

### Firebase-Specific
- **Rate Limits:** Free tier has read/write limits; may need to throttle cursor updates
- **Cost:** Real-time operations can get expensive at scale; budget accordingly
- **Data Structure:** Firestore document size limits (1MB); design schema carefully
- **Latency:** Firestore has ~100-200ms latency; use Realtime Database for cursors

### Real-Time Sync Challenges
- **Network Issues:** Test with throttled connections; implement reconnection logic
- **Race Conditions:** Multiple users editing same object needs clear "last write wins" logic
- **Cursor Flooding:** Throttle cursor position updates to avoid overwhelming the network
- **State Bloat:** Old cursor positions must be cleaned up when users disconnect

### Canvas Performance
- **Object Count:** Even with 60 FPS target, test with 100+ objects to ensure headroom
- **Re-render Optimization:** Only redraw changed objects, not entire canvas
- **Memory Leaks:** Event listeners and WebSocket connections must be cleaned up

### Authentication
- **Session Management:** Ensure users stay authenticated across page refreshes
- **Anonymous Users:** Decide if you allow anonymous access or require signup
- **User Cleanup:** Remove disconnected users from presence list

### Deployment
- **Environment Variables:** API keys must be properly configured for production
- **HTTPS Required:** WebSockets often require secure connections
- **CORS Issues:** Ensure frontend can communicate with backend across domains

### Time Management (24-Hour MVP)
- **Scope Creep:** Resist adding features beyond requirements
- **Perfect vs Done:** A working multiplayer canvas with basic shapes beats a beautiful canvas with broken sync
- **Testing Time:** Reserve final 4 hours for multi-user testing and bug fixes

---

## Success Criteria

The MVP passes if:
1. ✅ Two users can see each other's cursors with names in real-time
2. ✅ Creating a shape appears instantly for all users
3. ✅ Moving a shape updates for all users within 100ms
4. ✅ Users can pan and zoom smoothly at 60 FPS
5. ✅ Canvas state persists after refresh
6. ✅ Users must authenticate with accounts
7. ✅ Application is deployed and publicly accessible
8. ✅ Presence indicator shows who's online

---

## Next Steps After MVP
1. Add remaining shape types (circles, text, lines)
2. Implement selection and multi-select
3. Add transformation tools (resize, rotate)
4. Build layer management
5. Begin AI agent integration (Phase 2)