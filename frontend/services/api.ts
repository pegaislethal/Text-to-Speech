const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const checkHealth = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error('Error fetching health status:', error);
    throw error;
  }
};
