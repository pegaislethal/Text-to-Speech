'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WorkspaceLayout from '../../../components/WorkspaceLayout';
import { useAuth } from '../../../context/authContext';
import { useToast } from '../../../context/toastContext';
import VoiceLibrary from '../../../components/VoiceLibrary';
import { VoiceOption } from '../../../components/VoiceCard';
import {
  getVoiceLibraryApi,
  previewSpeechApi,
  deleteCustomVoiceApi,
  getApiUrl,
  getVoiceProfilesApi,
  updateVoiceProfileApi,
  deleteVoiceProfileApi,
  VoiceProfileData,
} from '../../../services/api';
import { Sparkles, Mic, Volume2, RefreshCw, Bookmark, Sliders, Trash2, Edit3, Check, X, ArrowRight, Play, Pause } from 'lucide-react';

export default function VoiceLibraryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [systemVoices, setSystemVoices] = useState<VoiceOption[]>([]);
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<VoiceProfileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Profile Edit State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    profileName: string;
    speed: number;
    pitch: number;
    voiceDepth: number;
    tonePreset: string;
    emotion: string;
  }>({
    profileName: '',
    speed: 1.0,
    pitch: 0,
    voiceDepth: 50,
    tonePreset: 'Natural',
    emotion: 'Neutral',
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BACKEND_URL = getApiUrl();

  useEffect(() => {
    fetchLibrary();
    fetchSavedProfiles();
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

  const fetchSavedProfiles = async () => {
    if (!user) return;
    setLoadingProfiles(true);
    try {
      const res = await getVoiceProfilesApi();
      if (res.success && Array.isArray(res.profiles)) {
        setSavedProfiles(res.profiles);
      }
    } catch (err) {
      console.warn('Failed to load voice profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handlePreviewVoice = async (v: VoiceOption) => {
    await handlePreviewVoiceWithSettings(v, {
      speed: 1.0,
      pitch: 0,
      depth: 50,
      tone: 'Natural',
      emotion: 'Neutral',
    });
  };

  const handlePreviewVoiceWithSettings = async (
    v: VoiceOption,
    settings: {
      speed: number;
      pitch: number;
      depth: number;
      tone: string;
      emotion: string;
    }
  ) => {
    if (previewingVoiceId) return;

    if (playingVoiceId === v.voiceId && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(v.voiceId);
    try {
      const demoText = `Hi, I am ${v.name}. Welcome to 21st Tech AI Voice Library.`;
      const res = await previewSpeechApi(
        v.voiceId,
        demoText,
        settings.speed,
        settings.pitch,
        settings.tone,
        settings.depth,
        settings.emotion
      );

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

  // Saved Voice Profile Actions
  const handleLoadProfileToStudio = (profile: VoiceProfileData) => {
    const params = new URLSearchParams({
      voiceId: profile.voiceId,
      speed: profile.speed.toString(),
      pitch: profile.pitch.toString(),
      depth: profile.voiceDepth.toString(),
      tone: profile.tonePreset,
      emotion: profile.emotion || 'Neutral',
      profileName: profile.profileName,
    });
    router.push(`/dashboard/speech-studio?${params.toString()}`);
  };

  const handleDeleteSavedProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved voice profile?')) return;
    try {
      const res = await deleteVoiceProfileApi(id);
      if (res.success) {
        showToast('Voice profile deleted.', 'info');
        setSavedProfiles((prev) => prev.filter((p) => p._id !== id));
      } else {
        showToast(res.message || 'Failed to delete profile.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete profile.', 'error');
    }
  };

  const startEditProfile = (profile: VoiceProfileData) => {
    setEditingProfileId(profile._id || null);
    setEditForm({
      profileName: profile.profileName,
      speed: profile.speed,
      pitch: profile.pitch,
      voiceDepth: profile.voiceDepth,
      tonePreset: profile.tonePreset,
      emotion: profile.emotion || 'Neutral',
    });
  };

  const handleSaveEditProfile = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await updateVoiceProfileApi(id, editForm);
      if (res.success) {
        showToast('Voice profile updated successfully!', 'success');
        setEditingProfileId(null);
        await fetchSavedProfiles();
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Banner */}
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
              Browse AI voices, configure custom control profiles, and choose your perfect narrator.
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

      {/* MY SAVED VOICE PROFILES SECTION */}
      {user && (
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                My Saved Voice Profiles ({savedProfiles.length})
              </h2>
            </div>
            {!user.premiumAccess && (
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                Free Plan: {savedProfiles.length}/1 Saved Profile
              </span>
            )}
          </div>

          {loadingProfiles ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Loading saved voice profiles...</span>
            </div>
          ) : savedProfiles.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-[var(--border-app)] rounded-2xl bg-[var(--bg-input)]/50 text-xs text-[var(--text-muted)]">
              No saved voice profiles yet. Select any voice below, open <strong className="text-indigo-400">Controls ▼</strong>, adjust your parameters, and click <strong className="text-indigo-400">Save Voice Profile</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProfiles.map((profile) => {
                const isEditing = editingProfileId === profile._id;

                if (isEditing) {
                  return (
                    <div
                      key={profile._id}
                      className="p-4 rounded-2xl border border-indigo-500 bg-[var(--bg-input)] flex flex-col gap-3 shadow-md"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                        <span>Edit Profile</span>
                        <button
                          type="button"
                          onClick={() => setEditingProfileId(null)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={editForm.profileName}
                        onChange={(e) => setEditForm({ ...editForm, profileName: e.target.value })}
                        placeholder="Profile name"
                        className="w-full px-3 py-1.5 bg-[var(--bg-card)] text-[var(--text-primary)] text-xs rounded-xl border border-[var(--border-app)] outline-none font-semibold"
                      />

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-[var(--text-muted)]">Speed ({editForm.speed}x)</label>
                          <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.05"
                            value={editForm.speed}
                            onChange={(e) => setEditForm({ ...editForm, speed: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-[var(--bg-card)] accent-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--text-muted)]">Pitch ({editForm.pitch})</label>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={editForm.pitch}
                            onChange={(e) => setEditForm({ ...editForm, pitch: parseInt(e.target.value) })}
                            className="w-full h-1 bg-[var(--bg-card)] accent-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-[var(--text-muted)]">Tone</label>
                          <select
                            value={editForm.tonePreset}
                            onChange={(e) => setEditForm({ ...editForm, tonePreset: e.target.value })}
                            className="w-full px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg border border-[var(--border-app)] outline-none"
                          >
                            <option value="Natural">Natural</option>
                            <option value="Documentary">Documentary</option>
                            <option value="Cinematic">Cinematic</option>
                            <option value="Podcast">Podcast</option>
                            <option value="Radio">Radio</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[var(--text-muted)]">Emotion</label>
                          <select
                            value={editForm.emotion}
                            onChange={(e) => setEditForm({ ...editForm, emotion: e.target.value })}
                            className="w-full px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg border border-[var(--border-app)] outline-none"
                          >
                            <option value="Neutral">Neutral</option>
                            <option value="Serious">Serious</option>
                            <option value="Dramatic">Dramatic</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-app)]">
                        <button
                          type="button"
                          onClick={() => handleSaveEditProfile(profile._id!)}
                          disabled={savingEdit}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={profile._id}
                    className="p-4 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-input)] hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-extrabold">
                            {profile.voiceName}
                          </span>
                          <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                            {profile.profileName}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditProfile(profile)}
                            className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-app)] transition cursor-pointer"
                            title="Edit profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedProfile(profile._id!)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition cursor-pointer"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Settings Summary Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)] font-mono font-bold">
                          Speed: {profile.speed}x
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)] font-mono font-bold">
                          Pitch: {profile.pitch > 0 ? `+${profile.pitch}` : profile.pitch}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-secondary)] font-mono font-bold">
                          Depth: {profile.voiceDepth}%
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                          {profile.tonePreset}
                        </span>
                        {profile.emotion && profile.emotion !== 'Neutral' && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                            {profile.emotion}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLoadProfileToStudio(profile)}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer mt-1"
                    >
                      <span>Load in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
          onPreviewWithControls={handlePreviewVoiceWithSettings}
          onProfileSaved={(newProfile) => {
            setSavedProfiles((prev) => [newProfile, ...prev]);
          }}
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
