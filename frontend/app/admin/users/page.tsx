'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAdminUsers, updateAdminUser, toggleAdminUserPremium, 
  deleteAdminUser, getAdminStats 
} from '../../../services/api';
import { 
  Search, ShieldAlert, Check, ToggleLeft, ToggleRight, Trash2, 
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

export default function UserManagement() {
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      const res = await updateAdminUser(user._id, { isActive: !user.isActive });
      if (res.success) {
        setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
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
      const updatePayload: any = {};
      if (credits !== undefined) updatePayload.freeCredits = credits;
      if (role !== undefined) updatePayload.role = role;

      const res = await updateAdminUser(userId, updatePayload);
      if (res.success) {
        setUsers(users.map(u => u._id === userId ? { 
          ...u, 
          freeCredits: credits !== undefined ? credits : u.freeCredits,
          role: role !== undefined ? role : u.role
        } : u));
        // Clear temp edit states
        const newCreditsState = { ...editedCredits };
        delete newCreditsState[userId];
        setEditedCredits(newCreditsState);

        const newRolesState = { ...editedRoles };
        delete newRolesState[userId];
        setEditedRoles(newRolesState);
      }
    } catch (error) {
      alert('Failed to save configurations');
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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
          User Directory & Admin Control
        </h1>
        <p className="text-neutral-400 text-sm mt-1">Manage user configurations, permissions, limits, and system roles.</p>
      </div>

      {/* Analytics stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Total Users</span>
              <span className="text-2xl font-bold text-neutral-200 mt-0.5">{stats.totalUsers}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Active Sessions</span>
              <span className="text-2xl font-bold text-neutral-200 mt-0.5">{stats.activeUsers}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Premium Access</span>
              <span className="text-2xl font-bold text-neutral-200 mt-0.5">{stats.premiumUsers}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Clips Generated</span>
              <span className="text-2xl font-bold text-neutral-200 mt-0.5">{stats.totalAudioCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Directory Table Area */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 shadow-xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-5 border-b border-neutral-900/60 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder-neutral-600 text-neutral-300"
          />
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-900 bg-neutral-950 text-neutral-500 font-semibold text-xs uppercase">
                <th className="p-5">User Profile</th>
                <th className="p-5">System Role</th>
                <th className="p-5">Session Limits</th>
                <th className="p-5">Premium Access</th>
                <th className="p-5">Account Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 bg-neutral-950/20">
              {users.map((u) => {
                const isDirty = editedCredits[u._id] !== undefined || editedRoles[u._id] !== undefined;
                return (
                  <tr key={u._id} className="hover:bg-neutral-900/10 transition">
                    {/* User Profile */}
                    <td className="p-5 flex items-center gap-3.5">
                      <img
                        src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                        alt={u.name}
                        className="w-9 h-9 rounded-full border border-neutral-800"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-neutral-200">{u.name}</span>
                        <span className="text-xs text-neutral-500 mt-0.5">{u.email}</span>
                      </div>
                    </td>

                    {/* System Role */}
                    <td className="p-5">
                      <select
                        value={editedRoles[u._id] !== undefined ? editedRoles[u._id] : u.role}
                        onChange={(e) => setEditedRoles({ ...editedRoles, [u._id]: e.target.value as 'user' | 'admin' })}
                        className="bg-neutral-900 border border-neutral-800 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:border-indigo-600 text-neutral-300"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Session limits */}
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedCredits[u._id] !== undefined ? editedCredits[u._id] : u.freeCredits}
                          onChange={(e) => setEditedCredits({ ...editedCredits, [u._id]: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-neutral-900 border border-neutral-800 rounded-lg py-1 px-2 text-xs font-bold text-center focus:outline-none focus:border-indigo-600 text-neutral-300"
                        />
                        <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                          (Used: {u.usedCredits})
                        </span>
                      </div>
                    </td>

                    {/* Premium Access */}
                    <td className="p-5">
                      <button
                        onClick={() => handleTogglePremium(u)}
                        className={`text-neutral-400 hover:text-white transition flex items-center gap-1.5`}
                      >
                        {u.premiumAccess ? (
                          <ToggleRight className="w-8 h-8 text-indigo-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-neutral-600" />
                        )}
                        <span className={`text-xs font-semibold ${u.premiumAccess ? 'text-indigo-400' : 'text-neutral-500'}`}>
                          {u.premiumAccess ? 'Premium Active' : 'Off'}
                        </span>
                      </button>
                    </td>

                    {/* Account status */}
                    <td className="p-5">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                          u.isActive 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/25'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-5 text-right flex items-center justify-end gap-2.5">
                      {isDirty && (
                        <button
                          onClick={() => handleSaveEdits(u._id)}
                          disabled={savingId === u._id}
                          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
                          title="Save Changes"
                        >
                          {savingId === u._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 transition"
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
      </div>
    </div>
  );
}
