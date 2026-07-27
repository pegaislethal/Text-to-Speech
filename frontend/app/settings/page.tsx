'use client';

import React, { useState } from 'react';
import WorkspaceLayout from '../../components/WorkspaceLayout';
import SettingsCard from '../../components/SettingsCard';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../context/authContext';
import { useToast } from '../../context/toastContext';
import {
  Moon,
  Bell,
  Shield,
  LogOut,
  Mail,
  User,
  Sparkles,
  Info,
  Calendar,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  const handleToggleNotifications = () => {
    const nextState = !emailNotifications;
    setEmailNotifications(nextState);
    showToast(
      nextState ? 'Email notifications enabled' : 'Email notifications disabled',
      'info'
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Member';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (_) {
      return 'Member';
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-app)] pb-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
              Application Settings
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure your workspace preferences, theme, notifications, and security.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-6">
          {/* Theme & Appearance */}
          <SettingsCard
            title="Appearance & Theme"
            description="Customize how Speech Studio looks on your device."
            icon={Moon}
            action={<ThemeToggle />}
          >
            <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Theme preference is saved locally and applies across all pages automatically.</span>
            </div>
          </SettingsCard>

          {/* Email Notifications */}
          <SettingsCard
            title="Email Notifications"
            description="Control alerts and updates delivered to your email."
            icon={Bell}
            action={
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailNotifications ? 'bg-indigo-600' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-2 border-b border-[var(--border-app)] text-xs">
                <span className="text-[var(--text-secondary)] font-medium">Generation Status Alerts</span>
                <span className="text-[var(--text-muted)]">
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-[var(--text-secondary)] font-medium">Product Updates & Features</span>
                <span className="text-[var(--text-muted)]">
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </SettingsCard>

          {/* Account Overview */}
          <SettingsCard
            title="Account Overview"
            description="Key information registered with your 21st Tech profile."
            icon={User}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-400" /> Primary Email
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {user?.email}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" /> Creation Date
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatDate(user?.createdAt)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" /> Account Role
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                  {user?.role || 'User'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Plan Access
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {user?.premiumAccess ? 'Premium Member (Unlimited)' : 'Free User'}
                </span>
              </div>
            </div>
          </SettingsCard>

          {/* Security & Sessions */}
          <SettingsCard
            title="Security & Sessions"
            description="Manage your active login session and device security."
            icon={Lock}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-950/10 border border-red-900/20">
              <div>
                <h4 className="text-xs font-bold text-neutral-200">Logout All Devices</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Sign out from your current session and clear stored credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <LogOut className="w-4 h-4" /> End Session
              </button>
            </div>
          </SettingsCard>
        </div>
      </div>
  );
}
