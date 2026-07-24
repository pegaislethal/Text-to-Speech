'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { 
  AudioLines, LogOut, Keyboard, History, User, Shield, Users, Settings, ArrowLeft, Menu, X, Star, Sparkles
} from 'lucide-react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  isAdminArea?: boolean;
}

export default function WorkspaceLayout({ children, isAdminArea = false }: WorkspaceLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!user) return null;

  // Navigation definition for normal workspace
  const userNavItems = [
    { name: 'Speech Studio', href: '/dashboard', icon: Keyboard },
    ...(user.premiumAccess ? [{ name: 'AI Scene Generator', href: '/dashboard/ai-scene-generator', icon: Sparkles }] : []),
    { name: 'Audio History', href: '/history', icon: History },
    { name: 'Profile Settings', href: '/profile', icon: User },
  ];

  // Navigation definition for admin portal
  const adminNavItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
    { name: 'User Directory', href: '/admin/users', icon: Users },
    { name: 'Premium Management', href: '/admin/premium', icon: Star },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  const currentNavItems = isAdminArea ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    if (href === '/admin' && pathname !== '/admin') return false;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-neutral-200 flex flex-col md:flex-row relative">
      {/* Background radial accent glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-900/5 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-950/5 blur-[140px] pointer-events-none -z-10" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-neutral-900/80 bg-neutral-950/40 backdrop-blur-xl p-6 flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
              <AudioLines className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-neutral-100 text-sm group-hover:text-white transition duration-200">
                21st Tech
              </span>
              <span className="text-[10px] text-neutral-500 font-semibold tracking-wider uppercase">
                {isAdminArea ? 'Operator Panel' : 'TTS Platform'}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest px-3 mb-2">
              Navigation
            </span>
            
            {currentNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    active 
                      ? 'bg-neutral-900 text-indigo-400 border border-neutral-800'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-300 ${active ? 'text-indigo-400' : 'text-neutral-400 group-hover:scale-110'}`} />
                  {item.name}
                  {active && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                </Link>
              );
            })}

            {/* Quick Toggle Link for Admin between workspaces */}
            {user.role === 'admin' && (
              <div className="mt-6 pt-6 border-t border-neutral-900/80">
                <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest px-3 mb-2 block">
                  Quick Switch
                </span>
                {isAdminArea ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-400 hover:bg-indigo-950/15 border border-indigo-950/20 hover:border-indigo-900/35 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                    Speech Studio
                  </Link>
                ) : (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-400 hover:bg-violet-950/15 border border-violet-950/20 hover:border-violet-900/35 transition-all duration-200"
                  >
                    <Shield className="w-4.5 h-4.5" />
                    Admin Control
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* User Card */}
        <div className="flex flex-col gap-4">
          {/* Plan Status / Credits Box (User Area Only) */}
          {!isAdminArea && !user.premiumAccess && (
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-900/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-500">Credits Used</span>
                <span className="text-neutral-300 font-bold">
                  {user.usedCredits} / {user.freeCredits}
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (user.usedCredits / user.freeCredits) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 leading-normal font-medium">
                {user.freeCredits - user.usedCredits} credits remaining
              </span>
            </div>
          )}

          {/* Premium Plan active banner */}
          {!isAdminArea && user.premiumAccess && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/10 border border-indigo-900/25 flex items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                ⭐ Premium Access Active
              </span>
            </div>
          )}

          {/* Profile Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-900/40 bg-neutral-950/20 hover:bg-neutral-900/20 transition-all duration-300 group">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-neutral-800 shrink-0 object-cover"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate text-neutral-200 group-hover:text-white transition duration-200">
                  {user.name}
                </span>
                <span className="text-[10px] text-neutral-500 truncate font-medium">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="flex md:hidden border-b border-neutral-900 bg-[#070708]/85 backdrop-blur-md px-6 py-4 items-center justify-between z-30 sticky top-0 w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <AudioLines className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-neutral-200 text-sm">21st Tech</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="absolute top-[69px] left-0 w-full border-b border-neutral-900 bg-[#0a0a0c] p-6 flex flex-col gap-5 animate-in slide-in-from-top duration-200 shadow-2xl">
            <nav className="flex flex-col gap-2">
              {currentNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      active 
                        ? 'bg-neutral-900 text-indigo-400 border border-neutral-800'
                        : 'text-neutral-400 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {item.name}
                  </Link>
                );
              })}

              {user.role === 'admin' && (
                <div className="mt-4 pt-4 border-t border-neutral-900">
                  {isAdminArea ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-950/10 border border-indigo-950/20 transition"
                    >
                      <ArrowLeft className="w-4.5 h-4.5" />
                      Switch to Speech Studio
                    </Link>
                  ) : (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-violet-400 bg-violet-950/10 border border-violet-950/20 transition"
                    >
                      <Shield className="w-4.5 h-4.5" />
                      Switch to Admin Control
                    </Link>
                  )}
                </div>
              )}
            </nav>

            {/* Profile / Logout section mobile */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-900">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border border-neutral-800 object-cover"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-neutral-200 truncate">{user.name}</span>
                  <span className="text-[10px] text-neutral-500 truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="py-2 px-4 rounded-lg bg-red-950/20 border border-red-900/35 hover:bg-red-900/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative w-full">
        {children}
      </main>
    </div>
  );
}
