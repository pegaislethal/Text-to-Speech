'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import { 
  cloneVoiceApi, getCustomVoicesApi, deleteCustomVoiceApi, 
  previewSpeechApi, getApiUrl 
} from '../../../services/api';
import { 
  Sparkles, ShieldCheck, Star, Music, RefreshCw, Play, Pause, Trash2, 
  Upload, FileText, Sliders, Volume2, Bookmark, CheckSquare, Info, ShieldAlert
} from 'lucide-react';
import ThemeToggle from '../../../components/ThemeToggle';
import VoiceSpeedControl from '../../../components/VoiceSpeedControl';

interface VoiceOption {
  voiceId: string;
  name: string;
  category: 'documentary' | 'male' | 'female' | 'custom';
  language: string;
  description: string;
  gender: 'Male' | 'Female' | 'Neutral';
  style: string;
}

const DEFAULT_PLATFORM_VOICES: VoiceOption[] = [
  // Documentary Voices
  {
    voiceId: 'en-US-ChristopherNeural',
    name: 'Deep History Narrator',
    category: 'documentary',
    language: 'en-US',
    description: 'Resonant, cinematic narrator tone designed for historical documentaries and epics.',
    gender: 'Male',
    style: 'Deep & Resonant'
  },
  {
    voiceId: 'en-GB-RyanNeural',
    name: 'Ancient Civilization Voice',
    category: 'documentary',
    language: 'en-GB',
    description: 'Slow, dramatic British accent with weight suitable for ancient histories.',
    gender: 'Male',
    style: 'Ancient Narrator'
  },
  {
    voiceId: 'en-US-SteffanNeural',
    name: 'Wildlife Documentary Voice',
    category: 'documentary',
    language: 'en-US',
    description: 'Clean, warm, narrative pitch ideal for scientific and wildlife features.',
    gender: 'Male',
    style: 'Clear Narrative'
  },
  {
    voiceId: 'en-US-EricNeural',
    name: 'Dark Mystery Narrator',
    category: 'documentary',
    language: 'en-US',
    description: 'Moody, low cadence narrator for mysteries, thrillers, and crime dramas.',
    gender: 'Male',
    style: 'Dark Storyteller'
  },
  {
    voiceId: 'en-US-GuyNeural',
    name: 'Cinematic Storyteller',
    category: 'documentary',
    language: 'en-US',
    description: 'Expressive, storytelling pacing for film trailers and audiobook narratives.',
    gender: 'Male',
    style: 'Cinematic Trailer'
  },
  
  // Male Voices
  {
    voiceId: 'en-US-AndrewNeural',
    name: 'Deep Male',
    category: 'male',
    language: 'en-US',
    description: 'Low-pitched, warm commercial male voice for announcements and promos.',
    gender: 'Male',
    style: 'Deep & Cinematic'
  },
  {
    voiceId: 'en-US-BrianNeural',
    name: 'Calm Male',
    category: 'male',
    language: 'en-US',
    description: 'Soft, steady pacing optimized for guided meditations and background essays.',
    gender: 'Male',
    style: 'Calm & Warm'
  },
  {
    voiceId: 'en-GB-ThomasNeural',
    name: 'Professional Male',
    category: 'male',
    language: 'en-GB',
    description: 'Articulate British corporate cadence suited for business pitches and tutorials.',
    gender: 'Male',
    style: 'Professional business'
  },
  {
    voiceId: 'en-US-AvaNeural', // Mapped placeholder name for anchor
    name: 'News Anchor Male',
    category: 'male',
    language: 'en-US',
    description: 'High energy, crisp broadcast voice for newscasts and news bulletins.',
    gender: 'Male',
    style: 'Broadcast News'
  },
  {
    voiceId: 'en-AU-WilliamNeural',
    name: 'Trailer Voice',
    category: 'male',
    language: 'en-AU',
    description: 'Resonant, epic Australian accent for promo ads and dramatic introductions.',
    gender: 'Male',
    style: 'Epic Accent'
  },

  // Female Voices
  {
    voiceId: 'en-US-EmmaNeural',
    name: 'Calm Female',
    category: 'female',
    language: 'en-US',
    description: 'Warm, soothing, clear voice ideal for guides, tutorials, and relaxations.',
    gender: 'Female',
    style: 'Calm Narrative'
  },
  {
    voiceId: 'en-US-MichelleNeural',
    name: 'Educational Female',
    category: 'female',
    language: 'en-US',
    description: 'Steady, articulate educator cadence optimized for e-learning and courses.',
    gender: 'Female',
    style: 'Articulate E-Learning'
  },
  {
    voiceId: 'en-GB-SoniaNeural',
    name: 'Storytelling Female',
    category: 'female',
    language: 'en-GB',
    description: 'Engaging, expressive British narration for audiobooks and dramatic scripts.',
    gender: 'Female',
    style: 'Expressive Novelist'
  }
];

