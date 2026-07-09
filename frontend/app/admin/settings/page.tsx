'use client';

import React, { useState, useEffect } from 'react';
import { getAdminSettings, updateAdminSettings } from '../../../services/api';
import { Save, RefreshCw, Volume2, ShieldCheck, ToggleLeft, ToggleRight, Check } from 'lucide-react';

interface VoiceItem {
  id: string;
  name: string;
  lang: string;
  gender: 'Male' | 'Female';
  premium: boolean;
}

export default function SystemSettings() {
  const [freeUserLimit, setFreeUserLimit] = useState<number>(100);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      const res = await getAdminSettings();
      if (res.success && res.settings) {
        setFreeUserLimit(res.settings.freeUserLimit);
        setVoices(res.settings.availableVoices || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoicePremium = (index: number) => {
    const updatedVoices = [...voices];
    updatedVoices[index].premium = !updatedVoices[index].premium;
    setVoices(updatedVoices);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await updateAdminSettings({
        freeUserLimit,
        availableVoices: voices
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Configure user signup rules and premium feature controls.</p>
        </div>

        <div className="flex items-center gap-3">
          {success && (
            <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> System updated successfully
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-bold text-xs text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side - Settings Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* User Signups limit card */}
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-neutral-300">Signup Control</h3>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Default Free Credits for New Users
              </label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="number"
                  value={freeUserLimit}
                  onChange={(e) => setFreeUserLimit(parseInt(e.target.value) || 0)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-sm font-bold w-36 text-center focus:outline-none focus:border-indigo-600 text-neutral-300"
                />
                <span className="text-xs text-neutral-400 font-medium">
                  credits (roughly {freeUserLimit * 50} free characters total)
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-normal mt-2">
                This configures the default credits granted to team members upon creating their account. You can manually adjust individual limits from the User Directory at any time.
              </p>
            </div>
          </div>

          {/* Voice Mapping card */}
          <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-300">Edge Voice Management</h3>
              <span className="text-[10px] text-neutral-500 font-bold uppercase">{voices.length} Registered</span>
            </div>

            <div className="divide-y divide-neutral-900">
              {voices.map((voice, idx) => (
                <div key={voice.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                      <Volume2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-200">{voice.name}</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">{voice.lang} &bull; {voice.gender}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVoicePremium(idx)}
                    className="flex items-center gap-2 group hover:text-white transition text-neutral-450"
                  >
                    <span className="text-xs font-semibold text-neutral-500">Premium Locked:</span>
                    {voice.premium ? (
                      <ToggleRight className="w-8 h-8 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Info Box */}
        <div className="p-5 rounded-2xl border border-indigo-950/40 bg-indigo-950/5 flex gap-3 text-indigo-400">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold">Scaling ready</span>
            <p className="text-[11px] text-indigo-300/80 leading-relaxed">
              This settings architecture is mapped directly to MongoDB. When integrating ElevenLabs or OpenAI TTS provider endpoints later, these settings schemas can expand dynamically to host API credentials and global configuration rules safely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
