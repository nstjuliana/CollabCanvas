/**
 * PresencePanel Component
 * Displays list of online users with their status
 */

import { useMemo } from 'react';
import usePresence from '../hooks/usePresence';
import { getUserId } from '../services/auth';
import './PresencePanel.css';

function PresencePanel() {
  const { presenceList, onlineUserCount, loading, error } = usePresence();
  const currentUserId = getUserId();

  // Separate current user and other users
  const { currentUser, otherUsers } = useMemo(() => {
    const current = presenceList.find(p => p.userId === currentUserId);
    const others = presenceList.filter(p => p.userId !== currentUserId);
    return { currentUser: current, otherUsers: others };
  }, [presenceList, currentUserId]);

  if (loading) {
    return (
      <aside className="presence-panel">
        <div className="presence-header">
          <h3>Online Users</h3>
        </div>
        <div className="presence-loading">
          <div className="presence-spinner"></div>
          <p>Loading...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="presence-panel">
        <div className="presence-header">
          <h3>Online Users</h3>
        </div>
        <div className="presence-error">
          <span className="error-icon">⚠️</span>
          <p>Failed to load presence</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="presence-panel">
      <div className="presence-header">
        <h3>Online Users</h3>
        <span className="user-count-badge">{onlineUserCount}</span>
      </div>

      <div className="presence-list">
        {/* Current User */}
        {currentUser && (
          <div className="presence-section">
            <h4 className="section-title">You</h4>
            <div className="presence-item current-user">
              <div 
                className="status-indicator online"
                style={{ backgroundColor: currentUser.color }}
                title="Online"
              ></div>
              <div className="user-details">
                <span className="user-name">{currentUser.displayName}</span>
                <span className="user-badge">You</span>
              </div>
            </div>
          </div>
        )}

        {/* Other Users */}
        {otherUsers.length > 0 && (
          <div className="presence-section">
            <h4 className="section-title">
              Others ({otherUsers.length} online)
            </h4>
            {otherUsers.map((user) => (
              <div 
                key={user.userId} 
                className="presence-item online"
              >
                <div 
                  className="status-indicator online"
                  style={{ backgroundColor: user.color }}
                  title="Online"
                ></div>
                <div className="user-details">
                  <span className="user-name">{user.displayName}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {otherUsers.length === 0 && (
          <div className="presence-empty">
            <div className="empty-icon">👋</div>
            <p className="empty-title">You're the first one here!</p>
            <p className="empty-subtitle">
              Other users will appear here when they join the canvas.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default PresencePanel;

