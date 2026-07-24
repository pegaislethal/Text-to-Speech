'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/authContext';
import { AudioLines, Shield, AlertCircle, RefreshCw, ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
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
    <div className="min-h-screen bg-[#070708] flex flex-col md:flex-row text-neutral-200 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Admin Branding */}
      <div className="md:w-1/2 p-8 md:p-16 bg-gradient-to-br from-neutral-950 via-[#0d0a14] to-violet-950/30 border-b md:border-b-0 md:border-r border-neutral-900 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 group w-fit z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-300">
            <AudioLines className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">21st Tech Operator</span>
        </Link>

        <div className="my-12 md:my-0 flex flex-col gap-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/25 bg-violet-500/5 text-[11px] text-violet-400 font-bold uppercase tracking-wider w-fit">
            <Shield className="w-3.5 h-3.5" /> Restricted Admin Portal
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            System Control & <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              User Management.
            </span>
          </h1>

          <p className="text-neutral-400 text-sm leading-relaxed font-medium">
            Authorized administrator access only. Manage system quotas, grant premium access, and configure Edge voice parameters.
          </p>
        </div>

        <div className="z-10 flex items-center justify-between text-xs text-neutral-500">
          <span>Looking for normal user login?</span>
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1">
            User Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: Admin Auth Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center relative bg-[#070708]">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Administrator Login</h2>
            <p className="text-xs text-neutral-400 font-medium">Enter your admin email and password.</p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl border border-red-950 bg-red-950/20 text-red-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl shadow-2xl flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@21sttech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 transition active:scale-98 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Log In as Administrator'}
            </button>

            <div className="mt-2 text-center text-neutral-500 text-[11px] font-medium">
              Need an admin account?{' '}
              <Link href="/admin/signup" className="text-violet-400 hover:text-violet-300 font-bold underline">
                Register Admin
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
