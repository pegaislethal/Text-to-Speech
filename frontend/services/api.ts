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
  const headers = getHeaders();
  try {
    const res = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include',
    });

    // Check for updated token in response headers
    const newToken = res.headers.get('x-new-token');
    if (newToken && typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: newToken }));
    }

    if (!res.ok) {
      let errorMsg = 'API request failed';
      let errorCode = '';
      try {
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.message || errorMsg;
          errorCode = errorData.code || '';
        } catch (_) {
          errorMsg = text || 'Server returned HTML or invalid response';
        }
      } catch (_) {}

      // Only dispatch session expired event if status is 401 AND not on an auth page or auth endpoint
      if (res.status === 401 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthRoute = 
          currentPath.startsWith('/login') || 
          currentPath.startsWith('/signup') || 
          currentPath.startsWith('/admin/login') || 
          currentPath.startsWith('/admin/signup');
        const isAuthEndpoint = 
          endpoint.includes('/api/auth/login') || 
          endpoint.includes('/api/auth/user-login') || 
          endpoint.includes('/api/auth/admin-login') || 
          endpoint.includes('/api/auth/signup') || 
          endpoint.includes('/api/auth/user-signup') || 
          endpoint.includes('/api/auth/google');

        if (!isAuthRoute && !isAuthEndpoint) {
          const isExplicitSessionExpired = 
            errorCode === 'SESSION_EXPIRED' ||
            /session expired|jwt expired|invalid token|token expired/i.test(errorMsg);

          if (isExplicitSessionExpired) {
            window.dispatchEvent(new CustomEvent('auth-session-expired'));
          }
        }
      }

      throw new Error(errorMsg);
    }

    return res;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to backend server. Please check backend status or network connection.');
    }
    throw err;
  }
};

export const checkHealth = async () => {
  const res = await apiFetch('/api/health');
  return res.json();
};

export const generateSpeech = async (text: string, voice: string, speed: number = 1.0, pitch?: number, tone?: string, depth?: number) => {
  const res = await apiFetch('/api/tts/generate', {
    method: 'POST',
    body: JSON.stringify({ text, voice, speed, pitch, tone, depth }),
  });
  return res.json();
};

export const generateSceneVoicesApi = async (script: string, voiceId: string, speed: number = 1.0, pitch?: number, tone?: string, depth?: number) => {
  const res = await apiFetch('/api/premium/scene-generator', {
    method: 'POST',
    body: JSON.stringify({ script, voiceId, speed, pitch, tone, depth }),
  });
  return res.json();
};

export const previewSpeechApi = async (voiceId: string, text?: string, speed?: number, pitch?: number, tone?: string, depth?: number) => {
  console.log('Selected voice for preview:', voiceId);
  const res = await apiFetch('/api/tts/preview', {
    method: 'POST',
    body: JSON.stringify({ voiceId, text, speed, pitch, tone, depth }),
  });
  return res.json();
};

export const getHistory = async () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return { success: false, history: [] };
    const res = await apiFetch('/api/history');
    return await res.json();
  } catch (err) {
    console.warn('getHistory fallback (unreachable or unauthenticated):', err);
    return { success: false, history: [] };
  }
};

export const getAnalyticsOverview = async (global: boolean = false) => {
  const query = global ? '?global=true' : '';
  const res = await apiFetch(`/api/analytics/overview${query}`);
  return res.json();
};

export const getAnalyticsVoices = async (global: boolean = false) => {
  const query = global ? '?global=true' : '';
  const res = await apiFetch(`/api/analytics/voices${query}`);
  return res.json();
};

export const getAnalyticsTimeline = async (global: boolean = false) => {
  const query = global ? '?global=true' : '';
  const res = await apiFetch(`/api/analytics/timeline${query}`);
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
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return { success: false, presets: [] };
    const res = await apiFetch('/api/presets');
    return await res.json();
  } catch (err) {
    console.warn('getPresets fallback (unreachable or unauthenticated):', err);
    return { success: false, presets: [] };
  }
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

