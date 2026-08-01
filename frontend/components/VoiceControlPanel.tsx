'use client';

import React, { useState } from 'react';
import { VoiceOption } from './VoiceCard';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { saveVoiceProfileApi, VoiceProfileData } from '../services/api';
import { SlidersHorizontal, Play, Pause, RefreshCw, BookmarkPlus, Check, Sparkles, X, FileText, ArrowRight, Mic, Volume2 } from 'lucide-react';

interface VoiceControlPanelProps {
  voice: VoiceOption;
  onPreviewWithSettings: (
    voice: VoiceOption,
    textPrompt: string,
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
  onDeselectVoice?: () => void;
  onUseInStudio?: (settings: { speed: number; pitch: number; depth: number; tone: string; emotion: string }) => void;
  initialSettings?: Partial<VoiceProfileData>;
}

export const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  voice,
  onPreviewWithSettings,
  isPreviewing = false,
  isPlayingPreview = false,
  onProfileSaved,
  onDeselectVoice,
  onUseInStudio,
  initialSettings,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [promptText, setPromptText] = useState<string>(
    `Hi, I am ${voice.name}. Welcome to 21st Tech AI Voice Studio.`
  );

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
    if (!promptText.trim()) {
      showToast('Please enter a script prompt to preview audio', 'error');
      return;
    }
    onPreviewWithSettings(voice, promptText.trim(), {
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
    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/30 shadow-2xl backdrop-blur-xl flex flex-col gap-5 text-left w-full relative overflow-hidden transition-all duration-300">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dedicated Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Mic className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                {voice.name}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                {voice.accent || voice.gender || 'AI Voice'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Configure parameters & preview with custom text prompt
            </p>
          </div>
        </div>

        {onDeselectVoice && (
          <button
            type="button"
            onClick={onDeselectVoice}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Deselect Voice"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CUSTOM SCRIPT PROMPT TEXTAREA */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Custom Script Preview Prompt</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {promptText.length} characters
          </span>
        </div>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Type or paste any custom script here to preview how this voice sounds..."
          rows={2}
          className="w-full px-4 py-3 bg-slate-950/70 text-white text-xs rounded-2xl border border-indigo-500/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 leading-relaxed resize-none"
        />
      </div>

      {/* PARAMETERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
        {/* Speed Slider (0.5x - 1.5x) */}
        <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 text-[11px]">Speed</span>
            <span className="font-mono text-indigo-400 text-[11px] font-bold">{speed}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
          </div>
        </div>

        {/* Pitch Offset (-12 to +12) */}
        <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 text-[11px]">Pitch Offset</span>
            <span className="font-mono text-indigo-400 text-[11px] font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>-12</span>
            <span>0</span>
            <span>+12</span>
          </div>
        </div>

        {/* Voice Depth (0 - 100%) */}
        <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 text-[11px]">Voice Depth</span>
            <span className="font-mono text-indigo-400 text-[11px] font-bold">{depth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* EQ Tone Preset */}
        <div className="flex flex-col gap-1 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300">EQ Tone Preset</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-xl border border-slate-700 outline-none font-medium cursor-pointer"
          >
            <option value="Natural">Natural</option>
            <option value="Documentary">Documentary</option>
            <option value="Cinematic">Cinematic</option>
            <option value="Podcast">Podcast</option>
            <option value="Radio">Radio</option>
          </select>
        </div>

        {/* Emotion Preset */}
        <div className="flex flex-col gap-1 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <label className="text-[11px] font-semibold text-slate-300">Emotion</label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-xl border border-slate-700 outline-none font-medium cursor-pointer"
          >
            <option value="Neutral">Neutral</option>
            <option value="Serious">Serious</option>
            <option value="Dramatic">Dramatic</option>
          </select>
        </div>
      </div>

      {/* ACTION FOOTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-500/20 relative z-10">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPreviewing || !promptText.trim()}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isPreviewing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : isPlayingPreview ? (
            <Pause className="w-4 h-4 fill-white text-white animate-pulse" />
          ) : (
            <Play className="w-4 h-4 fill-white text-white" />
          )}
          <span>{isPreviewing ? 'Generating Preview...' : isPlayingPreview ? 'Playing Audio' : 'Preview Voice Audio'}</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {!showSaveForm ? (
            <button
              type="button"
              onClick={() => {
                setProfileName(`${voice.name} - ${tone}`);
                setShowSaveForm(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-indigo-400" />
              <span>Save Voice Profile</span>
            </button>
          ) : (
            <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Profile name (e.g. Documentary)"
                className="w-44 px-3 py-1.5 bg-slate-950 text-white text-xs rounded-xl border border-indigo-500/40 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-2 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          {onUseInStudio && (
            <button
              type="button"
              onClick={() => onUseInStudio({ speed, pitch, depth, tone, emotion })}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <span>Use in Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceControlPanel;
