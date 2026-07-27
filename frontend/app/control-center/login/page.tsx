'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/authContext';
import { Shield, AlertCircle, RefreshCw, ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '../../../components/ThemeToggle';

export default function ControlCenterLogin() {
  const { adminLogin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    try {
      await adminLogin(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Admin login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col md:flex-row text-[var(--text-primary)] selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Admin Branding */}
      <div className="md:w-1/2 p-8 md:p-16 bg-[var(--bg-sidebar)] border-b md:border-b-0 md:border-r border-[var(--border-app)] flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between w-full z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-black overflow-hidden flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">21st Tech Control Center</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="my-12 md:my-0 flex flex-col gap-5 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/25 bg-violet-500/10 text-xs text-violet-400 font-semibold uppercase tracking-wider w-fit">
            <Shield className="w-3.5 h-3.5" /> Isolated Admin Authentication
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            System Administration & <br />
            <span className="text-indigo-400">Control Center.</span>
          </h1>

          <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium">
            Dedicated administrative operator panel for managing user quotas, toggling premium features, and overseeing system security.
          </p>
        </div>

        <div className="z-10 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Looking for regular user login?</span>
          <Link href="/login" className="text-indigo-400 hover:underline font-semibold flex items-center gap-1">
            User Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: Admin Auth Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center relative bg-[var(--bg-app)]">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Admin Sign In</h2>
            <p className="text-xs text-[var(--text-secondary)]">Enter your administrator email and password.</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-md flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  placeholder="admin@21sttech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition active:scale-98 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Log In to Control Center'}
            </button>

            <div className="mt-2 text-center text-[var(--text-muted)] text-xs">
              Need an admin account?{' '}
              <Link href="/control-center/signup" className="text-indigo-400 font-semibold hover:underline">
                Register Admin
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
