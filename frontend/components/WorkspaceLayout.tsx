'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { 
  AudioLines, LogOut, History, User, Shield, Users, Settings, ArrowLeft, Menu, X, Star, Sparkles, ChevronUp, LayoutDashboard, Mic, Lock
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { UpgradeModal } from './UpgradeModal';
import ProfileAvatar from './ProfileAvatar';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  isAdminArea?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  exact?: boolean;
  icon: any;
  isPremiumOnly?: boolean;
}

export default function WorkspaceLayout({ children, isAdminArea = false }: WorkspaceLayoutProps) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('AI Feature');
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
  const userNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', exact: true, icon: LayoutDashboard },
    { name: 'Speech Studio', href: '/dashboard/speech-studio', exact: true, icon: Mic },
    { name: 'AI Scene Generator', href: '/dashboard/ai-scene-generator', exact: true, icon: Sparkles, isPremiumOnly: true },
    { name: 'AI Voice Clone Generator', href: '/dashboard/voice-studio', exact: true, icon: Star, isPremiumOnly: true },
    { name: 'Voice Library', href: '/dashboard/voice-library', exact: true, icon: AudioLines },
    { name: 'History', href: '/dashboard/history', exact: true, icon: History },
    { name: 'Profile', href: '/profile', exact: true, icon: User },
    { name: 'Settings', href: '/settings', exact: true, icon: Settings },
  ];

  // Navigation definition for Admin portal
  const adminNavItems: NavItem[] = [
    { name: 'Control Dashboard', href: '/admin/dashboard', exact: true, icon: Shield }
  ];

  const currentNavItems = isAdminArea ? adminNavItems : userNavItems;

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.href === '/dashboard' || item.href === '/admin/dashboard') {
      return pathname === item.href;
    }
    if (item.href === '/dashboard/voice-studio' || item.href === '/dashboard/voice-clone') {
      return pathname === '/dashboard/voice-studio' || pathname === '/dashboard/voice-clone';
    }
    if (item.href === '/dashboard/ai-scene-generator' || item.href === '/dashboard/scene-generator') {
      return pathname === '/dashboard/ai-scene-generator' || pathname === '/dashboard/scene-generator';
    }
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const handleNavClick = (e: React.MouseEvent, item: { name: string; href: string; isPremiumOnly?: boolean }) => {
    const isLocked = item.isPremiumOnly && !user.premiumAccess;
    if (isLocked) {
      e.preventDefault();
      showToast('Premium access required to use this feature.', 'error');
      setLockedFeatureName(item.name);
      setUpgradeModalOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: { name: string; href: string; isPremiumOnly?: boolean }) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const isLocked = item.isPremiumOnly && !user.premiumAccess;
      if (isLocked) {
        showToast('Premium access required to use this feature.', 'error');
        setLockedFeatureName(item.name);
        setUpgradeModalOpen(true);
      } else {
        router.push(item.href);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col md:flex-row relative">
      {/* Sidebar - Desktop (Minimal SaaS aesthetic inspired by Linear / Vercel) */}
      <aside className="hidden md:flex w-60 border-r border-[var(--border-app)] bg-[var(--bg-sidebar)] p-4 flex-col shrink-0 h-screen sticky top-0 z-40 transition-colors duration-200">
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Logo Header */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group shrink-0">
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
          <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto pr-1 select-none" aria-label="Main Navigation">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider px-3 mb-1">
              Platform
            </span>
            
            {currentNavItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const isLocked = item.isPremiumOnly && !user.premiumAccess;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={0}
                  onClick={(e) => handleNavClick(e, item)}
                  onKeyDown={(e) => handleKeyDown(e, item)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active 
                      ? 'bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {/* Active Indicator Accent Line */}
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-500 rounded-r" />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-indigo-500' : 'text-[var(--text-muted)]'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Premium</span>
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Quick Switch for Admin & Sub-Admin */}
            {(user.role === 'admin' || user.role === 'sub_admin') && (
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
                    href="/admin/dashboard"
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
        <div className="pt-4 border-t border-[var(--border-app)] flex flex-col gap-2 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors flex-1 min-w-0 text-left cursor-pointer"
            >
              <ProfileAvatar
                name={user.name}
                email={user.email}
                imageUrl={user.profileImageUrl || user.profileImage}
                role={user.role}
                premiumAccess={user.premiumAccess}
                size="sm"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  {user.role === 'admin' ? 'Administrator' : user.role === 'sub_admin' ? 'Sub Admin' : (user.premiumAccess ? 'Premium Member' : 'Free Plan')}
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
                const active = isActive(item);
                const Icon = item.icon;
                const isLocked = item.isPremiumOnly && !user.premiumAccess;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleNavClick(e, item);
                    }}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      active 
                        ? 'bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Premium</span>
                      </span>
                    )}
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

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={lockedFeatureName}
      />
    </div>
  );
}
