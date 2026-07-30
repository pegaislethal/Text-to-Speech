'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useRouter } from 'next/navigation';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/admin/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-neutral-400 text-sm font-semibold tracking-wide">
            Verifying Admin Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'sub_admin')) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f3f4f6] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-8 shadow-2xl text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">403 Forbidden</h1>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
              You do not have permission to access this page.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-bold text-xs text-white shadow-lg shadow-indigo-600/25 active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
