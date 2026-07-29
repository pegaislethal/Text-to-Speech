'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import { 
  cloneVoiceApi, getVoiceLibraryApi, deleteCustomVoiceApi, getTrainingStatusApi,
  previewSpeechApi, getApiUrl, getUploadSignatureApi, uploadToCloudinaryDirectApi
} from '../../../services/api';
import { 
  Mic, Sparkles, Star, Play, Pause, Trash2, Sliders, Volume2, 
  Upload, Check, AlertCircle, RefreshCw, AudioWaveform, ShieldCheck, CheckCircle2, Zap, ArrowRight, User
} from 'lucide-react';
import PremiumRouteGuard from '../../../components/PremiumRouteGuard';
import VoiceCard, { VoiceOption } from '../../../components/VoiceCard';
import VoiceSwitcher from '../../../components/VoiceSwitcher';

export default function VoiceStudio() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Custom Cloned Voices State
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);
  const [selectedClonedVoiceId, setSelectedClonedVoiceId] = useState<string>('');
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
  const [trainingStatusText, setTrainingStatusText] = useState<string>('Analyzing audio & learning speaker characteristics...');

  // Preview States
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    fetchClonedVoices();
    audioPlayerRef.current = new Audio();

    const currentAudio = audioPlayerRef.current;
    currentAudio.onended = () => setPlayingVoiceId(null);
    currentAudio.onpause = () => setPlayingVoiceId(null);

    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [user]);

  const fetchClonedVoices = async () => {
    setLoadingLibrary(true);
    try {
      const res = await getVoiceLibraryApi();
      if (res && res.success) {
        const custVoices: VoiceOption[] = (res.customVoices || []).map((cv: any) => ({
          voiceId: cv._id || cv.voiceId,
          name: `${cv.voiceName || cv.name}`,
          gender: 'Male',
          language: 'en-US (Cloned)',
          accent: 'Custom Cloned',
          description: `Custom neural cloned voice profile (${cv.provider || 'XTTS v2'}).`,
          style: 'Custom Cloned',
          category: 'custom',
          premium: true,
          isPremium: true,
          isCustom: true,
          provider: cv.provider || 'XTTS',
          createdAt: cv.createdAt ? new Date(cv.createdAt).toLocaleDateString() : 'Recent',
        }));

        setCustomVoices(custVoices);
        if (custVoices.length > 0 && !selectedClonedVoiceId) {
          setSelectedClonedVoiceId(custVoices[0].voiceId);
        }
      }
    } catch (err) {
      console.error('Failed to load cloned voices:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const validateAudioFile = (file: File): boolean => {
    const validExtensions = ['.mp3', '.wav', '.m4a'];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const validMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];
    const isValidMime = validMimes.includes(file.type.toLowerCase()) || file.type.startsWith('audio/');

    if (!isValidExt && !isValidMime) {
      showToast('Please upload MP3, WAV, or M4A sample file.', 'error');
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
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      const optimizedFile = new File([wavBlob], audioFile.name.replace(/\.[^/.]+$/, '_optimized.wav'), { type: 'audio/wav' });

      setAudioFile(optimizedFile);
      setAudioDuration(renderedBuffer.duration);
      showToast(`Audio optimized! Size: ${(optimizedFile.size / (1024 * 1024)).toFixed(2)} MB`, 'success');
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

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
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
      showToast('Voice profile name is required.', 'error');
      return;
    }
    if (!audioFile) {
      showToast('Please upload a voice sample first.', 'error');
      return;
    }
    if (!consent) {
      showToast('You must confirm ownership/authorization consent.', 'error');
      return;
    }

    setCloning(true);
    setUploadStep(2);
    setUploadProgress(0);

    try {
      const sigRes = await getUploadSignatureApi('voice-clones/samples');
      if (!sigRes.success) {
        throw new Error(sigRes.message || 'Unable to upload voice sample.');
      }

      const { audioUrl } = await uploadToCloudinaryDirectApi(
        audioFile,
        sigRes,
        (percent) => setUploadProgress(percent)
      );

      setUploadStep(3);
      setTrainingStatusText('Analyzing audio & learning voice characteristics...');
      const res = await cloneVoiceApi(voiceName.trim(), audioUrl, consent);

      if (res.success) {
        const dbVoiceId = res.voice?._id;
        if (dbVoiceId) {
          let isDone = false;
          let attempts = 0;
          while (!isDone && attempts < 15) {
            attempts++;
            await new Promise((r) => setTimeout(r, 600));
            try {
              const statusData = await getTrainingStatusApi(dbVoiceId);
              if (statusData?.trainingStatus) {
                setTrainingStatusText(statusData.trainingStatus);
              }
              if (statusData?.status === 'completed' || (statusData?.trainingProgress ?? 0) >= 100) {
                isDone = true;
              }
            } catch (_) {
              isDone = true;
            }
          }
        }

        setUploadStep(4);
        showToast('AI Voice model created successfully!', 'success');

        setTimeout(() => {
          setVoiceName('');
          setAudioFile(null);
          setAudioDuration(null);
          setConsent(false);
          setUploadStep(1);
          fetchClonedVoices();
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

  const handleDeleteVoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom voice profile?')) return;
    setDeletingId(id);
    try {
      const res = await deleteCustomVoiceApi(id);
      if (res.success) {
        showToast('Custom voice profile deleted.', 'success');
        fetchClonedVoices();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete voice.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    if (previewingVoiceId) return;

    if (playingVoiceId === v.voiceId && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(v.voiceId);
    try {
      const demoText = `Hi, I am ${v.name}. This is a preview of my cloned voice profile.`;
      const res = await previewSpeechApi(v.voiceId, demoText, 1.0, 0, 'natural', 0);

      if (res.audioUrl && audioPlayerRef.current) {
        let fullUrl = res.audioUrl;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          const baseUrl = BACKEND_URL.replace(/\/+$/, '');
          const cleanPath = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
          fullUrl = `${baseUrl}${cleanPath}`;
        }
        audioPlayerRef.current.src = fullUrl;
        audioPlayerRef.current.load();
        await audioPlayerRef.current.play();
        setPlayingVoiceId(v.voiceId);
      }
    } catch (err) {
      console.error('Preview error:', err);
      showToast('Voice preview unavailable at the moment.', 'error');
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  const handleUseVoiceInStudio = (v: VoiceOption) => {
    router.push(`/dashboard/speech-studio?voiceId=${encodeURIComponent(v.voiceId)}`);
  };

  return (
    <PremiumRouteGuard featureTitle="AI Voice Clone Generator" featureDescription="Clone any voice from a short audio sample and save it to your custom voice profile library.">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900/60 to-indigo-950/60 border border-purple-500/20 shadow-xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Star className="w-6 h-6 fill-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                AI Voice Clone Generator
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
                  Zero-Shot Cloning
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Upload a short audio sample to train and create your custom neural voice profile.
              </p>
            </div>
          </div>
        </div>

        {/* TWO COLUMN WORKSPACE LAYOUT (50% / 50% Balanced Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Clone New Voice Form (Col-6: 50% Desktop Width) */}
          <div className="lg:col-span-6 flex flex-col gap-5 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg relative min-w-0">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-app)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-extrabold text-[var(--text-primary)]">Clone New Voice</h2>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium">Create custom voice profile</p>
                </div>
              </div>
            </div>

            {/* Progress Steps (1. Voice Sample -> 2. Uploading -> 3. Analyzing -> 4. Created) */}
            <div className="grid grid-cols-4 gap-1.5 p-2 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] text-[10px] font-bold text-center">
              <div className={`py-1 rounded-xl transition-all ${uploadStep === 1 ? 'bg-indigo-600 text-white shadow-sm' : uploadStep > 1 ? 'text-emerald-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                1. Sample
              </div>
              <div className={`py-1 rounded-xl transition-all ${uploadStep === 2 ? 'bg-indigo-600 text-white shadow-sm' : uploadStep > 2 ? 'text-emerald-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                2. Upload
              </div>
              <div className={`py-1 rounded-xl transition-all ${uploadStep === 3 ? 'bg-indigo-600 text-white shadow-sm' : uploadStep > 3 ? 'text-emerald-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                3. Analyze
              </div>
              <div className={`py-1 rounded-xl transition-all ${uploadStep === 4 ? 'bg-emerald-600 text-white shadow-sm' : 'text-[var(--text-muted)]'}`}>
                4. Created
              </div>
            </div>

            {uploadStep > 1 && uploadStep < 4 ? (
              <div className="p-6 border border-indigo-500/30 rounded-2xl bg-indigo-500/10 flex flex-col items-center justify-center text-center gap-3 animate-pulse">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {uploadStep === 2 ? `Uploading sample audio (${uploadProgress}%)...` : trainingStatusText}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-normal">
                    Deep learning neural encoder extracting pitch envelope & timbre latents...
                  </p>
                </div>

                {uploadStep === 2 && (
                  <div className="w-full bg-[var(--bg-input)] rounded-full h-2 overflow-hidden border border-[var(--border-app)] mt-2">
                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            ) : uploadStep === 4 ? (
              <div className="p-6 border border-emerald-500/30 rounded-2xl bg-emerald-500/10 flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="text-sm font-bold text-emerald-400">AI Voice Profile Ready!</p>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Added to My Voices library.</p>
              </div>
            ) : (
              <form onSubmit={handleCloneVoice} className="flex flex-col gap-4">
                {/* Field 1: Voice Profile Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Voice Profile Name</label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g., Documentary Male Narrator"
                    required
                    className="px-3.5 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs rounded-xl border border-[var(--border-app)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-[var(--text-muted)] font-medium"
                  />
                </div>

                {/* Field 2: AI Model Provider */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">AI Model Provider</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvider('XTTS')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        provider === 'XTTS'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-app)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Coqui XTTS v2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('OpenVoice')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        provider === 'OpenVoice'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-app)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <AudioWaveform className="w-3.5 h-3.5" />
                      <span>OpenVoice</span>
                    </button>
                  </div>
                </div>

                {/* Field 3: Voice Sample Upload */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Voice Sample Upload</label>
                    <span className="text-[10px] text-[var(--text-muted)]">Clean audio (5s - 60s)</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".mp3,.wav,.m4a,audio/*"
                    className="hidden"
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
                      audioFile
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[var(--border-app)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/40'
                    }`}
                  >
                    <Upload className={`w-6 h-6 ${audioFile ? 'text-indigo-500' : 'text-[var(--text-muted)]'}`} />
                    {audioFile ? (
                      <div className="flex flex-col items-center gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-indigo-400 truncate max-w-[200px]">
                          {audioFile.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {formatDurationDisplay(audioDuration)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Click to upload or drag & drop</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Supports MP3, WAV, M4A up to 100MB</span>
                      </div>
                    )}
                  </div>

                  {audioFile && (
                    <button
                      type="button"
                      onClick={optimizeAudioFile}
                      disabled={isCompressing}
                      className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCompressing ? 'animate-spin' : ''}`} />
                      <span>{isCompressing ? 'Optimizing...' : 'Optimize Sample Audio'}</span>
                    </button>
                  )}
                </div>

                {/* Field 4: Ownership Consent */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-[var(--text-secondary)] leading-tight font-medium">
                    I confirm that I own or have legal authorization to clone this voice sample profile.
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={cloning || !audioFile || !voiceName.trim() || !consent}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{cloning ? 'Processing AI Voice Model...' : 'Create Voice Clone'}</span>
                </button>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: MY VOICES PANEL (Col-6: 50% Desktop Width) */}
          <div className="lg:col-span-6 flex flex-col gap-4 min-w-0">
            {loadingLibrary ? (
              <div className="p-10 text-center border border-[var(--border-app)] rounded-3xl bg-[var(--bg-card)] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Loading your voices...</span>
              </div>
            ) : customVoices.length === 0 ? (
              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h2 className="text-base font-extrabold text-[var(--text-primary)]">My Voices</h2>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold uppercase tracking-wider">
                    0 Voices
                  </span>
                </div>

                <div className="p-8 text-center border border-dashed border-[var(--border-app)] rounded-2xl bg-[var(--bg-input)]/40 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 max-w-xs">
                    <p className="text-xs font-bold text-[var(--text-primary)]">No cloned voices yet</p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Upload a sample to create your first custom voice clone profile.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <VoiceSwitcher
                  voices={customVoices}
                  selectedVoiceId={selectedClonedVoiceId || customVoices[0].voiceId}
                  onSelectVoice={(v) => setSelectedClonedVoiceId(v.voiceId)}
                  onPreviewVoice={handlePreviewVoice}
                  previewingVoiceId={previewingVoiceId}
                  playingVoiceId={playingVoiceId}
                  isUserPremium={true}
                  label="My Cloned Voices Switcher"
                />

                <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h2 className="text-base font-extrabold text-[var(--text-primary)]">All My Cloned Voices</h2>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold uppercase tracking-wider">
                      {customVoices.length} {customVoices.length === 1 ? 'Voice' : 'Voices'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
                    {customVoices.map((v) => (
                      <VoiceCard
                        key={v.voiceId}
                        voice={v}
                        isSelected={v.voiceId === (selectedClonedVoiceId || customVoices[0].voiceId)}
                        isPreviewing={previewingVoiceId === v.voiceId}
                        isPlayingPreview={playingVoiceId === v.voiceId}
                        onPreview={handlePreviewVoice}
                        onDelete={handleDeleteVoice}
                        onSelect={handleUseVoiceInStudio}
                        actionLabel="Use in Studio"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PremiumRouteGuard>
  );
}
