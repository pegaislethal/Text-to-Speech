'use client';

import React from 'react';
import { Sparkles, Users, Lock, Unlock, Filter } from 'lucide-react';

export type CategoryFilter = 'all' | 'male' | 'female' | 'premium' | 'free' | 'custom';

interface VoiceFiltersProps {
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  selectedAccent?: string;
  onAccentChange?: (accent: string) => void;
  selectedStyle?: string;
  onStyleChange?: (style: string) => void;
  counts?: {
    all: number;
    male: number;
    female: number;
    premium: number;
    free: number;
    custom: number;
  };
}

export const ACCENT_OPTIONS = ['All Accents', 'American', 'British', 'Neutral'];
export const STYLE_OPTIONS = ['All Styles', 'Narration', 'Cinematic', 'Documentary', 'Storytelling', 'Commercial', 'Deep'];

export const VoiceFilters: React.FC<VoiceFiltersProps> = ({
  activeCategory,
  onCategoryChange,
  selectedAccent = 'All Accents',
  onAccentChange,
  selectedStyle = 'All Styles',
  onStyleChange,
  counts,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-app)] select-none">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Voices {counts ? `(${counts.all})` : ''}
        </button>

        <button
          type="button"
          onClick={() => onCategoryChange('male')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeCategory === 'male'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Male {counts ? `(${counts.male})` : ''}
        </button>

        <button
          type="button"
          onClick={() => onCategoryChange('female')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeCategory === 'female'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Female {counts ? `(${counts.female})` : ''}
        </button>

        <button
          type="button"
          onClick={() => onCategoryChange('premium')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeCategory === 'premium'
              ? 'bg-[var(--bg-card)] text-indigo-500 shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Lock className="w-3 h-3 text-indigo-500" />
          <span>Premium {counts ? `(${counts.premium})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => onCategoryChange('custom')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeCategory === 'custom'
              ? 'bg-[var(--bg-card)] text-indigo-500 shadow-sm border border-[var(--border-app)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>My Cloned Voices {counts ? `(${counts.custom})` : ''}</span>
        </button>
      </div>

      {/* Secondary Selectors for Accent & Style */}
      {(onAccentChange || onStyleChange) && (
        <div className="flex flex-wrap items-center gap-2">
          {onAccentChange && (
            <select
              value={selectedAccent}
              onChange={(e) => onAccentChange(e.target.value)}
              className="px-3 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs rounded-xl border border-[var(--border-app)] outline-none font-semibold cursor-pointer"
            >
              {ACCENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {onStyleChange && (
            <select
              value={selectedStyle}
              onChange={(e) => onStyleChange(e.target.value)}
              className="px-3 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs rounded-xl border border-[var(--border-app)] outline-none font-semibold cursor-pointer"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceFilters;
