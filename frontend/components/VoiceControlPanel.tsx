'use client';

import React, { useState } from 'react';
import { VoiceOption } from './VoiceCard';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { saveVoiceProfileApi, VoiceProfileData } from '../services/api';
import { SlidersHorizontal, Play, Pause, RefreshCw, BookmarkPlus, Check, Sparkles } from 'lucide-react';

interface VoiceControlPanelProps {
  voice: VoiceOption;
  onPreviewWithSettings: (
    voice: VoiceOption,
    settings: {
      speed: number;
      pitch: number;
      depth: number;
      tone: string;
      emotion: string;
    }
  ) => void;
  isPreviewing?: boolean;
  isPlayingPreview?: boolean;
  onProfileSaved?: (newProfile: VoiceProfileData) => void;
  initialSettings?: Partial<VoiceProfileData>;
  compact?: boolean;
}

export const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  voice,
  onPreviewWithSettings,
  isPreviewing = false,
  isPlayingPreview = false,
  onProfileSaved,
  initialSettings,
  compact = false,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [speed, setSpeed] = useState<number>(initialSettings?.speed ?? 1.0);
  const [pitch, setPitch] = useState<number>(initialSettings?.pitch ?? 0);
  const [depth, setDepth] = useState<number>(initialSettings?.voiceDepth ?? 50);
  const [tone, setTone] = useState<string>(initialSettings?.tonePreset ?? 'Natural');
  const [emotion, setEmotion] = useState<string>(initialSettings?.emotion ?? 'Neutral');

  const [showSaveForm, setShowSaveForm] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(
    initialSettings?.profileName || `${voice.name} - ${tone}`
  );
  const [saving, setSaving] = useState<boolean>(false);

  const handlePreview = () => {
    onPreviewWithSettings(voice, {
      speed,
      pitch,
      depth,
      tone,
      emotion,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Please enter a profile name', 'error');
      return;
    }

    if (!user) {
      showToast('Please log in to save voice profiles', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await saveVoiceProfileApi({
        voiceId: voice.voiceId,
        voiceName: voice.name,
        profileName: profileName.trim(),
        speed,
        pitch,
        voiceDepth: depth,
        tonePreset: tone,
        emotion,
      });

      if (res.success) {
        showToast(`Saved profile "${profileName.trim()}"!`, 'success');
        setShowSaveForm(false);
        if (onProfileSaved && res.profile) {
          onProfileSaved(res.profile);
        }
      } else {
        showToast(res.message || 'Failed to save voice profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save voice profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-input)]/80 border border-indigo-500/20 shadow-inner flex flex-col gap-4 text-left w-full animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-app)]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
            Voice Controls Panel
          </span>
        </div>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
          {voice.name}
        </span>
      </div>

      {/* Grid of Sliders & Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Speed Slider (0.5x - 1.5x) */}
        <div className="flex flex-col gap-1 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-app)]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-secondary)] text-[11px]">Speed</span>
            <span className="font-mono text-indigo-400 text-[11px]">{speed}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
          </div>
        </div>

        {/* Pitch Offset (-12 to +12) */}
        <div className="flex flex-col gap-1 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-app)]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-secondary)] text-[11px]">Pitch Offset</span>
            <span className="font-mono text-indigo-400 text-[11px]">{pitch > 0 ? `+${pitch}` : pitch}</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
            <span>-12</span>
            <span>0</span>
            <span>+12</span>
          </div>
        </div>

        {/* Voice Depth (0 - 100) */}
        <div className="flex flex-col gap-1 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-app)]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-secondary)] text-[11px]">Voice Depth</span>
            <span className="font-mono text-indigo-400 text-[11px]">{depth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* EQ Tone Preset */}
        <div className="flex flex-col gap-1 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-app)]">
          <label className="text-[11px] font-semibold text-[var(--text-secondary)]">EQ Tone Preset</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs rounded-lg border border-[var(--border-app)] outline-none font-medium cursor-pointer"
          >
            <option value="Natural">Natural</option>
            <option value="Documentary">Documentary</option>
            <option value="Cinematic">Cinematic</option>
            <option value="Podcast">Podcast</option>
            <option value="Radio">Radio</option>
          </select>
        </div>

        {/* Emotion Preset */}
        <div className="flex flex-col gap-1 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-app)]">
          <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Emotion</label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs rounded-lg border border-[var(--border-app)] outline-none font-medium cursor-pointer"
          >
            <option value="Neutral">Neutral</option>
            <option value="Serious">Serious</option>
            <option value="Dramatic">Dramatic</option>
          </select>
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--border-app)]">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPreviewing}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
        >
          {isPreviewing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : isPlayingPreview ? (
            <Pause className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white text-white" />
          )}
          <span>{isPreviewing ? 'Generating Preview...' : isPlayingPreview ? 'Playing Preview' : 'Preview Voice'}</span>
        </button>

        {!showSaveForm ? (
          <button
            type="button"
            onClick={() => {
              setProfileName(`${voice.name} - ${tone}`);
              setShowSaveForm(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-500 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Voice Profile</span>
          </button>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Profile name (e.g. Documentary Style)"
              className="flex-1 px-3 py-1.5 bg-[var(--bg-card)] text-[var(--text-primary)] text-xs rounded-xl border border-indigo-500/40 focus:border-indigo-500 outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSaveForm(false)}
              className="px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default VoiceControlPanel;
