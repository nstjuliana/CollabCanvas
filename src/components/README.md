# Components Module

This module contains all React components for CollabCanvas.

## Files

### AuthForm.jsx
Full-featured authentication form component.

**Features:**
- Toggle between login and signup modes
- Email and password validation
- Confirm password for signup
- Real-time error display
- Loading states with spinner
- Modern, responsive design
- Dark mode support
- Animated background
- User-friendly error messages

**Props:**
None - component manages its own state

**Usage:**
```jsx
import AuthForm from './components/AuthForm';

function App() {
  return <AuthForm />;
}
```

**States:**
- `isLogin` - Toggle between login/signup mode
- `email` - User email input
- `password` - User password input
- `confirmPassword` - Password confirmation (signup only)
- `error` - Error message to display
- `loading` - Loading state during authentication

**Validation:**
- Email format validation
- Password minimum length (6 characters)
- Password confirmation match (signup)
- Empty field checks

**Integration:**
- Uses `signup()` and `login()` from `services/auth.js`
- Uses `isValidEmail()` from `utils/helpers.js`
- Uses constants from `utils/constants.js`
- Automatic redirect on successful auth via `onAuthStateChanged`

## Component Architecture

### Authentication Flow

1. **User lands on app**
   - App.jsx checks auth state via `onAuthStateChanged`
   - If not authenticated → shows AuthForm

2. **User interacts with AuthForm**
   - Toggles between login/signup
   - Enters credentials
   - Validates input
   - Submits form

3. **Authentication process**
   - AuthForm calls `login()` or `signup()`
   - Auth service handles Firebase authentication
   - On success: Firebase updates auth state
   - On error: Shows user-friendly error message

4. **Auto-redirect**
   - App.jsx's `onAuthStateChanged` detects auth change
   - Updates `user` state
   - Re-renders to show authenticated view

### App.jsx States

**Loading State:**
```jsx
if (loading) {
  return <div className="app-loading">...</div>;
}
```

**Unauthenticated State:**
```jsx
if (!user) {
  return <AuthForm />;
}
```

**Authenticated State:**
```jsx
return (
  <div className="app-container">
    <header>...</header>
    <main>Canvas will go here</main>
  </div>
);
```

## Styling

### AuthForm.css
- Gradient background with animated shapes
- Card-based form design
- Tab-based mode switching
- Focus states and transitions
- Loading spinner animation
- Error shake animation
- Responsive breakpoints
- Dark mode support

### App.css
- Header with user info and logout
- Loading spinner
- Canvas placeholder (temporary)
- Responsive layout
- Dark mode support

## Future Components

Components to be implemented in later tasks:
- `Canvas.jsx` - Main canvas component
- `Shape.jsx` - Individual shape rendering
- `Cursor.jsx` - Multiplayer cursor display
- `PresencePanel.jsx` - Online users panel

## Testing the Authentication

1. **Start dev server**: `npm run dev`
2. **Open browser**: `http://localhost:5173`
3. **Test signup**:
   - Click "Sign Up" tab
   - Enter email: `test@example.com`
   - Enter password: `password123`
   - Confirm password: `password123`
   - Click "Sign Up"
4. **Verify authentication**:
   - Should see welcome message with username
   - Header shows username and logout button
5. **Test logout**:
   - Click "Log Out" button
   - Should return to AuthForm
6. **Test login**:
   - Click "Log In" tab
   - Enter same credentials
   - Should log in successfully

## Error Scenarios

The AuthForm handles these error cases:
- Empty email or password
- Invalid email format
- Password too short (< 6 chars)
- Passwords don't match (signup)
- Email already in use
- User not found
- Wrong password
- Network errors
- Firebase configuration errors

All errors display user-friendly messages in the error banner.

