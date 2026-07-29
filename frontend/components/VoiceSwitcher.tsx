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

  // Extract style tags array for chips
  const tags: string[] = [];
  if (currentVoice.style) tags.push(currentVoice.style);
  if (currentVoice.category && currentVoice.category !== currentVoice.style && currentVoice.category !== 'custom') {
    tags.push(currentVoice.category);
  }
  if (tags.length === 0) {
    tags.push('Narration');
  }

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
    <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-xl flex flex-col gap-5 w-full min-h-[320px] justify-between">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-app)]">
        <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label} ({safeIndex + 1}/{voices.length})
        </span>

        {onOpenLibrary && (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Browse Library</span>
          </button>
        )}
      </div>

      {/* VOICE SELECTOR BODY */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full flex-1">
        {/* Desktop Circular Left Arrow (44px x 44px) */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={voices.length <= 1}
          title="Previous Voice (←)"
          className="hidden sm:flex w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] items-center justify-center transition shadow-md shrink-0 cursor-pointer disabled:opacity-30 self-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* VOICE CARD (320px Desktop Width, 260px Min-Height) */}
        <div
          className={`w-full max-w-[340px] sm:w-[320px] min-h-[260px] p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-app)] shadow-md flex flex-col justify-between gap-4 transition-all duration-200 shrink-0 ${
            animating ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex flex-col gap-3 min-w-0">
            {/* 1. Voice Icon & Badge */}
            <div className="flex items-center justify-between gap-2">
              {isCustomVoice ? (
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
              )}

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

            {/* 2. Voice Name & 3. Accent/Gender */}
            <div className="flex flex-col min-w-0">
              <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-2 break-words">
                {currentVoice.name}
              </h3>
              <span className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                {currentVoice.accent || currentVoice.language || 'American Male'}
              </span>
            </div>

            {/* 4. Style Tags (Small Rounded Chips) */}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] text-[11px] font-bold text-indigo-400 capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 5. Description */}
            {currentVoice.description && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal line-clamp-3 break-words">
                {currentVoice.description}
              </p>
            )}
          </div>

          {/* 6. Preview Button (Height 44px) */}
          {isLocked ? (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center text-xs font-bold text-indigo-400">
              Upgrade to Premium to synthesize with this voice
            </div>
          ) : (
            <div className="pt-2 border-t border-[var(--border-app)]">
              <button
                type="button"
                onClick={() => onPreviewVoice(currentVoice)}
                disabled={Boolean(previewingVoiceId)}
                className="w-full h-11 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-xs font-bold text-indigo-500 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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

        {/* Desktop Circular Right Arrow (44px x 44px) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={voices.length <= 1}
          title="Next Voice (→)"
          className="hidden sm:flex w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] items-center justify-center transition shadow-md shrink-0 cursor-pointer disabled:opacity-30 self-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Mobile Navigation Controls Row */}
        <div className="flex sm:hidden items-center justify-center gap-4 w-full pt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={voices.length <= 1}
            title="Previous Voice"
            className="w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] flex items-center justify-center transition shadow-md cursor-pointer disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={voices.length <= 1}
            title="Next Voice"
            className="w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] flex items-center justify-center transition shadow-md cursor-pointer disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSwitcher;
