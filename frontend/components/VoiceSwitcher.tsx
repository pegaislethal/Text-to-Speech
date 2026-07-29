'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Mic, Sparkles, Lock, Play, Pause, RefreshCw, Grid } from 'lucide-react';
import { VoiceOption } from './VoiceCard';

interface VoiceSwitcherProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  onSelectVoice: (voice: VoiceOption) => void;
  onPreviewVoice: (voice: VoiceOption) => void;
  previewingVoiceId?: string | null;
  playingVoiceId?: string | null;
  isUserPremium?: boolean;
  onOpenLibrary?: () => void;
  label?: string;
}

export const VoiceSwitcher: React.FC<VoiceSwitcherProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  previewingVoiceId,
  playingVoiceId,
  isUserPremium = true,
  onOpenLibrary,
  label = 'Selected Voice',
}) => {
  const [animating, setAnimating] = useState<boolean>(false);

  if (!voices || voices.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] text-center text-xs text-[var(--text-muted)]">
        No voices available
      </div>
    );
  }

  const currentIndex = voices.findIndex((v) => v.voiceId === selectedVoiceId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentVoice = voices[safeIndex] || voices[0];

  const isLocked = Boolean((currentVoice.premium || currentVoice.isPremium) && !isUserPremium);
  const isCustomVoice = Boolean(currentVoice.isCustom || currentVoice.category === 'custom');

  const triggerAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);
  };

  const handlePrev = () => {
    if (voices.length <= 1) return;
    const prevIdx = (safeIndex - 1 + voices.length) % voices.length;
    triggerAnimation();
    onSelectVoice(voices[prevIdx]);
  };

  const handleNext = () => {
    if (voices.length <= 1) return;
    const nextIdx = (safeIndex + 1) % voices.length;
    triggerAnimation();
    onSelectVoice(voices[nextIdx]);
  };

  return (
    <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
          {label} ({safeIndex + 1}/{voices.length})
        </span>

        {onOpenLibrary && (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Browse Library</span>
          </button>
        )}
      </div>

      {/* Main Switcher Controls Area */}
      <div className="flex items-center gap-2">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={voices.length <= 1}
          title="Previous Voice (←)"
          className="w-9 h-16 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] flex items-center justify-center transition shrink-0 cursor-pointer disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Selected Voice Display Card */}
        <div
          className={`flex-1 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-2.5 min-w-0 transition-opacity duration-200 ${
            animating ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {isCustomVoice ? (
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
              )}

              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  {currentVoice.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium truncate">
                  {currentVoice.accent || currentVoice.language || 'American Accent'}
                </span>
              </div>
            </div>

            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 flex items-center gap-1 ${
                isLocked
                  ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)]'
                  : currentVoice.premium || currentVoice.isPremium
                  ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}
            >
              {isLocked && <Lock className="w-2.5 h-2.5" />}
              {isLocked ? 'Locked' : currentVoice.premium || currentVoice.isPremium ? 'Premium' : 'Free'}
            </span>
          </div>

          {currentVoice.description && (
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight line-clamp-2 h-7 overflow-hidden">
              {currentVoice.description}
            </p>
          )}

          {isLocked ? (
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center text-[10px] font-bold text-indigo-400">
              Upgrade to Premium to synthesize with this voice
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-app)]">
              <button
                type="button"
                onClick={() => onPreviewVoice(currentVoice)}
                disabled={Boolean(previewingVoiceId)}
                className="w-full py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-xs font-bold text-indigo-500 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {previewingVoiceId === currentVoice.voiceId ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                ) : playingVoiceId === currentVoice.voiceId ? (
                  <Pause className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500 animate-pulse" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                )}
                <span>
                  {previewingVoiceId === currentVoice.voiceId
                    ? 'Loading...'
                    : playingVoiceId === currentVoice.voiceId
                    ? 'Stop Preview'
                    : 'Preview Voice'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={voices.length <= 1}
          title="Next Voice (→)"
          className="w-9 h-16 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] flex items-center justify-center transition shrink-0 cursor-pointer disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default VoiceSwitcher;
