'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { 
  AudioLines, LogOut, History, User, Shield, Users, Settings, ArrowLeft, Menu, X, Star, Sparkles, ChevronUp, LayoutDashboard, Mic
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  isAdminArea?: boolean;
}

export default function WorkspaceLayout({ children, isAdminArea = false }: WorkspaceLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
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

  // Single canonical navigation definition for normal workspace (Linear / Vercel style)
  const userNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Speech Studio', href: '/speech-studio', icon: Mic },
    ...(user.premiumAccess ? [{ name: 'AI Scene Generator', href: '/ai-scene-generator', icon: Sparkles }] : []),
    { name: 'History', href: '/history', icon: History },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Navigation definition for Control Center (Admin portal)
  const adminNavItems = [
    { name: 'Control Dashboard', href: '/control-center/dashboard', icon: Shield },
    { name: 'User Directory', href: '/control-center/users', icon: Users },
    { name: 'Premium Control', href: '/control-center/premium', icon: Star },
    { name: 'System Settings', href: '/control-center/settings', icon: Settings },
  ];

  const currentNavItems = isAdminArea ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href === '/speech-studio' && (pathname === '/speech-studio' || pathname === '/dashboard')) return true;
    if (href === '/ai-scene-generator' && (pathname === '/ai-scene-generator' || pathname === '/dashboard/ai-scene-generator')) return true;
    return pathname === href || (href !== '/' && href !== '/dashboard' && pathname.startsWith(`${href}`));
  };

  const handleKeyDown = (e: React.KeyboardEvent, href: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col md:flex-row relative">
      {/* Sidebar - Desktop (Minimal SaaS aesthetic inspired by Linear / Vercel) */}
      <aside className="hidden md:flex w-60 border-r border-[var(--border-app)] bg-[var(--bg-sidebar)] p-4 flex-col justify-between shrink-0 h-screen sticky top-0 z-40 transition-colors duration-200">
        <div className="flex flex-col gap-6">
          {/* Logo Header */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-black overflow-hidden flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-sm text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                21st Tech
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-wider uppercase">
                {isAdminArea ? 'Control Center' : 'Voice Platform'}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5" aria-label="Main Navigation">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider px-3 mb-1">
              Platform
            </span>
            
            {currentNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, item.href)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active 
                      ? 'bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {/* Active Indicator Accent Line */}
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-500 rounded-r" />
                  )}

                  <Icon className={`w-4 h-4 transition-colors ${active ? 'text-indigo-500' : 'text-[var(--text-muted)]'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}

            {/* Quick Switch for Admin */}
            {user.role === 'admin' && (
              <div className="mt-4 pt-4 border-t border-[var(--border-app)] flex flex-col gap-1">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider px-3 mb-1">
                  System Context
                </span>
                {isAdminArea ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Speech Studio
                  </Link>
                ) : (
                  <Link
                    href="/control-center/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-violet-400 hover:bg-violet-500/10 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Control Center
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Footer: User & Controls */}
        <div className="flex flex-col gap-3" ref={dropdownRef}>
          {/* User Credits Bar (Non-premium user) */}
          {!isAdminArea && !user.premiumAccess && (
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-app)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] font-medium">Credits</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {user.usedCredits} / {user.freeCredits}
                </span>
              </div>
              <div className="w-full bg-[var(--bg-input)] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (user.usedCredits / user.freeCredits) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* User Profile Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-app)] gap-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors min-w-0 text-left flex-1"
            >
              <img
                src={user.profileImageUrl || user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-[var(--border-app)] object-cover shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </div>
              <ChevronUp className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ml-auto shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <ThemeToggle />
          </div>

          {/* Profile Dropdown Popover */}
          {dropdownOpen && (
            <div className="absolute bottom-16 left-4 right-4 bg-[var(--bg-card)] border border-[var(--border-app)] rounded-xl p-1.5 shadow-xl z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" /> View Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" /> Settings
              </Link>
              <div className="border-t border-[var(--border-app)] my-1" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="flex md:hidden border-b border-[var(--border-app)] bg-[var(--bg-sidebar)] px-4 py-3 items-center justify-between z-30 sticky top-0 w-full">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black overflow-hidden flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm text-[var(--text-primary)]">21st Tech</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full border-b border-[var(--border-app)] bg-[var(--bg-sidebar)] p-4 flex flex-col gap-3 shadow-xl max-h-[calc(100vh-60px)] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {currentNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      active 
                        ? 'bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-[var(--border-app)] flex justify-between items-center">
              <span className="text-xs text-[var(--text-muted)]">{user.email}</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden relative w-full">
        {children}
      </main>
    </div>
  );
}
