'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import { 
  cloneVoiceApi, getVoiceLibraryApi, deleteCustomVoiceApi, 
  previewSpeechApi, getApiUrl, getUploadSignatureApi, uploadToCloudinaryDirectApi
} from '../../../services/api';
import { 
  Mic, Sparkles, Star, Play, Pause, Trash2, Sliders, Volume2, 
  Upload, Check, AlertCircle, RefreshCw, AudioWaveform, ShieldCheck, ShieldAlert, CheckCircle2, Zap
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
  isPremium?: boolean;
}

// Platform default voices loaded dynamically from DB business
export default function VoiceStudio() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<'library' | 'clone'>('clone');
  const [libraryCategory, setLibraryCategory] = useState<'all' | 'documentary' | 'male' | 'female' | 'custom'>('all');

  // Voice Library States
  const [systemVoices, setSystemVoices] = useState<any[]>([]);
  const [customVoices, setCustomVoices] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for voice cloning
  const [voiceName, setVoiceName] = useState<string>('');
  const [provider, setProvider] = useState<'XTTS' | 'OpenVoice'>('XTTS');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [consent, setConsent] = useState<boolean>(false);
  const [cloning, setCloning] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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
    fetchVoiceLibrary();
  }, [user]);

  const fetchVoiceLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const res = await getVoiceLibraryApi();
      if (res.success) {
        setSystemVoices(res.systemVoices || []);
        setCustomVoices(res.customVoices || []);
      }
    } catch (err) {
      console.error('Failed to load voice profiles:', err);
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

  const validateAudioFile = (file: File): boolean => {
    const validExtensions = ['.mp3', '.wav', '.m4a'];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));
    const validMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];
    const isValidMime = validMimes.includes(file.type.toLowerCase()) || file.type.startsWith('audio/');

    if (!isValidExt && !isValidMime) {
      showToast('Please upload MP3, WAV, or M4A.', 'error');
      return false;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      showToast('Audio file is too large. Please upload a smaller sample.', 'error');
      return false;
    }

    return true;
  };

  const handleSelectAudioFile = (file: File) => {
    if (!validateAudioFile(file)) return;
    setAudioFile(file);

    // Parse audio duration
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setAudioDuration(null);
        URL.revokeObjectURL(url);
      };
    } catch {
      setAudioDuration(null);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectAudioFile(e.target.files[0]);
    }
  };

  const formatDurationDisplay = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return 'Unknown length';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Client-Side Audio Optimization (Resamples to Mono 22.05kHz PCM WAV)
  const optimizeAudioFile = async () => {
    if (!audioFile) return;
    setIsCompressing(true);
    showToast('Optimizing audio sample...', 'info');

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const targetSampleRate = 22050;
      const offlineCtx = new OfflineAudioContext(1, Math.ceil(decodedBuffer.duration * targetSampleRate), targetSampleRate);

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();

      // WAV Encoder
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      const optimizedFile = new File([wavBlob], audioFile.name.replace(/\.[^/.]+$/, '_optimized.wav'), { type: 'audio/wav' });

      setAudioFile(optimizedFile);
      setAudioDuration(renderedBuffer.duration);
      showToast(`Audio optimized! New size: ${(optimizedFile.size / (1024 * 1024)).toFixed(2)} MB`, 'success');
    } catch (err: any) {
      console.error('Optimization error:', err);
      showToast('Optimization failed. Using original file.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) { view.setUint16(offset, data, true); offset += 2; }
    function setUint32(data: number) { view.setUint32(offset, data, true); offset += 4; }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - offset - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      pos++;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }

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
    setUploadStep(2); // Step 2: Uploading
    setUploadProgress(0);

    try {
      // Step 2: Fetch upload signature & upload directly to Cloudinary
      const sigRes = await getUploadSignatureApi('voice-clones/samples');
      if (!sigRes.success) {
        throw new Error(sigRes.message || 'Unable to upload voice sample.');
      }

      const { audioUrl } = await uploadToCloudinaryDirectApi(
        audioFile,
        sigRes,
        (percent) => setUploadProgress(percent)
      );

      // Step 3: Send audio URL to backend for embedding creation
      setUploadStep(3); // Step 3: Analyzing voice...
      const res = await cloneVoiceApi(voiceName.trim(), audioUrl, consent);
      
      if (res.success) {
        setUploadStep(4); // Step 4: Success
        showToast('Voice created successfully!', 'success');
        
        setTimeout(() => {
          setVoiceName('');
          setAudioFile(null);
          setAudioDuration(null);
          setConsent(false);
          setUploadStep(1);
          fetchVoiceLibrary();
          setActiveTab('library');
          setLibraryCategory('custom');
        }, 1500);
      } else {
        throw new Error(res.message || 'Voice cloning failed. Please try another sample.');
      }
    } catch (err: any) {
      console.error('Voice Clone Error:', err);
      showToast(err.message || 'Voice cloning failed. Please try another sample.', 'error');
      setUploadStep(1);
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
      console.error('Preview failed:', err);
      showToast('Preview not available for this voice at the moment.', 'error');
      setPreviewingVoiceId(null);
    } finally {
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
  const formattedSystemVoices = systemVoices.map((sv: any) => ({
    voiceId: sv.voiceId,
    name: sv.name,
    category: sv.category || 'documentary',
    language: 'en-US',
    description: sv.description || '',
    gender: sv.category === 'female' ? 'Female' : 'Male',
    style: sv.category || 'Standard',
    premium: sv.isPremium,
    isPremium: sv.isPremium
  }));

  const formattedCustomVoices = customVoices.map((cv: any) => ({
    _id: cv._id,
    voiceId: cv._id,
    name: cv.voiceName || cv.name,
    category: 'custom' as const,
    language: 'en-US (cloned)',
    description: `Custom cloned voice profile (${cv.provider}).`,
    gender: 'Neutral' as const,
    style: 'Custom Cloned',
    premium: true,
    isPremium: true
  }));

  const combinedLibrary = [...formattedSystemVoices, ...formattedCustomVoices];

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
              Documentary ({formattedSystemVoices.filter(v => v.category === 'documentary').length})
            </button>
            <button
              onClick={() => setLibraryCategory('male')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'male'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Male ({formattedSystemVoices.filter(v => v.category === 'male').length})
            </button>
            <button
              onClick={() => setLibraryCategory('female')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                libraryCategory === 'female'
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                  : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Female ({formattedSystemVoices.filter(v => v.category === 'female').length})
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

            {/* 4-Step Progress Indicator */}
            <div className="grid grid-cols-4 gap-2 my-1">
              {[
                { step: 1, label: '1. Voice sample' },
                { step: 2, label: '2. Uploading...' },
                { step: 3, label: '3. Analyzing voice' },
                { step: 4, label: '4. Voice created' }
              ].map(s => (
                <div 
                  key={s.step} 
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                    uploadStep === s.step 
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold' 
                      : uploadStep > s.step 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium' 
                        : 'bg-[var(--bg-input)] border-[var(--border-app)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-[10px] truncate">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step 2 Progress Bar */}
            {uploadStep === 2 && (
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col gap-2 animate-in fade-in">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-300">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading audio sample directly to cloud storage...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-200" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Step 3 AI Analyzing Banner */}
            {uploadStep === 3 && (
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center gap-3 animate-in fade-in">
                <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-purple-300">Analyzing voice & creating speaker embedding...</span>
                  <span className="text-[10px] text-purple-400/80">Processing sample URL through AI neural network</span>
                </div>
              </div>
            )}

            {/* Step 4 Success Banner */}
            {uploadStep === 4 && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-300">Voice created successfully!</span>
                  <span className="text-[10px] text-emerald-400/80">Redirecting to your voice library...</span>
                </div>
              </div>
            )}

            {/* Voice Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Voice Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Deep Narration Speaker"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                required
                disabled={cloning}
                className="w-full bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 transition-all font-medium disabled:opacity-50"
              />
            </div>

            {/* Provider Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">AI Model Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'XTTS' | 'OpenVoice')}
                disabled={cloning}
                className="w-full bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 transition-all font-medium disabled:opacity-50"
              >
                <option value="XTTS">XTTS v2.0 (High voice embedding quality)</option>
                <option value="OpenVoice">OpenVoice v2.0 (Tone color style conversion)</option>
              </select>
            </div>

            {/* Upload Box */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Voice Sample Audio File</label>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Recommended: 30s – 3 min
                </span>
              </div>
              
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !cloning && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-[var(--border-app)] hover:border-indigo-500/50 bg-[var(--bg-input)] p-6 rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition ${
                  cloning ? 'opacity-50 pointer-events-none' : ''
                }`}
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
                    MP3, WAV, or M4A format (max 100MB)
                  </span>
                </div>
              </div>

              {/* Display Selected Audio Metadata & Optimization Option */}
              {audioFile && (
                <div className="mt-2 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AudioWaveform className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[var(--text-primary)] truncate">{audioFile.name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] mt-0.5">
                        <span>Duration: {formatDurationDisplay(audioDuration)}</span>
                        <span>•</span>
                        <span>Size: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={optimizeAudioFile}
                    disabled={isCompressing || cloning}
                    className="px-2.5 py-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-bold flex items-center gap-1.5 shrink-0 transition disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Optimizing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-400" /> Optimize sample
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Consent Box */}
            <div className="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-app)] flex items-start gap-3 mt-1">
              <input
                type="checkbox"
                id="consent-check"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={cloning}
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
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing AI Voice Clone...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Create AI Voice Clone
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
