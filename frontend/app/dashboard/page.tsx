'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import { generateSpeech, previewSpeechApi, getPresets, createPreset, deletePreset } from '../../services/api';
import { 
  Play, Pause, Download, Volume2, Sparkles, AlertCircle, RefreshCw, AudioLines, 
  CheckCircle, Sliders, Save, Trash2, Bookmark, Mic, Gauge, FileText, Check
} from 'lucide-react';

interface VoiceOption {
  voiceId: string;
  name: string;
  gender: 'Male';
  language: string;
  description: string;
  style: string;
  premium: boolean;
}

const DEEP_MALE_VOICES: VoiceOption[] = [
  {
    voiceId: 'en-US-ChristopherNeural',
    name: 'Deep Documentary Male',
    gender: 'Male',
    language: 'en-US',
    description: 'Deep, cinematic, and calm tone modeled for National Geographic & nature documentaries.',
    style: 'Deep & Cinematic',
    premium: false,
  },
  {
    voiceId: 'en-US-EricNeural',
    name: 'Dark Storyteller Male',
    gender: 'Male',
    language: 'en-US',
    description: 'Low pitch, dramatic, and moody cadence tailored for mystery and thriller narration.',
    style: 'Dramatic Mystery',
    premium: false,
  },
  {
    voiceId: 'en-US-AndrewNeural',
    name: 'Professional Podcast Male',
    gender: 'Male',
    language: 'en-US',
    description: 'Clear, warm, articulate tone optimized for technical podcasts and interviews.',
    style: 'Warm & Professional',
    premium: false,
  },
  {
    voiceId: 'en-GB-RyanNeural',
    name: 'Ancient History Narrator',
    gender: 'Male',
    language: 'en-GB',
    description: 'Slow, resonant British accent with emotional weight for historical & epic audiobooks.',
    style: 'Resonant & Emotional',
    premium: true,
  },
  {
    voiceId: 'en-US-SteffanNeural',
    name: 'News Documentary Male',
    gender: 'Male',
    language: 'en-US',
    description: 'Serious, clean, powerful voice ideal for investigative journalism and video essays.',
    style: 'Serious & Powerful',
    premium: true,
  },
];

interface PresetItem {
  _id: string;
  presetName: string;
  voiceId: string;
  speed: number;
}

