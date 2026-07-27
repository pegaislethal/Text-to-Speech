'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  getAdminUsers, updateAdminUser, toggleAdminUserPremium, 
  deleteAdminUser, getAdminStats, getAdminSettings, updateAdminSettings,
  getAnalyticsOverview, getAnalyticsVoices, getAnalyticsTimeline
} from '../../../services/api';
import { 
  Search, ShieldAlert, Check, ToggleLeft, ToggleRight, Trash2, 
  Save, RefreshCw, Users, Music, Activity, Star, Mail, Edit3, ShieldCheck, 
  Settings, Layers, Sliders, CheckCircle2, AlertCircle, Volume2
} from 'lucide-react';
import { useToast } from '../../../context/toastContext';

const VoicePopularityChart = dynamic(
  () => import('../../../components/DashboardCharts').then((mod) => mod.VoicePopularityChart),
  { ssr: false }
);

const VoiceDistributionChart = dynamic(
  () => import('../../../components/DashboardCharts').then((mod) => mod.VoiceDistributionChart),
  { ssr: false }
);

const GenerationTimelineChart = dynamic(
  () => import('../../../components/DashboardCharts').then((mod) => mod.GenerationTimelineChart),
  { ssr: false }
);

interface UserItem {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  premiumAccess: boolean;
  freeCredits: number;
  usedCredits: number;
  createdAt: string;
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalAudioCount: number;
  totalCharacters: number;
}

interface VoiceItem {
  id: string;
  name: string;
  lang: string;
  gender: 'Male' | 'Female';
  premium: boolean;
}

type AdminTab = 'analytics' | 'users' | 'premium' | 'settings';

