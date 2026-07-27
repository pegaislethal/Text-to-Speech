'use client';

import React from 'react';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { Play, RefreshCw, Lock, Check } from 'lucide-react';

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

  const allVoices = [...systemVoices, ...customVoices];

  const handleVoiceSelect = (v: VoiceOption) => {
    const isLocked = (v.premium || v.isPremium) && user && !user.premiumAccess;
    if (isLocked) {
      showToast('Upgrade to Premium to unlock this voice.', 'error');
      return;
    }
    onChange(v.voiceId);
  };

  return (
    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
      {allVoices.length === 0 ? (
        <p className="text-xs text-neutral-500 text-center py-4">No voices available.</p>
      ) : (
        allVoices.map((v) => {
          const isSelected = selectedVoiceId === v.voiceId;
          const isPremiumVoice = v.premium || v.isPremium;
          const isLocked = isPremiumVoice && user && !user.premiumAccess;
          const isPreviewing = previewingVoiceId === v.voiceId;

          return (
            <div
              key={v.voiceId}
              onClick={() => handleVoiceSelect(v)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                isSelected
                  ? 'border-indigo-500/60 bg-indigo-500/10 shadow-md'
                  : 'border-input bg-background/50 hover:bg-background/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{v.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(v);
                    }}
                    disabled={isPreviewing}
                    className="px-2 py-0.5 rounded bg-background border border-input text-[9px] font-bold text-indigo-500 flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isPreviewing ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-indigo-500" />
                    )}
                    <span>Preview</span>
                  </button>

                  {isPremiumVoice && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                        isLocked
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border border-input'
                          : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                      }`}
                    >
                      {isLocked && <Lock className="w-2.5 h-2.5" />}
                      {isLocked ? 'Locked' : 'Premium'}
                    </span>
                  )}
                </div>
              </div>

              {v.description && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal font-medium">
                  {v.description}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
