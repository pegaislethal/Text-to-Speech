'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { Play, RefreshCw, Lock, Check, Sparkles, User, Radio, Mic } from 'lucide-react';

export interface VoiceOption {
  voiceId: string;
  name: string;
  category?: string;
  language?: string;
  description?: string;
  gender?: 'Male' | 'Female' | 'Neutral' | string;
  style?: string;
  premium: boolean;
  isPremium?: boolean;
}

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
  systemVoices: VoiceOption[];
  customVoices: VoiceOption[];
  previewingVoiceId: string | null;
  onPreviewVoice: (voice: VoiceOption) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onChange,
  systemVoices,
  customVoices,
  previewingVoiceId,
  onPreviewVoice,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'custom'>('all');

  const allVoices = [...systemVoices, ...customVoices];

  const filteredVoices = allVoices.filter((v) => {
    if (activeTab === 'system') return systemVoices.some((sv) => sv.voiceId === v.voiceId);
    if (activeTab === 'custom') return customVoices.some((cv) => cv.voiceId === v.voiceId);
    return true;
  });

  const handleVoiceSelect = (v: VoiceOption) => {
    const isLocked = (v.premium || v.isPremium) && user && !user.premiumAccess;
    if (isLocked) {
      showToast('Upgrade to Premium to unlock this voice.', 'error');
      return;
    }
    onChange(v.voiceId);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] w-fit select-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Voices ({allVoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          System Default ({systemVoices.length})
        </button>
        {customVoices.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'custom'
                ? 'bg-[var(--bg-card)] text-indigo-500 shadow-sm border border-[var(--border-app)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Custom Cloned ({customVoices.length})
          </button>
        )}
      </div>

      {/* Interactive Voice Cards Grid */}
      {filteredVoices.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--border-app)] rounded-2xl bg-[var(--bg-card)]/50 flex flex-col items-center gap-2">
          <Mic className="w-6 h-6 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">No voice profiles found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredVoices.map((v) => {
            const isSelected = selectedVoiceId === v.voiceId;
            const isPremiumVoice = v.premium || v.isPremium;
            const isLocked = isPremiumVoice && user && !user.premiumAccess;
            const isPreviewing = previewingVoiceId === v.voiceId;

            return (
              <div
                key={v.voiceId}
                onClick={() => handleVoiceSelect(v)}
                className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                    : 'border-[var(--border-app)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/30'
                }`}
              >
                {/* Accent selection indicator */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-indigo-500/30 to-transparent pointer-events-none rounded-bl-full" />
                )}

                {/* Top Row: Name, Badges */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-500' : 'text-[var(--text-primary)]'}`}>
                        {v.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPremiumVoice ? (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase flex items-center gap-1 ${
                            isLocked
                              ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)]'
                              : 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                          }`}
                        >
                          {isLocked && <Lock className="w-2.5 h-2.5" />}
                          {isLocked ? 'Locked' : 'Premium'}
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Free
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category / Gender Badge */}
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-medium">
                    {v.category && (
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                        {v.category}
                      </span>
                    )}
                    {v.gender && <span>&bull; {v.gender}</span>}
                  </div>

                  {/* Description */}
                  {v.description && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-0.5 font-normal">
                      {v.description}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Actions (Preview & Select Grid) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-app)] mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(v);
                    }}
                    disabled={isPreviewing}
                    className="w-full px-2 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-[11px] font-bold text-indigo-500 flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {isPreviewing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500 shrink-0" />
                    )}
                    <span className="truncate">{isPreviewing ? 'Loading...' : 'Preview'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoiceSelect(v);
                    }}
                    className={`w-full px-2 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : isLocked
                        ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)]'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Selected</span>
                      </>
                    ) : isLocked ? (
                      <span>Locked</span>
                    ) : (
                      <span>Use Voice</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
