'use client';

import { useEffect, useState } from 'react';
import { checkHealth } from '../services/api';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');

  useEffect(() => {
    const getStatus = async () => {
      try {
        const data = await checkHealth();
        setHealthStatus(data.message || 'Healthy');
      } catch (error) {
        setHealthStatus('Error connecting to backend');
      }
    };
    getStatus();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Welcome to the Full-Stack App</h1>
      </div>

      <div className="flex flex-col items-center justify-center border p-8 rounded-lg shadow-lg bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4">Backend Status:</h2>
        <div className={`text-xl font-bold p-4 rounded ${healthStatus === 'Server is healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {healthStatus}
        </div>
      </div>
    </main>
  );
}
