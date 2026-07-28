'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PremiumRouteGuard from '../../../components/PremiumRouteGuard';
import WorkspaceLayout from '../../../components/WorkspaceLayout';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import VoiceSpeedControl from '../../../components/VoiceSpeedControl';
import DownloadButton from '../../../components/DownloadButton';
import { generateSceneVoicesApi, getApiUrl, downloadAudioFile, downloadScenesZipApi, getVoiceLibraryApi, previewSpeechApi } from '../../../services/api';
import { 
  Sparkles, FileText, Mic, RefreshCw, AlertCircle, Play, Pause, Clapperboard, Layers, ShieldCheck, FolderArchive, RotateCcw, CheckCircle2, Music2, Sliders
} from 'lucide-react';
import { VoiceSelector, VoiceOption } from '../../../components/VoiceSelector';

interface GeneratedScene {
  sceneNumber: number;
  text: string;
  audioUrl: string;
  filename: string;
  status?: 'generating' | 'completed';
}

const DEFAULT_SCRIPT_PLACEHOLDER = `Scene1:
Enter narration for the first scene of your script...

Scene2:
Continue narration for the second scene here...`;

export default function DashboardAISceneGenerator() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [script, setScript] = useState<string>(DEFAULT_SCRIPT_PLACEHOLDER);
  const [voiceId, setVoiceId] = useState<string>('en-US-ChristopherNeural');
  const [speed, setSpeed] = useState<number>(0.75);
  const [pitch, setPitch] = useState<number>(0);
  const [depth, setDepth] = useState<number>(0);
  const [tone, setTone] = useState<string>('natural');
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [downloadingSceneIndex, setDownloadingSceneIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    loadVoiceLibrary();
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [user]);

  const loadVoiceLibrary = async () => {
    try {
      const res = await getVoiceLibraryApi();
      if (res.success) {
        const sysVoices = (res.systemVoices || []).map((sv: any) => ({
          voiceId: sv.voiceId,
          name: sv.name,
          gender: sv.category === 'female' ? 'Female' : 'Male',
          language: 'en-US',
          description: sv.description,
          style: sv.category,
          premium: sv.isPremium,
          isPremium: sv.isPremium
        }));
        
        const custVoices = (res.customVoices || []).map((cv: any) => ({
          voiceId: cv._id,
          name: `${cv.voiceName || cv.name} (Custom)`,
          gender: 'Male',
          language: 'en-US (cloned)',
          description: `Custom cloned voice profile (${cv.provider}).`,
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

  const handlePreviewVoice = async (v: VoiceOption) => {
    if (previewingVoice) return;
    setPreviewingVoice(v.voiceId);
    try {
      const demoText = `Hi, I am ${v.name}. This is a preview of my narration style.`;
      const res = await previewSpeechApi(v.voiceId, demoText, speed, pitch, tone, depth);
      if (res.audioUrl && audioRef.current) {
        let fullUrl = res.audioUrl;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          const baseUrl = BACKEND_URL.replace(/\/+$/, '');
          const cleanPath = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
          fullUrl = `${baseUrl}${cleanPath}`;
        }
        audioRef.current.src = fullUrl;
        audioRef.current.load();
        audioRef.current.play().catch((playErr) => {
          console.error('Browser playback error:', playErr);
        });
      }
    } catch (err) {
      console.error('Preview failed:', err);
      showToast('Preview not available for this voice at the moment.', 'error');
    } finally {
      setPreviewingVoice(null);
    }
  };

  const allVoices = [...systemVoices, ...customVoices];

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError('Please enter a script before generating scene voices.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedScenes([]);
    setPlayingIndex(null);

    try {
      const res = await generateSceneVoicesApi(script, voiceId, speed, pitch, tone, depth);

      if (!res.success || !res.scenes || res.scenes.length === 0) {
        throw new Error(res.message || 'Unable to generate scene audio.');
      }

      const formattedScenes: GeneratedScene[] = res.scenes.map((sc: any) => ({
        ...sc,
        status: 'completed'
      }));

      setGeneratedScenes(formattedScenes);
      showToast('Scene voices generated successfully!', 'success');
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
          status: 'completed'
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

  const getFullAudioUrl = (urlPath: string) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleDownloadScene = async (scene: GeneratedScene, index: number) => {
    setDownloadingSceneIndex(index);
    const paddedNumber = String(scene.sceneNumber).padStart(2, '0');
    const filename = `scene_${paddedNumber}.mp3`;
    const fullUrl = getFullAudioUrl(scene.audioUrl);

    const success = await downloadAudioFile(fullUrl, filename);
    setDownloadingSceneIndex(null);

    if (success) {
      showToast(`Downloaded Scene ${paddedNumber}.mp3`, 'success');
    } else {
      showToast('Unable to download audio file.', 'error');
    }
  };

  const handleDownloadAllZip = async () => {
    if (!generatedScenes || generatedScenes.length === 0) return;
    setDownloadingZip(true);
    showToast('Creating ZIP archive...', 'info');

    try {
      await downloadScenesZipApi(generatedScenes);
      showToast('ZIP download started!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to create ZIP file.', 'error');
    } finally {
      setDownloadingZip(false);
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
        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setPlayingIndex(index))
            .catch(() => setError('Browser blocked audio playback. Use player directly.'));
        }
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
      <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-app)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              AI Scene Generator
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Production Workspace
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Convert your scripts into organized scene-by-scene voice narration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Premium Unlimited Stems
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Script Input Panel */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-400" /> Script Input Panel
              </span>
              <button
                type="button"
                onClick={() => setScript(DEFAULT_SCRIPT_PLACEHOLDER)}
                className="text-xs text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Reset Template
              </button>
            </div>

            <textarea
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                setError(null);
              }}
              placeholder={DEFAULT_SCRIPT_PLACEHOLDER}
              rows={11}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg p-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 text-xs font-mono leading-relaxed resize-y min-h-[360px] transition-colors"
            />

            <div className="p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-app)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-indigo-400 shrink-0" />
                Auto-detects <code className="text-indigo-400 font-mono">Scene1:</code>, <code className="text-indigo-400 font-mono">Scene 2:</code> headings into clean scene stems.
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {script.length} characters
              </span>
            </div>
          </div>

          {/* Generate Voice Scenes Button - Directly Below Text Input Panel */}
          <button
            onClick={handleGenerate}
            disabled={generating || !script.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 font-bold text-sm text-white shadow-xl shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Synthesizing voice stems...
              </>
            ) : (
              <>
                <Layers className="w-4.5 h-4.5" /> Generate Voice Scenes
              </>
            )}
          </button>
        </div>

        {/* Right: Generation Settings Panel */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" /> Neural Voice characters
              </h3>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{allVoices.length} Available</span>
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

          {/* Voice Advanced Waveform Controls Card */}
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-app)]">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Voice Settings</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Pitch */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-[var(--text-secondary)]">Pitch Offset</span>
                  <span className="font-mono text-indigo-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseInt(e.target.value))} 
                  className="w-full focus:outline-none"
                />
              </div>

              {/* Depth */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-[var(--text-secondary)]">Voice Depth</span>
                  <span className="font-mono text-indigo-400">{depth}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={depth} 
                  onChange={(e) => setDepth(parseInt(e.target.value))} 
                  className="w-full focus:outline-none"
                />
              </div>

              {/* Tone preset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)]">EQ Tone Preset</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="natural">Natural</option>
                  <option value="documentary">Documentary</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="podcast">Podcast</option>
                  <option value="radio">Radio</option>
                </select>
              </div>

              {/* Speed */}
              <VoiceSpeedControl speed={speed} onChange={setSpeed} />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-500 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Scene Generation Failed</span>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State Skeleton */}
      {generating && (
        <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-8 flex flex-col items-center justify-center gap-3 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">Parsing scenes & synthesizing voice stems...</span>
          <span className="text-[11px] text-[var(--text-muted)]">This usually takes a few seconds per scene stem.</span>
        </div>
      )}

      {/* Empty State */}
      {!generating && generatedScenes.length === 0 && !error && (
        <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-10 flex flex-col items-center justify-center gap-3 text-center my-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Music2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Scenes Generated Yet</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Write or paste your script in the editor above and click <strong>Generate Voice Scenes</strong> to create audio stems.
            </p>
          </div>
        </div>
      )}

      {/* Generated Scene Cards Results */}
      {!generating && generatedScenes.length > 0 && (
        <div className="mt-4 flex flex-col gap-5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-app)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-indigo-400" /> Generated Scenes ({generatedScenes.length})
            </h2>

            <DownloadButton
              onClick={handleDownloadAllZip}
              loading={downloadingZip}
              label="Download All (ZIP)"
              variant="secondary"
              size="sm"
              icon={<FolderArchive className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedScenes.map((scene, idx) => {
              const isPlaying = playingIndex === idx;
              const isDownloading = downloadingSceneIndex === idx;
              const isRegenerating = regeneratingIndex === idx;

              return (
                <div
                  key={scene.sceneNumber}
                  className="p-5 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col justify-between gap-4 relative shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-xs">
                        Scene {String(scene.sceneNumber).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-input)] px-2 py-0.5 rounded border border-[var(--border-app)]">
                        {scene.filename}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                      <button
                        onClick={() => toggleSceneAudio(idx)}
                        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shrink-0"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Text Preview */}
                  <div className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)]">
                    <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                      "{scene.text}"
                    </p>
                  </div>

                  {/* Audio Player & Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-app)] gap-3">
                    <audio
                      ref={(el) => { audioRefs.current[idx] = el; }}
                      controls
                      src={getFullAudioUrl(scene.audioUrl)}
                      className="h-8 w-full text-xs rounded border border-[var(--border-app)] bg-[var(--bg-card)] max-w-[200px]"
                      onPlay={() => setPlayingIndex(idx)}
                      onPause={() => setPlayingIndex(null)}
                      onEnded={() => setPlayingIndex(null)}
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRegenerateScene(idx)}
                        disabled={isRegenerating}
                        className="p-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs flex items-center gap-1"
                        title="Regenerate scene voice"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline text-[11px]">Regenerate</span>
                      </button>

                      <DownloadButton
                        onClick={() => handleDownloadScene(scene, idx)}
                        loading={isDownloading}
                        label="Download"
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </PremiumRouteGuard>
);
}
