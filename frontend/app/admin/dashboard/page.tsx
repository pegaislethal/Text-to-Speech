'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../context/authContext';
import { 
  getAdminUsers, updateAdminUser, toggleAdminUserPremium, 
  deleteAdminUser, getAdminStats, getAdminSettings, updateAdminSettings,
  getAnalyticsOverview, getAnalyticsVoices, getAnalyticsTimeline,
  createAdminApi, updateAdminPermissionsApi,
  createSubAdminApi, getSubAdminsApi, updateSubAdminStatusApi, deleteSubAdminApi,
  getAuditLogsApi
} from '../../../services/api';
import { 
  Search, ShieldAlert, Check, ToggleLeft, ToggleRight, Trash2, 
  Save, RefreshCw, Users, Music, Activity, Star, Mail, Edit3, ShieldCheck, 
  Settings, Layers, Sliders, CheckCircle2, AlertCircle, Volume2, UserPlus, Shield, Key, Lock, X, FileText, UserCheck, UserX, Sparkles
} from 'lucide-react';
import { useToast } from '../../../context/toastContext';
import PasswordInput from '../../../components/PasswordInput';

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
  role: 'user' | 'sub_admin' | 'admin';
  permissions?: string[];
  isActive: boolean;
  premiumAccess: boolean;
  freeCredits: number;
  usedCredits: number;
  createdAt: string;
}

interface SubAdminItem {
  _id: string;
  name: string;
  email: string;
  role: 'sub_admin';
  isActive: boolean;
  createdAt: string;
}

