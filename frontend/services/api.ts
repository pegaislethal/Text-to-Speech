export const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.vercel.app') || process.env.NODE_ENV === 'production') {
      return '/api/backend';
    }
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }
  return 'http://localhost:5000';
};

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const backendUrl = getBackendUrl();
  const headers = getHeaders();
  const res = await fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
  });
  return res;
};

export const checkHealth = async () => {
  const res = await apiFetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
};

export const generateSpeech = async (text: string, voice: string, speed: number = 1.0) => {
  const res = await apiFetch('/api/tts/generate', {
    method: 'POST',
    body: JSON.stringify({ text, voice, speed }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Speech generation failed');
  return data;
};

export const previewSpeechApi = async (voiceId: string, text?: string) => {
  console.log('Selected voice for preview:', voiceId);
  const res = await apiFetch('/api/tts/preview', {
    method: 'POST',
    body: JSON.stringify({ voiceId, text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Preview generation failed');
  return data;
};

export const getHistory = async () => {
  const res = await apiFetch('/api/history');
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch history');
  return data;
};

export const deleteHistoryItemApi = async (id: string) => {
  const res = await apiFetch(`/api/history/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete history item');
  return data;
};

export const clearHistoryApi = async () => {
  const res = await apiFetch('/api/history', {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to clear history');
  return data;
};

// Preset Endpoints
export const getPresets = async () => {
  const res = await apiFetch('/api/presets');
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch presets');
  return data;
};

export const createPreset = async (presetName: string, voiceId: string, speed: number = 1.0, settings: any = {}) => {
  const res = await apiFetch('/api/presets', {
    method: 'POST',
    body: JSON.stringify({ presetName, voiceId, speed, settings }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create preset');
  return data;
};

export const deletePreset = async (id: string) => {
  const res = await apiFetch(`/api/presets/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete preset');
  return data;
};

// Admin Authentication Endpoints
export const adminSignupApi = async (name: string, email: string, password: string) => {
  const res = await apiFetch('/api/auth/admin/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Admin registration failed');
  return data;
};

export const adminLoginApi = async (email: string, password: string) => {
  const res = await apiFetch('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Admin login failed');
  return data;
};

// Admin Operations
export const getAdminUsers = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await apiFetch(`/api/admin/users${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
};

export const updateAdminUser = async (id: string, body: any) => {
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update user');
  return data;
};

export const toggleAdminUserPremium = async (id: string, premiumAccess: boolean) => {
  const res = await apiFetch(`/api/admin/users/${id}/premium`, {
    method: 'PATCH',
    body: JSON.stringify({ premiumAccess }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update premium access');
  return data;
};

export const deleteAdminUser = async (id: string) => {
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete user');
  return data;
};

export const getAdminStats = async () => {
  const res = await apiFetch('/api/admin/stats');
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch statistics');
  return data;
};

export const getAdminSettings = async () => {
  const res = await apiFetch('/api/admin/settings');
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch settings');
  return data;
};

export const updateAdminSettings = async (body: any) => {
  const res = await apiFetch('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update settings');
  return data;
};

export const logoutApi = async () => {
  const res = await apiFetch('/api/auth/logout', {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Logout failed');
  return data;
};
