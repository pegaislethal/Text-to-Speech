'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { GoogleLogin } from '@react-oauth/google';
import { Sparkles, AlertCircle, RefreshCw, ArrowRight, User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';

export default function UserLogin() {
  const { user, loginWithGoogle, userLogin, loginBypass, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDevBypass, setShowDevBypass] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === 'success') {
        setSuccessMsg('Logged out successfully.');
      }
      if (params.get('expired') === 'true') {
        setErrorMsg('Your session has expired. Please log in again.');
      }
    }
  }, []);

  React.useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMsg(null);
    if (credentialResponse.credential) {
      try {
        await loginWithGoogle(credentialResponse.credential);
      } catch (err: any) {
        setErrorMsg(err.message || 'Google authentication failed.');
      }
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Google Sign-In was unsuccessful. Please try again.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userLogin(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row selection:bg-indigo-50 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Left Column: Branding */}
      <div className="md:w-1/2 p-6 sm:p-10 md:p-16 bg-card border-b md:border-b-0 md:border-r border-input flex flex-col justify-between relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

        {/* Top Logo & Theme Toggle */}
        <div className="flex items-center justify-between z-10">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group w-fit">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">21st Tech Company</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Hero Copy */}
        <div className="my-8 sm:my-12 md:my-0 flex flex-col gap-4 sm:gap-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-[11px] text-indigo-400 font-bold uppercase tracking-wider w-fit">
            <Sparkles className="w-3.5 h-3.5" /> User Speech Workspace
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-[var(--text-primary)]">
            Natural Voices. <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Synthesized Instantly.
            </span>
          </h1>

          <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed font-medium">
            Access Edge AI neural models, continuous voice speed manipulation, and instant audio stem downloads.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[var(--text-muted)] font-medium border-t border-[var(--border-app)]">
            <span>&bull; Google Single Sign-On</span>
            <span>&bull; Free Credit Allocations</span>
          </div>
        </div>

        {/* Bottom Switch Link */}
        <div className="z-10 flex items-center justify-between text-xs text-[var(--text-muted)] pt-4 md:pt-0">
          <span>Are you a System Administrator?</span>
          <Link href="/admin/login" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            Admin Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: User Auth Card */}
      <div className="md:w-1/2 p-4 sm:p-8 md:p-16 flex flex-col items-center justify-center relative bg-background border-t md:border-t-0 border-[var(--border-app)]">
        <div className="w-full max-w-md flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Welcome Back</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Sign in to your account with Google or Email.</p>
          </div>

          {successMsg && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--status-error-text)]/20 bg-[var(--status-error-bg)] text-[var(--status-error-text)] text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Auth Card Container */}
          <div className="p-5 sm:p-8 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)]/60 backdrop-blur-xl shadow-2xl flex flex-col gap-5 sm:gap-6">
            {/* Google SSO Button */}
            <div className="w-full flex justify-center py-2 bg-[var(--bg-input)]/65 border border-[var(--border-app)] rounded-xl hover:border-indigo-500/20 transition duration-200 overflow-x-auto">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="pill"
                text="continue_with"
                width="280px"
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[var(--border-app)]" />
              <span className="absolute px-3 bg-[var(--bg-card)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Or Continue With Email
              </span>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-app)] focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-app)] focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-10 py-3 outline-none transition placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="mt-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading || isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-[var(--text-muted)] text-[11px] font-medium leading-relaxed">
              Don't have an account yet?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Hidden Dev Bypass Trigger */}
          <div className="mt-2 text-center">
            <button
              onClick={() => setShowDevBypass(!showDevBypass)}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-semibold"
            >
              [Developer Sandbox Override]
            </button>
            {showDevBypass && (
              <div className="mt-3 p-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-2.5 shadow-md">
                <button
                  onClick={() => loginBypass('user')}
                  className="py-2.5 px-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[var(--bg-card-hover)] transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-indigo-400" /> Bypass as User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
