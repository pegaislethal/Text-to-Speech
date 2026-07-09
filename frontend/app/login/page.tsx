'use client';

import { useAuth } from '../../context/authContext';
import { GoogleLogin } from '@react-oauth/google';
import { AudioLines, ShieldAlert, Sparkles, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const { loginWithGoogle, loginBypass, loading } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await loginWithGoogle(credentialResponse.credential);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign In Failed');
    alert('Google Login failed. Using local developer login instead.');
  };

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] -z-10" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <AudioLines className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">21st Tech Company</h2>
          <p className="text-sm text-neutral-400 mt-1">SaaS Speech Workspace Studio</p>
        </div>

        {/* Google Authentication */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-full flex justify-center py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-850 transition">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="rectangular"
              text="signin_with"
            />
          </div>
          <p className="text-neutral-500 text-xs text-center leading-relaxed">
            * To evaluate immediately without configuring Google OAuth Client IDs, use the developer bypass buttons below.
          </p>
        </div>

        {/* Divider */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-900" />
          </div>
          <span className="relative bg-neutral-950 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Developer Bypass
          </span>
        </div>

        {/* Developer login options */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => loginBypass('user')}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition active:scale-98 disabled:opacity-50"
          >
            <User className="w-4 h-4 text-indigo-400" />
            Sign in as Team Member (User Role)
          </button>

          <button
            onClick={() => loginBypass('admin')}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-indigo-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-900/20 transition active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Sign in as Operator (Admin Role)
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-neutral-600 text-xs flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-neutral-600" /> Secure Sandbox Session
      </div>
    </main>
  );
}
