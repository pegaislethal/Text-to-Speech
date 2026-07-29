'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, X, 
  Mic, Sparkles, Lock, Check, Play, Pause, RefreshCw, Volume2, Grid
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

export type CategoryFilter = 'all' | 'male' | 'female' | 'deep' | 'documentary' | 'premium' | 'custom';

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
  label = 'Current Voice',
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [animating, setAnimating] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Combine system + custom voices list safely
  const allVoices = useMemo(() => {
    if (voices.length > 0) return voices;
    return [...systemVoices, ...customVoices];
  }, [voices, systemVoices, customVoices]);

  // Current Selected Voice Index & Object
  const currentIndex = useMemo(() => {
    const idx = allVoices.findIndex((v) => v.voiceId === selectedVoiceId);
    return idx >= 0 ? idx : 0;
  }, [allVoices, selectedVoiceId]);

  const selectedVoiceObj = useMemo(() => {
    return allVoices[currentIndex] || allVoices[0] || {
      voiceId: selectedVoiceId || 'en-US-ChristopherNeural',
      name: 'Christopher (Default)',
      accent: 'American Male',
      style: 'Documentary',
      description: 'Clear, authoritative male narration voice.',
      category: 'documentary',
      premium: false,
    };
  }, [allVoices, currentIndex, selectedVoiceId]);

  // Click Outside to Close Voice Selection Panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  const triggerAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 150);
  };

  // Quick Switch Handlers
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allVoices.length <= 1) return;
    const prevIdx = (currentIndex - 1 + allVoices.length) % allVoices.length;
    const targetVoice = allVoices[prevIdx];
    triggerAnimation();
    if (onSelectVoice) onSelectVoice(targetVoice);
    if (onChange) onChange(targetVoice.voiceId);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allVoices.length <= 1) return;
    const nextIdx = (currentIndex + 1) % allVoices.length;
    const targetVoice = allVoices[nextIdx];
    triggerAnimation();
    if (onSelectVoice) onSelectVoice(targetVoice);
    if (onChange) onChange(targetVoice.voiceId);
  };

  // Panel Voice Selection Handler
  const handlePanelSelect = (v: VoiceOption) => {
    triggerAnimation();
    if (onSelectVoice) onSelectVoice(v);
    if (onChange) onChange(v.voiceId);
    setIsPanelOpen(false);
  };

  // Filter Voices by Search Query & Category
  const filteredVoices = useMemo(() => {
    return allVoices.filter((voice) => {
      if (activeCategory === 'male') {
        if ((voice.gender || '').toLowerCase() !== 'male') return false;
      } else if (activeCategory === 'female') {
        if ((voice.gender || '').toLowerCase() !== 'female') return false;
      } else if (activeCategory === 'deep') {
        const style = (voice.style || '').toLowerCase();
        const desc = (voice.description || '').toLowerCase();
        const name = voice.name.toLowerCase();
        if (!style.includes('deep') && !desc.includes('deep') && !name.includes('deep')) return false;
      } else if (activeCategory === 'documentary') {
        const cat = (voice.category || voice.style || '').toLowerCase();
        if (!cat.includes('documentary')) return false;
      } else if (activeCategory === 'premium') {
        if (!voice.premium && !voice.isPremium) return false;
      } else if (activeCategory === 'custom') {
        if (!voice.isCustom && voice.category !== 'custom') return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        voice.name.toLowerCase().includes(q) ||
        (voice.accent || voice.language || '').toLowerCase().includes(q) ||
        (voice.style || voice.category || '').toLowerCase().includes(q)
      );
    });
  }, [allVoices, activeCategory, searchQuery]);

  const isCustomSelected = Boolean(selectedVoiceObj.isCustom || selectedVoiceObj.category === 'custom');
  const isSelectedLocked = Boolean((selectedVoiceObj.premium || selectedVoiceObj.isPremium) && !isUserPremium);

  // Extract style tags array for chips
  const tags: string[] = useMemo(() => {
    const t: string[] = [];
    if (selectedVoiceObj.style) t.push(selectedVoiceObj.style);
    if (selectedVoiceObj.category && selectedVoiceObj.category !== selectedVoiceObj.style && selectedVoiceObj.category !== 'custom') {
      t.push(selectedVoiceObj.category);
    }
    if (t.length === 0) t.push('Narration');
    return t;
  }, [selectedVoiceObj]);

  if (allVoices.length === 0) {
    return (
      <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] text-center text-xs text-[var(--text-muted)] font-medium">
        No voices available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-3.5 w-full relative">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-app)]">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
          {label} ({currentIndex + 1}/{allVoices.length})
        </span>

        {onOpenLibrary && (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-2.5 py-1 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-[11px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
        )}
      </div>

      {/* COMPACT MAIN VOICE CARD TRIGGER (Height: ~110px - 130px) */}
      <button
        type="button"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`w-full p-4 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] hover:border-indigo-500/40 shadow-sm flex items-center justify-between gap-3 text-left transition-all cursor-pointer group min-h-[110px] ${
          animating ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {/* Left Icon & Voice Information */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
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
            <span className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors truncate">
              {selectedVoiceObj.name}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)] mt-0.5 truncate">
              {selectedVoiceObj.accent || selectedVoiceObj.language || 'American Male'}
            </span>

            {/* Style Tags Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {tags.map((tag, idx) => (
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

        {/* Right Badge & Dropdown Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[9px] px-2.5 py-1 rounded-full font-extrabold uppercase flex items-center gap-1 ${
              isSelectedLocked
                ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)]'
                : selectedVoiceObj.premium || selectedVoiceObj.isPremium
                ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {isSelectedLocked && <Lock className="w-2.5 h-2.5" />}
            {isSelectedLocked ? 'Locked' : selectedVoiceObj.premium || selectedVoiceObj.isPremium ? 'Premium' : 'Free'}
          </span>

          <div className="w-7 h-7 rounded-xl bg-[var(--bg-card)] border border-[var(--border-app)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-indigo-400 transition-colors">
            {isPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* BOTTOM QUICK ACTION CONTROL BAR: [ ← Previous ] [ ▶ Preview ] [ Next → ] */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={handlePrev}
          disabled={allVoices.length <= 1}
          className="flex-1 py-2 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-30"
          title="Previous Voice"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {onPreviewVoice && !isSelectedLocked ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewVoice(selectedVoiceObj);
            }}
            disabled={Boolean(previewingVoiceId)}
            className="flex-1 py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-400 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Preview Voice Audio"
          >
            {previewingVoiceId === selectedVoiceObj.voiceId ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            ) : playingVoiceId === selectedVoiceObj.voiceId ? (
              <Pause className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            )}
            <span>
              {previewingVoiceId === selectedVoiceObj.voiceId
                ? 'Loading...'
                : playingVoiceId === selectedVoiceObj.voiceId
                ? 'Stop'
                : 'Preview'}
            </span>
          </button>
        ) : (
          <div className="flex-1 text-center text-[10px] font-bold text-indigo-400 px-2 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 truncate">
            Upgrade Required
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={allVoices.length <= 1}
          className="flex-1 py-2 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-30"
          title="Next Voice"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* FLOATING SEARCHABLE VOICE SELECTION PANEL */}
      {isPanelOpen && (
        <div className="absolute top-[68px] left-0 right-0 sm:right-auto sm:w-[450px] z-50 bg-[var(--bg-card)] border border-[var(--border-app)] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5 max-h-[480px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voices..."
              autoFocus
              className="w-full pl-10 pr-9 py-2 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs sm:text-sm rounded-2xl border border-[var(--border-app)] focus:border-indigo-500 outline-none placeholder:text-[var(--text-muted)] font-medium"
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
              { id: 'premium', label: 'Premium' },
              { id: 'custom', label: 'My Voices' },
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
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[320px]">
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
                    onClick={() => handlePanelSelect(v)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[72px] ${
                      isItemActive
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                        : 'border-[var(--border-app)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/30'
                    }`}
                  >
                    {/* Left Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isCustom ? (
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
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

                        <span className="text-[11px] text-[var(--text-muted)] font-semibold truncate mt-0.5">
                          {v.accent || v.language || 'American Male'}
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
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
                          title="Preview Voice"
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
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                          <Check className="w-3.5 h-3.5" />
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

// Export VoiceSwitcher alias for backwards compatibility
export const VoiceSwitcher = VoiceSelector;

export default VoiceSelector;