interface AuditLogItem {
  _id: string;
  performedByName: string;
  performedByEmail: string;
  performedByRole: string;
  action: string;
  targetUserEmail?: string;
  details: string;
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

type AdminTab = 'analytics' | 'users' | 'premium' | 'sub_admins' | 'audit_logs' | 'settings';

export default function UnifiedAdminDashboard() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  
  const isFullAdmin = currentUser?.role === 'admin';
  const isSubAdmin = currentUser?.role === 'sub_admin';

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Directory & Stats States
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [search, setSearch] = useState<string>('');
  const [userFilter, setUserFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Sub-Admin Management States
  const [subAdmins, setSubAdmins] = useState<SubAdminItem[]>([]);
  const [subAdminsLoading, setSubAdminsLoading] = useState<boolean>(false);
  const [showCreateSubAdminModal, setShowCreateSubAdminModal] = useState<boolean>(false);
  const [newSubAdminName, setNewSubAdminName] = useState<string>('');
  const [newSubAdminEmail, setNewSubAdminEmail] = useState<string>('');
  const [newSubAdminPassword, setNewSubAdminPassword] = useState<string>('');
  const [newSubAdminStatus, setNewSubAdminStatus] = useState<'active' | 'inactive'>('active');
  const [createSubAdminLoading, setCreateSubAdminLoading] = useState<boolean>(false);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState<boolean>(false);

  // Premium Confirmation Modal State
  const [confirmPremiumModal, setConfirmPremiumModal] = useState<{
    user: UserItem;
    targetStatus: boolean;
  } | null>(null);
  const [confirmPremiumLoading, setConfirmPremiumLoading] = useState<boolean>(false);

  // States for user modifications
  const [editedCredits, setEditedCredits] = useState<{ [key: string]: number }>({});
  const [editedRoles, setEditedRoles] = useState<{ [key: string]: 'user' | 'sub_admin' | 'admin' }>({});

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
    if (activeTab === 'settings' && isFullAdmin) {
      fetchSettingsData();
    } else if (activeTab === 'sub_admins' && isFullAdmin) {
      fetchSubAdmins();
    } else if (activeTab === 'audit_logs') {
      fetchAuditLogs();
    } else if (activeTab === 'analytics') {
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

  const fetchSubAdmins = async () => {
    setSubAdminsLoading(true);
    try {
      const res = await getSubAdminsApi();
      if (res.success) {
        setSubAdmins(res.subAdmins);
      }
    } catch (err) {
      console.error('Failed to fetch sub admins:', err);
      showToast('Failed to fetch sub-admins', 'error');
    } finally {
      setSubAdminsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const res = await getAuditLogsApi();
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLogsLoading(false);
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
      showToast('Failed to load user data.', 'error');
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
    if (!isFullAdmin) {
      showToast('Only full administrators can change account activation status.', 'error');
      return;
    }
    try {
      const res = await updateAdminUser(user._id, { isActive: !user.isActive });
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
        showToast(`User active status updated`, 'success');
        loadDashboardData();
      }
    } catch (error) {
      showToast('Failed to update user active status', 'error');
    }
  };

  const openPremiumConfirmation = (user: UserItem, targetStatus: boolean) => {
    if (user.role === 'admin' && !isFullAdmin) {
      showToast('Cannot modify admin accounts.', 'error');
      return;
    }
    setConfirmPremiumModal({ user, targetStatus });
  };

  const handleExecuteTogglePremium = async () => {
    if (!confirmPremiumModal) return;
    const { user, targetStatus } = confirmPremiumModal;
    setConfirmPremiumLoading(true);

    try {
      const res = await toggleAdminUserPremium(user._id, targetStatus);
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, premiumAccess: targetStatus } : u));
        showToast(
          targetStatus 
            ? `Successfully upgraded ${user.name || user.email} to Premium` 
            : `Removed Premium access for ${user.name || user.email}`, 
          'success'
        );
        setConfirmPremiumModal(null);
        loadDashboardData();
        fetchAuditLogs();
      } else {
        showToast(res.message || 'Failed to update premium status', 'error');
      }
    } catch (error) {
      showToast('Failed to update premium status', 'error');
    } finally {
      setConfirmPremiumLoading(false);
    }
  };

  const handleSaveEdits = async (userId: string) => {
    if (!isFullAdmin) {
      showToast('Only full administrators can change role or quota settings.', 'error');
      return;
    }
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
        showToast('User credentials saved successfully', 'success');
        loadDashboardData();
        fetchAuditLogs();
      }
    } catch (error) {
      showToast('Failed to save user updates', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isFullAdmin) {
      showToast('Only full administrators can delete user profiles.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This will permanently wipe their account and audio history.')) return;
    try {
      const res = await deleteAdminUser(userId);
      if (res.success) {
        setUsers(users.filter(u => u._id !== userId));
        showToast('User account deleted permanently', 'success');
        loadDashboardData();
        fetchAuditLogs();
      }
    } catch (error) {
      showToast('Failed to delete user profile', 'error');
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubAdminName || !newSubAdminEmail || !newSubAdminPassword) {
      showToast('Full Name, Email, and Temporary Password are required', 'error');
      return;
    }
    if (newSubAdminPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    setCreateSubAdminLoading(true);
    try {
      const res = await createSubAdminApi({
        name: newSubAdminName,
        email: newSubAdminEmail,
        password: newSubAdminPassword,
        status: newSubAdminStatus
      });
      if (res.success) {
        showToast(res.message || 'Sub-admin account created successfully', 'success');
        setShowCreateSubAdminModal(false);
        setNewSubAdminName('');
        setNewSubAdminEmail('');
        setNewSubAdminPassword('');
        setNewSubAdminStatus('active');
        fetchSubAdmins();
        loadDashboardData();
        fetchAuditLogs();
      } else {
        showToast(res.message || 'Failed to create sub-admin', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating sub-admin', 'error');
    } finally {
      setCreateSubAdminLoading(false);
    }
  };

  const handleToggleSubAdminStatus = async (subAdmin: SubAdminItem) => {
    if (!isFullAdmin) return;
    try {
      const newStatus = !subAdmin.isActive;
      const res = await updateSubAdminStatusApi(subAdmin._id, newStatus);
      if (res.success) {
        setSubAdmins(subAdmins.map(s => s._id === subAdmin._id ? { ...s, isActive: newStatus } : s));
        showToast(`Sub-admin ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');
        fetchAuditLogs();
      } else {
        showToast(res.message || 'Failed to update sub-admin status', 'error');
      }
    } catch (err: any) {
      showToast('Failed to update sub-admin status', 'error');
    }
  };

  const handleDeleteSubAdmin = async (id: string, email: string) => {
    if (!isFullAdmin) return;
    if (!confirm(`Are you sure you want to remove sub-admin account (${email})?`)) return;
    try {
      const res = await deleteSubAdminApi(id);
      if (res.success) {
        setSubAdmins(subAdmins.filter(s => s._id !== id));
        showToast('Sub-admin account removed successfully', 'success');
        fetchAuditLogs();
        loadDashboardData();
      } else {
        showToast(res.message || 'Failed to remove sub-admin', 'error');
      }
    } catch (err: any) {
      showToast('Failed to remove sub-admin', 'error');
    }
  };

  const handleSaveSettings = async () => {
    if (!isFullAdmin) return;
    setSettingsSaving(true);
    try {
      const res = await updateAdminSettings({
        freeUserLimit,
        availableVoices: voices
      });
      if (res.success) {
        showToast('System configuration saved successfully', 'success');
        fetchAuditLogs();
      }
    } catch (error) {
      showToast('Failed to save settings modifications', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filter users based on tab search & userFilter
  const filteredUsers = users.filter(u => {
    if (userFilter === 'premium') return u.premiumAccess;
    if (userFilter === 'free') return !u.premiumAccess;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300 text-[var(--text-primary)]">
      {/* Page Header */}
      <div className="border-b border-[var(--border-app)] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] bg-gradient-to-r from-neutral-900 via-neutral-700 to-indigo-600 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text">
              {isFullAdmin ? 'Owner Control Panel' : 'Management Dashboard'}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isFullAdmin ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {isFullAdmin ? 'Admin (Full Owner Access)' : 'Sub Admin (Limited Access)'}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">
            {isFullAdmin 
              ? 'Audit active accounts, manage sub-admins, adjust quotas, and configure system settings.'
              : 'View user directory, manage premium memberships, and monitor usage analytics.'}
          </p>
        </div>

        {isFullAdmin && (
          <button
            onClick={() => setShowCreateSubAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Create Sub Admin
          </button>
        )}
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-[var(--border-app)] gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none shrink-0 ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none shrink-0 ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          User Directory
        </button>
        <button
          onClick={() => setActiveTab('premium')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none shrink-0 ${
            activeTab === 'premium'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Premium Management
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none shrink-0 flex items-center gap-1.5 ${
            activeTab === 'audit_logs'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Log
        </button>

        {isFullAdmin && (
          <>
            <button
              onClick={() => setActiveTab('sub_admins')}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none shrink-0 flex items-center gap-1.5 ${
                activeTab === 'sub_admins'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Sub Admin Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 outline-none shrink-0 ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              System Settings
            </button>
          </>
        )}
      </div>

      {/* Security Check Guard for restricted tabs if a sub_admin forces state */}
      {!isFullAdmin && (activeTab === 'sub_admins' || activeTab === 'settings') && (
        <div className="py-16 text-center flex flex-col items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-app)] rounded-2xl p-8">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">403 Forbidden - Access Denied</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Sub-admins do not have permission to access system configuration or manage other administrative roles.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('users')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Back to User Directory
          </button>
        </div>
      )}

      {/* Tab 1: Analytics Overview */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          {analyticsLoading ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] h-24 animate-pulse flex flex-col gap-3">
                    <div className="h-3 w-24 bg-neutral-800 rounded" />
                    <div className="h-6 w-16 bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total User Accounts</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[var(--text-primary)]">{stats?.totalUsers || 0}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">({stats?.activeUsers || 0} Active)</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Premium Members</span>
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[var(--text-primary)]">{stats?.premiumUsers || 0}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Subscribed</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Audio Generations</span>
                    <Music className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[var(--text-primary)]">{globalOverview?.totalGenerations || stats?.totalAudioCount || 0}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Syntheses</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Audio Duration</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[var(--text-primary)]">{formatDuration(globalOverview?.totalDuration || 0)}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Total audio</span>
                  </div>
                </div>
              </div>

              {/* Charts Display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                  <div className="border-b border-[var(--border-app)] pb-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Voice Popularity</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Top voice synthesis usage</p>
                  </div>
                  <VoicePopularityChart data={globalVoices} />
                </div>

                <div className="p-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
                  <div className="border-b border-[var(--border-app)] pb-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Usage Distribution</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Category distribution</p>
                  </div>
                  <VoiceDistributionChart data={globalVoices} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Search & Filter Bar */}
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts by name or email address..."
                className="w-full bg-transparent text-sm focus:outline-none placeholder-[var(--text-muted)] text-[var(--text-primary)] font-medium"
              />
            </div>

            {/* User Category Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-app)] self-stretch sm:self-auto shrink-0">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  userFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setUserFilter('premium')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  userFilter === 'premium'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Premium ({users.filter(u => u.premiumAccess).length})
              </button>
              <button
                onClick={() => setUserFilter('free')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  userFilter === 'free'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Free ({users.filter(u => !u.premiumAccess).length})
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-md overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-xs text-[var(--text-secondary)]">No registered users matched the filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-4">Account Profile</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Membership Plan</th>
                      <th className="p-4">Credit Usage</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-app)]">
                    {filteredUsers.map((u) => {
                      const finalCredits = editedCredits[u._id] !== undefined ? editedCredits[u._id] : u.freeCredits;
                      const finalRole = editedRoles[u._id] !== undefined ? editedRoles[u._id] : u.role;
                      const isModified = editedCredits[u._id] !== undefined || editedRoles[u._id] !== undefined;

                      return (
                        <tr key={u._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                          {/* Account Profile */}
                          <td className="p-4 flex items-center gap-3.5">
                            <img
                              src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                              alt={u.name}
                              className="w-9 h-9 rounded-full border border-[var(--border-app)] object-cover shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-[var(--text-primary)] text-sm truncate">{u.name}</span>
                              <span className="text-[11px] text-[var(--text-secondary)] truncate">{u.email}</span>
                              <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                Created: {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="p-4">
                            {isFullAdmin ? (
                              <select
                                value={finalRole}
                                onChange={(e) => setEditedRoles({ ...editedRoles, [u._id]: e.target.value as any })}
                                className="bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-indigo-500"
                              >
                                <option value="user">User</option>
                                <option value="sub_admin">Sub Admin</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'admin' 
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                  : u.role === 'sub_admin'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                              }`}>
                                {u.role}
                              </span>
                            )}
                          </td>

                          {/* Plan */}
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                              u.premiumAccess 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                            }`}>
                              {u.premiumAccess ? <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> : null}
                              {u.premiumAccess ? 'Premium Plan' : 'Free Tier'}
                            </span>
                          </td>

                          {/* Usage / Credits */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)]">
                                <span>Used: {u.usedCredits || 0}</span>
                                <span className="text-[var(--text-muted)]">/</span>
                                {isFullAdmin ? (
                                  <input
                                    type="number"
                                    value={finalCredits}
                                    onChange={(e) => setEditedCredits({ ...editedCredits, [u._id]: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-[var(--bg-input)] border border-[var(--border-app)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] focus:outline-none"
                                  />
                                ) : (
                                  <span>{u.freeCredits} quota</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Active / Security Status */}
                          <td className="p-4">
                            {isFullAdmin ? (
                              <button
                                onClick={() => handleToggleActive(u)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  u.isActive 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                }`}
                              >
                                {u.isActive ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                {u.isActive ? 'Active' : 'Disabled'}
                              </button>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${u.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {u.isActive ? <Check className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>

                          {/* Actions: Premium Management + Save / Delete */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Premium Management Button with Confirmation Modal */}
                              {u.role === 'admin' && !isFullAdmin ? (
                                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Admin Protected
                                </span>
                              ) : u.premiumAccess ? (
                                <button
                                  onClick={() => openPremiumConfirmation(u, false)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-red-950/40 text-neutral-300 hover:text-red-400 border border-neutral-700 hover:border-red-500/30 text-xs font-bold transition flex items-center gap-1"
                                  title="Remove Premium Membership"
                                >
                                  <UserX className="w-3.5 h-3.5" /> Remove Premium
                                </button>
                              ) : (
                                <button
                                  onClick={() => openPremiumConfirmation(u, true)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                                  title="Upgrade user to Premium"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Grant Premium
                                </button>
                              )}

                              {/* Save edits for admin */}
                              {isFullAdmin && isModified && (
                                <button
                                  onClick={() => handleSaveEdits(u._id)}
                                  disabled={savingId === u._id}
                                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-sm"
                                  title="Save role/credit updates"
                                >
                                  {savingId === u._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                              )}

                              {/* Delete user for full admin */}
                              {isFullAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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

      {/* Tab 3: Premium Management (Dedicated Section) */}
      {activeTab === 'premium' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-app)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Premium Access Control</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  As an authorized administrative manager, you can assign or revoke Premium entitlements for user accounts.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {users.filter(u => u.premiumAccess).length} Premium Accounts Active
              </div>
            </div>

            {/* Quick Premium User List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-app)]">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-[var(--bg-card-hover)]">
                      <td className="p-3 font-semibold text-[var(--text-primary)]">
                        {u.name} <span className="text-[var(--text-muted)] font-normal">({u.email})</span>
                      </td>
                      <td className="p-3 uppercase text-[10px] font-bold text-[var(--text-secondary)]">{u.role}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          u.premiumAccess ? 'bg-amber-500/10 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {u.premiumAccess ? 'Premium' : 'Free'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role === 'admin' && !isFullAdmin ? (
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-md inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Admin Protected
                          </span>
                        ) : u.premiumAccess ? (
                          <button
                            onClick={() => openPremiumConfirmation(u, false)}
                            className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition"
                          >
                            Remove Premium Access
                          </button>
                        ) : (
                          <button
                            onClick={() => openPremiumConfirmation(u, true)}
                            className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition"
                          >
                            Upgrade to Premium
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sub Admin Management (Full Admin Only) */}
      {activeTab === 'sub_admins' && isFullAdmin && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[var(--border-app)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Sub Admin Management</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Create and manage restricted sub-admin accounts for team member delegation. Sub-admins cannot alter system settings or manage admins.
              </p>
            </div>
            <button
              onClick={() => setShowCreateSubAdminModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Create Sub Admin
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-md overflow-hidden">
            {subAdminsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : subAdmins.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-secondary)] flex flex-col items-center gap-3">
                <Shield className="w-8 h-8 text-neutral-600" />
                <span>No Sub-Admin accounts created yet. Click "Create Sub Admin" above to assign management privileges.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-4">Sub Admin Profile</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-app)]">
                  {subAdmins.map((subAdmin) => (
                    <tr key={subAdmin._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[var(--text-primary)]">{subAdmin.name}</span>
                          <span className="text-xs text-[var(--text-secondary)]">{subAdmin.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          SUB_ADMIN
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {new Date(subAdmin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleSubAdminStatus(subAdmin)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            subAdmin.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                          }`}
                        >
                          {subAdmin.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {subAdmin.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleSubAdminStatus(subAdmin)}
                            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition"
                          >
                            {subAdmin.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteSubAdmin(subAdmin._id, subAdmin.email)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Remove Sub Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Activity Log */}
      {activeTab === 'audit_logs' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[var(--border-app)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Admin Activity Log</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Audit trail of administrative actions performed across the system.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-md overflow-hidden">
            {auditLogsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-secondary)]">No audit activity recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Performed By</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target User</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-app)]">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="p-4 text-[var(--text-secondary)] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--text-primary)]">{log.performedByName}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{log.performedByEmail} ({log.performedByRole})</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action.includes('SUB_ADMIN') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            log.action.includes('PREMIUM') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-neutral-800 text-neutral-300'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-[var(--text-secondary)]">
                          {log.targetUserEmail || '-'}
                        </td>
                        <td className="p-4 text-[var(--text-secondary)]">
                          {log.details}
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

      {/* Tab 6: System Settings (Full Admin Only) */}
      {activeTab === 'settings' && isFullAdmin && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] flex flex-col gap-6 shadow-sm">
            <div className="border-b border-[var(--border-app)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">System Configuration</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage default quotas, credit rules, and system behavior.</p>
            </div>

            <div className="flex flex-col gap-4 max-w-xl">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">Default Free User Credit Limit</span>
                <input
                  type="number"
                  value={freeUserLimit}
                  onChange={(e) => setFreeUserLimit(parseInt(e.target.value) || 0)}
                  className="bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </label>

              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="w-fit px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center gap-2"
              >
                {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUB-ADMIN MODAL */}
      {showCreateSubAdminModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-app)] rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[var(--border-app)] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Create Restricted Sub Admin</h3>
              </div>
              <button onClick={() => setShowCreateSubAdminModal(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={newSubAdminName}
                  onChange={(e) => setNewSubAdminName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full mt-1 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={newSubAdminEmail}
                  onChange={(e) => setNewSubAdminEmail(e.target.value)}
                  placeholder="subadmin@21sttech.com"
                  className="w-full mt-1 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <PasswordInput
                  label="TEMPORARY PASSWORD"
                  required
                  value={newSubAdminPassword}
                  onChange={(e) => setNewSubAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Initial Status</label>
                <select
                  value={newSubAdminStatus}
                  onChange={(e) => setNewSubAdminStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full mt-1 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="active">Active (Immediate access)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-app)]">
                <button
                  type="button"
                  onClick={() => setShowCreateSubAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubAdminLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
                >
                  {createSubAdminLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR PREMIUM MANAGEMENT */}
      {confirmPremiumModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-app)] rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmPremiumModal.targetStatus ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <Star className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {confirmPremiumModal.targetStatus ? 'Upgrade this user to Premium?' : 'Remove Premium Access?'}
                </h3>
                <span className="text-xs text-[var(--text-secondary)]">
                  {confirmPremiumModal.user.name} ({confirmPremiumModal.user.email})
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {confirmPremiumModal.targetStatus 
                ? 'This action will grant the user full access to premium voice cloning, scene voice generation, and extended features.'
                : 'This action will revoke premium access rights for this user account.'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--border-app)]">
              <button
                type="button"
                onClick={() => setConfirmPremiumModal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTogglePremium}
                disabled={confirmPremiumLoading}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-1.5 ${
                  confirmPremiumModal.targetStatus 
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25' 
                    : 'bg-red-600 hover:bg-red-500 shadow-red-600/25'
                }`}
              >
                {confirmPremiumLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