export default function UnifiedAdminDashboard() {
  const { showToast } = useToast();
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Directory & Stats States
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // States for user modifications
  const [editedCredits, setEditedCredits] = useState<{ [key: string]: number }>({});
  const [editedRoles, setEditedRoles] = useState<{ [key: string]: 'user' | 'admin' }>({});

  // System Settings States
  const [freeUserLimit, setFreeUserLimit] = useState<number>(100);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);

  // Global Analytics States
  const [globalOverview, setGlobalOverview] = useState<{
    totalGenerations: number;
    totalDuration: number;
    mostUsedVoice: string;
    totalUsers: number;
    premiumUsage: number;
  } | null>(null);
  const [globalVoices, setGlobalVoices] = useState<any[]>([]);
  const [globalTimeline, setGlobalTimeline] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);

  // Initial Data Load
  useEffect(() => {
    loadDashboardData();
  }, [search]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettingsData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchGlobalAnalytics();
    }
  }, [activeTab]);

  const fetchGlobalAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [overviewRes, voicesRes, timelineRes] = await Promise.all([
        getAnalyticsOverview(true),
        getAnalyticsVoices(true),
        getAnalyticsTimeline(true)
      ]);

      if (overviewRes.success) setGlobalOverview(overviewRes);
      if (voicesRes.success) setGlobalVoices(voicesRes.voices);
      if (timelineRes.success) setGlobalTimeline(timelineRes.timeline);
    } catch (err) {
      console.error('Failed to load global admin analytics:', err);
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

  const loadDashboardData = async () => {
    try {
      const usersData = await getAdminUsers(search);
      const statsData = await getAdminStats();
      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showToast('Failed to load administrator data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsData = async () => {
    setSettingsLoading(true);
    try {
      const res = await getAdminSettings();
      if (res.success && res.settings) {
        setFreeUserLimit(res.settings.freeUserLimit);
        setVoices(res.settings.availableVoices || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast('Failed to fetch system settings.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      const res = await updateAdminUser(user._id, { isActive: !user.isActive });
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
        showToast(`User status updated successfully`, 'success');
        loadDashboardData();
      }
    } catch (error) {
      showToast('Failed to update user active status', 'error');
    }
  };

  const handleTogglePremium = async (user: UserItem) => {
    try {
      const res = await toggleAdminUserPremium(user._id, !user.premiumAccess);
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, premiumAccess: !u.premiumAccess } : u));
        showToast(`User premium access updated`, 'success');
        loadDashboardData();
      }
    } catch (error) {
      showToast('Failed to update premium credentials', 'error');
    }
  };

  const handleSaveEdits = async (userId: string) => {
    const credits = editedCredits[userId];
    const role = editedRoles[userId];
    
    if (credits === undefined && role === undefined) return;
    setSavingId(userId);

    try {
      const body: any = {};
      if (credits !== undefined) body.freeCredits = credits;
      if (role !== undefined) body.role = role;

      const res = await updateAdminUser(userId, body);
      if (res.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, ...body } : u));
        showToast('Account credentials saved successfully', 'success');
        loadDashboardData();
      }
    } catch (error) {
      showToast('Failed to save credit updates', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also wipe their audio history.')) return;
    try {
      const res = await deleteAdminUser(userId);
      if (res.success) {
        setUsers(users.filter(u => u._id !== userId));
        showToast('User account deleted permanently', 'success');
        loadDashboardData();
      }
    } catch (error) {
      showToast('Failed to delete user profile', 'error');
    }
  };

  const handleToggleVoicePremium = (index: number) => {
    const updatedVoices = [...voices];
    updatedVoices[index].premium = !updatedVoices[index].premium;
    setVoices(updatedVoices);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await updateAdminSettings({
        freeUserLimit,
        availableVoices: voices
      });
      if (res.success) {
        showToast('System configuration saved successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to save settings modifications', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300 text-[var(--text-primary)]">
      {/* Page Header */}
      <div className="border-b border-[var(--border-app)] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] bg-gradient-to-r from-neutral-900 via-neutral-700 to-indigo-600 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text">
            System Control Panel
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">Audit active accounts, adjust quotas, assign roles, and view usage metrics.</p>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-[var(--border-app)] gap-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          User Directory
        </button>
        <button
          onClick={() => setActiveTab('premium')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none ${
            activeTab === 'premium'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Premium Controls
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none ${
            activeTab === 'settings'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          System Settings
        </button>
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          {analyticsLoading ? (
            // Loading State (Skeleton Cards)
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] h-24 animate-pulse flex flex-col gap-3">
                    <div className="h-3 w-24 bg-neutral-800 rounded" />
                    <div className="h-6 w-16 bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-[var(--border-app)] bg-[var(--bg-card)] rounded-2xl h-80 animate-pulse" />
                <div className="lg:col-span-2 border border-[var(--border-app)] bg-[var(--bg-card)] rounded-2xl h-80 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Overview Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Total Users */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Users</span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{globalOverview?.totalUsers || 0}</span>
                  </div>
                </div>

                {/* Card 2: Total Generations */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Sliders className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Generations</span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{globalOverview?.totalGenerations || 0}</span>
                  </div>
                </div>

                {/* Card 3: Audio Generated */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Volume2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Audio Generated</span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                      {formatDuration(globalOverview?.totalDuration || 0)}
                    </span>
                  </div>
                </div>

                {/* Card 4: Premium Usage */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-4 shadow-sm hover:border-indigo-500/25 transition">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Star className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Premium Usage</span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{globalOverview?.premiumUsage || 0}</span>
                  </div>
                </div>
              </div>

              {/* Charts and Rankings Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Voice Ranking List */}
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                  <div className="border-b border-[var(--border-app)] pb-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Platform Voice Ranking</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Most used voices across all users</p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {globalVoices.length === 0 ? (
                      <div className="text-center text-xs text-[var(--text-muted)] py-8 font-medium">
                        No voices used yet.
                      </div>
                    ) : (
                      globalVoices.map((voice, idx) => (
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
                    <VoicePopularityChart data={globalVoices} />
                  </div>

                  {/* Voice Distribution Card */}
                  <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                    <div className="border-b border-[var(--border-app)] pb-2.5">
                      <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Usage Distribution</h3>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Distribution by voice category</p>
                    </div>
                    <VoiceDistributionChart data={globalVoices} />
                  </div>
                </div>
              </div>

              {/* Line Chart: Timeline Card */}
              <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                <div className="border-b border-[var(--border-app)] pb-2.5">
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Generation Timeline</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Daily synthesis operations timeline</p>
                </div>
                <GenerationTimelineChart data={globalTimeline} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border-app)] flex items-center gap-3">
              <Search className="w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts by name or email address..."
                className="w-full bg-transparent text-sm focus:outline-none placeholder-[var(--text-muted)] text-[var(--text-primary)] font-medium"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-xs text-[var(--text-secondary)]">No registered users matched the search constraints.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-4">Account Profile</th>
                      <th className="p-4">System Role</th>
                      <th className="p-4">Credit Entitlements</th>
                      <th className="p-4">Security / Active</th>
                      <th className="p-4 text-center">Save / Modify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-app)]">
                    {users.map((u) => {
                      const finalCredits = editedCredits[u._id] !== undefined ? editedCredits[u._id] : u.freeCredits;
                      const finalRole = editedRoles[u._id] !== undefined ? editedRoles[u._id] : u.role;
                      const isSaving = savingId === u._id;
                      const isModified = editedCredits[u._id] !== undefined || editedRoles[u._id] !== undefined;

                      return (
                        <tr key={u._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                          <td className="p-4 flex items-center gap-3.5">
                            <img
                              src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                              alt={u.name}
                              className="w-9 h-9 rounded-full border border-[var(--border-app)] object-cover shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-[var(--text-primary)] truncate">{u.name}</span>
                              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">{u.email}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <select
                              value={finalRole}
                              onChange={(e) => setEditedRoles({ ...editedRoles, [u._id]: e.target.value as 'user' | 'admin' })}
                              className="bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-app)] rounded p-1 font-medium focus:outline-none"
                            >
                              <option value="user">User</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={finalCredits}
                                onChange={(e) => setEditedCredits({ ...editedCredits, [u._id]: parseInt(e.target.value) || 0 })}
                                className="w-16 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-app)] rounded p-1 font-mono focus:outline-none"
                              />
                              <span className="text-[10px] text-[var(--text-secondary)]">allocated (used: {u.usedCredits})</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={`flex items-center gap-1 text-[11px] font-semibold transition ${
                                u.isActive ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                              title={u.isActive ? 'Deactivate account' : 'Activate account'}
                            >
                              {u.isActive ? <ToggleRight className="w-5.5 h-5.5" /> : <ToggleLeft className="w-5.5 h-5.5" />}
                              {u.isActive ? 'Active' : 'Banned'}
                            </button>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdits(u._id)}
                                disabled={!isModified || isSaving}
                                className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white font-bold transition flex items-center gap-1"
                                title="Save local edits"
                              >
                                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-1.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 transition"
                                title="Delete account permanent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Premium Access */}
      {activeTab === 'premium' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border-app)] flex items-center gap-3">
              <Search className="w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter premium status by account name or email..."
                className="w-full bg-transparent text-sm focus:outline-none placeholder-[var(--text-muted)] text-[var(--text-primary)] font-medium"
              />
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-4">Account Profile</th>
                      <th className="p-4">System Role</th>
                      <th className="p-4">Credits Consumed</th>
                      <th className="p-4 text-center">Premium Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-app)]">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="p-4 flex items-center gap-3.5">
                          <img
                            src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                            alt={u.name}
                            className="w-9 h-9 rounded-full border border-[var(--border-app)] object-cover shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[var(--text-primary)] truncate">{u.name}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">{u.email}</span>
                          </div>
                        </td>

                        <td className="p-4 uppercase tracking-wider font-semibold text-[10px] text-[var(--text-secondary)]">
                          {u.role}
                        </td>

                        <td className="p-4 font-mono text-[var(--text-secondary)]">
                          {u.usedCredits} credits used
                        </td>

                        <td className="p-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleTogglePremium(u)}
                              className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 ${
                                u.premiumAccess
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-[var(--bg-input)] border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${u.premiumAccess ? 'fill-amber-400' : ''}`} />
                              {u.premiumAccess ? 'Premium Enabled' : 'Grant Premium'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: System Settings */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {settingsLoading ? (
            <div className="py-20 flex justify-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Credit allocations */}
              <div className="lg:col-span-1 flex flex-col gap-5">
                <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-app)]">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">Quota Settings</h3>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wide">Default Free Signup Credits</label>
                    <input
                      type="number"
                      value={freeUserLimit}
                      onChange={(e) => setFreeUserLimit(parseInt(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-input)] text-xs text-[var(--text-primary)] border border-[var(--border-app)] rounded-lg p-2.5 font-mono focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      New non-admin accounts registered on the platform receive this credit allocation immediately upon profile creation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Configuration</span>
                </button>
              </div>

              {/* Right Column: Voice availability toggles */}
              <div className="lg:col-span-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-app)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">Voice Access List ({voices.length})</h3>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Toggle Premium Lock</span>
                </div>

                <div className="flex flex-col divide-y divide-[var(--border-app)] max-h-[400px] overflow-y-auto pr-1">
                  {voices.map((v, index) => (
                    <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{v.name}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">{v.lang} • {v.gender}</span>
                      </div>

                      <button
                        onClick={() => handleToggleVoicePremium(index)}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-wide transition flex items-center gap-1.5 ${
                          v.premium
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-[var(--bg-input)] border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${v.premium ? 'fill-amber-400' : ''}`} />
                        {v.premium ? 'Premium Lock' : 'Everyone (Free)'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
