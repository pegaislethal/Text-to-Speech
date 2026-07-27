'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import ThemeToggle from '../../../components/ThemeToggle';
import VoiceSpeedControl from '../../../components/VoiceSpeedControl';
import DownloadButton from '../../../components/DownloadButton';
import { generateSpeech, previewSpeechApi, getPresets, createPreset, deletePreset, getApiUrl, downloadAudioFile, getCustomVoicesApi } from '../../../services/api';
import { 
  Play, Pause, Volume2, AlertCircle, RefreshCw, 
  CheckCircle, Save, Trash2, Bookmark, Mic, FileText, Check, Sliders
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
  const [tone, setTone] = useState<string>('neutral');
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
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    loadCustomVoices();
  }, [user]);

  const loadCustomVoices = async () => {
    if (user?.premiumAccess) {
      try {
        const res = await getCustomVoicesApi();
        if (res.success && res.customVoices) {
          const cvs = res.customVoices.map((cv: any) => ({
            voiceId: cv._id,
            name: `${cv.voiceName} (Custom)`,
            gender: 'Male',
            language: 'en-US (cloned)',
            description: `Custom cloned voice profile (${cv.provider}).`,
            style: 'Custom Cloned',
            premium: true,
          }));
          setCustomVoices(cvs);
        }
      } catch (err) {
        console.warn('Failed to load custom cloned voices:', err);
      }
    }
  };

  const allVoices = [...DEEP_MALE_VOICES, ...customVoices];

  const getFullAudioUrl = (urlPath: string | null) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const characterCount = text.length;
  const creditsRequired = Math.max(1, Math.ceil(characterCount / 50));

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = getFullAudioUrl(audioUrl);
      audioRef.current.load();
    }
  }, [audioUrl, BACKEND_URL]);

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
      const res = await generateSpeech(text, voiceId, speed, pitch, tone, depth);
      
      if (!res.audioUrl) {
        throw new Error('Generation failed: Backend did not return an audio URL.');
      }

      setAudioUrl(res.audioUrl);
      showToast('Speech generated successfully!', 'success');
      await refreshUser();
    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(err.message || 'Generation failed. Please try again.');
      showToast(err.message || 'Generation failed.', 'error');
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
      const res = await previewSpeechApi(v.voiceId, demoText, speed, pitch, tone, depth);
      if (!res.audioUrl) {
        throw new Error('Backend failed to return preview audio URL.');
      }

      const fullUrl = getFullAudioUrl(res.audioUrl);
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
      showToast('Voice preview failed.', 'error');
    } finally {
      setPreviewingVoice(null);
    }
  };

  const handleExportMp3 = async () => {
    if (!audioUrl) return;
    setDownloadingMp3(true);
    showToast('Your audio download has started', 'info');

    const selectedVoice = allVoices.find((v) => v.voiceId === voiceId);
    const voiceNameClean = (selectedVoice?.name || voiceId).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `speech_studio_${voiceNameClean}_${dateStr}.mp3`;

    const fullUrl = getFullAudioUrl(audioUrl);
    const success = await downloadAudioFile(fullUrl, filename);

    setDownloadingMp3(false);
    if (!success) {
      showToast('Unable to download audio. Please try again.', 'error');
    }
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    setSavingPreset(true);
    try {
      const res = await createPreset(presetNameInput.trim(), voiceId, speed, { voiceId, speed });
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
    showToast(`Preset "${p.presetName}" applied`, 'info');
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
      audioRef.current.play().catch((e) => {
        console.error('Playback error:', e);
        setError('Failed to play audio stream');
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Header with ThemeToggle */}
      <div className="border-b border-neutral-200 dark:border-neutral-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-indigo-600 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text text-transparent">
            Speech Studio
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Convert scripts to high-fidelity deep male narrative AI voices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && !user.premiumAccess && (
            <div className="px-4 py-2 rounded-xl bg-card border border-input flex items-center gap-3 shadow-sm">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Quota:</span>
              <span className="text-sm font-bold text-indigo-500">{user.freeCredits - user.usedCredits} credits</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column: Script Editor */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Text Area Card */}
          <div className="relative rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Script Editor
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
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
              className="w-full min-h-[300px] sm:min-h-[460px] bg-transparent text-foreground placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none resize-none text-sm sm:text-base leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between border-t border-input pt-3 text-xs text-neutral-500 dark:text-neutral-400 gap-2">
              <span>Required Cost: <strong className="text-indigo-500">{creditsRequired} credits</strong></span>
              <span>Rate: 1 credit / 50 chars</span>
            </div>
          </div>
        </div>

        {/* Right Column: Voice Library, Advanced Controls, Presets & Outputs */}
        <div className="flex flex-col gap-6">
          {/* Voice Library Cards */}
          <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Mic className="w-4 h-4 text-indigo-500" /> Neural Voice Library
              </h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">{allVoices.length} Available</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
              {allVoices.map((v) => {
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
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
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
                            handlePreviewVoice(v);
                          }}
                          disabled={isPreviewing}
                          className="px-2 py-0.5 rounded bg-background border border-input text-[9px] font-bold text-indigo-500 flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                        >
                          {isPreviewing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-indigo-500" />}
                          <span>Preview</span>
                        </button>

                        {v.premium && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isLocked
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border border-input'
                              : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                          }`}>
                            {isLocked ? 'Locked' : 'Premium'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal font-medium">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Advanced Waveform Controls Card */}
          <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-input">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Advanced Voice Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Pitch */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400">Pitch Offset</span>
                  <span className="font-mono text-indigo-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Depth */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400">Voice Depth</span>
                  <span className="font-mono text-indigo-400">{depth}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={depth} 
                  onChange={(e) => setDepth(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Tone preset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">EQ Tone Preset</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-background text-xs text-foreground border border-input rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="neutral">Neutral</option>
                  <option value="deep">Deep & Bass</option>
                  <option value="warm">Warm Narration</option>
                  <option value="professional">Professional corporate</option>
                  <option value="cinematic">Cinematic Wide</option>
                  <option value="dramatic">Dramatic Studio</option>
                </select>
              </div>

              {/* Speed */}
              <VoiceSpeedControl speed={speed} onChange={setSpeed} />
            </div>
          </div>

          {/* Preset Manager Card */}
          <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-indigo-500" /> Voice Presets
            </h3>

            {/* Save Preset Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Preset Name..."
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                className="flex-1 min-w-0 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
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

            {/* Presets List */}
            {presets.length === 0 ? (
              <p className="text-[11px] text-neutral-400 font-medium text-center py-2">No saved presets yet.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {presets.map((p) => (
                  <div key={p._id} className="p-3 rounded-xl border border-input bg-background flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{p.presetName}</span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        {DEEP_MALE_VOICES.find((v) => v.voiceId === p.voiceId)?.name || allVoices.find((v) => v.voiceId === p.voiceId)?.name || p.voiceId} ({p.speed}x)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApplyPreset(p)}
                        className="px-2.5 py-1 rounded-md bg-card border border-input text-[10px] font-bold text-indigo-500 hover:bg-background transition cursor-pointer"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDeletePresetItem(p._id)}
                        className="p-1 rounded-md text-neutral-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !text.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 font-bold text-sm text-white shadow-xl shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Synthesizing waveform ({speed.toFixed(2)}x speed)...
              </>
            ) : (
              <>
                <Volume2 className="w-4.5 h-4.5" /> Synthesize Audio Waveform
              </>
            )}
          </button>

          {/* Audio Waveform Player Output */}
          {audioUrl && (
            <div className="p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-indigo-500/20 shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">Audio Stream Active</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Synthesized audio ready
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <audio
                  ref={audioRef}
                  controls
                  src={getFullAudioUrl(audioUrl)}
                  className="h-9 text-xs rounded-lg w-full border border-input bg-card"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Audio element error:', e);
                    setError('Failed to play audio stream from backend server.');
                  }}
                />

                {/* Reusable Export MP3 Download Button */}
                <DownloadButton
                  onClick={handleExportMp3}
                  loading={downloadingMp3}
                  label="Export MP3"
                  variant="primary"
                  size="md"
                />
              </div>
            </div>
          )}

          {/* Error alert display */}
          {error && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3 text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold">Operation Exception</span>
                <p className="text-[11px] opacity-90 leading-normal">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
