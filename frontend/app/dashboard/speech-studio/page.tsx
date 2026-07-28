'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import ThemeToggle from '../../../components/ThemeToggle';
import VoiceSpeedControl from '../../../components/VoiceSpeedControl';
import DownloadButton from '../../../components/DownloadButton';
import { 
  generateSpeech, 
  previewSpeechApi, 
  getPresets, 
  createPreset, 
  deletePreset, 
  getApiUrl, 
  downloadAudioFile, 
  getVoiceLibraryApi 
} from '../../../services/api';
import { 
  Play, Pause, Volume2, AlertCircle, RefreshCw, 
  CheckCircle, Save, Trash2, Bookmark, Mic, FileText, Check, Sliders
} from 'lucide-react';
import { VoiceSelector, VoiceOption } from '../../../components/VoiceSelector';

interface PresetItem {
  _id: string;
  presetName: string;
  voiceId: string;
  speed: number;
  settings?: any;
}

export default function SpeechStudio() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>('en-US-ChristopherNeural');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [depth, setDepth] = useState<number>(0);
  const [tone, setTone] = useState<string>('natural');
  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadingMp3, setDownloadingMp3] = useState<boolean>(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Preset System States
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [savingPreset, setSavingPreset] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    loadVoiceLibrary();
    loadPresets();
  }, [user]);

  const loadVoiceLibrary = async () => {
    try {
      const res = await getVoiceLibraryApi();
      if (res && res.success) {
        const sysVoices = (res.systemVoices || []).map((sv: any) => ({
          voiceId: sv.voiceId,
          name: sv.name,
          gender: sv.category === 'female' ? 'Female' : 'Male',
          language: 'en-US',
          description: sv.description,
          category: sv.category || 'Documentary',
          style: sv.category,
          premium: sv.isPremium,
          isPremium: sv.isPremium
        }));
        
        const custVoices = (res.customVoices || []).map((cv: any) => ({
          voiceId: cv._id,
          name: `${cv.voiceName || cv.name} (Custom)`,
          gender: 'Male',
          language: 'en-US (cloned)',
          description: `Custom cloned voice profile (${cv.provider || 'AI'}).`,
          category: 'Cloned',
          style: 'Custom Cloned',
          premium: true,
          isPremium: true
        }));
        
        setSystemVoices(sysVoices);
        setCustomVoices(custVoices);
      }
    } catch (err) {
      console.warn('Failed to load voice library:', err);
    }
  };

  const loadPresets = async () => {
    try {
      const res = await getPresets();
      if (res && res.success && Array.isArray(res.presets)) {
        setPresets(res.presets);
      }
    } catch (err) {
      console.warn('Failed to load presets:', err);
    }
  };

  const allVoices = [...systemVoices, ...customVoices];

  const getFullAudioUrl = (urlPath: string | null) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const characterCount = text.length;
  const creditsRequired = Math.max(1, Math.ceil(characterCount / 50));
  const selectedVoiceObj = allVoices.find((v: VoiceOption) => v.voiceId === voiceId);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = getFullAudioUrl(audioUrl);
      audioRef.current.load();
    }
  }, [audioUrl, BACKEND_URL]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please write your script before generating speech.');
      return;
    }

    setGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const isLocked = selectedVoiceObj && (selectedVoiceObj.premium || selectedVoiceObj.isPremium) && user && !user.premiumAccess;
      if (isLocked) {
        throw new Error('Upgrade to Premium to unlock this voice.');
      }

      const res = await generateSpeech(text, voiceId, speed, pitch, tone, depth);
      
      if (!res.audioUrl) {
        throw new Error('Generation failed: Backend did not return an audio URL.');
      }

      setAudioUrl(res.audioUrl);
      showToast('Speech generated successfully!', 'success');
      await refreshUser();

      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(err.message || 'Generation failed. Please try again.');
      showToast(err.message || 'Generation failed.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    if (previewingVoice) return;
    setPreviewingVoice(v.voiceId);
    setError(null);

    const demoText = `Hi, I am ${v.name}. This is a preview of my narration style.`;

    try {
      const res = await previewSpeechApi(v.voiceId, demoText, speed, pitch, tone, depth);
      if (!res.audioUrl) {
        throw new Error('Backend failed to return preview audio URL.');
      }

      const fullUrl = getFullAudioUrl(res.audioUrl);
      setAudioUrl(res.audioUrl);

      if (audioRef.current) {
        audioRef.current.src = fullUrl;
        audioRef.current.load();
        audioRef.current.play().catch((playErr) => {
          console.error('Browser playback error:', playErr);
          setError('Audio preview loaded. Click play on the player below if browser blocked autoplay.');
        });
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Preview Error:', err);
      showToast('Preview is currently unavailable for this voice.', 'error');
    } finally {
      setPreviewingVoice(null);
    }
  };

  const handleExportMp3 = async () => {
    if (!audioUrl) return;
    setDownloadingMp3(true);
    showToast('Your audio download has started', 'info');

    const voiceNameClean = (selectedVoiceObj?.name || voiceId).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `speech_studio_${voiceNameClean}_${dateStr}.mp3`;

    const fullUrl = getFullAudioUrl(audioUrl);
    const success = await downloadAudioFile(fullUrl, filename);

    setDownloadingMp3(false);
    if (!success) {
      showToast('Unable to download audio file. Please try again.', 'error');
    }
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    setSavingPreset(true);
    try {
      const res = await createPreset(presetNameInput.trim(), voiceId, speed, { voiceId, speed, pitch, depth, tone });
      if (res.success) {
        setPresetNameInput('');
        showToast('Preset saved successfully!', 'success');
        await loadPresets();
      }
    } catch (err: any) {
      showToast('Failed to save preset: ' + err.message, 'error');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePresetItem = async (id: string) => {
    try {
      const res = await deletePreset(id);
      if (res.success) {
        setPresets(presets.filter((p) => p._id !== id));
        showToast('Preset deleted.', 'info');
      }
    } catch (err: any) {
      showToast('Failed to delete preset.', 'error');
    }
  };

  const handleApplyPreset = (p: PresetItem) => {
    setVoiceId(p.voiceId);
    setSpeed(p.speed);
    if (p.settings) {
      if (p.settings.pitch !== undefined) setPitch(p.settings.pitch);
      if (p.settings.depth !== undefined) setDepth(p.settings.depth);
      if (p.settings.tone) setTone(p.settings.tone);
    }
    showToast(`Preset "${p.presetName}" loaded`, 'info');
  };

  const togglePlay = () => {
    if (!audioUrl) {
      setError('No audio stream available for playback');
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        console.error('Playback error:', e);
        setError('Failed to play audio stream');
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-16 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="border-b border-[var(--border-app)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--text-primary)] via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
            Speech Studio
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Write your script and synthesize natural AI voice narration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && !user.premiumAccess && (
            <div className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-app)] flex items-center gap-3 shadow-sm">
              <span className="text-xs text-[var(--text-secondary)] font-medium">Quota:</span>
              <span className="text-sm font-bold text-indigo-500">{user.freeCredits - user.usedCredits} credits</span>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Creator Layout (60% Left / 40% Right on Desktop, 50/50 Tablet, Stack Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Script Creation Area (60% Width - lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-2xl border bg-[var(--bg-card)] border-[var(--border-app)] backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border-app)] pb-3">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-500" /> Write Your Script
              </h2>
              <span className="text-xs font-mono font-semibold text-[var(--text-secondary)]">
                {characterCount} / 2000 chars
              </span>
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder="Write your narration script here..."
              maxLength={2000}
              className="w-full min-h-[380px] lg:min-h-[480px] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-y text-sm sm:text-base leading-relaxed font-sans"
            />

            <div className="flex flex-wrap items-center justify-between border-t border-[var(--border-app)] pt-4 text-xs text-[var(--text-secondary)] gap-3">
              <span>Characters: <strong className="text-[var(--text-primary)]">{characterCount}</strong></span>
              <span>Credits required: <strong className="text-indigo-500">{creditsRequired} credits</strong></span>
            </div>
          </div>

          {/* Primary Action: Generate Speech Button Directly Below Script */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating || !text.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 font-extrabold text-sm text-white shadow-xl shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Generating Audio...
                </>
              ) : (
                <>
                  <Volume2 className="w-4.5 h-4.5" /> Generate Speech
                </>
              )}
            </button>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3 text-red-500 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Generation Error</span>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Generated Result Card below left script panel */}
          {audioUrl && (
            <div ref={resultCardRef} className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-indigo-500/30 shrink-0 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">Synthesized Output</span>
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Audio ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <audio
                  ref={audioRef}
                  controls
                  src={getFullAudioUrl(audioUrl)}
                  className="h-9 text-xs rounded-xl w-full border border-[var(--border-app)] bg-[var(--bg-input)]"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Audio element error:', e);
                    setError('Failed to play audio stream from backend server.');
                  }}
                />

                <div className="flex justify-end">
                  <DownloadButton
                    onClick={handleExportMp3}
                    loading={downloadingMp3}
                    label="Export MP3"
                    variant="primary"
                    size="md"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Voice Workspace & Controls (40% Width - lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SECTION 1: CHOOSE YOUR VOICE */}
          <div className="rounded-2xl border bg-[var(--bg-card)] border-[var(--border-app)] backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border-app)] pb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" /> Choose Your Voice
              </h3>
              {selectedVoiceObj && (
                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  Selected: <strong className="text-[var(--text-primary)] truncate max-w-[120px]">{selectedVoiceObj.name}</strong> <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </span>
              )}
            </div>

            <VoiceSelector
              selectedVoiceId={voiceId}
              onChange={(newVoiceId) => setVoiceId(newVoiceId)}
              systemVoices={systemVoices}
              customVoices={customVoices}
              previewingVoiceId={previewingVoice}
              onPreviewVoice={(v) => handlePreviewVoice(v)}
            />
          </div>

          {/* SECTION 2: VOICE CONTROLS */}
          <div className="rounded-2xl border bg-[var(--bg-card)] border-[var(--border-app)] backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-app)] pb-3">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Voice Controls</h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Speed */}
              <VoiceSpeedControl speed={speed} onChange={setSpeed} />

              {/* Pitch Offset */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span>Pitch Offset</span>
                  <span className="font-mono text-indigo-500">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseInt(e.target.value))} 
                  className="w-full focus:outline-none"
                />
                <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                  <span>-12</span>
                  <span>0</span>
                  <span>+12</span>
                </div>
              </div>

              {/* Voice Depth */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span>Voice Depth</span>
                  <span className="font-mono text-indigo-500">{depth}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={depth} 
                  onChange={(e) => setDepth(parseInt(e.target.value))} 
                  className="w-full focus:outline-none"
                />
                <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              {/* EQ Tone Preset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">EQ Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="natural">Natural</option>
                  <option value="documentary">Documentary</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="podcast">Podcast</option>
                  <option value="radio">Radio</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: VOICE PRESETS */}
          <div className="rounded-2xl border bg-[var(--bg-card)] border-[var(--border-app)] backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-app)] pb-3">
              <Bookmark className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Voice Presets</h3>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Save current settings..."
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSavePreset}
                disabled={savingPreset || !presetNameInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition disabled:opacity-40 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {savingPreset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>

            {presets.length > 0 && (
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                {presets.map((p) => (
                  <div key={p._id} className="p-2.5 rounded-xl border border-[var(--border-app)] bg-[var(--bg-input)] flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{p.presetName}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApplyPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-[10px] font-bold text-indigo-500 border border-[var(--border-app)] hover:bg-[var(--bg-card-hover)] transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeletePresetItem(p._id)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500 transition"
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
    </div>
  );
}
