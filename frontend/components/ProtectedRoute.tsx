'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-neutral-400 text-sm font-semibold tracking-wide">
            Accessing Secure Workspace...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
