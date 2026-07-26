'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAdminUsers, updateAdminUser, toggleAdminUserPremium, 
  deleteAdminUser, getAdminStats 
} from '../../services/api';
import { 
  Search, ShieldAlert, Check, ToggleLeft, ToggleRight, Trash2, 
  Save, RefreshCw, Users, Music, Activity, Star, Mail, Edit3, ShieldCheck
} from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

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

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // States for user modifications
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
      console.error('Error fetching admin data:', error);
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
    if (!confirm('Are you sure you want to delete this user? This will also wipe their audio history.')) return;
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
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-input pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-indigo-600 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text text-transparent">
            System Control Panel
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">Audit active accounts, adjust quotas, assign roles, and view usage metrics.</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Analytics statistics cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl flex items-center gap-4 shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Users</span>
              <span className="text-xl sm:text-2xl font-black text-neutral-100 mt-1">{stats.totalUsers}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl flex items-center gap-4 shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Activity className="w-5 h-5 sm:w-5.5 sm:h-5.5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Active Sessions</span>
              <span className="text-xl sm:text-2xl font-black text-neutral-100 mt-1">{stats.activeUsers}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl flex items-center gap-4 shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Star className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Premium Access</span>
              <span className="text-xl sm:text-2xl font-black text-neutral-100 mt-1">{stats.premiumUsers}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl flex items-center gap-4 shadow-md">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Music className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Generated Clips</span>
              <span className="text-xl sm:text-2xl font-black text-neutral-100 mt-1">{stats.totalAudioCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Directory Table Area */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-5 border-b border-neutral-900/60 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by name or email address..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder-neutral-650 text-neutral-300 font-medium"
          />
        </div>

        {/* Loading Spinner */}
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 text-sm font-medium">
            No active records found matching the criteria.
          </div>
        ) : (
          /* Table Layout */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950/40 text-neutral-550 font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-5 font-bold">User Identity</th>
                  <th className="p-5 font-bold">System Role</th>
                  <th className="p-5 font-bold">Session Quota</th>
                  <th className="p-5 font-bold">Premium Mode</th>
                  <th className="p-5 font-bold">System Access</th>
                  <th className="p-5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60 bg-neutral-950/10">
                {users.map((u) => {
                  const isDirty = editedCredits[u._id] !== undefined || editedRoles[u._id] !== undefined;
                  return (
                    <tr key={u._id} className="hover:bg-neutral-900/10 transition-colors duration-200">
                      {/* User Profile */}
                      <td className="p-5 flex items-center gap-3.5">
                        <img
                          src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full border border-neutral-850 shrink-0 object-cover"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-neutral-200 truncate">{u.name}</span>
                          <span className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">{u.email}</span>
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="p-5">
                        <select
                          value={editedRoles[u._id] !== undefined ? editedRoles[u._id] : u.role}
                          onChange={(e) => setEditedRoles({ ...editedRoles, [u._id]: e.target.value as 'user' | 'admin' })}
                          className="bg-neutral-900 border border-neutral-800 rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500/50 text-neutral-350"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Session Quota */}
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editedCredits[u._id] !== undefined ? editedCredits[u._id] : u.freeCredits}
                            onChange={(e) => setEditedCredits({ ...editedCredits, [u._id]: parseInt(e.target.value) || 0 })}
                            className="w-20 bg-neutral-900 border border-neutral-800 rounded-xl py-1.5 px-3 text-xs font-bold text-center focus:outline-none focus:border-indigo-500/50 text-neutral-300"
                          />
                          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider shrink-0">
                            (Used: {u.usedCredits})
                          </span>
                        </div>
                      </td>

                      {/* Premium Mode Toggle */}
                      <td className="p-5">
                        <button
                          onClick={() => handleTogglePremium(u)}
                          className="text-neutral-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 select-none"
                        >
                          {u.premiumAccess ? (
                            <ToggleRight className="w-8 h-8 text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-neutral-600" />
                          )}
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${u.premiumAccess ? 'text-indigo-400' : 'text-neutral-500'}`}>
                            {u.premiumAccess ? 'Active' : 'Disabled'}
                          </span>
                        </button>
                      </td>

                      {/* Account Status Toggle */}
                      <td className="p-5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition duration-200 select-none ${
                            u.isActive 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/25'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right flex items-center justify-end gap-2.5">
                        {isDirty && (
                          <button
                            onClick={() => handleSaveEdits(u._id)}
                            disabled={savingId === u._id}
                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 shadow-md shadow-indigo-500/10"
                            title="Save Changes"
                          >
                            {savingId === u._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-red-900/30 text-neutral-450 hover:text-red-400 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
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
  );
}
