import { useState, useEffect, useRef } from 'react';
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
  const [showMoreUsersTooltip, setShowMoreUsersTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const moreButtonRef = useRef(null);
  const tooltipRef = useRef(null);

  // Get presence data for mobile header
  const { onlineUsers, onlineUserCount } = usePresence();

  // Show only current user's circle, rest in +N tooltip
  const displayedUsers = onlineUsers.filter(u => u.userId === user?.uid);
  const hiddenUsers = onlineUsers.filter(u => u.userId !== user?.uid);

  // Calculate tooltip position when it should be shown
  useEffect(() => {
    if (showMoreUsersTooltip && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      const headerHeight = 80; // Approximate header height
      const tooltipHeight = 150; // Approximate tooltip height

      // Position tooltip below the button, but adjust if it would go off-screen
      let top = rect.bottom + 5;
      let left = rect.left + (rect.width / 2); // Center horizontally

      // If tooltip would go below viewport, position above button
      if (top + tooltipHeight > window.innerHeight) {
        top = rect.top - tooltipHeight - 5;
      }

      // If tooltip would go off left edge, adjust left position
      if (left < 100) {
        left = 100;
      }

      setTooltipPosition({ top, left });
    }
  }, [showMoreUsersTooltip]);

  // Handle clicks outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMoreUsersTooltip &&
        moreButtonRef.current &&
        tooltipRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        !tooltipRef.current.contains(event.target)
      ) {
        setShowMoreUsersTooltip(false);
      }
    };

    if (showMoreUsersTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreUsersTooltip]);

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

        {/* Online Users Avatars - Google Docs style */}
        <div className="online-users">
          {displayedUsers.map((onlineUser) => (
            <div
              key={onlineUser.userId}
              className={`user-avatar ${onlineUser.userId === user.uid ? 'current-user-avatar' : ''}`}
              style={{ backgroundColor: onlineUser.color }}
              title={onlineUser.displayName + (onlineUser.userId === user.uid ? ' (You)' : '')}
            >
              {onlineUser.displayName.charAt(0).toUpperCase()}
            </div>
          ))}
          {hiddenUsers.length > 0 && (
            <div
              ref={moreButtonRef}
              className="user-avatar-more"
              onMouseEnter={() => setShowMoreUsersTooltip(true)}
              onMouseLeave={(e) => {
                // Only hide if moving away from both button and tooltip
                setTimeout(() => {
                  if (tooltipRef.current && !tooltipRef.current.matches(':hover') &&
                      moreButtonRef.current && !moreButtonRef.current.matches(':hover')) {
                    setShowMoreUsersTooltip(false);
                  }
                }, 100);
              }}
              title={`${hiddenUsers.length} more user${hiddenUsers.length > 1 ? 's' : ''}`}
            >
              +{hiddenUsers.length}
            </div>
          )}
          {showMoreUsersTooltip && hiddenUsers.length > 0 && (
            <div
              ref={tooltipRef}
              className="more-users-tooltip"
              style={{
                position: 'fixed',
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translateX(-50%)'
              }}
              onMouseEnter={() => setShowMoreUsersTooltip(true)}
              onMouseLeave={(e) => {
                // Only hide if moving away from both button and tooltip
                setTimeout(() => {
                  if (tooltipRef.current && !tooltipRef.current.matches(':hover') &&
                      moreButtonRef.current && !moreButtonRef.current.matches(':hover')) {
                    setShowMoreUsersTooltip(false);
                  }
                }, 100);
              }}
            >
              <div className="tooltip-arrow"></div>
              {hiddenUsers.map((hiddenUser) => (
                <div key={hiddenUser.userId} className="tooltip-user">
                  <div
                    className="tooltip-user-avatar"
                    style={{ backgroundColor: hiddenUser.color }}
                  >
                    {hiddenUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="tooltip-user-name">
                    {hiddenUser.displayName}
                  </span>
                </div>
              ))}
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
      </div>
    </div>
  );
}

export default App
