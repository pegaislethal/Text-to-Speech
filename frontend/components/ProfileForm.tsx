'use client';

import React, { useState } from 'react';
import { User, FileText, Save, RefreshCw, Check } from 'lucide-react';
import { useToast } from '../context/toastContext';

interface ProfileFormProps {
  initialName: string;
  initialBio?: string;
  onSave: (name: string, bio: string) => Promise<void>;
}

export default function ProfileForm({ initialName, initialBio = '', onSave }: ProfileFormProps) {
  const { showToast } = useToast();
  const [name, setName] = useState<string>(initialName || '');
  const [bio, setBio] = useState<string>(initialBio || '');
  const [saving, setSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    try {
      await onSave(name, bio);
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 rounded-2xl bg-neutral-950/70 border border-neutral-900/80">
      <div>
        <h3 className="text-sm font-bold text-neutral-200">Personal Information</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Update your public profile details and bio.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 placeholder-neutral-600 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Profile Bio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Bio (Optional)
            </label>
            <span className="text-[10px] text-neutral-600 font-medium">
              {bio.length} / 250 characters
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.substring(0, 250))}
            rows={3}
            placeholder="Tell us a little bit about yourself, your narration style, or audio projects..."
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 placeholder-neutral-600 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
