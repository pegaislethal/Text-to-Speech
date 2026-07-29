'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PremiumRouteGuard from '../../../components/PremiumRouteGuard';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import DownloadButton from '../../../components/DownloadButton';
import { 
  generateSceneVoicesApi, getApiUrl, downloadAudioFile, 
  downloadScenesZipApi, getVoiceLibraryApi, previewSpeechApi 
} from '../../../services/api';
import { 
  Sparkles, FileText, Mic, RefreshCw, AlertCircle, Play, Pause, 
  Clapperboard, Layers, FolderArchive, RotateCcw, CheckCircle2, 
  SlidersHorizontal, ChevronRight, Zap, Download, X 
} from 'lucide-react';
import { VoiceOption } from '../../../components/VoiceCard';
import VoiceSwitcher from '../../../components/VoiceSwitcher';

interface GeneratedScene {
  sceneNumber: number;
  text: string;
  audioUrl: string;
  filename: string;
  status?: 'generating' | 'completed';
}

const DEFAULT_SCRIPT_PLACEHOLDER = `Scene1:
Before humans discovered fire, night was dominated by total silence and cold darkness.

Scene2:
With the first sparked ember, storytelling was born around the central hearth.`;

export default function DashboardAISceneGenerator() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Core Scene Editor States
  const [script, setScript] = useState<string>(DEFAULT_SCRIPT_PLACEHOLDER);
  const [voiceId, setVoiceId] = useState<string>('en-US-ChristopherNeural');

  // Voice Control States
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [depth, setDepth] = useState<number>(0);
  const [tone, setTone] = useState<string>('natural');

  // Voices
  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);

  // Execution States
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [downloadingSceneIndex, setDownloadingSceneIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    loadVoiceLibrary();
    audioRef.current = new Audio();
    
    const prevAudio = audioRef.current;
    prevAudio.onended = () => setPlayingPreviewId(null);
    prevAudio.onpause = () => setPlayingPreviewId(null);

    return () => {
      if (prevAudio) prevAudio.pause();
    };
  }, [user]);

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

  const allVoices = useMemo(() => [...systemVoices, ...customVoices], [systemVoices, customVoices]);

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

  const detectedScenesCount = useMemo(() => {
    const matches = script.match(/Scene\s*\d+\s*:/gi);
    return matches ? Math.max(1, matches.length) : 1;
  }, [script]);

  const characterCount = script.length;
  const creditsRequired = Math.max(1, Math.ceil(characterCount / 50));

  const getFullAudioUrl = (urlPath: string) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError('Please enter your script with scene delimiters before generating.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedScenes([]);
    setPlayingIndex(null);

    try {
      const isLocked = selectedVoiceObj && (selectedVoiceObj.premium || selectedVoiceObj.isPremium) && user && !user.premiumAccess;
      if (isLocked) {
        throw new Error('Upgrade to Premium to unlock this voice profile.');
      }

      const res = await generateSceneVoicesApi(script, voiceId, speed, pitch, tone, depth);

      if (!res.success || !res.scenes || res.scenes.length === 0) {
        throw new Error(res.message || 'Unable to generate scene audio.');
      }

      const formattedScenes: GeneratedScene[] = res.scenes.map((sc: any) => ({
        ...sc,
        status: 'completed',
      }));

      setGeneratedScenes(formattedScenes);
      showToast('All scene voices generated successfully!', 'success');
      await refreshUser();
    } catch (err: any) {
      console.error('AI Scene Generation Error:', err);
      setError(err.message || 'Unable to generate scene audio.');
      showToast(err.message || 'Unable to generate scene audio.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateScene = async (index: number) => {
    const targetScene = generatedScenes[index];
    if (!targetScene) return;

    setRegeneratingIndex(index);
    showToast(`Regenerating Scene ${String(targetScene.sceneNumber).padStart(2, '0')}...`, 'info');

    try {
      const res = await generateSceneVoicesApi(targetScene.text, voiceId, speed, pitch, tone, depth);
      if (res.success && res.scenes && res.scenes.length > 0) {
        const updated = [...generatedScenes];
        updated[index] = {
          ...targetScene,
          audioUrl: res.scenes[0].audioUrl,
          filename: res.scenes[0].filename,
          status: 'completed',
        };
        setGeneratedScenes(updated);
        showToast(`Scene ${String(targetScene.sceneNumber).padStart(2, '0')} regenerated!`, 'success');
      } else {
        throw new Error(res.message || 'Failed to regenerate scene');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate scene', 'error');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleDownloadScene = async (scene: GeneratedScene, index: number) => {
    setDownloadingSceneIndex(index);
    const sceneNum = scene.sceneNumber !== undefined && scene.sceneNumber !== null ? scene.sceneNumber : index;
    const filename = `Scene${sceneNum}.mp3`;
    const fullUrl = getFullAudioUrl(scene.audioUrl);

    const success = await downloadAudioFile(fullUrl, filename);
    setDownloadingSceneIndex(null);

    if (success) {
      showToast(`Downloaded ${filename}`, 'success');
    } else {
      showToast('Unable to download audio file.', 'error');
    }
  };

  const handleDownloadAllZip = async () => {
    if (!generatedScenes || generatedScenes.length === 0) return;
    setDownloadingZip(true);
    showToast('Preparing scene audio ZIP package...', 'info');

    try {
      await downloadScenesZipApi(generatedScenes);
      showToast('Scene audio ZIP downloaded successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to create ZIP file.', 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    if (previewingVoiceId) return;

    if (playingPreviewId === v.voiceId && audioRef.current) {
      audioRef.current.pause();
      setPlayingPreviewId(null);
      return;
    }

    setPreviewingVoiceId(v.voiceId);
    try {
      const demoText = `Hi, I am ${v.name}. This is a preview of my narration style.`;
      const res = await previewSpeechApi(v.voiceId, demoText, speed, pitch, tone, depth);
      if (res.audioUrl && audioRef.current) {
        const fullUrl = getFullAudioUrl(res.audioUrl);
        audioRef.current.src = fullUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setPlayingPreviewId(v.voiceId);
      }
    } catch (err) {
      console.error('Preview failed:', err);
      showToast('Preview not available for this voice at the moment.', 'error');
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  const toggleSceneAudio = (index: number) => {
    const currentAudio = audioRefs.current[index];
    if (!currentAudio) return;

    if (playingIndex === index) {
      currentAudio.pause();
      setPlayingIndex(null);
    } else {
      if (playingIndex !== null && audioRefs.current[playingIndex]) {
        audioRefs.current[playingIndex]?.pause();
      }
      try {
        currentAudio.load();
        currentAudio.play().then(() => {
          setPlayingIndex(index);
        }).catch(() => {
          setError('Browser blocked audio playback. Use audio player controls.');
        });
      } catch (err) {
        console.error('Audio play error:', err);
      }
    }
  };

  return (
    <PremiumRouteGuard
      featureTitle="AI Scene Generator"
      featureDescription="Generate multi-voice audio scripts scene-by-scene with realistic AI narrators."
    >
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/20 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                AI Scene Generator
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
                  Scene-by-Scene
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Generate distinct scene audio stems from your script with automatic scene parsing.
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

        {/* TWO PANEL PROFESSIONAL WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Scene Script Workspace (Col-8) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Scene Script Input
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                    {detectedScenesCount} {detectedScenesCount === 1 ? 'Scene' : 'Scenes'} Detected
                  </span>
                </div>
              </div>

              {/* Distraction-Free Textarea Editor */}
              <textarea
                value={script}
                onChange={(e) => {
                  setScript(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your script with scene headers (e.g. Scene1:, Scene2:)..."
                rows={11}
                className="w-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] text-sm rounded-2xl p-5 border border-[var(--border-app)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-[var(--text-muted)] font-sans leading-relaxed resize-y min-h-[300px]"
              />

              {/* Bottom Bar: Character Count, Credit Cost, Primary Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[var(--border-app)]">
                <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>Characters: <strong className="text-[var(--text-primary)]">{characterCount}</strong></span>
                  <span>&bull;</span>
                  <span>Credit Cost: <strong className="text-indigo-400">{creditsRequired}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !script.trim()}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Scene Voices...</span>
                    </>
                  ) : (
                    <>
                      <Clapperboard className="w-4 h-4" />
                      <span>Generate Scene Audio</span>
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

            {/* GENERATED SCENES OUTPUT SECTION */}
            {generatedScenes.length > 0 && (
              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-indigo-500/30 shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom-3 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Generated Scene Audio Stems ({generatedScenes.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={downloadingZip}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {downloadingZip ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderArchive className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingZip ? 'Packaging ZIP...' : 'Download All ZIP'}</span>
                  </button>
                </div>

                {/* List of Scene Audio Stems */}
                <div className="flex flex-col gap-3">
                  {generatedScenes.map((scene, idx) => {
                    const sceneNumDisplay = String(scene.sceneNumber !== undefined ? scene.sceneNumber : idx).padStart(2, '0');
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleSceneAudio(idx)}
                            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 transition shrink-0 cursor-pointer"
                          >
                            {playingIndex === idx ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            )}
                          </button>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                              Scene {sceneNumDisplay}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-sm">
                              {scene.text}
                            </span>
                          </div>

                          <audio
                            ref={(el) => { audioRefs.current[idx] = el; }}
                            src={getFullAudioUrl(scene.audioUrl)}
                            onEnded={() => setPlayingIndex(null)}
                            onPause={() => setPlayingIndex(null)}
                            className="hidden"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRegenerateScene(idx)}
                            disabled={regeneratingIndex === idx}
                            className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-[var(--text-secondary)] text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Regenerate scene voice"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${regeneratingIndex === idx ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadScene(scene, idx)}
                            disabled={downloadingSceneIndex === idx}
                            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Voice Configuration Panel (Col-4) */}
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
              label="Selected Narration Voice"
            />

            {/* CARD 2: VOICE CONTROLS */}
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

            {/* CARD 3: EQ TONE PRESET */}
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
            </div>
          </div>
        </div>
      </div>
    </PremiumRouteGuard>
  );
}
