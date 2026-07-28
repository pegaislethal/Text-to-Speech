'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, Star, RefreshCw, ShieldAlert, ArrowLeft, Check } from 'lucide-react';
import WorkspaceLayout from './WorkspaceLayout';
import { UpgradeModal } from './UpgradeModal';

interface PremiumRouteGuardProps {
  children: React.ReactNode;
  featureTitle?: string;
  featureDescription?: string;
}

export default function PremiumRouteGuard({
  children,
  featureTitle = 'Premium AI Feature',
  featureDescription = 'This feature is exclusively reserved for Premium Members. Upgrade your account to gain unlimited access.',
}: PremiumRouteGuardProps) {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Verifying premium permissions...
          </span>
        </div>
      </div>
    );
  }

  if (!user.premiumAccess) {
    return (
      <WorkspaceLayout>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
          <div className="bg-[var(--bg-card)] border border-indigo-500/30 rounded-3xl p-8 sm:p-12 max-w-xl w-full flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r from-indigo-900/20 via-violet-900/30 to-purple-900/20 -z-0" />

            {/* Lock Badge */}
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl z-10">
              <Lock className="w-10 h-10" />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center gap-2 z-10">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                Premium Feature Locked
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {featureTitle}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-md leading-relaxed">
                {featureDescription}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="w-full bg-[var(--bg-app)] border border-[var(--border-app)] rounded-2xl p-5 flex flex-col gap-3 text-left z-10">
              <div className="flex items-center gap-3 text-xs text-[var(--text-primary)] font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Full access to Multi-Voice AI Scene Generator</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-primary)] font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Custom Voice Cloning Infrastructure & Embedding Extraction</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-primary)] font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Unlock Premium Default Voices Catalog</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full z-10 pt-2">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Premium
              </button>
              <button
                onClick={() => router.push('/dashboard/speech-studio')}
                className="w-full sm:w-auto py-3 px-5 rounded-xl border border-[var(--border-app)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Speech Studio
              </button>
            </div>
          </div>
        </div>

        <UpgradeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          featureName={featureTitle}
        />
      </WorkspaceLayout>
    );
  }

  return <>{children}</>;
}
