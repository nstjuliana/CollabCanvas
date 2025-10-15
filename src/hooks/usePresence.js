/**
 * usePresence Hook
 * React hook for managing user presence and online/offline status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToPresence,
  initializePresence,
  cleanupPresence,
  getUserPresenceColor,
} from '../services/presence';
import { onConnectionStateChange } from '../services/firebase';
import { getUserId } from '../services/auth';
import { PRESENCE_COLORS } from '../utils/constants';

/**
 * Custom hook for managing user presence
 * @returns {object} Presence state and methods
 */
function usePresence() {
  const [presence, setPresence] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const unsubscribeRef = useRef(null);
  const unsubscribeConnectionRef = useRef(null);
  const userId = getUserId();

  // Initialize presence tracking on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        if (userId) {
          await initializePresence();
        }
      } catch (err) {
        console.error('Error initializing presence:', err);
        setError(err.message);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      cleanupPresence();
    };
  }, [userId]);

  // Monitor connection state and re-initialize presence on reconnection
  useEffect(() => {
    if (!userId) return;

    let wasDisconnected = false;

    const unsubscribe = onConnectionStateChange(async (connected) => {
      // If we reconnected after being disconnected, re-initialize presence
      if (connected && wasDisconnected) {
        console.log('Connection restored, re-initializing presence...');
        try {
          await initializePresence();
        } catch (err) {
          console.error('Error re-initializing presence:', err);
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

  // Subscribe to real-time presence updates
  // Re-subscribe when connection state changes to ensure reliability
  useEffect(() => {
    console.log('Setting up presence subscription...');
    
    const setupSubscription = () => {
      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = subscribeToPresence((updatedPresence) => {
        // Add colors to presence
        const presenceWithColors = Object.entries(updatedPresence).reduce((acc, [uid, presenceData]) => {
          acc[uid] = {
            ...presenceData,
            color: getUserPresenceColor(uid, PRESENCE_COLORS),
          };
          return acc;
        }, {});

        setPresence(presenceWithColors);
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
        console.log('Connection restored, re-subscribing to presence...');
        setupSubscription();
      }
      wasDisconnected = !connected;
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up presence subscription');
        unsubscribeRef.current();
      }
      unsubscribeConnection();
    };
  }, []);

  /**
   * Get all users' presence as an array, sorted by display name
   * @returns {Array} Array of presence objects
   */
  const getPresenceList = useCallback(() => {
    return Object.values(presence).sort((a, b) => {
      // Sort by display name (all users in list are online)
      return (a.displayName || '').localeCompare(b.displayName || '');
    });
  }, [presence]);

  /**
   * Get a specific user's presence
   * @param {string} targetUserId - User ID to get presence for
   * @returns {object|null} Presence object or null if not found
   */
  const getPresenceByUserId = useCallback((targetUserId) => {
    return presence[targetUserId] || null;
  }, [presence]);

  /**
   * Get the number of online users (all users in presence list are online)
   * @returns {number} Count of online users
   */
  const getOnlineUserCount = useCallback(() => {
    return Object.keys(presence).length;
  }, [presence]);

  /**
   * Get list of only online users (same as presenceList since we only store online users)
   * @returns {Array} Array of online user presence objects
   */
  const getOnlineUsers = useCallback(() => {
    return Object.values(presence);
  }, [presence]);

  /**
   * Check if a specific user is online (present in the presence list)
   * @param {string} targetUserId - User ID to check
   * @returns {boolean} True if user is online
   */
  const isUserOnline = useCallback((targetUserId) => {
    return !!presence[targetUserId];
  }, [presence]);

  return {
    // State
    presence, // Object with userId as key
    presenceList: getPresenceList(), // Array of all users' presence
    onlineUsers: getOnlineUsers(), // Array of only online users
    loading,
    error,
    onlineUserCount: getOnlineUserCount(),
    totalUserCount: Object.keys(presence).length,
    
    // Methods
    getPresenceByUserId,
    isUserOnline,
  };
}

export default usePresence;

