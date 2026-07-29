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
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [animating, setAnimating] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Combine system + custom voices list safely
  const allVoices = useMemo(() => {
    if (voices.length > 0) return voices;
    return [...systemVoices, ...customVoices];
  }, [voices, systemVoices, customVoices]);

  // Current Selected Voice Index & Object (Synchronized across slider and dropdown)
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

  // Click Outside to Close Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const triggerAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 150);
  };

  // Slider Navigation Handlers
  const handlePrev = () => {
    if (allVoices.length <= 1) return;
    const prevIdx = (currentIndex - 1 + allVoices.length) % allVoices.length;
    const targetVoice = allVoices[prevIdx];
    triggerAnimation();
    if (onSelectVoice) onSelectVoice(targetVoice);
    if (onChange) onChange(targetVoice.voiceId);
  };

  const handleNext = () => {
    if (allVoices.length <= 1) return;
    const nextIdx = (currentIndex + 1) % allVoices.length;
    const targetVoice = allVoices[nextIdx];
    triggerAnimation();
    if (onSelectVoice) onSelectVoice(targetVoice);
    if (onChange) onChange(targetVoice.voiceId);
  };

  // Dropdown Selection Handler
  const handleDropdownSelect = (v: VoiceOption) => {
    triggerAnimation();
    if (onSelectVoice) onSelectVoice(v);
    if (onChange) onChange(v.voiceId);
    setIsDropdownOpen(false);
  };

  // Filter Voices by Search Query & Category in Dropdown
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
      } else if (activeCategory === 'cinematic') {
        const cat = (voice.category || voice.style || '').toLowerCase();
        if (!cat.includes('cinematic')) return false;
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
        (voice.style || voice.category || '').toLowerCase().includes(q) ||
        (voice.description || '').toLowerCase().includes(q)
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
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] text-center text-xs sm:text-sm text-[var(--text-muted)] font-medium">
        No voices available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-xl flex flex-col justify-between w-full max-w-[700px] min-h-[420px] relative">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-app)] mb-4">
        <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label} ({currentIndex + 1}/{allVoices.length})
        </span>

        {/* CHOOSE VOICE DROPDOWN BUTTON */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] hover:border-indigo-500/40 text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <span>Choose Voice</span>
          {isDropdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* SEARCHABLE VOICE DROPDOWN PANEL (FLOATING OVERLAY) */}
      {isDropdownOpen && (
        <div className="absolute top-[68px] left-4 right-4 z-50 bg-[var(--bg-card)] border border-[var(--border-app)] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 max-h-[460px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
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

          {/* Voice Item List (Rows) */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[300px]">
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
                    onClick={() => handleDropdownSelect(v)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[76px] ${
                      isItemActive
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                        : 'border-[var(--border-app)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/30'
                    }`}
                  >
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

                        <span className="text-[11px] text-[var(--text-muted)] font-semibold truncate mt-0.5">
                          {v.accent || v.language || 'American Male'}
                        </span>
                      </div>
                    </div>

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

      {/* VOICE SLIDER BODY AREA */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 w-full flex-1 my-auto">
        {/* Desktop Left Circular Arrow (44px x 44px) */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={allVoices.length <= 1}
          title="Previous Voice (←)"
          className="hidden md:flex w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] items-center justify-center transition shadow-md shrink-0 cursor-pointer disabled:opacity-30 self-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* COMPACT VOICE CARD */}
        <div
          className={`w-full max-w-[340px] flex-1 min-w-0 min-h-[260px] p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-app)] shadow-md flex flex-col justify-between gap-4 transition-opacity duration-150 relative ${
            animating ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col gap-3 min-w-0">
            {/* 1. Voice Icon & Badge */}
            <div className="flex items-center justify-between gap-2">
              {isCustomSelected ? (
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
              )}

              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase shrink-0 flex items-center gap-1 ${
                  isSelectedLocked
                    ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)]'
                    : selectedVoiceObj.premium || selectedVoiceObj.isPremium
                    ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/30'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {isSelectedLocked && <Lock className="w-3 h-3" />}
                {isSelectedLocked ? 'Locked' : selectedVoiceObj.premium || selectedVoiceObj.isPremium ? 'Premium' : 'Free'}
              </span>
            </div>

            {/* 2. Voice Name & 3. Accent/Gender */}
            <div className="flex flex-col min-w-0">
              <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-2 break-words">
                {selectedVoiceObj.name}
              </h3>
              <span className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                {selectedVoiceObj.accent || selectedVoiceObj.language || 'American Male'}
              </span>
            </div>

            {/* 4. Style Tags (Rounded Chips) */}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-app)] text-[11px] font-bold text-indigo-400 capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 5. Description */}
            {selectedVoiceObj.description && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal line-clamp-3 break-words">
                {selectedVoiceObj.description}
              </p>
            )}
          </div>

          {/* 6. Preview Button (Height 44px) */}
          {isSelectedLocked ? (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center text-xs font-bold text-indigo-400">
              Upgrade to Premium to synthesize with this voice
            </div>
          ) : (
            <div className="pt-2 border-t border-[var(--border-app)] mt-1">
              <button
                type="button"
                onClick={() => onPreviewVoice && onPreviewVoice(selectedVoiceObj)}
                disabled={Boolean(previewingVoiceId)}
                className="w-full h-11 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-xs font-bold text-indigo-500 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {previewingVoiceId === selectedVoiceObj.voiceId ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                ) : playingVoiceId === selectedVoiceObj.voiceId ? (
                  <Pause className="w-4 h-4 fill-indigo-500 text-indigo-500 animate-pulse" />
                ) : (
                  <Play className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                )}
                <span>
                  {previewingVoiceId === selectedVoiceObj.voiceId
                    ? 'Loading preview...'
                    : playingVoiceId === selectedVoiceObj.voiceId
                    ? 'Stop Preview'
                    : 'Preview Voice'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Circular Right Arrow (44px x 44px) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={allVoices.length <= 1}
          title="Next Voice (→)"
          className="hidden md:flex w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] items-center justify-center transition shadow-md shrink-0 cursor-pointer disabled:opacity-30 self-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Mobile Navigation Controls Row */}
        <div className="flex md:hidden items-center justify-center gap-4 w-full pt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={allVoices.length <= 1}
            title="Previous Voice"
            className="w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] flex items-center justify-center transition shadow-md cursor-pointer disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={allVoices.length <= 1}
            title="Next Voice"
            className="w-11 h-11 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] active:scale-95 border border-[var(--border-app)] text-[var(--text-primary)] flex items-center justify-center transition shadow-md cursor-pointer disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Export VoiceSwitcher alias for full backwards compatibility
export const VoiceSwitcher = VoiceSelector;

export default VoiceSelector;
