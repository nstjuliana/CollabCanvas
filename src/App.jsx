import { useState, useEffect } from 'react';
import { onAuthStateChanged, logout } from './services/auth';
import AuthForm from './components/AuthForm';
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
      <main className="app-main">
        <div className="canvas-placeholder">
          <h2>Canvas Coming Soon!</h2>
          <p>Welcome to CollabCanvas, {user.displayName}!</p>
          <p className="placeholder-text">
            The collaborative canvas will be implemented in the next tasks.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App
