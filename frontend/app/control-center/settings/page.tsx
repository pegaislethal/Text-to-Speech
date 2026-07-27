'use client';

import React, { useState, useEffect } from 'react';
import WorkspaceLayout from '../../../components/WorkspaceLayout';
import { getAdminSettings, updateAdminSettings } from '../../../services/api';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/toastContext';

export default function ControlCenterSettingsPage() {
  const { showToast } = useToast();
  const [freeUserLimit, setFreeUserLimit] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getAdminSettings();
      if (res.success && res.settings) {
        setFreeUserLimit(res.settings.freeUserLimit || 100);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateAdminSettings({ freeUserLimit });
      if (res.success) {
        showToast('System settings saved successfully', 'success');
      } else {
        throw new Error(res.message || 'Save failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceLayout isAdminArea>
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        <div className="pb-4 border-b border-[var(--border-app)] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Control Center Settings
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Configure system-wide parameters and default free credit quotas.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 rounded-xl border border-[var(--border-app)] bg-[var(--bg-card)] shadow-sm flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-indigo-400" /> Default Free Credit Allocation
              </label>
              <input
                type="number"
                value={freeUserLimit}
                onChange={(e) => setFreeUserLimit(parseInt(e.target.value) || 0)}
                className="w-full max-w-xs bg-[var(--bg-input)] border border-[var(--border-app)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Newly registered users will automatically be provisioned with this amount of audio synthesis credits.
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--border-app)] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </WorkspaceLayout>
  );
}
