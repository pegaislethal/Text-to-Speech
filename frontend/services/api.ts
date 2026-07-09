const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const checkHealth = async () => {
  const res = await fetch(`${BACKEND_URL}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
};

export const generateSpeech = async (text: string, voice: string) => {
  const res = await fetch(`${BACKEND_URL}/api/tts/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, voice }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Speech generation failed');
  return data;
};

export const getHistory = async () => {
  const res = await fetch(`${BACKEND_URL}/api/history`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch history');
  return data;
};

// Admin Endpoints
export const getAdminUsers = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BACKEND_URL}/api/admin/users${query}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
};

export const updateAdminUser = async (id: string, body: any) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update user');
  return data;
};

export const toggleAdminUserPremium = async (id: string, premiumAccess: boolean) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}/premium`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ premiumAccess }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update premium access');
  return data;
};

export const deleteAdminUser = async (id: string) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete user');
  return data;
};

export const getAdminStats = async () => {
  const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch statistics');
  return data;
};

export const getAdminSettings = async () => {
  const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch settings');
  return data;
};

export const updateAdminSettings = async (body: any) => {
  const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update settings');
  return data;
};
