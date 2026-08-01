'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import { 
  generateSpeech, 
  previewSpeechApi, 
  getPresets, 
  createPreset, 
  deletePreset, 
  getApiUrl, 
  downloadAudioFile, 
  getVoiceLibraryApi,
  getVoiceProfilesApi,
  VoiceProfileData
} from '../../../services/api';
import { 
  Play, Pause, Volume2, AlertCircle, RefreshCw, 
  Download, Mic, FileText, Check, Sliders, Sparkles, X, 
  Lock, Bookmark, Save, Trash2, SlidersHorizontal, ChevronRight, Zap
} from 'lucide-react';
import { VoiceOption } from '../../../components/VoiceCard';
import DownloadButton from '../../../components/DownloadButton';
import VoiceSwitcher from '../../../components/VoiceSwitcher';

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
  const searchParams = useSearchParams();

  // Core Editor States
  const [text, setText] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>('en-US-ChristopherNeural');
  
  // Real Backend Voice Controls
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [depth, setDepth] = useState<number>(0);
  const [tone, setTone] = useState<string>('natural');

  // Voices
  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);

  // Execution States
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadingMp3, setDownloadingMp3] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingGenerated, setIsPlayingGenerated] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Preset & Profile System States
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [savingPreset, setSavingPreset] = useState<boolean>(false);
  const [savedVoiceProfiles, setSavedVoiceProfiles] = useState<VoiceProfileData[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    loadVoiceLibrary();
    loadPresets();
    loadVoiceProfiles();
    audioRef.current = new Audio();
    previewAudioRef.current = new Audio();

    const currentAudio = audioRef.current;
    currentAudio.onended = () => setIsPlayingGenerated(false);
    currentAudio.onpause = () => setIsPlayingGenerated(false);
    currentAudio.ontimeupdate = () => setCurrentTime(currentAudio.currentTime);
    currentAudio.onloadedmetadata = () => setAudioDuration(currentAudio.duration);

    const prevAudio = previewAudioRef.current;
    prevAudio.onended = () => setPlayingPreviewId(null);
    prevAudio.onpause = () => setPlayingPreviewId(null);

    return () => {
      if (currentAudio) currentAudio.pause();
      if (prevAudio) prevAudio.pause();
    };
  }, [user]);

  // Check URL search parameter for preselected voiceId and voice profile settings
  useEffect(() => {
    const urlVoiceId = searchParams.get('voiceId');
    if (urlVoiceId) {
      setVoiceId(urlVoiceId);
    }
    const urlSpeed = searchParams.get('speed');
    if (urlSpeed) setSpeed(parseFloat(urlSpeed));
    const urlPitch = searchParams.get('pitch');
    if (urlPitch) setPitch(parseInt(urlPitch));
    const urlDepth = searchParams.get('depth');
    if (urlDepth) setDepth(parseInt(urlDepth));
    const urlTone = searchParams.get('tone');
    if (urlTone) setTone(urlTone.toLowerCase());
    const profileName = searchParams.get('profileName');
    if (profileName) {
      showToast(`Loaded voice profile "${profileName}"`, 'info');
    }
  }, [searchParams]);

  const loadVoiceProfiles = async () => {
    try {
      const res = await getVoiceProfilesApi();
      if (res && res.success && Array.isArray(res.profiles)) {
        setSavedVoiceProfiles(res.profiles);
      }
    } catch (err) {
      console.warn('Failed to load voice profiles:', err);
    }
  };

  const loadVoiceLibrary = async () => {
    try {
      const res = await getVoiceLibraryApi();
      if (res && res.success) {
        const sysVoices: VoiceOption[] = (res.systemVoices || []).map((sv: any) => ({
          voiceId: sv.voiceId,
          name: sv.name,
          gender: sv.category === 'female' ? 'Female' : 'Male',
          language: 'en-US',
          accent: sv.category === 'female' ? 'American Female' : 'American Male',
          description: sv.description,
          category: sv.category || 'Documentary',
          style: sv.category,
          premium: sv.isPremium,
          isPremium: sv.isPremium,
        }));

        const custVoices: VoiceOption[] = (res.customVoices || []).map((cv: any) => ({
          voiceId: cv._id || cv.voiceId,
          name: `${cv.voiceName || cv.name}`,
          gender: 'Male',
          language: 'en-US (Cloned)',
          accent: 'Custom Cloned',
          description: `Custom neural cloned voice profile (${cv.provider || 'XTTS v2'}).`,
          category: 'custom',
          style: 'Custom Cloned',
          premium: true,
          isPremium: true,
          isCustom: true,
          provider: cv.provider || 'XTTS',
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

  const allVoices = useMemo(() => [...systemVoices, ...customVoices], [systemVoices, customVoices]);

  const matchingVoiceProfiles = useMemo(() => {
    return savedVoiceProfiles.filter((p) => p.voiceId === voiceId);
  }, [savedVoiceProfiles, voiceId]);

  const selectedVoiceObj = useMemo(() => {
    return allVoices.find((v) => v.voiceId === voiceId) || {
      voiceId,
      name: 'Christopher (Default)',
      accent: 'American Male',
      style: 'Documentary',
      description: 'Clear, authoritative male narration voice.',
      category: 'documentary',
      premium: false,
    };
  }, [allVoices, voiceId]);

  const characterCount = text.length;
  const creditsRequired = Math.max(1, Math.ceil(characterCount / 50));

  const getFullAudioUrl = (urlPath: string | null) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter a script before generating speech.');
      return;
    }

    setGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsPlayingGenerated(false);

    try {
      const isLocked = selectedVoiceObj && (selectedVoiceObj.premium || selectedVoiceObj.isPremium) && user && !user.premiumAccess;
      if (isLocked) {
        throw new Error('Upgrade to Premium to unlock this voice profile.');
      }

      const res = await generateSpeech(text, voiceId, speed, pitch, tone, depth);

      if (!res.audioUrl) {
        throw new Error('Generation failed: Backend did not return an audio URL.');
      }

      const fullUrl = getFullAudioUrl(res.audioUrl);
      setAudioUrl(res.audioUrl);

      if (audioRef.current) {
        audioRef.current.src = fullUrl;
        audioRef.current.load();
      }

      showToast('Speech generated successfully!', 'success');
      await refreshUser();

      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(err.message || 'Generation failed. Please try again.');
      showToast(err.message || 'Generation failed.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleGeneratedPlayback = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlayingGenerated) {
      audioRef.current.pause();
      setIsPlayingGenerated(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingGenerated(true);
      }).catch((err) => {
        console.error('Playback error:', err);
        setError('Playback failed. Please try again.');
      });
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    if (previewingVoiceId) return;

    if (playingPreviewId === v.voiceId && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPlayingPreviewId(null);
      return;
    }

    setPreviewingVoiceId(v.voiceId);
    setError(null);

    const demoText = `Hi, I am ${v.name}. This is a preview of my narration style.`;

    try {
      const res = await previewSpeechApi(v.voiceId, demoText, speed, pitch, tone, depth);
      if (!res.audioUrl) {
        throw new Error('Backend failed to return preview audio URL.');
      }

      const fullUrl = getFullAudioUrl(res.audioUrl);
      if (previewAudioRef.current) {
        previewAudioRef.current.src = fullUrl;
        previewAudioRef.current.load();
        await previewAudioRef.current.play();
        setPlayingPreviewId(v.voiceId);
      }
    } catch (err: any) {
      console.error('Preview Error:', err);
      showToast('Preview is currently unavailable for this voice.', 'error');
    } finally {
      setPreviewingVoiceId(null);
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/20 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Mic className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Speech Studio
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
                Creator Workspace
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Convert script narration to natural voice speech with real-time AI audio controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-app)] flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Credits: <strong className="text-[var(--text-primary)]">{(user?.freeCredits ?? 1000) - (user?.usedCredits ?? 0)}</strong></span>
          </div>
        </div>
      </div>

      {/* TWO PANEL PROFESSIONAL EDITOR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Text Editor Workspace (65% width on desktop -> col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Text to Speech
                </h2>
              </div>
              {text && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                >
                  Clear Text
                </button>
              )}
            </div>

            {/* Distraction-Free Text Editor */}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder="Type or paste your narration script here. The AI voice will synthesize your text naturally..."
              rows={12}
              className="w-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] text-sm rounded-2xl p-5 border border-[var(--border-app)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-[var(--text-muted)] font-sans leading-relaxed resize-y min-h-[320px]"
            />

            {/* Bottom Bar: Character Count, Credit Usage, Primary Generate Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[var(--border-app)]">
              <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                <span>Characters: <strong className="text-[var(--text-primary)]">{characterCount}</strong></span>
                <span>&bull;</span>
                <span>Credit Cost: <strong className="text-indigo-400">{creditsRequired}</strong></span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !text.trim()}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Audio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-medium flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* GENERATED AUDIO SECTION (Directly below text editor) */}
          {audioUrl && (
            <div
              ref={resultCardRef}
              className="p-6 rounded-3xl bg-[var(--bg-card)] border border-indigo-500/30 shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom-3 duration-300"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Generated Speech Output</h3>
                </div>

                <DownloadButton
                  onClick={handleExportMp3}
                  loading={downloadingMp3}
                  label="Download MP3"
                  variant="primary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Player UI */}
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={toggleGeneratedPlayback}
                    className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition shrink-0 cursor-pointer"
                  >
                    {isPlayingGenerated ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                      <span>{selectedVoiceObj.name}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {formatTime(currentTime)} / {formatTime(audioDuration)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={audioDuration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (audioRef.current) {
                          audioRef.current.currentTime = val;
                          setCurrentTime(val);
                        }
                      }}
                      className="w-full h-1.5 bg-[var(--bg-card)] rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-[var(--text-muted)] font-semibold border-t border-[var(--border-app)]">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)]">
                    Voice: <strong>{selectedVoiceObj.name}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)]">
                    Speed: <strong>{speed}x</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)]">
                    Pitch: <strong>{pitch > 0 ? `+${pitch}` : pitch}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)] capitalize">
                    Tone: <strong>{tone}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Voice Configuration Panel (35% width on desktop -> col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* CARD 1: VOICE SWITCHER */}
          <VoiceSwitcher
            voices={allVoices}
            selectedVoiceId={voiceId}
            onSelectVoice={(v) => setVoiceId(v.voiceId)}
            onPreviewVoice={handlePreviewVoice}
            previewingVoiceId={previewingVoiceId}
            playingVoiceId={playingPreviewId}
            isUserPremium={Boolean(user?.premiumAccess)}
            label="Selected Voice"
          />

          {/* SAVED VOICE PROFILES BANNER FOR SELECTED VOICE */}
          {matchingVoiceProfiles.length > 0 && (
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 shadow-lg flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Bookmark className="w-4 h-4 shrink-0" />
                  <span>Saved voice settings available</span>
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {matchingVoiceProfiles.length} {matchingVoiceProfiles.length === 1 ? 'Profile' : 'Profiles'}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {matchingVoiceProfiles.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {p.profileName}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                        Speed: {p.speed}x | Pitch: {p.pitch} | Depth: {p.voiceDepth}% | {p.tonePreset}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSpeed(p.speed);
                        setPitch(p.pitch);
                        setDepth(p.voiceDepth);
                        setTone(p.tonePreset.toLowerCase());
                        showToast(`Applied voice profile "${p.profileName}"`, 'success');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      Apply Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARD 2: REAL VOICE CONTROLS (Only controls affecting backend audio) */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-app)]">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                Voice Controls
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Speed Slider (0.5x - 1.5x) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-primary)]">Speech Speed</span>
                  <span className="font-mono text-indigo-400">{speed}x</span>
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
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.5x (Fast)</span>
                </div>
              </div>

              {/* Voice Depth Slider (0 - 100) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-primary)]">Voice Depth</span>
                  <span className="font-mono text-indigo-400">{depth}%</span>
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
              </div>

              {/* Pitch Offset Slider (-12 to +12) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-primary)]">Pitch Offset</span>
                  <span className="font-mono text-indigo-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
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
              </div>
            </div>
          </div>

          {/* CARD 3: TONE & PRESETS */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                EQ Tone Preset
              </span>
            </div>

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs rounded-xl border border-[var(--border-app)] outline-none font-bold cursor-pointer"
            >
              <option value="natural">Natural (Default)</option>
              <option value="documentary">Documentary (Warm & Clear)</option>
              <option value="cinematic">Cinematic (Rich Sub-Bass)</option>
              <option value="podcast">Podcast (Broadcast Clarity)</option>
              <option value="radio">Radio (Crisp Treble)</option>
            </select>

            {/* Quick Presets Manager */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-app)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Saved Custom Presets
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 px-3 py-1.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs rounded-xl border border-[var(--border-app)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={savingPreset || !presetNameInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  Save
                </button>
              </div>

              {presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {presets.map((p) => (
                    <div
                      key={p._id}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceId(p.voiceId);
                          setSpeed(p.speed);
                          if (p.settings) {
                            if (p.settings.pitch !== undefined) setPitch(p.settings.pitch);
                            if (p.settings.depth !== undefined) setDepth(p.settings.depth);
                            if (p.settings.tone) setTone(p.settings.tone);
                          }
                          showToast(`Preset "${p.presetName}" applied`, 'info');
                        }}
                        className="hover:text-indigo-400 cursor-pointer"
                      >
                        {p.presetName}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePresetItem(p._id)}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
