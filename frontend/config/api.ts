/**
 * Centralized API Configuration
 * Supports Environment Variables, Vercel Rewrites, LAN IP Testing, and Localhost Fallbacks
 */
export const getApiUrl = (): string => {
  // Highest priority: Explicit environment variable (e.g., https://your-backend.onrender.com)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  // Client-side dynamic resolution for Vercel and LAN devices
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // Production / Vercel Domain Resolution
    if (host.endsWith('.vercel.app') || (process.env.NODE_ENV === 'production' && host !== 'localhost' && host !== '127.0.0.1')) {
      return '/api/backend';
    }

    // LAN / Wi-Fi Multi-device resolution (e.g. mobile phone visiting http://192.168.1.50:3000)
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }

  // Development Fallback
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();
