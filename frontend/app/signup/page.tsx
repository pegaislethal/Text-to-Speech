'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { GoogleLogin } from '@react-oauth/google';
import { Sparkles, AlertCircle, RefreshCw, ArrowRight, User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';

export default function UserSignup() {
  const { user, loginWithGoogle, userSignup, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setErrorMsg(err.message || 'Google signup failed.');
      }
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Google Sign-Up was unsuccessful. Please try again.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name || !email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userSignup(name, email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Left Column: Branding */}
      <div className="md:w-1/2 p-6 sm:p-10 md:p-16 bg-card border-b md:border-b-0 md:border-r border-input flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

        <div className="flex items-center justify-between z-10">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group w-fit">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">21st Tech Company</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="my-8 sm:my-12 md:my-0 flex flex-col gap-4 sm:gap-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-[11px] text-indigo-400 font-bold uppercase tracking-wider w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Instant Onboarding
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Create Your <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Speech Studio Profile.
            </span>
          </h1>

          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed font-medium">
            Sign up today to receive 100 free neural TTS credits immediately.
          </p>

          <div className="pt-4 flex flex-col gap-2 text-xs text-neutral-400 border-t border-neutral-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100 Free Neural Speech Credits upon registration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Access to all Edge AI voice synthesis models</span>
            </div>
          </div>
        </div>

        <div className="z-10 flex items-center justify-between text-xs text-neutral-500 pt-4 md:pt-0">
          <span>Are you an Administrator?</span>
          <Link href="/admin/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            Admin Signup <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: User Auth Card */}
      <div className="md:w-1/2 p-4 sm:p-8 md:p-16 flex flex-col items-center justify-center relative bg-[#070708]">
        <div className="w-full max-w-md flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Create Member Account</h2>
            <p className="text-xs text-neutral-400 font-medium">Sign up using Google or Email.</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-red-950 bg-red-950/20 text-red-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Auth Card Container */}
          <div className="p-5 sm:p-8 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl shadow-2xl flex flex-col gap-5 sm:gap-6">
            {/* Google SSO Button */}
            <div className="w-full flex justify-center py-2 bg-neutral-900/60 border border-neutral-800 rounded-xl hover:border-neutral-750 transition duration-200 overflow-x-auto">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="pill"
                text="signup_with"
                width="280px"
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-neutral-900" />
              <span className="absolute px-3 bg-[#0a0a0d] text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                Or Register With Email
              </span>
            </div>

            {/* Email + Password Signup Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white text-xs rounded-xl pl-10 pr-10 py-3 outline-none transition placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="mt-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading || isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Account & Get 100 Credits <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-neutral-500 text-[11px] font-medium leading-relaxed">
              Already registered?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
