'use client';

import React from 'react';
import { useAuth } from '../../context/authContext';
import { GoogleLogin } from '@react-oauth/google';
import { AudioLines, Sparkles, AlertCircle, RefreshCw, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

export default function UserSignup() {
  const { loginWithGoogle, loginBypass, loading } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMsg(null);
    if (credentialResponse.credential) {
      try {
        await loginWithGoogle(credentialResponse.credential);
      } catch (err: any) {
        setErrorMsg(err.message || 'Google registration failed.');
      }
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Google Sign-Up failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[#070708] flex flex-col md:flex-row text-neutral-200 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Branding */}
      <div className="md:w-1/2 p-8 md:p-16 bg-gradient-to-br from-neutral-950 via-[#0a0a0e] to-indigo-950/30 border-b md:border-b-0 md:border-r border-neutral-900 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 group w-fit z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <AudioLines className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">21st Tech Company</span>
        </Link>

        <div className="my-12 md:my-0 flex flex-col gap-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-[11px] text-indigo-400 font-bold uppercase tracking-wider w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Instant Onboarding
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Create Your <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Speech Studio Profile.
            </span>
          </h1>

          <p className="text-neutral-400 text-sm leading-relaxed font-medium">
            Sign up with your Google account to receive 100 free neural TTS credits immediately.
          </p>
        </div>

        <div className="z-10 flex items-center justify-between text-xs text-neutral-500">
          <span>Are you an Administrator?</span>
          <Link href="/admin/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            Admin Signup <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: User Auth Card */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center relative bg-[#070708]">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create Member Account</h2>
            <p className="text-xs text-neutral-400 font-medium">Sign up using your Google Gmail credentials.</p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl border border-red-950 bg-red-950/20 text-red-400 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Creating Profile...</span>
              </div>
            ) : (
              <div className="w-full flex justify-center py-2 bg-neutral-900/60 border border-neutral-800 rounded-xl hover:border-neutral-750 transition duration-200">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  text="signup_with"
                  width="280px"
                />
              </div>
            )}

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
