'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { 
  AudioLines, LogOut, Keyboard, History, User, Shield, Users, Settings, ArrowLeft, Menu, X, Star, Sparkles, ChevronUp
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  isAdminArea?: boolean;
}

export default function WorkspaceLayout({ children, isAdminArea = false }: WorkspaceLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Single canonical navigation definition for normal workspace
  const userNavItems = [
    { name: 'Speech Studio', href: '/dashboard', icon: Keyboard },
    ...(user.premiumAccess ? [{ name: 'AI Scene Generator', href: '/dashboard/ai-scene-generator', icon: Sparkles }] : []),
    { name: 'Audio History', href: '/history', icon: History },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
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
    return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
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
                    href="/admin/dashboard"
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

        {/* User Card with Interactive Avatar Dropdown Menu */}
        <div className="flex flex-col gap-4 relative" ref={dropdownRef}>
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

          {/* User Profile Card Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-900/40 bg-neutral-950/20 hover:bg-neutral-900/40 transition-all duration-300 group text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.profileImageUrl || user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
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
            <ChevronUp className={`w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Avatar Popover Dropdown */}
          {dropdownOpen && (
            <div className="absolute bottom-16 inset-x-0 bg-neutral-950 border border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
              >
                <User className="w-4 h-4 text-indigo-400" /> View Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
              >
                <Settings className="w-4 h-4 text-indigo-400" /> Account Settings
              </Link>
              <div className="border-t border-neutral-900 my-1" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/20 transition text-left w-full"
              >
                <LogOut className="w-4 h-4 text-red-400" /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="flex md:hidden border-b border-neutral-900 bg-[#070708]/85 backdrop-blur-md px-4 sm:px-6 py-3.5 items-center justify-between z-30 sticky top-0 w-full">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <AudioLines className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-neutral-200 text-sm truncate">21st Tech</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="absolute top-[61px] left-0 w-full border-b border-neutral-900 bg-[#0a0a0c] p-5 flex flex-col gap-4 animate-in slide-in-from-top duration-200 shadow-2xl max-h-[calc(100vh-70px)] overflow-y-auto">
            <nav className="flex flex-col gap-1.5">
              {currentNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      active 
                        ? 'bg-neutral-900 text-indigo-400 border border-neutral-800'
                        : 'text-neutral-400 border border-transparent hover:bg-neutral-900/40 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {item.name}
                  </Link>
                );
              })}

              {user.role === 'admin' && (
                <div className="mt-3 pt-3 border-t border-neutral-900">
                  {isAdminArea ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-950/10 border border-indigo-950/20 transition"
                    >
                      <ArrowLeft className="w-4.5 h-4.5" />
                      Switch to Speech Studio
                    </Link>
                  ) : (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-violet-400 bg-violet-950/10 border border-violet-950/20 transition"
                    >
                      <Shield className="w-4.5 h-4.5" />
                      Switch to Admin Control
                    </Link>
                  )}
                </div>
              )}
            </nav>

            {/* Profile / Logout section mobile */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-900 mt-1">
              <div className="flex items-center gap-3 min-w-0 mb-2">
                <img
                  src={user.profileImageUrl || user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border border-neutral-800 object-cover shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-neutral-200 truncate">{user.name}</span>
                  <span className="text-[10px] text-neutral-500 truncate">{user.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg bg-neutral-900 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg bg-neutral-900 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" /> Settings
                </Link>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="mt-1 py-2 px-4 rounded-lg bg-red-950/20 border border-red-900/35 hover:bg-red-900/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto overflow-x-hidden relative w-full">
        {children}
      </main>
    </div>
  );
}
