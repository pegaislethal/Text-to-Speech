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
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] text-center text-xs sm:text-sm text-[var(--text-muted)] font-medium">
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
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4 w-full min-h-[300px] justify-between">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-app)]">
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
          {label} ({safeIndex + 1}/{voices.length})
        </span>

        {onOpenLibrary && (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="text-xs sm:text-sm font-bold text-indigo-500 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Grid className="w-4 h-4" />
            <span>Browse Library</span>
          </button>
        )}
      </div>

      {/* Switcher Layout Container */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full flex-1">
        {/* Desktop Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={voices.length <= 1}
          title="Previous Voice (←)"
          className="hidden sm:flex w-11 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] items-center justify-center transition shrink-0 cursor-pointer disabled:opacity-30 self-stretch min-h-[120px]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Selected Voice Card */}
        <div
          className={`flex-1 p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col justify-between gap-3.5 min-w-0 w-full transition-all duration-200 ${
            animating ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex flex-col gap-2.5 min-w-0">
            {/* Top Row: Icon, Name & Lock Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {isCustomVoice ? (
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                )}

                <div className="flex flex-col min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] leading-snug line-clamp-2 break-words">
                    {currentVoice.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {currentVoice.accent && (
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        {currentVoice.accent}
                      </span>
                    )}
                    {currentVoice.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)] font-bold capitalize">
                        {currentVoice.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase shrink-0 flex items-center gap-1 ${
                  isLocked
                    ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)]'
                    : currentVoice.premium || currentVoice.isPremium
                    ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3" />}
                {isLocked ? 'Locked' : currentVoice.premium || currentVoice.isPremium ? 'Premium' : 'Free'}
              </span>
            </div>

            {/* Voice Description */}
            {currentVoice.description && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 break-words font-normal mt-1">
                {currentVoice.description}
              </p>
            )}
          </div>

          {/* Action Footer */}
          {isLocked ? (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center text-xs font-bold text-indigo-400 mt-1">
              Upgrade to Premium to synthesize with this voice
            </div>
          ) : (
            <div className="pt-2 border-t border-[var(--border-app)] mt-1">
              <button
                type="button"
                onClick={() => onPreviewVoice(currentVoice)}
                disabled={Boolean(previewingVoiceId)}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-xs sm:text-sm font-bold text-indigo-500 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {previewingVoiceId === currentVoice.voiceId ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                ) : playingVoiceId === currentVoice.voiceId ? (
                  <Pause className="w-4 h-4 fill-indigo-500 text-indigo-500 animate-pulse" />
                ) : (
                  <Play className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                )}
                <span>
                  {previewingVoiceId === currentVoice.voiceId
                    ? 'Loading preview...'
                    : playingVoiceId === currentVoice.voiceId
                    ? 'Stop Preview'
                    : 'Preview Voice'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={voices.length <= 1}
          title="Next Voice (→)"
          className="hidden sm:flex w-11 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] items-center justify-center transition shrink-0 cursor-pointer disabled:opacity-30 self-stretch min-h-[120px]"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Mobile Navigation Controls Row */}
        <div className="flex sm:hidden items-center justify-between gap-3 w-full pt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={voices.length <= 1}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={voices.length <= 1}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-30"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSwitcher;
