'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/authContext';
import { Shield, AlertCircle, RefreshCw, ArrowRight, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminSignup() {
  const { adminSignup, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      await adminSignup(name, email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Admin registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground selection:bg-indigo-50 selection:text-white transition-colors duration-200">
      {/* Left Column: Admin Branding */}
      <div className="md:w-1/2 p-8 md:p-16 bg-card border-b md:border-b-0 md:border-r border-[var(--border-app)] flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 group w-fit z-10">
          <div className="w-10 h-10 rounded-xl bg-black overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">21st Tech Operator</span>
        </Link>

        <div className="my-12 md:my-0 flex flex-col gap-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/25 bg-violet-500/5 text-[11px] text-violet-400 font-bold uppercase tracking-wider w-fit">
            <Shield className="w-3.5 h-3.5" /> Administrator Registration
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-[var(--text-primary)]">
            Register System <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Operator Account.
            </span>
          </h1>

          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">
            Create an administrator account to oversee user management, voice settings, system statistics, and premium access privileges.
          </p>
        </div>

        <div className="z-10 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Already registered as admin?</span>
          <Link href="/admin/login" className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1">
            Admin Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: Admin Signup Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center relative bg-background border-t md:border-t-0 border-[var(--border-app)]">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Create Admin Account</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Fill in credentials to register an administrator profile.</p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl border border-[var(--status-error-text)]/20 bg-[var(--status-error-bg)] text-[var(--status-error-text)] text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)]/60 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  placeholder="System Operator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50 transition placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  placeholder="admin@21sttech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50 transition placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50 transition placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500/50 transition placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register Administrator Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
