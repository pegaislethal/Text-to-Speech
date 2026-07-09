'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioLines, LogOut, Keyboard, History, Shield, RefreshCw } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-neutral-400 text-sm">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // Calculate usage percentage
  const creditsRemaining = user.freeCredits - user.usedCredits;
  const usagePercentage = Math.min(100, (user.usedCredits / user.freeCredits) * 100);

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
            <span className="font-bold tracking-tight text-neutral-100">21st Tech Company</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-neutral-900 text-indigo-400 border border-indigo-950/20"
            >
              <Keyboard className="w-4 h-4" />
              Speech Studio
            </Link>
            <Link
              href="/dashboard/history"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
            >
              <History className="w-4 h-4" />
              Audio History
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* User Card & Limits */}
        <div className="flex flex-col gap-6">
          {/* Credits Box */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-900 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Credits Usage</span>
              <span className="text-neutral-300 font-bold">
                {user.premiumAccess ? 'Unlimited' : `${user.usedCredits} / ${user.freeCredits}`}
              </span>
            </div>
            {!user.premiumAccess && (
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            )}
            <div className="text-[10px] text-neutral-500 leading-normal">
              {user.premiumAccess 
                ? '⭐ Premium Plan Active' 
                : `${creditsRemaining} credits remaining. Short text uses fewer credits.`
              }
            </div>
          </div>

          {/* Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 transition group">
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-neutral-800"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate text-neutral-200">{user.name}</span>
                <span className="text-[10px] text-neutral-500 truncate">{user.email}</span>
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

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="border-b border-neutral-900 bg-neutral-950 px-6 py-4 flex items-center justify-between md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-neutral-200 text-sm">21st Tech Company</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-semibold text-indigo-400">Studio</Link>
            <Link href="/dashboard/history" className="text-xs font-semibold text-neutral-400">History</Link>
            {user.role === 'admin' && (
              <Link href="/admin/users" className="text-xs font-semibold text-indigo-400">Admin</Link>
            )}
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
