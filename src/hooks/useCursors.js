/**
 * useCursors Hook
 * React hook for managing cursor positions and real-time synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  updateCursorPosition as updateCursorService,
  subscribeToCursors,
  initializeCursor,
  cleanupCursor,
  getUserCursorColor,
} from '../services/cursors';
import { onConnectionStateChange } from '../services/firebase';
import { getUserId } from '../services/auth';
import { PRESENCE_COLORS, CURSOR_CONFIG } from '../utils/constants';

/**
 * Custom hook for managing cursors
 * @returns {object} Cursors state and methods
 */
function useCursors() {
  const [cursors, setCursors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const unsubscribeRef = useRef(null);
  const unsubscribeConnectionRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const userId = getUserId();

  // Initialize cursor tracking on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeCursor();
      } catch (err) {
        console.error('Error initializing cursor:', err);
        setError(err.message);
      }
    };

    if (userId) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      cleanupCursor();
    };
  }, [userId]);

  // Monitor connection state and re-initialize cursor on reconnection
  useEffect(() => {
    if (!userId) return;

    let wasDisconnected = false;

    const unsubscribe = onConnectionStateChange(async (connected) => {
      // If we reconnected after being disconnected, re-initialize cursor
      if (connected && wasDisconnected) {
        console.log('Connection restored, re-initializing cursor...');
        try {
          await initializeCursor();
        } catch (err) {
          console.error('Error re-initializing cursor:', err);
        }
      }

      wasDisconnected = !connected;
    });

    unsubscribeConnectionRef.current = unsubscribe;

    return () => {
      if (unsubscribeConnectionRef.current) {
        unsubscribeConnectionRef.current();
      }
    };
  }, [userId]);

  // Subscribe to real-time cursor updates
  // Re-subscribe when connection state changes to ensure reliability
  useEffect(() => {
    console.log('Setting up cursors subscription...');
    
    const setupSubscription = () => {
      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = subscribeToCursors((updatedCursors) => {
        // Add colors to cursors
        const cursorsWithColors = Object.entries(updatedCursors).reduce((acc, [uid, cursor]) => {
          acc[uid] = {
            ...cursor,
            color: getUserCursorColor(uid, PRESENCE_COLORS),
          };
          return acc;
        }, {});

        setCursors(cursorsWithColors);
        setLoading(false);
        setError(null);
      });

      unsubscribeRef.current = unsubscribe;
    };

    // Set up initial subscription
    setupSubscription();

    // Monitor connection and re-subscribe on reconnection
    let wasDisconnected = false;
    const unsubscribeConnection = onConnectionStateChange((connected) => {
      if (connected && wasDisconnected) {
        console.log('Connection restored, re-subscribing to cursors...');
        setupSubscription();
      }
      wasDisconnected = !connected;
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up cursors subscription');
        unsubscribeRef.current();
      }
      unsubscribeConnection();
    };
  }, []);

  /**
   * Update the current user's cursor position
   * Throttled to prevent excessive database writes
   * @param {number} x - X coordinate (canvas space)
   * @param {number} y - Y coordinate (canvas space)
   */
  const updateCursorPosition = useCallback((x, y) => {
    try {
      // Throttle cursor updates
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < CURSOR_CONFIG.UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTimeRef.current = now;

      // Update cursor position in database
      updateCursorService(x, y);
    } catch (err) {
      console.error('Error updating cursor position:', err);
      // Don't set error state for cursor updates (graceful degradation)
    }
  }, []);

  /**
   * Get all other users' cursors as an array
   * @returns {Array} Array of cursor objects
   */
  const getCursorsList = useCallback(() => {
    return Object.values(cursors);
  }, [cursors]);

  /**
   * Get a specific user's cursor
   * @param {string} targetUserId - User ID to get cursor for
   * @returns {object|null} Cursor object or null if not found
   */
  const getCursorByUserId = useCallback((targetUserId) => {
    return cursors[targetUserId] || null;
  }, [cursors]);

  /**
   * Get the number of other users with active cursors
   * @returns {number} Count of active cursors
   */
  const getActiveCursorCount = useCallback(() => {
    return Object.keys(cursors).length;
  }, [cursors]);

  return {
    // State
    cursors, // Object with userId as key
    cursorsList: getCursorsList(), // Array of cursor objects
    loading,
    error,
    activeCursorCount: getActiveCursorCount(),
    
    // Methods
    updateCursorPosition,
    getCursorByUserId,
  };
}

export default useCursors;

