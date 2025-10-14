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

  // Subscribe to real-time presence updates
  useEffect(() => {
    console.log('Setting up presence subscription...');
    
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

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up presence subscription');
        unsubscribeRef.current();
      }
    };
  }, []);

  /**
   * Get all users' presence as an array, sorted by online status
   * @returns {Array} Array of presence objects
   */
  const getPresenceList = useCallback(() => {
    return Object.values(presence).sort((a, b) => {
      // Sort online users first
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      // Then sort by display name
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
   * Get the number of online users
   * @returns {number} Count of online users
   */
  const getOnlineUserCount = useCallback(() => {
    return Object.values(presence).filter(p => p.status === 'online').length;
  }, [presence]);

  /**
   * Get list of only online users
   * @returns {Array} Array of online user presence objects
   */
  const getOnlineUsers = useCallback(() => {
    return Object.values(presence).filter(p => p.status === 'online');
  }, [presence]);

  /**
   * Check if a specific user is online
   * @param {string} targetUserId - User ID to check
   * @returns {boolean} True if user is online
   */
  const isUserOnline = useCallback((targetUserId) => {
    const userPresence = presence[targetUserId];
    return userPresence?.status === 'online';
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

