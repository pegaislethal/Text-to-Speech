'use client';

import React, { useState, useEffect } from 'react';
import { getAdminUsers, toggleAdminUserPremium } from '../../../services/api';
import { Star, RefreshCw, ToggleLeft, ToggleRight, Search, ShieldCheck } from 'lucide-react';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: 'user' | 'admin';
  premiumAccess: boolean;
  freeCredits: number;
  usedCredits: number;
}

export default function PremiumManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers(search);
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (u: UserItem) => {
    try {
      const res = await toggleAdminUserPremium(u._id, !u.premiumAccess);
      if (res.success) {
        setUsers(users.map(item => item._id === u._id ? { ...item, premiumAccess: !u.premiumAccess } : item));
      }
    } catch (err) {
      alert('Failed to update premium access.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="border-b border-neutral-900 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
          Premium Access Control
        </h1>
        <p className="text-neutral-400 text-sm mt-1">Enable or revoke unlimited credit entitlements and premium voice access for platform accounts.</p>
      </div>

      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-neutral-900/60 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter accounts by name or email..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder-neutral-600 text-neutral-300 font-medium"
          />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950/40 text-neutral-500 font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-5">Account Profile</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Usage Summary</th>
                  <th className="p-5 text-right">Premium Entitlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60 bg-neutral-950/10">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-neutral-900/10 transition">
                    <td className="p-5 flex items-center gap-3.5">
                      <img
                        src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                        alt={u.name}
                        className="w-9 h-9 rounded-full border border-neutral-850 object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-neutral-200 truncate">{u.name}</span>
                        <span className="text-[11px] text-neutral-500 truncate mt-0.5">{u.email}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        u.role === 'admin' 
                          ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="p-5 text-xs text-neutral-400 font-semibold">
                      {u.premiumAccess ? 'Unlimited Credits' : `${u.usedCredits} / ${u.freeCredits} credits used`}
                    </td>

                    <td className="p-5 text-right">
                      <button
                        onClick={() => handleToggle(u)}
                        className="inline-flex items-center gap-2 text-xs font-bold transition"
                      >
                        {u.premiumAccess ? (
                          <>
                            <ToggleRight className="w-8 h-8 text-indigo-500" />
                            <span className="text-indigo-400">Granted</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-8 h-8 text-neutral-600" />
                            <span className="text-neutral-500">Revoked</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