export default function VoiceStudio() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<'library' | 'clone'>('clone');
  const [libraryCategory, setLibraryCategory] = useState<'all' | 'documentary' | 'male' | 'female' | 'custom'>('all');

  // Custom Cloned Voices States
  const [customVoices, setCustomVoices] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cloning Form States
  const [voiceName, setVoiceName] = useState<string>('');
  const [provider, setProvider] = useState<'XTTS' | 'OpenVoice'>('XTTS');
  const [consent, setConsent] = useState<boolean>(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [cloning, setCloning] = useState<boolean>(false);

  // Advanced Audio Control States (For previews)
  const [pitch, setPitch] = useState<number>(0);
  const [depth, setDepth] = useState<number>(0);
  const [tone, setTone] = useState<string>('neutral');
  const [speed, setSpeed] = useState<number>(1.0);

  // Preview States
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    if (user?.premiumAccess) {
      fetchCustomVoices();
    }
  }, [user]);

  const fetchCustomVoices = async () => {
    try {
      const res = await getCustomVoicesApi();
      if (res.success) {
        setCustomVoices(res.customVoices || []);
      }
    } catch (err) {
      console.error('Failed to load custom voice profiles:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const getFullAudioUrl = (urlPath: string) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-m4a', 'audio/m4a'];
      if (validTypes.includes(file.type) || file.name.endsWith('.m4a')) {
        setAudioFile(file);
      } else {
        showToast('Please upload a valid MP3, WAV, or M4A audio file.', 'error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  // Convert file to Base64 data string
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleCloneVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceName.trim()) {
      showToast('Voice name is required.', 'error');
      return;
    }
    if (!audioFile) {
      showToast('Please upload a voice sample first.', 'error');
      return;
    }
    if (!consent) {
      showToast('You must check the authorization consent checkbox.', 'error');
      return;
    }

    setCloning(true);
    showToast('Extracting tone characteristics & cloning voice...', 'loading');

    try {
      const base64Data = await toBase64(audioFile);
      const res = await cloneVoiceApi(voiceName, base64Data, consent);
      
      if (res.success) {
        showToast('Voice cloned successfully!', 'success');
        setVoiceName('');
        setAudioFile(null);
        setConsent(false);
        fetchCustomVoices();
        setActiveTab('library');
        setLibraryCategory('custom');
      } else {
        throw new Error(res.message || 'Cloning failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to clone voice. Please try again.', 'error');
    } finally {
      setCloning(false);
    }
  };

  const handleDeleteVoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom cloned voice?')) return;
    setDeletingId(id);
    try {
      const res = await deleteCustomVoiceApi(id);
      if (res.success) {
        showToast('Custom voice profile deleted.', 'success');
        setCustomVoices(customVoices.filter(v => v._id !== id));
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete voice.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePlayPreview = async (voiceId: string) => {
    // If already playing this preview, pause it
    if (previewingVoiceId === voiceId && playingPreviewUrl) {
      if (audioPlayerRef.current) {
        if (audioPlayerRef.current.paused) {
          audioPlayerRef.current.play().catch(e => console.error(e));
          setPreviewingVoiceId(voiceId);
        } else {
          audioPlayerRef.current.pause();
          setPreviewingVoiceId(null);
        }
      }
      return;
    }

    setPreviewLoading(true);
    setPreviewingVoiceId(voiceId);
    showToast('Synthesizing narrator preview clip...', 'info');

    try {
      const text = 'Hi, I am your AI narrator from 21st Tech Company.';
      const res = await previewSpeechApi(voiceId, text, speed, pitch, tone, depth);
      
      if (res.success && res.audioUrl) {
        const fullUrl = getFullAudioUrl(res.audioUrl);
        setPlayingPreviewUrl(fullUrl);

        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = fullUrl;
          audioPlayerRef.current.load();
          audioPlayerRef.current.play()
            .then(() => setPreviewLoading(false))
            .catch(err => {
              console.error(err);
              setPreviewLoading(false);
              showToast('Browser blocked autoplay. Press play again.', 'error');
            });
        }
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err.message || 'Preview generation failed.', 'error');
      setPreviewingVoiceId(null);
      setPreviewLoading(false);
    }
  };

  // Upgrade Gateway View for non-premium accounts
  if (user && !user.premiumAccess) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[75vh] px-6">
        <div className="rounded-2xl border border-amber-500/20 bg-[var(--bg-card)] backdrop-blur-xl p-8 sm:p-12 shadow-2xl text-center flex flex-col items-center gap-6 max-w-lg">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">AI Voice Studio Locked</h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
              This feature is available for premium users. Upgrade your subscription package to unlock voice cloning, infinite voice library custom uploads, and high-fidelity narrators.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 transition font-bold text-xs text-black shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Combined Voice Library List (Default list + Custom cloned list)
  const formattedCustomVoices: VoiceOption[] = customVoices.map((cv: any) => ({
    voiceId: cv._id,
    name: cv.voiceName,
    category: 'custom',
    language: 'en-US (cloned)',
    description: `User-created custom AI voice cloned using the ${cv.provider} engine.`,
    gender: 'Neutral',
    style: cv.provider
  }));

  const combinedLibrary = [...DEFAULT_PLATFORM_VOICES, ...formattedCustomVoices];

  const filteredLibrary = combinedLibrary.filter((voice) => {
    if (libraryCategory === 'all') return true;
    return voice.category === libraryCategory;
  });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-app)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              AI Voice Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" /> Premium Workspace
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Clone custom voices from audio samples, test different pitches, and manage voice libraries.
          </p>
        </div>

        {/* Tab Controllers */}
        <div className="flex bg-[var(--bg-input)] border border-[var(--border-app)] p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Voice Library
          </button>
          <button
            onClick={() => setActiveTab('clone')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'clone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Clone New Voice
          </button>
        </div>
      </div>

      {/* Voice Preview Audio Controls Bar */}
      {activeTab === 'library' && (
        <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-4 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-app)]">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Voice Synthesis Controls</h3>
            <span className="text-[10px] text-[var(--text-muted)] font-medium ml-1">Configure options before playing a card preview</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
            {/* Pitch */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-[var(--text-secondary)]">Pitch Offset</span>
                <span className="font-mono text-indigo-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
              </div>
              <input 
                type="range" 
                min="-20" 
                max="20" 
                value={pitch} 
                onChange={(e) => setPitch(parseInt(e.target.value))} 
                className="w-full h-1 bg-[var(--border-app)] rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
            </div>

            {/* Depth */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-[var(--text-secondary)]">Voice Depth</span>
                <span className="font-mono text-indigo-400">{depth}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={depth} 
                onChange={(e) => setDepth(parseInt(e.target.value))} 
                className="w-full h-1 bg-[var(--border-app)] rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
            </div>

            {/* Tone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">EQ Tone Preset</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2 focus:outline-none focus:border-indigo-550"
              >
                <option value="neutral">Neutral</option>
                <option value="deep">Deep & Bass</option>
                <option value="warm">Warm Narration</option>
                <option value="professional">Professional articulative</option>
                <option value="cinematic">Cinematic Wide</option>
                <option value="dramatic">Dramatic Studio</option>
              </select>
            </div>

            {/* Speed */}
            <VoiceSpeedControl speed={speed} onChange={setSpeed} />
          </div>
        </div>
      )}

      {/* Tab content: Library */}
      {activeTab === 'library' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Categories Navigation */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-[var(--border-app)]">
            <button
              onClick={() => setLibraryCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'all'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Voices ({combinedLibrary.length})
            </button>
            <button
              onClick={() => setLibraryCategory('documentary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'documentary'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Documentary ({DEFAULT_PLATFORM_VOICES.filter(v => v.category === 'documentary').length})
            </button>
            <button
              onClick={() => setLibraryCategory('male')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'male'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Male ({DEFAULT_PLATFORM_VOICES.filter(v => v.category === 'male').length})
            </button>
            <button
              onClick={() => setLibraryCategory('female')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'female'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Female ({DEFAULT_PLATFORM_VOICES.filter(v => v.category === 'female').length})
            </button>
            <button
              onClick={() => setLibraryCategory('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'custom'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Custom Cloned ({customVoices.length})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLibrary.map((voice) => {
              const isPlaying = previewingVoiceId === voice.voiceId && !previewLoading;
              const isVoiceLoading = previewingVoiceId === voice.voiceId && previewLoading;

              return (
                <div 
                  key={voice.voiceId}
                  className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-indigo-500/30 transition-all duration-200"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{voice.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                        voice.category === 'custom'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {voice.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed min-h-[36px]">
                      {voice.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-app)] text-[10px] text-[var(--text-secondary)] font-medium">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-[var(--bg-input)] border border-[var(--border-app)] px-2 py-0.5 rounded truncate">
                        {voice.language}
                      </span>
                      <span className="bg-[var(--bg-input)] border border-[var(--border-app)] px-2 py-0.5 rounded truncate">
                        {voice.gender}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePlayPreview(voice.voiceId)}
                        disabled={isVoiceLoading}
                        className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isVoiceLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isPlaying ? (
                          <>
                            <Pause className="w-3 h-3 fill-white" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-white ml-0.5" /> Preview
                          </>
                        )}
                      </button>

                      {voice.category === 'custom' && (
                        <button
                          onClick={(e) => handleDeleteVoice(voice.voiceId, e)}
                          disabled={deletingId === voice.voiceId}
                          className="p-1.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 transition"
                          title="Delete cloned voice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab content: Clone Voice */}
      {activeTab === 'clone' && (
        <form onSubmit={handleCloneVoice} className="max-w-xl mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-6 flex flex-col gap-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--border-app)]">
              <Upload className="w-4 h-4 text-indigo-400" /> Create Custom Voice Profile
            </h3>

            {/* Voice Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Voice Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Deep Narration Speaker"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Provider Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">AI Model Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'XTTS' | 'OpenVoice')}
                className="w-full bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              >
                <option value="XTTS">XTTS v2.0 (High voice embedding quality)</option>
                <option value="OpenVoice">OpenVoice v2.0 (Tone color style conversion)</option>
              </select>
            </div>

            {/* Upload Box */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Voice Sample Audio File</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-app)] hover:border-indigo-500/50 bg-[var(--bg-input)] p-8 rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a" 
                  className="hidden" 
                />
                
                <Upload className="w-8 h-8 text-indigo-400 animate-pulse" />
                <div className="flex flex-col gap-0.5 text-center">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {audioFile ? audioFile.name : 'Select or drag & drop audio file'}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    MP3, WAV, or M4A format (10-60 seconds recommended, max 10MB)
                  </span>
                </div>
              </div>
            </div>

            {/* Consent Box */}
            <div className="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-app)] flex items-start gap-3 mt-1">
              <input
                type="checkbox"
                id="consent-check"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-app)] text-indigo-600 focus:ring-indigo-500 focus:ring-opacity-25 mt-0.5"
              />
              <div className="flex flex-col gap-0.5 leading-normal">
                <label htmlFor="consent-check" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer select-none">
                  Voice Ownership Consent Verification
                </label>
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                  I confirm I own this voice sample or have express legal permission to clone and synthesize speech from this speaker.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={cloning || !voiceName.trim() || !audioFile || !consent}
            className="w-full py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            {cloning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Voice Embeddings...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Initialize Custom Cloned Voice
              </>
            )}
          </button>
        </form>
      )}

      {/* Hidden audio tag for card preview playback */}
      <audio
        ref={audioPlayerRef}
        className="hidden"
        onPause={() => setPreviewingVoiceId(null)}
        onEnded={() => setPreviewingVoiceId(null)}
      />
    </div>
  );
}
