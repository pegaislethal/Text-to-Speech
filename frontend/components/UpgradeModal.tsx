'use client';

import React from 'react';
import { Lock, Sparkles, Star, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName = 'this feature',
}) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    showToast('Premium access required. Contact administrator or grant via Admin Dashboard.', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5 text-[var(--text-primary)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Header */}
        <div className="flex flex-col items-center text-center gap-3 mt-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 inline-block mb-1">
              Premium Required
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Unlock {featureName}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
              Premium access is required to use {featureName}. Upgrade your account to unlock full platform capabilities.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-[var(--bg-app)] border border-[var(--border-app)] rounded-xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] font-medium">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Multi-Voice AI Scene Generator</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] font-medium">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Custom AI Voice Cloning Infrastructure</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] font-medium">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Exclusive Premium Default Voices Catalog</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] font-medium">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>High-Priority Voice Synthesis Queue</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-1">
          <button
            onClick={handleUpgradeClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Premium
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
