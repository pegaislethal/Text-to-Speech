'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Search, X, Mic, Sparkles, 
  Lock, Check, Play, Pause, RefreshCw, Volume2, Grid, Filter
} from 'lucide-react';
import { VoiceOption } from './VoiceCard';

export type { VoiceOption };

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice?: (voice: VoiceOption) => void;
  onChange?: (voiceId: string) => void;
  voices?: VoiceOption[];
  systemVoices?: VoiceOption[];
  customVoices?: VoiceOption[];
  previewingVoiceId?: string | null;
  onPreviewVoice?: (voice: VoiceOption) => void;
  playingVoiceId?: string | null;
  isUserPremium?: boolean;
  onOpenLibrary?: () => void;
  label?: string;
  maxHeight?: string;
}

export type CategoryFilter = 'all' | 'male' | 'female' | 'deep' | 'documentary' | 'cinematic' | 'premium' | 'custom';

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  onChange,
  voices = [],
  systemVoices = [],
  customVoices = [],
  previewingVoiceId = null,
  onPreviewVoice,
  playingVoiceId = null,
  isUserPremium = true,
  onOpenLibrary,
  label = 'Selected Voice',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Combine voices list safely
  const allVoices = useMemo(() => {
    if (voices.length > 0) return voices;
    return [...systemVoices, ...customVoices];
  }, [voices, systemVoices, customVoices]);

  // Selected Voice Object
  const selectedVoiceObj = useMemo(() => {
    return allVoices.find((v) => v.voiceId === selectedVoiceId) || allVoices[0] || {
      voiceId: selectedVoiceId || 'en-US-ChristopherNeural',
      name: 'Christopher (Default)',
      accent: 'American Male',
      style: 'Documentary',
      description: 'Clear, authoritative male narration voice.',
      category: 'documentary',
      premium: false,
    };
  }, [allVoices, selectedVoiceId]);

  // Click Outside to Close Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Voice Selection
  const handleSelect = (v: VoiceOption) => {
    if (onSelectVoice) {
      onSelectVoice(v);
    }
    if (onChange) {
      onChange(v.voiceId);
    }
    setIsOpen(false);
  };

  // Filter Voices by Search Query & Category
  const filteredVoices = useMemo(() => {
    return allVoices.filter((voice) => {
      // 1. Category Filter
      if (activeCategory === 'male') {
        const gender = (voice.gender || '').toLowerCase();
        if (gender !== 'male') return false;
      } else if (activeCategory === 'female') {
        const gender = (voice.gender || '').toLowerCase();
        if (gender !== 'female') return false;
      } else if (activeCategory === 'deep') {
        const style = (voice.style || '').toLowerCase();
        const desc = (voice.description || '').toLowerCase();
        const name = voice.name.toLowerCase();
        if (!style.includes('deep') && !desc.includes('deep') && !name.includes('deep')) return false;
      } else if (activeCategory === 'documentary') {
        const cat = (voice.category || voice.style || '').toLowerCase();
        if (!cat.includes('documentary')) return false;
      } else if (activeCategory === 'cinematic') {
        const cat = (voice.category || voice.style || '').toLowerCase();
        if (!cat.includes('cinematic')) return false;
      } else if (activeCategory === 'premium') {
        if (!voice.premium && !voice.isPremium) return false;
      } else if (activeCategory === 'custom') {
        if (!voice.isCustom && voice.category !== 'custom') return false;
      }

      // 2. Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = voice.name.toLowerCase().includes(q);
      const matchAccent = (voice.accent || voice.language || '').toLowerCase().includes(q);
      const matchStyle = (voice.style || voice.category || '').toLowerCase().includes(q);
      const matchDesc = (voice.description || '').toLowerCase().includes(q);
      return matchName || matchAccent || matchStyle || matchDesc;
    });
  }, [allVoices, activeCategory, searchQuery]);

  const isCustomSelected = Boolean(selectedVoiceObj.isCustom || selectedVoiceObj.category === 'custom');
  const isSelectedLocked = Boolean((selectedVoiceObj.premium || selectedVoiceObj.isPremium) && !isUserPremium);

  // Extract style tags array for chips
  const getStyleTags = (v: VoiceOption) => {
    const tags: string[] = [];
    if (v.style) tags.push(v.style);
    if (v.category && v.category !== v.style && v.category !== 'custom') tags.push(v.category);
    if (tags.length === 0) tags.push('Narration');
    return tags;
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* CLOSED STATE TRIGGER CARD */}
      <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-3.5 w-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-app)]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </span>

          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Browse Library</span>
            </button>
          )}
        </div>

        {/* Selected Voice Card Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] hover:border-indigo-500/40 shadow-sm flex items-center justify-between gap-3 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isCustomSelected ? (
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
            )}

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] truncate group-hover:text-indigo-400 transition-colors">
                  {selectedVoiceObj.name}
                </span>
                {isSelectedLocked && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)] text-[9px] font-extrabold uppercase flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Locked
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs font-semibold text-[var(--text-muted)] truncate">
                  {selectedVoiceObj.accent || selectedVoiceObj.language || 'American Accent'}
                </span>
                {getStyleTags(selectedVoiceObj).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[10px] font-bold text-indigo-400 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-app)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-indigo-400 shrink-0 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
      </div>

      {/* OPEN DROPDOWN PANEL (FLOATING PANEL) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[480px] mt-2 z-50 bg-[var(--bg-card)] border border-[var(--border-app)] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voices by name, accent, style..."
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs sm:text-sm rounded-2xl border border-[var(--border-app)] focus:border-indigo-500 outline-none placeholder:text-[var(--text-muted)] font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs select-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'male', label: 'Male' },
              { id: 'female', label: 'Female' },
              { id: 'deep', label: 'Deep' },
              { id: 'documentary', label: 'Documentary' },
              { id: 'cinematic', label: 'Cinematic' },
              { id: 'premium', label: 'Premium' },
              { id: 'custom', label: 'Cloned' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as CategoryFilter)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-app)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Voice Item List (80px Rows) */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[340px]">
            {filteredVoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-medium">
                No matching voices found
              </div>
            ) : (
              filteredVoices.map((v) => {
                const isItemActive = v.voiceId === selectedVoiceId;
                const isItemLocked = Boolean((v.premium || v.isPremium) && !isUserPremium);
                const isCustom = Boolean(v.isCustom || v.category === 'custom');

                return (
                  <div
                    key={v.voiceId}
                    onClick={() => handleSelect(v)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[76px] ${
                      isItemActive
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                        : 'border-[var(--border-app)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/30'
                    }`}
                  >
                    {/* Left Icon & Information */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isCustom ? (
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                          <Mic className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-bold truncate ${isItemActive ? 'text-indigo-400' : 'text-[var(--text-primary)]'}`}>
                            {v.name}
                          </span>
                          {isItemLocked && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-muted)] font-bold uppercase flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Locked
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-[var(--text-muted)] font-semibold truncate">
                            {v.accent || v.language || 'American Male'}
                          </span>
                          {getStyleTags(v).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[10px] font-bold text-indigo-400 capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Actions: Preview Button & Selected Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {onPreviewVoice && !isItemLocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewVoice(v);
                          }}
                          disabled={previewingVoiceId === v.voiceId}
                          className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-indigo-500 text-xs font-bold transition cursor-pointer"
                          title="Preview voice audio"
                        >
                          {previewingVoiceId === v.voiceId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : playingVoiceId === v.voiceId ? (
                            <Pause className="w-3.5 h-3.5 fill-indigo-500 animate-pulse" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-indigo-500" />
                          )}
                        </button>
                      )}

                      {isItemActive ? (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export VoiceSwitcher alias for backwards compatibility across pages
export const VoiceSwitcher = VoiceSelector;

export default VoiceSelector;
