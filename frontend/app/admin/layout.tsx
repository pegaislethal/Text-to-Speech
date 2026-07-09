'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioLines, LogOut, Shield, Users, Settings, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-neutral-400 text-sm">Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-900 bg-neutral-950 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <AudioLines className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-neutral-100">Operator Portal</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider px-3 mb-1">Control Center</span>
            
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-450 hover:text-neutral-200 hover:bg-neutral-900 transition"
            >
              <Users className="w-4 h-4" />
              User Directory
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-450 hover:text-neutral-200 hover:bg-neutral-900 transition"
            >
              <Settings className="w-4 h-4" />
              System Settings
            </Link>

            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider px-3 mt-6 mb-1">Workspace</span>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-400 hover:bg-indigo-950/15 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Speech Studio
            </Link>
          </nav>
        </div>

        {/* User Card */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 transition group">
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120'}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-neutral-800"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate text-neutral-200">{user.name}</span>
                <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> Administrator
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded text-neutral-500 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="border-b border-neutral-900 bg-neutral-950 px-6 py-4 flex items-center justify-between md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-neutral-200 text-sm">Admin Control</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="text-xs font-semibold text-neutral-350">Users</Link>
            <Link href="/admin/settings" className="text-xs font-semibold text-neutral-350">Settings</Link>
            <Link href="/dashboard" className="text-xs font-semibold text-indigo-400">Studio</Link>
            <button onClick={logout} className="p-1 rounded text-neutral-400"><LogOut className="w-4.5 h-4.5" /></button>
          </div>
        </header>

        {/* Layout content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-neutral-950/40">
          {children}
        </main>
      </div>
    </div>
  );
}
