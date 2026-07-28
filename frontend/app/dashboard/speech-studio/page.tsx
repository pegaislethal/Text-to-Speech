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
  CheckCircle, Save, Trash2, Bookmark, Mic, FileText, Check, Sliders, Sparkles, Activity, Layers
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
      setError('Please enter your script before generating speech.');
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

      console.log('Generating speech with settings:', { voiceId, speed, pitch, depth, tone });
      const res = await generateSpeech(text, voiceId, speed, pitch, tone, depth);
      
      if (!res.audioUrl) {
        throw new Error('Generation failed: Backend did not return an audio URL.');
      }

      setAudioUrl(res.audioUrl);
      showToast('Speech generated successfully!', 'success');
      await refreshUser();

      // Smooth scroll to generated audio card
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
    showToast(`Preset "${p.presetName}" applied`, 'info');
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
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-16 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="border-b border-input pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-neutral-200 to-indigo-400 bg-clip-text text-transparent">
            Speech Studio
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Convert scripts into high-fidelity, natural AI voiceovers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && !user.premiumAccess && (
            <div className="px-4 py-2 rounded-xl bg-card border border-input flex items-center gap-3 shadow-sm">
              <span className="text-xs text-neutral-400 font-medium">Quota:</span>
              <span className="text-sm font-bold text-indigo-400">{user.freeCredits - user.usedCredits} credits</span>
            </div>
          )}
        </div>
      </div>

      {/* Single-Column Creation Workflow */}
      <div className="flex flex-col gap-8">
        
        {/* STEP 1: WRITE YOUR SCRIPT */}
        <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-input pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-extrabold border border-indigo-500/20 uppercase tracking-wider">
                Step 1
              </span>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-400" /> Write Your Script
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-400">
              {characterCount} / 2000 chars
            </span>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="Type or paste your script here to generate natural AI speech..."
            maxLength={2000}
            className="w-full min-h-[220px] bg-transparent text-foreground placeholder-neutral-500 focus:outline-none resize-none text-sm sm:text-base leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between border-t border-input pt-3 text-xs text-neutral-400 gap-2">
            <span>Required Cost: <strong className="text-indigo-400">{creditsRequired} credits</strong></span>
            <span>Allocation Rate: 1 credit per 50 characters</span>
          </div>
        </div>

        {/* STEP 2: CHOOSE YOUR VOICE */}
        <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-input pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-extrabold border border-indigo-500/20 uppercase tracking-wider">
                Step 2
              </span>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Mic className="w-4 h-4 text-indigo-400" /> Choose Your Voice
              </h2>
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {allVoices.length} Voices Available
            </span>
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

        {/* STEP 3: CUSTOMIZE VOICE & CONTROLS */}
        <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center gap-2.5 border-b border-input pb-3">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-extrabold border border-indigo-500/20 uppercase tracking-wider">
              Step 3
            </span>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-400" /> Customize Voice
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Speed Control */}
            <VoiceSpeedControl speed={speed} onChange={setSpeed} />

            {/* Pitch Offset */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-neutral-400">
                <span className="uppercase tracking-wider text-[11px]">Pitch Offset</span>
                <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {pitch > 0 ? `+${pitch}` : pitch} semitones
                </span>
              </div>
              <input 
                type="range" 
                min="-12" 
                max="12" 
                value={pitch} 
                onChange={(e) => setPitch(parseInt(e.target.value))} 
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                <span>-12 (Deep Male)</span>
                <span>0 (Natural)</span>
                <span>+12 (High Pitch)</span>
              </div>
            </div>

            {/* Voice Depth */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-neutral-400">
                <span className="uppercase tracking-wider text-[11px]">Voice Depth</span>
                <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {depth}%
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={depth} 
                onChange={(e) => setDepth(parseInt(e.target.value))} 
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                <span>0% (Natural)</span>
                <span>50% (Warm)</span>
                <span>100% (Deep Cinematic Bass)</span>
              </div>
            </div>

            {/* EQ Tone Preset */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-[11px]">
                EQ Tone Preset
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-background text-xs font-semibold text-foreground border border-input rounded-xl p-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="natural">Natural (Original Signal)</option>
                <option value="documentary">Documentary (Narrative Warmth + Clarity)</option>
                <option value="cinematic">Cinematic (Deep Bass & Presence)</option>
                <option value="podcast">Podcast (Balanced Speech EQ)</option>
                <option value="radio">Radio (Broadcast Compressor EQ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 4: VOICE PRESETS */}
        <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-input pb-3">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-extrabold border border-indigo-500/20 uppercase tracking-wider">
              Step 4
            </span>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-indigo-400" /> Saved Voice Presets
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Preset Name (e.g. Documentary Male 1.2x)..."
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="w-full sm:flex-1 bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSavePreset}
              disabled={savingPreset || !presetNameInput.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {savingPreset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Preset</span>
            </button>
          </div>

          {presets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {presets.map((p) => (
                <div key={p._id} className="p-3.5 rounded-xl border border-input bg-background flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">{p.presetName}</span>
                    <span className="text-[10px] text-neutral-400 truncate">
                      {allVoices.find((v: VoiceOption) => v.voiceId === p.voiceId)?.name || p.voiceId} ({p.speed}x)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-card border border-input text-[10px] font-bold text-indigo-400 hover:bg-neutral-800 transition cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleDeletePresetItem(p._id)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 5: GENERATE SPEECH BUTTON */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !text.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 font-extrabold text-base text-white shadow-xl shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating Speech ({speed.toFixed(2)}x speed)...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>Generate Speech</span>
              </>
            )}
          </button>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3 text-red-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-bold">Generation Error</span>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* STEP 6: GENERATED AUDIO RESULT CARD */}
        {audioUrl && (
          <div ref={resultCardRef} className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl shadow-2xl flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-indigo-500/30 shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-extrabold text-foreground truncate">Generated Audio Output</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <CheckCircle className="w-4 h-4 shrink-0" /> Audio stream ready
                  </span>
                </div>
              </div>

              {/* Metadata Badges */}
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold">
                <span className="px-2.5 py-1 rounded-md bg-background border border-input text-indigo-400">
                  {selectedVoiceObj?.name || voiceId}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-background border border-input text-neutral-300">
                  {speed.toFixed(2)}x speed
                </span>
                <span className="px-2.5 py-1 rounded-md bg-background border border-input text-neutral-300 capitalize">
                  {tone} tone
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <audio
                ref={audioRef}
                controls
                src={getFullAudioUrl(audioUrl)}
                className="h-10 text-xs rounded-xl w-full border border-input bg-card"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Audio element playback error:', e);
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
    </div>
  );
}
