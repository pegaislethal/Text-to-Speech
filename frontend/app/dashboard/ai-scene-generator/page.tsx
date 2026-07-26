'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import ThemeToggle from '../../../components/ThemeToggle';
import VoiceSpeedControl from '../../../components/VoiceSpeedControl';
import DownloadButton from '../../../components/DownloadButton';
import { generateSceneVoicesApi, getApiUrl, downloadAudioFile, downloadScenesZipApi } from '../../../services/api';
import { 
  Sparkles, FileText, Mic, RefreshCw, AlertCircle, Play, Pause, Clapperboard, Layers, ShieldCheck, FolderArchive
} from 'lucide-react';

interface GeneratedScene {
  sceneNumber: number;
  text: string;
  audioUrl: string;
  filename: string;
}

interface VoiceOption {
  voiceId: string;
  name: string;
  language: string;
  description: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    voiceId: 'en-US-ChristopherNeural',
    name: 'Deep Documentary Male',
    language: 'en-US',
    description: 'Deep, cinematic, and calm tone modeled for nature and history documentaries.'
  },
  {
    voiceId: 'en-US-EricNeural',
    name: 'Dark Storyteller',
    language: 'en-US',
    description: 'Low pitch, dramatic, and moody cadence for thrillers and mysteries.'
  },
  {
    voiceId: 'en-GB-RyanNeural',
    name: 'Ancient History Narrator',
    language: 'en-GB',
    description: 'Slow, resonant British accent with emotional weight for historical narratives.'
  },
  {
    voiceId: 'en-US-AndrewNeural',
    name: 'Professional Podcast Male',
    language: 'en-US',
    description: 'Clear, articulate, and engaging voice for technical essays and audiobooks.'
  },
  {
    voiceId: 'en-US-SteffanNeural',
    name: 'News Documentary Male',
    language: 'en-US',
    description: 'Serious, clean, and commanding voice ideal for investigative reporting.'
  }
];

const DEFAULT_SCRIPT_EXAMPLE = `Scene1: Welcome to the ancient world.

Scene2: I am a Neanderthal living during the Ice Age.

Scene3: My survival depended on hunting and adapting to harsh winters.`;

