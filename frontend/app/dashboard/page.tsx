'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '../../context/authContext';
import { useToast } from '../../context/toastContext';
import { 
  getHistory, downloadAudioFile, getApiUrl,
  getAnalyticsOverview, getAnalyticsVoices, getAnalyticsTimeline
} from '../../services/api';
import { 
  Play, Pause, Download, Mic, Sparkles, Layers, History, 
  ArrowRight, ShieldCheck, HelpCircle, Star, Music, RefreshCw, Calendar, Volume2, User,
  Activity, Sliders
} from 'lucide-react';

const VoicePopularityChart = dynamic(
  () => import('../../components/DashboardCharts').then((mod) => mod.VoicePopularityChart),
  { ssr: false }
);

const VoiceDistributionChart = dynamic(
  () => import('../../components/DashboardCharts').then((mod) => mod.VoiceDistributionChart),
  { ssr: false }
);

const GenerationTimelineChart = dynamic(
  () => import('../../components/DashboardCharts').then((mod) => mod.GenerationTimelineChart),
  { ssr: false }
);

interface HistoryItem {
  _id: string;
  text: string;
  voice: string;
  audioUrl: string;
  characterCount: number;
  createdAt: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [recentClips, setRecentClips] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Analytics States
  const [analyticsOverview, setAnalyticsOverview] = useState<{
    totalGenerations: number;
    totalDuration: number;
    mostUsedVoice: string;
  } | null>(null);
  const [popularVoices, setPopularVoices] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);

  const BACKEND_URL = getApiUrl();

  const getFullAudioUrl = (urlPath: string) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    fetchHistoryList();
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const [overviewRes, voicesRes, timelineRes] = await Promise.all([
        getAnalyticsOverview(false),
        getAnalyticsVoices(false),
        getAnalyticsTimeline(false)
      ]);

      if (overviewRes.success) setAnalyticsOverview(overviewRes);
      if (voicesRes.success) setPopularVoices(voicesRes.voices);
      if (timelineRes.success) setTimelineData(timelineRes.timeline);
    } catch (err) {
      console.error('Failed to load user analytics data:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 && hrs === 0) parts.push(`${secs}s`);
    return parts.join(' ') || '0s';
  };

  const fetchHistoryList = async () => {
    try {
      const res = await getHistory();
      if (res.success) {
        setRecentClips(res.history.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClip = (clipId: string, url: string) => {
    if (!audioRef.current) return;

    if (activeClip === clipId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => console.error(err));
        setIsPlaying(true);
      }
    } else {
      audioRef.current.src = getFullAudioUrl(url);
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setActiveClip(clipId);
          setIsPlaying(true);
        })
        .catch(err => console.error(err));
    }
  };

  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setActiveClip(null);
  };

  const handleDownload = async (item: HistoryItem) => {
    const filename = `generation_${item._id.substring(0, 6)}.mp3`;
    const success = await downloadAudioFile(getFullAudioUrl(item.audioUrl), filename);
    if (success) {
      showToast('Audio download started', 'success');
    } else {
      showToast('Download failed. Try again.', 'error');
    }
  };

  const remainingCredits = user ? user.freeCredits - user.usedCredits : 0;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] p-6 md:p-8 overflow-hidden shadow-lg">
        {/* Glow Ambient */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Workspace
              </span>
              {user?.premiumAccess && (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" /> Premium
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Create your next AI voice project
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] max-w-xl">
              Convert scripts to lifelike neural voices, manage scene narrations, and clone custom speech patterns in one unified workspace.
            </p>
          </div>

          {/* Credits Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] flex flex-col gap-1.5 shrink-0 min-w-[200px]">
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Usage & Credits
            </span>
            {user?.premiumAccess ? (
              <div className="flex flex-col">
                <span className="text-lg font-black text-[var(--text-primary)]">Unlimited</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-medium">Enterprise Entitlement</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-xl font-black text-indigo-400">{remainingCredits} <span className="text-xs text-[var(--text-secondary)] font-medium">credits left</span></span>
                {/* Progress bar */}
                <div className="w-full bg-[var(--border-app)] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (remainingCredits / user!.freeCredits) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Core AI Workspaces */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          AI Voice Workspaces
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Action 1: Speech Studio */}
          <Link 
            href="/dashboard/speech-studio" 
            className="group p-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] hover:border-indigo-500/50 hover:bg-[var(--bg-card-hover)] hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between gap-8 cursor-pointer"
          >
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                  Speech Studio
                </h3>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  Synthesize text into lifelike neural narrations using advanced speed, pitch, and depth controls.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 self-start">
              Open Studio <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          {/* Action 2: AI Scene Generator */}
          <Link 
            href="/dashboard/ai-scene-generator" 
            className="group p-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] hover:border-indigo-500/50 hover:bg-[var(--bg-card-hover)] hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between gap-8 cursor-pointer"
          >
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                    AI Scene Generator
                  </h3>
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  Synthesize multi-character scripts into structured scene-by-scene narrative audio stems.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 self-start">
              Launch Builder <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          {/* Action 3: AI Voice Clone Generator */}
          <Link 
            href="/dashboard/voice-studio" 
            className="group p-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] hover:border-indigo-500/50 hover:bg-[var(--bg-card-hover)] hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between gap-8 cursor-pointer"
          >
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                    AI Voice Clone Generator
                  </h3>
                  <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Premium
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  Clone custom voices from uploaded audio samples and reuse them for future generations.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 self-start">
              Create AI Voice <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>

      {/* Voice Analytics and Usage Statistics */}
      <div className="flex flex-col gap-5 border-t border-[var(--border-app)]/60 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Voice Analytics & Statistics
          </h2>
          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">My Usage Insights</span>
        </div>

        {analyticsLoading ? (
          // Skeleton Cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] h-24 animate-pulse flex flex-col gap-3">
              <div className="h-3 w-24 bg-neutral-800 rounded" />
              <div className="h-6 w-16 bg-neutral-800 rounded" />
            </div>
            <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] h-24 animate-pulse flex flex-col gap-3">
              <div className="h-3 w-28 bg-neutral-800 rounded" />
              <div className="h-6 w-20 bg-neutral-800 rounded" />
            </div>
            <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] h-24 animate-pulse flex flex-col gap-3">
              <div className="h-3 w-32 bg-neutral-800 rounded" />
              <div className="h-6 w-36 bg-neutral-800 rounded" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Generations</span>
                  <span className="text-xl font-black text-[var(--text-primary)]">{analyticsOverview?.totalGenerations || 0}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Volume2 className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Audio Duration</span>
                  <span className="text-xl font-black text-[var(--text-primary)]">
                    {formatDuration(analyticsOverview?.totalDuration || 0)}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Most Used Voice</span>
                  <span className="text-xs font-black text-[var(--text-primary)] truncate max-w-[150px]" title={analyticsOverview?.mostUsedVoice}>
                    {analyticsOverview?.mostUsedVoice || 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts and Rankings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Popular Voices Ranking List */}
              <div className="lg:col-span-1 p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                <div className="border-b border-[var(--border-app)] pb-2.5">
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Popular Voices</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">My voices ranked by usage frequency</p>
                </div>

                <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                  {popularVoices.length === 0 ? (
                    <div className="text-center text-xs text-[var(--text-muted)] py-8 font-medium">
                      No voices used yet.
                    </div>
                  ) : (
                    popularVoices.map((voice, idx) => (
                      <div key={voice.voiceName} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0 
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                              : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)]'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[var(--text-primary)] truncate">{voice.voiceName}</span>
                            <span className="text-[9px] text-[var(--text-secondary)] mt-0.5 capitalize">{voice.category}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-bold text-[var(--text-primary)]">{voice.usageCount} times</span>
                          <span className="text-[9px] text-[var(--text-secondary)] mt-0.5">{voice.percentage}% share</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Charts Display */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Voice Popularity Chart Card */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                  <div className="border-b border-[var(--border-app)] pb-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Voice Popularity</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Top 5 voices comparison</p>
                  </div>
                  <VoicePopularityChart data={popularVoices} />
                </div>

                {/* Voice Distribution (Category Pie) Card */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                  <div className="border-b border-[var(--border-app)] pb-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Usage Distribution</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Distribution by voice category</p>
                  </div>
                  <VoiceDistributionChart data={popularVoices} />
                </div>
              </div>
            </div>

            {/* Line Chart: Timeline Card */}
            <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
              <div className="border-b border-[var(--border-app)] pb-2.5">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Generation Timeline</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Daily synthesis operations timeline</p>
              </div>
              <GenerationTimelineChart data={timelineData} />
            </div>
          </div>
        )}
      </div>

      {/* Recent Generations Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-app)]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-400" /> Recent Generations
          </h2>
          {recentClips.length > 0 && (
            <Link href="/dashboard/history" className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              View all history <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-xs text-[var(--text-muted)]">Loading recent generations...</span>
          </div>
        ) : recentClips.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-10 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Music className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Audio Created Yet</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Try synthesizing your first text passage into premium speech using the Speech Studio!
              </p>
            </div>
            <Link 
              href="/dashboard/speech-studio"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition rounded-lg flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" /> Open Speech Studio
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentClips.map((item) => {
              const isClipPlaying = activeClip === item._id && isPlaying;
              return (
                <div 
                  key={item._id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
                    isClipPlaying 
                      ? 'border-indigo-500/30 bg-indigo-950/10' 
                      : 'border-[var(--border-app)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div className="flex items-start gap-4 w-full sm:max-w-[75%] min-w-0">
                    <button
                      onClick={() => handlePlayClip(item._id, item.audioUrl)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-95 shadow-sm ${
                        isClipPlaying
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-[var(--bg-input)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isClipPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <div className="flex flex-col min-w-0 pt-0.5">
                      <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed truncate">
                        "{item.text}"
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--text-secondary)] font-medium">
                        <span className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-app)] px-2 py-0.5 rounded">
                          <Volume2 className="w-3 h-3 text-indigo-400 shrink-0" /> {item.voice}
                        </span>
                        <span className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-app)] px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3 text-indigo-400 shrink-0" /> {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 border-t sm:border-t-0 border-[var(--border-app)] pt-2.5 sm:pt-0">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition flex items-center justify-center gap-1.5 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden audio player */}
      <audio
        ref={audioRef}
        className="hidden"
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
      />
    </div>
  );
}
