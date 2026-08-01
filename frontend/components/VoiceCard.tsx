'use client';

import React from 'react';
import { Play, Pause, RefreshCw, Lock, Check, Sparkles, Trash2, Mic, Volume2 } from 'lucide-react';

export interface VoiceOption {
  voiceId: string;
  name: string;
  category?: string;
  language?: string;
  description?: string;
  gender?: 'Male' | 'Female' | 'Neutral' | string;
  style?: string;
  accent?: string;
  premium?: boolean;
  isPremium?: boolean;
  isCustom?: boolean;
  provider?: string;
  createdAt?: string;
  sampleUrl?: string;
}

interface VoiceCardProps {
  voice: VoiceOption;
  isSelected?: boolean;
  isLocked?: boolean;
  isPreviewing?: boolean;
  isPlayingPreview?: boolean;
  onSelect?: (voice: VoiceOption) => void;
  onPreview?: (voice: VoiceOption) => void;
  onDelete?: (voiceId: string) => void;
  onGenerateSpeech?: (voice: VoiceOption) => void;
  actionLabel?: string;
  compact?: boolean;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected = false,
  isLocked = false,
  isPreviewing = false,
  isPlayingPreview = false,
  onSelect,
  onPreview,
  onDelete,
  onGenerateSpeech,
  actionLabel,
  compact = false,
}) => {
  const isCustomVoice = voice.isCustom || voice.category === 'custom';
  const isPremiumVoice = voice.premium || voice.isPremium;

  return (
    <div
      onClick={() => onSelect && onSelect(voice)}
      className={`group relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 overflow-hidden min-h-[160px] w-full shrink-0 ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/50 scale-[1.01]'
          : 'border-[var(--border-app)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/30'
      }`}
    >
      {/* Top Background Ribbon Accent if selected */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/30 to-transparent pointer-events-none rounded-bl-full" />
      )}

      {/* Header Info: Name & Badges */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isCustomVoice ? (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                <Mic className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="flex flex-col min-w-0 flex-1">
              <span className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-500' : 'text-[var(--text-primary)]'}`}>
                {voice.name}
              </span>
              {voice.accent || voice.language ? (
                <span className="text-[10px] text-[var(--text-muted)] font-medium truncate">
                  {voice.accent || voice.language}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isCustomVoice ? (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {voice.provider || 'Cloned'}
              </span>
            ) : isPremiumVoice ? (
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

        {/* Tags Row: Gender, Category, Style */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {voice.gender && (
            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] font-semibold">
              {voice.gender}
            </span>
          )}
          {voice.category && (
            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] capitalize font-semibold">
              {voice.category}
            </span>
          )}
          {voice.style && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              {voice.style}
            </span>
          )}
        </div>

        {/* Description */}
        {voice.description && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-0.5 font-normal h-8 overflow-hidden">
            {voice.description}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border-app)] mt-auto h-10 shrink-0">
        {onPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(voice);
            }}
            disabled={isPreviewing}
            className="flex-1 h-8 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-[11px] font-bold text-indigo-500 flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isPreviewing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
            ) : isPlayingPreview ? (
              <Pause className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500 shrink-0 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500 shrink-0" />
            )}
            <span className="truncate">{isPreviewing ? 'Loading...' : isPlayingPreview ? 'Playing' : 'Preview'}</span>
          </button>
        )}

        {onSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(voice);
            }}
            className={`flex-1 h-8 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
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
                <span className="truncate">Selected</span>
              </>
            ) : isLocked ? (
              <span className="truncate">Locked</span>
            ) : (
              <span className="truncate">{actionLabel || 'Select Voice'}</span>
            )}
          </button>
        )}

        {onGenerateSpeech && !onSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateSpeech(voice);
            }}
            className="flex-1 h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm shadow-indigo-600/20 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="truncate">Generate</span>
          </button>
        )}

        {onDelete && isCustomVoice && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(voice.voiceId);
            }}
            title="Delete custom voice profile"
            className="h-8 w-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition cursor-pointer flex items-center justify-center shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceCard;
