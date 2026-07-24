/**
 * Centralized API Configuration
 * Supports Environment Variables, Production Deployed Backend, and Localhost Fallbacks
 */
const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

export const getApiUrl = (): string => {
  // Highest priority: Explicit environment variable (process.env.NEXT_PUBLIC_API_URL)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return sanitizeUrl(process.env.NEXT_PUBLIC_API_URL);
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return sanitizeUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
  }

  // Client-side resolution for production vs development
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // Deployed production environment on Vercel
    if (host.endsWith('.vercel.app') || (process.env.NODE_ENV === 'production' && host !== 'localhost' && host !== '127.0.0.1')) {
      return 'https://text-to-speech-cudm.vercel.app';
    }

    // LAN / Wi-Fi Multi-device testing (e.g. mobile phone visiting http://192.168.1.50:3000)
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }

  // Development Fallback
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();