export const adminLoginApi = async (email: string, password: string) => {
  const res = await apiFetch('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Admin Operations
export const createAdminApi = async (name: string, email: string, password: string, permissions?: string[]) => {
  const res = await apiFetch('/api/admin/create-admin', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, permissions }),
  });
  return res.json();
};

export const updateAdminPermissionsApi = async (id: string, permissions: string[], role?: string) => {
  const res = await apiFetch(`/api/admin/users/${id}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions, role }),
  });
  return res.json();
};

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

export const refreshSessionApi = async () => {
  const res = await apiFetch('/api/auth/refresh', {
    method: 'POST',
  });
  return res.json();
};

/**
 * Helper to download an audio file directly without opening a new tab or redirecting.
 */
export const downloadAudioFile = async (url: string, filename: string): Promise<boolean> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audio stream');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err) {
    console.error('downloadAudioFile error:', err);
    return false;
  }
};

/**
 * Helper to request backend ZIP archive generation for all scenes and trigger download.
 */
export const downloadScenesZipApi = async (scenes: Array<{ sceneNumber: number; audioUrl: string }>) => {
  const apiUrl = getApiUrl();
  const headers = getHeaders();
  const dateStr = new Date().toISOString().split('T')[0];
  const zipFilename = `scene_audio_generation_${dateStr}.zip`;

  const res = await fetch(`${apiUrl}/api/premium/download-scenes-zip`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scenes }),
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMsg = 'Unable to create ZIP file.';
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
  return true;
};

// ==========================================
// User Profile Management APIs
// ==========================================

export const getUserProfileApi = async () => {
  const res = await apiFetch('/api/user/profile', {
    method: 'GET',
  });
  return res.json();
};

export const updateUserProfileApi = async (name: string, bio?: string) => {
  const res = await apiFetch('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, bio }),
  });
  return res.json();
};

export const uploadProfileImageApi = async (base64Image: string) => {
  const res = await apiFetch('/api/user/profile/image', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image }),
  });
  return res.json();
};

export const removeProfileImageApi = async () => {
  const res = await apiFetch('/api/user/profile/image', {
    method: 'DELETE',
  });
  return res.json();
};

// ==========================================
// Voice Cloning & Direct Upload APIs
// ==========================================

export const getUploadSignatureApi = async (folder: string = 'voice-clones/samples') => {
  const res = await apiFetch('/api/upload/signature', {
    method: 'POST',
    body: JSON.stringify({ folder }),
  });
  return res.json();
};

export const uploadToCloudinaryDirectApi = async (
  file: File | Blob, 
  signatureData: { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string },
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', signatureData.timestamp.toString());
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);

  const xhr = new XMLHttpRequest();
  return new Promise<{ audioUrl: string; publicId: string }>((resolve, reject) => {
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          audioUrl: response.secure_url || response.url,
          publicId: response.public_id
        });
      } else {
        try {
          const errorResp = JSON.parse(xhr.responseText);
          reject(new Error(errorResp.error?.message || 'Cloudinary upload failed'));
        } catch {
          reject(new Error('Unable to upload voice sample.'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Unable to upload voice sample.'));
    xhr.send(formData);
  });
};

export const cloneVoiceApi = async (voiceName: string, audioUrl: string, consent: boolean) => {
  const res = await apiFetch('/api/voice/clone', {
    method: 'POST',
    body: JSON.stringify({ voiceName, audioUrl, consent }),
  });
  return res.json();
};

export const getCustomVoicesApi = async () => {
  const res = await apiFetch('/api/voice/library', {
    method: 'GET',
  });
  return res.json();
};

export const getVoiceLibraryApi = async () => {
  const res = await apiFetch('/api/voice/library', {
    method: 'GET',
  });
  return res.json();
};

export const getTrainingStatusApi = async (voiceId: string) => {
  const res = await apiFetch(`/api/voice/status/${voiceId}`, {
    method: 'GET',
  });
  return res.json();
};

export const deleteCustomVoiceApi = async (id: string) => {
  const res = await apiFetch(`/api/voice/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};


