import { useState, useEffect } from 'react';
import { onAuthStateChanged, logout } from './services/auth';
import { onConnectionStateChange } from './services/firebase';
import { cleanupCursor } from './services/cursors';
import { cleanupPresence } from './services/presence';
import usePresence from './hooks/usePresence';
import AuthForm from './components/AuthForm';
import Canvas from './components/Canvas';
import PresencePanel from './components/PresencePanel';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  
  // Get presence data for mobile header
  const { onlineUsers, onlineUserCount } = usePresence();
  
  // Filter out current user from avatars (they see their own username already)
  const otherUsers = user ? onlineUsers.filter(u => u.userId !== user.uid) : onlineUsers;
  const otherUserCount = otherUsers.length;

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Monitor Firebase connection status
  useEffect(() => {
    let wasDisconnected = false;

    const unsubscribe = onConnectionStateChange((connected) => {
      setIsConnected(connected);

      // Show reconnected toast if we were previously disconnected
      if (connected && wasDisconnected) {
        setShowReconnectedToast(true);
        setTimeout(() => {
          setShowReconnectedToast(false);
        }, 3000); // Hide after 3 seconds
      }

      // Track disconnection state
      if (!connected) {
        wasDisconnected = true;
      }
    });

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
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="connection-banner offline">
          <span className="banner-icon">⚠️</span>
          <span className="banner-text">
            You're offline. Reconnecting...
          </span>
        </div>
      )}

      {/* Reconnected Toast */}
      {showReconnectedToast && (
        <div className="connection-toast connected">
          <span className="toast-icon">✓</span>
          <span className="toast-text">Reconnected</span>
        </div>
      )}

      <header className="app-header">
        <h1>CollabCanvas</h1>
        
        {/* Mobile Presence Avatars - Show other users only */}
        <div className="mobile-presence">
          {otherUsers.slice(0, 3).map((onlineUser) => (
            <div
              key={onlineUser.userId}
              className="mobile-avatar"
              style={{ backgroundColor: onlineUser.color }}
              title={onlineUser.displayName}
            >
              {onlineUser.displayName.charAt(0).toUpperCase()}
            </div>
          ))}
          {otherUserCount > 3 && (
            <div className="mobile-avatar-more">
              +{otherUserCount - 3}
            </div>
          )}
        </div>

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
