import { API_URL, getApiUrl } from '../config/api';

export { API_URL, getApiUrl };

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const apiUrl = getApiUrl();
  console.log('API_URL:', apiUrl);
  const headers = getHeaders();
  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMsg = 'API request failed';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch (_) {
      const errorText = await res.text();
      errorMsg = errorText || 'Server returned HTML or invalid response';
    }
    throw new Error(errorMsg);
  }

  return res;
};

export const checkHealth = async () => {
  const res = await apiFetch('/api/health');
  return res.json();
};

export const generateSpeech = async (text: string, voice: string, speed: number = 1.0) => {
  const res = await apiFetch('/api/tts/generate', {
    method: 'POST',
    body: JSON.stringify({ text, voice, speed }),
  });
  return res.json();
};

export const previewSpeechApi = async (voiceId: string, text?: string) => {
  console.log('Selected voice for preview:', voiceId);
  const res = await apiFetch('/api/tts/preview', {
    method: 'POST',
    body: JSON.stringify({ voiceId, text }),
  });
  return res.json();
};

export const getHistory = async () => {
  const res = await apiFetch('/api/history');
  return res.json();
};

export const deleteHistoryItemApi = async (id: string) => {
  const res = await apiFetch(`/api/history/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const clearHistoryApi = async () => {
  const res = await apiFetch('/api/history', {
    method: 'DELETE',
  });
  return res.json();
};

// Preset Endpoints
export const getPresets = async () => {
  const res = await apiFetch('/api/presets');
  return res.json();
};

export const createPreset = async (presetName: string, voiceId: string, speed: number = 1.0, settings: any = {}) => {
  const res = await apiFetch('/api/presets', {
    method: 'POST',
    body: JSON.stringify({ presetName, voiceId, speed, settings }),
  });
  return res.json();
};

export const deletePreset = async (id: string) => {
  const res = await apiFetch(`/api/presets/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

// User Authentication Endpoints
export const userSignupApi = async (name: string, email: string, password: string) => {
  const res = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
};

export const userLoginApi = async (email: string, password: string) => {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Admin Authentication Endpoints
export const adminSignupApi = async (name: string, email: string, password: string) => {
  const res = await apiFetch('/api/auth/admin/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
};

export const adminLoginApi = async (email: string, password: string) => {
  const res = await apiFetch('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Admin Operations
export const getAdminUsers = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await apiFetch(`/api/admin/users${query}`);
  return res.json();
};

export const updateAdminUser = async (id: string, body: any) => {
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res.json();
};

export const toggleAdminUserPremium = async (id: string, premiumAccess: boolean) => {
  const res = await apiFetch(`/api/admin/users/${id}/premium`, {
    method: 'PATCH',
    body: JSON.stringify({ premiumAccess }),
  });
  return res.json();
};

export const deleteAdminUser = async (id: string) => {
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const getAdminStats = async () => {
  const res = await apiFetch('/api/admin/stats');
  return res.json();
};

export const getAdminSettings = async () => {
  const res = await apiFetch('/api/admin/settings');
  return res.json();
};

export const updateAdminSettings = async (body: any) => {
  const res = await apiFetch('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res.json();
};

export const logoutApi = async () => {
  const res = await apiFetch('/api/auth/logout', {
    method: 'POST',
  });
  return res.json();
};
