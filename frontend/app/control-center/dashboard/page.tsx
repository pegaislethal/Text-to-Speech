'use client';

import React, { useState, useEffect } from 'react';
import WorkspaceLayout from '../../../components/WorkspaceLayout';
import { 
  getAdminUsers, updateAdminUser, toggleAdminUserPremium, 
  deleteAdminUser, getAdminStats 
} from '../../../services/api';
import { 
  Search, ToggleLeft, ToggleRight, Trash2, 
  Save, RefreshCw, Users, Music, Activity, Star
} from 'lucide-react';

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

export default function ControlCenterDashboard() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [editedCredits, setEditedCredits] = useState<{ [key: string]: number }>({});
  const [editedRoles, setEditedRoles] = useState<{ [key: string]: 'user' | 'admin' }>({});

  useEffect(() => {
    loadDashboardData();
  }, [search]);

  const loadDashboardData = async () => {
    try {
      const usersData = await getAdminUsers(search);
      const statsData = await getAdminStats();
      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching control center data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      const res = await updateAdminUser(user._id, { isActive: !user.isActive });
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
        loadDashboardData();
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleTogglePremium = async (user: UserItem) => {
    try {
      const res = await toggleAdminUserPremium(user._id, !user.premiumAccess);
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, premiumAccess: !u.premiumAccess } : u));
        loadDashboardData();
      }
    } catch (error) {
      alert('Failed to toggle premium access');
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
        loadDashboardData();
      }
    } catch (error) {
      alert('Failed to save user changes');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await deleteAdminUser(userId);
      if (res.success) {
        setUsers(users.filter(u => u._id !== userId));
        loadDashboardData();
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  return (
    <WorkspaceLayout isAdminArea>
      <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="pb-4 border-b border-[var(--border-app)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              System Control Dashboard
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Audit active accounts, adjust quotas, assign roles, and view usage metrics.</p>
          </div>
        </div>

        {/* Analytics Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Total Users</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{stats.totalUsers}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Active Sessions</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{stats.activeUsers}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Premium Access</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{stats.premiumUsers}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Generated Clips</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{stats.totalAudioCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Directory Table Area */}
        <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-sm overflow-hidden flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-[var(--border-app)] flex items-center gap-3">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts by name or email address..."
              className="w-full bg-transparent text-xs focus:outline-none placeholder-[var(--text-muted)] text-[var(--text-primary)]"
            />
          </div>

          {/* Table Content */}
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-xs">
              No matching records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider">
                    <th className="p-4">User Identity</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Credits</th>
                    <th className="p-4">Premium Access</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-app)]">
                  {users.map((u) => {
                    const isDirty = editedCredits[u._id] !== undefined || editedRoles[u._id] !== undefined;
                    return (
                      <tr key={u._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full border border-[var(--border-app)] object-cover shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[var(--text-primary)] truncate">{u.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)] truncate">{u.email}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <select
                            value={editedRoles[u._id] !== undefined ? editedRoles[u._id] : u.role}
                            onChange={(e) => setEditedRoles({ ...editedRoles, [u._id]: e.target.value as 'user' | 'admin' })}
                            className="bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg py-1 px-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editedCredits[u._id] !== undefined ? editedCredits[u._id] : u.freeCredits}
                              onChange={(e) => setEditedCredits({ ...editedCredits, [u._id]: parseInt(e.target.value) || 0 })}
                              className="w-16 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg py-1 px-2 text-xs font-bold text-center text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-[var(--text-muted)]">
                              (Used: {u.usedCredits})
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleTogglePremium(u)}
                            className="flex items-center gap-1.5 cursor-pointer"
                          >
                            {u.premiumAccess ? (
                              <ToggleRight className="w-7 h-7 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-[var(--text-muted)]" />
                            )}
                            <span className={`text-[10px] font-semibold uppercase ${u.premiumAccess ? 'text-indigo-400' : 'text-[var(--text-muted)]'}`}>
                              {u.premiumAccess ? 'Active' : 'Disabled'}
                            </span>
                          </button>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              u.isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>

                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          {isDirty && (
                            <button
                              onClick={() => handleSaveEdits(u._id)}
                              disabled={savingId === u._id}
                              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
                              title="Save Changes"
                            >
                              {savingId === u._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-input)] hover:border-red-500/30 text-[var(--text-muted)] hover:text-red-400 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </WorkspaceLayout>
  );
}