export default function SpeechStudio() {
  const { user, refreshUser } = useAuth();
  const [text, setText] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>('en-US-ChristopherNeural');
  const [speed, setSpeed] = useState<number>(1.0);
  const [generating, setGenerating] = useState<boolean>(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Preset System States
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [savingPreset, setSavingPreset] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const getBackendUrl = () => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) {
      return '/api/backend';
    }
    return 'http://localhost:5000';
  };

  const BACKEND_URL = getBackendUrl();

  const characterCount = text.length;
  const creditsRequired = Math.max(1, Math.ceil(characterCount / 50));

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = `${BACKEND_URL}${audioUrl}`;
      audioRef.current.load();
    }
  }, [audioUrl, BACKEND_URL]);

  const loadPresets = async () => {
    try {
      const res = await getPresets();
      if (res.success) setPresets(res.presets);
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text before generating speech.');
      return;
    }

    setGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const selectedVoiceObj = DEEP_MALE_VOICES.find(v => v.voiceId === voiceId);
      if (selectedVoiceObj?.premium && user && !user.premiumAccess) {
        throw new Error('This is a Premium Voice. Upgrade your account or select a free voice.');
      }

      console.log('Selected voice for generation:', voiceId);
      const res = await generateSpeech(text, voiceId, speed);
      
      if (!res.audioUrl) {
        throw new Error('Generation failed: Backend did not return an audio URL.');
      }

      setAudioUrl(res.audioUrl);
      await refreshUser();
    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    console.log('Selected voice for preview:', v.voiceId);
    if (previewingVoice) return;
    setPreviewingVoice(v.voiceId);
    setError(null);

    const demoText = `Hi, I am ${v.name}. This is a preview of my narration style.`;

    try {
      const res = await previewSpeechApi(v.voiceId, demoText);
      if (!res.audioUrl) {
        throw new Error('Backend failed to return preview audio URL.');
      }

      const fullUrl = `${BACKEND_URL}${res.audioUrl}`;
      console.log('Preview generated:', fullUrl);

      setAudioUrl(res.audioUrl);

      if (audioRef.current) {
        audioRef.current.src = fullUrl;
        audioRef.current.load();
        audioRef.current.play().catch((playErr) => {
          console.error('Browser playback error:', playErr);
          setError('Audio loaded successfully. Click play on the player below if browser blocked autoplay.');
        });
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Preview Error:', err);
      setError('Preview failed: ' + (err.message || 'Unknown error'));
    } finally {
      setPreviewingVoice(null);
    }
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    setSavingPreset(true);
    try {
      const res = await createPreset(presetNameInput.trim(), voiceId, speed);
      if (res.success) {
        setPresetNameInput('');
        await loadPresets();
      }
    } catch (err: any) {
      alert('Failed to save preset: ' + err.message);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePresetItem = async (id: string) => {
    try {
      const res = await deletePreset(id);
      if (res.success) {
        setPresets(presets.filter(p => p._id !== id));
      }
    } catch (err: any) {
      alert('Failed to delete preset.');
    }
  };

  const handleApplyPreset = (p: PresetItem) => {
    setVoiceId(p.voiceId);
    setSpeed(p.speed);
  };

  const togglePlay = () => {
    if (!audioUrl) {
      setError('No audio URL available for playback');
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error('Playback error:', e);
        setError('Failed to play audio stream');
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-neutral-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
            Speech Studio
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Convert scripts to high-fidelity deep male narrative AI voices.</p>
        </div>

        {/* User Credit Pill */}
        {user && !user.premiumAccess && (
          <div className="px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center gap-3">
            <span className="text-xs text-neutral-400 font-medium">Allocated Quota:</span>
            <span className="text-sm font-bold text-indigo-400">{user.freeCredits - user.usedCredits} credits</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Text Area & Speed Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Text Area Card */}
          <div className="relative rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Script Editor
              </span>
              <span className="text-[11px] font-semibold text-neutral-500">
                {characterCount} / 2000 chars
              </span>
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder="Enter your script here to generate narrative audio..."
              maxLength={2000}
              className="w-full min-h-[260px] bg-transparent text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none text-base leading-relaxed"
            />

            <div className="flex items-center justify-between border-t border-neutral-900 pt-3 text-xs text-neutral-500">
              <span>Required Cost: <strong className="text-indigo-400">{creditsRequired} credits</strong></span>
              <span>Rate: 1 credit / 50 chars</span>
            </div>
          </div>

          {/* Voice Speed Controls Panel */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" /> Voice Speed Control
              </h3>
              <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                {speed.toFixed(2)}x Speed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Option 1: Dropdown Preset Speed */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Speed Preset</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-500/50 text-neutral-200"
                >
                  <option value={0.5}>Slow (0.5x)</option>
                  <option value={0.8}>Relaxed (0.8x)</option>
                  <option value={1.0}>Normal (1.0x)</option>
                  <option value={1.25}>Paced (1.25x)</option>
                  <option value={1.5}>Fast (1.5x)</option>
                </select>
              </div>

              {/* Option 2: Continuous Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Fine adjustment slider</span>
                  <span>{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !text.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 font-bold text-sm text-white shadow-xl shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Synthesizing waveform ({speed}x speed)...
              </>
            ) : (
              <>
                <Volume2 className="w-4.5 h-4.5" /> Synthesize Audio Waveform
              </>
            )}
          </button>
        </div>

        {/* Right Column: Deep Male Voice Library & Presets */}
        <div className="flex flex-col gap-6">
          {/* Voice Library Cards */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" /> Deep Male Voice Library
              </h3>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">{DEEP_MALE_VOICES.length} Available</span>
            </div>

            <div className="flex flex-col gap-3">
              {DEEP_MALE_VOICES.map((v) => {
                const isSelected = voiceId === v.voiceId;
                const isLocked = v.premium && user && !user.premiumAccess;
                const isPreviewing = previewingVoice === v.voiceId;

                return (
                  <div
                    key={v.voiceId}
                    onClick={() => {
                      setVoiceId(v.voiceId);
                      setError(null);
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
                      isSelected 
                        ? 'border-indigo-500/50 bg-indigo-950/15 shadow-md shadow-indigo-500/5' 
                        : 'border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-100">{v.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Demo Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(v);
                          }}
                          disabled={isPreviewing}
                          className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[10px] font-bold text-indigo-400 flex items-center gap-1 transition disabled:opacity-50"
                        >
                          {isPreviewing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-indigo-400" />}
                          <span>Preview</span>
                        </button>

                        {v.premium && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isLocked 
                              ? 'bg-neutral-900 text-neutral-500 border border-neutral-800' 
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {isLocked ? 'Locked' : 'Premium'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-normal font-medium">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Manager Card */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" /> Voice Presets
            </h3>

            {/* Save Preset Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Preset Name..."
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={handleSavePreset}
                disabled={savingPreset || !presetNameInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                {savingPreset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>

            {/* Presets List */}
            {presets.length === 0 ? (
              <p className="text-[11px] text-neutral-500 font-medium text-center py-2">No saved presets yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {presets.map((p) => (
                  <div key={p._id} className="p-3 rounded-xl border border-neutral-900 bg-neutral-950 flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-neutral-200 truncate">{p.presetName}</span>
                      <span className="text-[10px] text-neutral-500 truncate">
                        {DEEP_MALE_VOICES.find(v => v.voiceId === p.voiceId)?.name || p.voiceId} ({p.speed}x)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApplyPreset(p)}
                        className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-indigo-400 hover:bg-neutral-800 transition"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDeletePresetItem(p._id)}
                        className="p-1 rounded-md text-neutral-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Waveform Player Output */}
      {audioUrl && (
        <div className="p-6 rounded-2xl border border-indigo-950 bg-indigo-950/15 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-indigo-500/20 shrink-0"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-200">Audio Stream Active</span>
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Synthesized audio ready for playback & export
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* HTML5 Audio Controls Element */}
            <audio
              ref={audioRef}
              controls
              src={`${BACKEND_URL}${audioUrl}`}
              className="h-10 text-xs rounded-lg max-w-[240px] md:max-w-xs border border-neutral-800 bg-neutral-900"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Audio element error:', e);
                setError('Failed to play audio stream from backend server.');
              }}
            />

            <a
              href={`${BACKEND_URL}${audioUrl}`}
              download
              className="p-3 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-850 hover:text-white transition flex items-center gap-2 text-xs font-bold shrink-0"
            >
              <Download className="w-4 h-4" /> Export MP3
            </a>
          </div>
        </div>
      )}

      {/* Error alert display */}
      {error && (
        <div className="p-5 rounded-2xl border border-red-950 bg-red-950/15 flex gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold">Operation Exception</span>
            <p className="text-xs text-red-300/80 leading-normal">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
