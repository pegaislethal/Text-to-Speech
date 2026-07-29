'use client';

import React from 'react';
import { Search, X, Sparkles, SlidersHorizontal } from 'lucide-react';

interface VoiceSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  onClear?: () => void;
  quickFilters?: string[];
  activeQuickFilter?: string | null;
  onSelectQuickFilter?: (filter: string | null) => void;
}

export const DEFAULT_QUICK_FILTERS = [
  'Deep',
  'Cinematic',
  'Documentary',
  'American',
  'British',
  'Male',
  'Female',
  'Storytelling',
  'Commercial'
];

export const VoiceSearch: React.FC<VoiceSearchProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search voice by name, style, accent...',
  onClear,
  quickFilters = DEFAULT_QUICK_FILTERS,
  activeQuickFilter,
  onSelectQuickFilter,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search Input Container */}
      <div className="relative flex items-center w-full group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors">
          <Search className="w-4 h-4" />
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-app)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-[var(--text-muted)]"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              if (onClear) onClear();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Filter Tag Chips */}
      {quickFilters && quickFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider pr-1 shrink-0">
            <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
            <span>Tags:</span>
          </div>

          {quickFilters.map((tag) => {
            const isActive = activeQuickFilter === tag || searchQuery.toLowerCase().includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (onSelectQuickFilter) {
                    onSelectQuickFilter(isActive ? null : tag);
                  } else {
                    onSearchChange(isActive ? '' : tag);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-app)] hover:border-indigo-500/30'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
