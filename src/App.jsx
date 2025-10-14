import { useState, useEffect } from 'react';
import { onAuthStateChanged, logout } from './services/auth';
import { cleanupCursor } from './services/cursors';
import { cleanupPresence } from './services/presence';
import AuthForm from './components/AuthForm';
import Canvas from './components/Canvas';
import PresencePanel from './components/PresencePanel';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      // Clean up cursor and presence data BEFORE signing out
      // This ensures getUserId() still returns the user's ID during cleanup
      await Promise.all([
        cleanupCursor(),
        cleanupPresence()
      ]);
      
      // Now sign out
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth form if user is not authenticated
  if (!user) {
    return <AuthForm />;
  }

  // User is authenticated - show main app
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>CollabCanvas</h1>
        <div className="user-info">
          <span className="username">👤 {user.displayName}</span>
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        </div>
      </header>
      <div className="app-content">
        <main className="app-main">
          <Canvas />
        </main>
        <PresencePanel />
      </div>
    </div>
  );
}

export default App
