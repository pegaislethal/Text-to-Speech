'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { refreshSessionApi } from '../services/api';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 minutes
const REFRESH_THROTTLE = 60 * 1000; // 1 minute throttle for backend calls

export const SessionTimeoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout, token } = useAuth();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const lastRefreshRef = useRef<number>(Date.now());

  // Function to handle user activity
  const handleActivity = () => {
    lastActivityRef.current = Date.now();

    // Throttle backend refresh call
    if (isAuthenticated && token) {
      const now = Date.now();
      if (now - lastRefreshRef.current > REFRESH_THROTTLE) {
        lastRefreshRef.current = now;
        refreshSessionApi().catch((err) => {
          console.error('Failed to refresh session on activity:', err);
        });
      }
    }
  };

  // Reset inactivity timer when pathname changes (route changes)
  useEffect(() => {
    if (isAuthenticated) {
      handleActivity();
    }
  }, [pathname, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen to window events for user activity
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'click', 'scroll', 'touchstart'];
    
    // Throttle event handlers slightly to avoid high CPU usage
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleActivity();
        timeoutId = null;
      }, 500); // Only handle activity at most once every 500ms
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledActivity, { passive: true });
    });

    // Listen to token refresh and session expiration events from API service
    const handleTokenRefreshed = (e: Event) => {
      // Update our activity timestamp
      lastActivityRef.current = Date.now();
      // Also update the last refresh timestamp to avoid immediate duplicate requests
      lastRefreshRef.current = Date.now();
    };

    const handleSessionExpired = () => {
      logout(true);
    };

    window.addEventListener('auth-token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-session-expired', handleSessionExpired);

    // Set up check interval to detect inactivity expiry
    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current >= INACTIVITY_TIMEOUT) {
        logout(true);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledActivity);
      });
      window.removeEventListener('auth-token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-session-expired', handleSessionExpired);
      clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, token, logout]);

  return <>{children}</>;
};
