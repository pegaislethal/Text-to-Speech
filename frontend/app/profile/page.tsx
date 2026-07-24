'use client';

import React from 'react';
import { useAuth } from '../../context/authContext';
import { User, Mail, Shield, Zap, Sparkles, CheckCircle2, History, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const creditsRemaining = user.freeCredits - user.usedCredits;
  const usagePercentage = Math.min(100, (user.usedCredits / user.freeCredits) * 100);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-neutral-900 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
          Account Profile
        </h1>
        <p className="text-neutral-400 text-sm mt-1">Manage your account profile, settings, and workspace utilization plan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: General Profile Info Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl shadow-xl flex flex-col gap-6">
            <h3 className="text-sm font-bold text-neutral-300">Personal Information</h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-neutral-900/20 border border-neutral-900/60">
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                alt={user.name}
                className="w-20 h-20 rounded-full border border-neutral-800 object-cover shadow-lg"
              />
              <div className="flex flex-col gap-1 text-center sm:text-left min-w-0">
                <span className="text-lg font-bold text-neutral-100">{user.name}</span>
                <span className="text-sm text-neutral-400 flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-4 h-4 text-neutral-500" /> {user.email}
                </span>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {user.role === 'admin' ? 'Administrator' : 'Team Member'}
                  </span>
                  {user.premiumAccess ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Premium
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-500">
                      Free Tier
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile fields detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-neutral-900 bg-neutral-950/20">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Account ID</span>
                <span className="text-xs font-semibold text-neutral-300 truncate">{user.id}</span>
              </div>
              <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-neutral-900 bg-neutral-950/20">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Identity Provider</span>
                <span className="text-xs font-semibold text-neutral-300">Google OAuth 2.0</span>
              </div>
            </div>
          </div>

          {/* Additional details about service usage */}
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-neutral-300">Workspace Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-200">High-fidelity Synthesizer</span>
                  <span className="text-[11px] text-neutral-500 leading-normal mt-0.5">Produce humanlike edge voices using advanced TTS models.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-200">MP3 Downloading</span>
                  <span className="text-[11px] text-neutral-500 leading-normal mt-0.5">Download synthesized assets to use in video voiceovers.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-200">Local History Log</span>
                  <span className="text-[11px] text-neutral-500 leading-normal mt-0.5">Store and retrieve previously generated audio stems at any time.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-200">Premium Accents</span>
                  <span className="text-[11px] text-neutral-500 leading-normal mt-0.5">Unlock localized English voices with professional intonation.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Plan & Credit Allocation Card */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl shadow-xl flex flex-col gap-5">
            <div className="flex items-center gap-2 text-neutral-300">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold">Credit Limit Plan</h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black tracking-tight text-neutral-100">
                  {user.premiumAccess ? 'Unlimited' : `${creditsRemaining}`}
                </span>
                <span className="text-xs text-neutral-500 font-semibold uppercase">
                  {user.premiumAccess ? '' : 'credits left'}
                </span>
              </div>

              {!user.premiumAccess ? (
                <>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 font-semibold uppercase">
                    <span>Used: {user.usedCredits}</span>
                    <span>Total: {user.freeCredits}</span>
                  </div>
                </>
              ) : (
                <div className="py-2.5 px-3 rounded-xl bg-indigo-950/15 border border-indigo-900/30 text-indigo-400 text-xs font-semibold leading-relaxed">
                  You are currently on a premium system administrator plan. Unlimited credits and premium voices are enabled.
                </div>
              )}
            </div>

            <div className="border-t border-neutral-900/80 pt-4 flex flex-col gap-3.5 text-xs text-neutral-400">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Plan Type</span>
                <span className="font-semibold text-neutral-300">{user.premiumAccess ? 'Premium Administrator' : 'Internal Free Plan'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Credits Reset</span>
                <span className="font-semibold text-neutral-300">None Scheduled</span>
              </div>
            </div>
          </div>

          {/* Need help note */}
          <div className="p-5 rounded-2xl border border-indigo-950/20 bg-indigo-950/5 flex gap-3 text-indigo-400">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold">Quota Upgrades</span>
              <p className="text-[11px] text-indigo-300/80 leading-relaxed">
                Need more free credits or custom voice features for your project? Contact your administrator to increase your default free credit allocation limit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