export default function AISceneGenerator() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [script, setScript] = useState<string>(DEFAULT_SCRIPT_EXAMPLE);
  const [voiceId, setVoiceId] = useState<string>('en-US-ChristopherNeural');
  const [speed, setSpeed] = useState<number>(0.75);
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [downloadingSceneIndex, setDownloadingSceneIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const BACKEND_URL = getApiUrl();

  // Premium Route Protection Guard
  useEffect(() => {
    if (user && !user.premiumAccess) {
      alert('This feature is available only for premium users.');
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || !user.premiumAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Verifying Premium Clearance...</span>
      </div>
    );
  }

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
      const res = await generateSceneVoicesApi(script, voiceId, speed);

      if (!res.success || !res.scenes || res.scenes.length === 0) {
        throw new Error(res.message || 'Unable to generate scene audio.');
      }

      setGeneratedScenes(res.scenes);
      showToast('Scene voices generated successfully!', 'success');
    } catch (err: any) {
      console.error('AI Scene Generation Error:', err);
      setError(err.message || 'Unable to generate scene audio.');
      showToast(err.message || 'Unable to generate scene audio.', 'error');
    } finally {
      setGenerating(false);
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
    showToast(`Downloading Scene ${String(scene.sceneNumber).padStart(2, '0')}...`, 'info');
    const paddedNumber = String(scene.sceneNumber).padStart(2, '0');
    const filename = `scene_${paddedNumber}.mp3`;
    const fullUrl = getFullAudioUrl(scene.audioUrl);

    const success = await downloadAudioFile(fullUrl, filename);
    setDownloadingSceneIndex(null);

    if (!success) {
      showToast('Unable to download audio. Please try again.', 'error');
    }
  };

  const handleDownloadAllZip = async () => {
    if (!generatedScenes || generatedScenes.length === 0) {
      showToast('No generated scenes available.', 'error');
      return;
    }

    setDownloadingZip(true);
    showToast('Creating ZIP archive...', 'info');

    try {
      await downloadScenesZipApi(generatedScenes);
      showToast('ZIP download started!', 'success');
    } catch (err: any) {
      console.error('ZIP generation error:', err);
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
            .then(() => {
              setPlayingIndex(index);
            })
            .catch((err) => {
              console.error('Audio play error:', err);
              setError('Browser blocked audio playback. Use the player controls directly.');
            });
        }
      } catch (err) {
        console.error('Audio trigger error:', err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="border-b border-input pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 bg-clip-text text-transparent">
              21st Tech AI Scene Voice Generator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-[10px] font-extrabold text-amber-500 tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Premium Exclusive
            </span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Automatically detect scene headings (<code className="text-indigo-500 font-mono text-xs">Scene1:</code>, <code className="text-indigo-500 font-mono text-xs">Scene 2:</code>) and split narration scripts into clean individual voice stems.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <ThemeToggle />
          <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-500 font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Premium Access Unlocked
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Script Editor & Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Script Editor Card */}
          <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Multi-Scene Script Editor
              </span>
              <button
                type="button"
                onClick={() => setScript(DEFAULT_SCRIPT_EXAMPLE)}
                className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold underline"
              >
                Load Sample Script
              </button>
            </div>

            <textarea
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                setError(null);
              }}
              placeholder={`Scene1: Welcome to the ancient world.\n\nScene2: I am a Neanderthal living during the Ice Age.\n\nScene3: My survival depended on hunting and adapting.`}
              rows={10}
              className="w-full bg-background border border-input rounded-xl p-4 text-foreground placeholder-neutral-400 focus:outline-none focus:border-indigo-500 text-sm font-mono leading-relaxed resize-y min-h-[220px]"
            />

            <div className="p-3.5 rounded-xl bg-background border border-input flex items-start gap-2.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Clapperboard className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">21st Tech AI Script Parser Active</span>
                <span className="text-[11px] leading-relaxed">
                  Headings like <code className="text-indigo-500 font-mono">Scene1:</code> or <code className="text-indigo-500 font-mono">Scene 2:</code> will automatically name files (<code className="font-mono">scene_01.mp3</code>, <code className="font-mono">scene_02.mp3</code>) and will <strong>NEVER</strong> be spoken in the audio output.
                </span>
              </div>
            </div>
          </div>

          {/* Voice Speed Controls Component */}
          <VoiceSpeedControl speed={speed} onChange={setSpeed} />

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !script.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 transition-all duration-300 font-bold text-sm text-white shadow-xl shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> 21st Tech AI Script Parsing & Synthesizing...
              </>
            ) : (
              <>
                <Layers className="w-5 h-5" /> Generate Scene Voices
              </>
            )}
          </button>
        </div>

        {/* Right Column: Voice Library Selector */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" /> Voice Character Selection
              </h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">{VOICE_OPTIONS.length} Voices</span>
            </div>

            <div className="flex flex-col gap-3">
              {VOICE_OPTIONS.map((v) => {
                const isSelected = voiceId === v.voiceId;
                return (
                  <div
                    key={v.voiceId}
                    onClick={() => {
                      setVoiceId(v.voiceId);
                      setError(null);
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'border-indigo-500/60 bg-indigo-500/10 shadow-md'
                        : 'border-input bg-background/50 hover:bg-background/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{v.name}</span>
                      {isSelected && <ShieldCheck className="w-4 h-4 text-indigo-500" />}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold">Scene Processing Error</span>
            <p className="text-xs opacity-90 leading-normal">{error}</p>
          </div>
        </div>
      )}

      {/* Output Results Section */}
      {generatedScenes.length > 0 && (
        <div className="mt-4 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="border-b border-input pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-indigo-500" /> Generated Scene Voice Stems ({generatedScenes.length})
            </h2>

            {/* Main ZIP Download Button */}
            <DownloadButton
              onClick={handleDownloadAllZip}
              loading={downloadingZip}
              label="Download All Scenes (ZIP)"
              variant="secondary"
              size="md"
              icon={<FolderArchive className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedScenes.map((scene, idx) => {
              const isPlaying = playingIndex === idx;
              const isDownloading = downloadingSceneIndex === idx;

              return (
                <div
                  key={scene.sceneNumber}
                  className="p-6 rounded-2xl border bg-card text-card-foreground border-input backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-extrabold text-xs tracking-wide shadow-md">
                        Scene {String(scene.sceneNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 font-bold bg-background px-2.5 py-1 rounded-lg border border-input">
                        {scene.filename}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleSceneAudio(idx)}
                      className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shadow-lg shrink-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>
                  </div>

                  {/* Clean Text Snippet Preview */}
                  <div className="p-3.5 rounded-xl bg-background border border-input">
                    <p className="text-xs text-foreground italic font-medium leading-relaxed">
                      "{scene.text}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-input gap-4">
                    {/* Audio Player Controls */}
                    <audio
                      ref={(el) => { audioRefs.current[idx] = el; }}
                      controls
                      src={getFullAudioUrl(scene.audioUrl)}
                      className="h-9 w-full text-xs rounded-lg border border-input bg-card max-w-[220px]"
                      onPlay={() => setPlayingIndex(idx)}
                      onPause={() => setPlayingIndex(null)}
                      onEnded={() => setPlayingIndex(null)}
                    />

                    {/* Individual Scene Download Button */}
                    <DownloadButton
                      onClick={() => handleDownloadScene(scene, idx)}
                      loading={isDownloading}
                      label="Download MP3"
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
