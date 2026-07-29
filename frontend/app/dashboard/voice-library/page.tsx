'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WorkspaceLayout from '../../../components/WorkspaceLayout';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import VoiceLibrary from '../../../components/VoiceLibrary';
import { VoiceOption } from '../../../components/VoiceCard';
import { getVoiceLibraryApi, previewSpeechApi, deleteCustomVoiceApi, getApiUrl } from '../../../services/api';
import { Sparkles, Mic, Volume2, RefreshCw } from 'lucide-react';

export default function VoiceLibraryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    fetchLibrary();
    audioRef.current = new Audio();

    const currentAudio = audioRef.current;
    currentAudio.onended = () => setPlayingVoiceId(null);
    currentAudio.onpause = () => setPlayingVoiceId(null);

    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [user]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await getVoiceLibraryApi();
      if (res.success) {
        const sysVoices: VoiceOption[] = (res.systemVoices || []).map((sv: any) => ({
          voiceId: sv.voiceId,
          name: sv.name,
          gender: sv.category === 'female' ? 'Female' : 'Male',
          language: 'en-US',
          accent: sv.category === 'female' ? 'American Female' : 'American Male',
          description: sv.description,
          style: sv.category || 'Narration',
          category: sv.category,
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
          style: 'Custom Cloned',
          category: 'custom',
          premium: true,
          isPremium: true,
          isCustom: true,
          provider: cv.provider || 'XTTS',
          createdAt: cv.createdAt ? new Date(cv.createdAt).toLocaleDateString() : 'Recent',
        }));

        setSystemVoices(sysVoices);
        setCustomVoices(custVoices);
      }
    } catch (err) {
      console.error('Failed to load voice library:', err);
      showToast('Failed to load voice library.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    if (previewingVoiceId) return;

    if (playingVoiceId === v.voiceId && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(v.voiceId);
    try {
      const demoText = `Hi, I am ${v.name}. Welcome to 21st Tech AI Voice Library.`;
      const res = await previewSpeechApi(v.voiceId, demoText, 1.0, 0, 'natural', 0);
      
      if (res.audioUrl && audioRef.current) {
        let fullUrl = res.audioUrl;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          const baseUrl = BACKEND_URL.replace(/\/+$/, '');
          const cleanPath = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
          fullUrl = `${baseUrl}${cleanPath}`;
        }
        audioRef.current.src = fullUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setPlayingVoiceId(v.voiceId);
      }
    } catch (err) {
      console.error('Preview error:', err);
      showToast('Voice preview unavailable at the moment.', 'error');
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm('Are you sure you want to delete this custom voice profile?')) return;
    try {
      const res = await deleteCustomVoiceApi(voiceId);
      if (res.success) {
        showToast('Voice profile deleted successfully.', 'success');
        setCustomVoices((prev) => prev.filter((v) => v.voiceId !== voiceId));
      } else {
        showToast(res.message || 'Failed to delete voice profile.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete voice profile.', 'error');
    }
  };

  const handleSelectVoice = (v: VoiceOption) => {
    // Navigate to speech studio with voice selected
    router.push(`/dashboard/speech-studio?voiceId=${encodeURIComponent(v.voiceId)}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/60 border border-indigo-500/20 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Mic className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Voice Marketplace & Library
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
                AI Voices
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Browse AI voices and choose the perfect narrator.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard/voice-clone')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Clone New Voice</span>
        </button>
      </div>

      {/* Voice Library Grid */}
      {loading ? (
        <div className="p-16 text-center border border-[var(--border-app)] rounded-3xl bg-[var(--bg-card)] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Loading voice marketplace...</p>
        </div>
      ) : (
        <VoiceLibrary
          systemVoices={systemVoices}
          customVoices={customVoices}
          onSelectVoice={handleSelectVoice}
          onPreviewVoice={handlePreviewVoice}
          onDeleteVoice={handleDeleteVoice}
          previewingVoiceId={previewingVoiceId}
          playingVoiceId={playingVoiceId}
          actionLabel="Use in Studio"
          maxHeight="none"
          gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          showFilters={true}
        />
      )}
    </div>
  );
}
