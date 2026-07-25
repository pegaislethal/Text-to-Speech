/**
 * Centralized API Configuration
 * Supports Environment Variables, Production Deployed Backend, and Localhost Fallbacks
 */
const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  // Client-side resolution for production vs development
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // Deployed production environment on Vercel or custom domain
    if (host.endsWith('.vercel.app') || (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.'))) {
      // If envUrl is provided and is NOT a localhost address, use it; otherwise use deployed backend
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return sanitizeUrl(envUrl);
      }
      return 'https://text-to-speech-cudm-82zozn7fm-pegas-projects-be8fc807.vercel.app';
    }

    // LAN / Wi-Fi Multi-device testing (e.g. mobile phone visiting http://192.168.1.50:3000)
    if (host.startsWith('192.168.')) {
      return `http://${host}:5000`;
    }
  }

  // Explicit environment variable (if valid for current environment)
  if (envUrl) {
    return sanitizeUrl(envUrl);
  }

  // Server-side/SSR resolution during Production build
  if (process.env.NODE_ENV === 'production') {
    return 'https://text-to-speech-cudm-82zozn7fm-pegas-projects-be8fc807.vercel.app';
  }

  // Development Fallback
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();
