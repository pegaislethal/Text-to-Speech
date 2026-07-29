'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, Mic, Sparkles, Lock, Check, Play, Pause, RefreshCw, 
  ChevronRight, SlidersHorizontal, User, Globe, Tag, Layers
} from 'lucide-react';
import { VoiceOption } from './VoiceCard';
import { useAuth } from '../context/authContext';

export type { VoiceOption };

interface VoiceExplorerProps {
  systemVoices?: VoiceOption[];
  customVoices?: VoiceOption[];
  voices?: VoiceOption[];
  selectedVoiceId?: string;
  onSelectVoice?: (voice: VoiceOption) => void;
  onChange?: (voiceId: string) => void;
  onPreviewVoice?: (voice: VoiceOption) => void;
  onDeleteVoice?: (voiceId: string) => void;
  onOpenLibrary?: () => void;
  previewingVoiceId?: string | null;
  playingVoiceId?: string | null;
  isUserPremium?: boolean;
  label?: string;
}

export type ExplorerTab = 'explore' | 'my-voices';

export const VoiceExplorer: React.FC<VoiceExplorerProps> = ({
  systemVoices = [],
  customVoices = [],
  voices = [],
  selectedVoiceId,
  onSelectVoice,
  onChange,
  onPreviewVoice,
  onDeleteVoice,
  previewingVoiceId = null,
  playingVoiceId = null,
  isUserPremium = true,
  label = 'Selected Voice',
}) => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ExplorerTab>('explore');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter States
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All Languages');
  const [selectedAccent, setSelectedAccent] = useState<string>('All Accents');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedGender, setSelectedGender] = useState<string>('All Genders');
  const [selectedTier, setSelectedTier] = useState<string>('All Tiers');

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Combine system + custom voices array safely
  const allVoices = useMemo(() => {
    if (voices.length > 0) return voices;
    const sys = systemVoices.map((v) => ({ ...v, isCustom: false }));
    const cust = customVoices.map((v) => ({ ...v, isCustom: true, category: 'custom' }));
    return [...sys, ...cust];
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

  // Handle Voice Selection
  const handleSelect = (v: VoiceOption) => {
    if (onSelectVoice) onSelectVoice(v);
    if (onChange) onChange(v.voiceId);
    setIsOpen(false);
  };

  // Close Modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered Voices List
  const filteredVoices = useMemo(() => {
    const baseList = activeTab === 'my-voices' 
      ? allVoices.filter((v) => v.isCustom || v.category === 'custom')
      : allVoices;

    return baseList.filter((v) => {
      // 1. Language Filter
      if (selectedLanguage !== 'All Languages') {
        const vLang = (v.language || v.accent || '').toLowerCase();
        if (!vLang.includes(selectedLanguage.toLowerCase())) return false;
      }

      // 2. Accent Filter
      if (selectedAccent !== 'All Accents') {
        const vAcc = (v.accent || v.language || '').toLowerCase();
        if (!vAcc.includes(selectedAccent.toLowerCase())) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'All Categories') {
        const vCat = (v.category || v.style || '').toLowerCase();
        if (!vCat.includes(selectedCategory.toLowerCase())) return false;
      }

      // 4. Gender Filter
      if (selectedGender !== 'All Genders') {
        const vGender = (v.gender || '').toLowerCase();
        if (vGender !== selectedGender.toLowerCase()) return false;
      }

      // 5. Tier Filter
      if (selectedTier === 'Free Voices' && (v.premium || v.isPremium)) return false;
      if (selectedTier === 'Premium Voices' && !(v.premium || v.isPremium)) return false;

      // 6. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const searchableText = `${v.name} ${v.style || ''} ${v.accent || ''} ${v.language || ''} ${v.gender || ''} ${v.category || ''} ${v.description || ''}`.toLowerCase();
      return searchableText.includes(q);
    });
  }, [allVoices, activeTab, selectedLanguage, selectedAccent, selectedCategory, selectedGender, selectedTier, searchQuery]);

  const isCustomSelected = Boolean(selectedVoiceObj.isCustom || selectedVoiceObj.category === 'custom');
  const isSelectedLocked = Boolean((selectedVoiceObj.premium || selectedVoiceObj.isPremium) && !isUserPremium);

  // Extract tags array
  const getTags = (v: VoiceOption) => {
    const tags: string[] = [];
    if (v.style) tags.push(v.style);
    if (v.category && v.category !== v.style && v.category !== 'custom') tags.push(v.category);
    if (tags.length === 0) tags.push('Narration');
    return tags;
  };

  return (
    <div className="w-full">
      {/* TRIGGER WORKSPACE CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-app)] shadow-lg flex flex-col gap-4 w-full box-border">
        {/* Header Title Row */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
          <div className="flex items-center gap-2 min-w-0">
            <Mic className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--text-secondary)] truncate">
              {label}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Choose Voice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected Voice Display Card */}
        <div
          onClick={() => setIsOpen(true)}
          className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] hover:border-indigo-500/40 shadow-sm flex items-center justify-between gap-4 transition-all cursor-pointer group min-w-0 box-border"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {isCustomSelected ? (
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
            )}

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors truncate">
                  {selectedVoiceObj.name}
                </h3>
                {isSelectedLocked && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-app)] text-[9px] font-extrabold uppercase flex items-center gap-1 shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    Locked
                  </span>
                )}
              </div>

              <span className="text-xs font-semibold text-[var(--text-muted)] mt-0.5 truncate">
                {selectedVoiceObj.accent || selectedVoiceObj.language || 'American Male'}
              </span>

              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {getTags(selectedVoiceObj).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[10px] font-bold text-indigo-400 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onPreviewVoice && !isSelectedLocked && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewVoice(selectedVoiceObj);
                }}
                disabled={Boolean(previewingVoiceId)}
                className="p-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-indigo-500 text-xs font-bold transition cursor-pointer"
                title="Preview Voice Audio"
              >
                {previewingVoiceId === selectedVoiceObj.voiceId ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                ) : playingVoiceId === selectedVoiceObj.voiceId ? (
                  <Pause className="w-4 h-4 fill-indigo-500 text-indigo-500 animate-pulse" />
                ) : (
                  <Play className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                )}
              </button>
            )}

            <div className="px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-1">
              <span>Change Voice</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* FULL VOICE EXPLORER MODAL (STRICTLY BOUNDED PARENT) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden">
          <div
            ref={modalRef}
            className="w-full max-w-[860px] max-h-[85vh] h-auto bg-[var(--bg-card)] border border-[var(--border-app)] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative box-border animate-in zoom-in-95 duration-150"
          >
            {/* 1. Fixed Header Bar */}
            <div className="p-5 sm:p-6 pb-4 border-b border-[var(--border-app)] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight truncate">
                    Select a Voice
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-medium truncate">
                    Explore high-quality AI voices and custom voice clones
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-[var(--border-app)] flex items-center gap-6 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className={`pb-3 text-xs sm:text-sm font-extrabold transition border-b-2 cursor-pointer ${
                  activeTab === 'explore'
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Explore Library ({allVoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my-voices')}
                className={`pb-3 text-xs sm:text-sm font-extrabold transition border-b-2 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'my-voices'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>My Voices ({customVoices.length})</span>
              </button>
            </div>

            {/* 3. Fixed Search & Multi-Filters Toolbar */}
            <div className="p-4 sm:p-5 pb-3 border-b border-[var(--border-app)] bg-[var(--bg-input)]/30 flex flex-col gap-3 shrink-0">
              {/* Search Input */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search voices by name, style, accent, provider..."
                  autoFocus
                  className="w-full pl-11 pr-10 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs sm:text-sm rounded-2xl border border-[var(--border-app)] focus:border-indigo-500 outline-none placeholder:text-[var(--text-muted)] font-medium shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Chips Toolbar */}
              {activeTab === 'explore' && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-app)] font-bold outline-none cursor-pointer"
                  >
                    <option value="All Languages">🌐 All Languages</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                  </select>

                  <select
                    value={selectedAccent}
                    onChange={(e) => setSelectedAccent(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-app)] font-bold outline-none cursor-pointer"
                  >
                    <option value="All Accents">🗣️ All Accents</option>
                    <option value="American">American</option>
                    <option value="British">British</option>
                    <option value="Australian">Australian</option>
                    <option value="Canadian">Canadian</option>
                    <option value="Indian">Indian</option>
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-app)] font-bold outline-none cursor-pointer"
                  >
                    <option value="All Categories">🎙️ All Categories</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Narration">Narration</option>
                    <option value="Podcast">Podcast</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Cinematic">Cinematic</option>
                  </select>

                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-app)] font-bold outline-none cursor-pointer"
                  >
                    <option value="All Genders">👤 All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>

                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-app)] font-bold outline-none cursor-pointer"
                  >
                    <option value="All Tiers">⭐ All Tiers</option>
                    <option value="Free Voices">Free Voices</option>
                    <option value="Premium Voices">Premium Voices</option>
                  </select>
                </div>
              )}
            </div>

            {/* 4. Strictly Bounded Internal Scrollable Voice List Container */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 max-h-[420px] box-border">
              {filteredVoices.length === 0 ? (
                <div className="p-12 text-center text-xs sm:text-sm text-[var(--text-muted)] font-medium">
                  {activeTab === 'my-voices'
                    ? 'No cloned voices found. Upload a voice sample in AI Voice Clone Generator to create your first custom voice model!'
                    : 'No matching voices found. Try adjusting your search query or filters.'}
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
                      className={`w-full min-h-[84px] p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer box-border ${
                        isItemActive
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                          : 'border-[var(--border-app)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] hover:border-indigo-500/30'
                      }`}
                    >
                      {/* Left: Icon & Voice Information */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {isCustom ? (
                          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                            <Mic className="w-5 h-5" />
                          </div>
                        )}

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm sm:text-base font-extrabold truncate ${isItemActive ? 'text-indigo-400' : 'text-[var(--text-primary)]'}`}>
                              {v.name}
                            </h4>
                            {isItemLocked && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-app)] text-[var(--text-muted)] font-bold uppercase flex items-center gap-1 shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                              </span>
                            )}
                            {v.premium || v.isPremium ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 font-bold uppercase shrink-0">
                                Premium
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase shrink-0">
                                Free
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-[var(--text-muted)]">
                              {v.accent || v.language || 'American Male'}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">&bull;</span>
                            <span className="text-xs text-[var(--text-secondary)] font-normal line-clamp-1">
                              {v.description || 'Natural speech synthesis voice'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {getTags(v).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-app)] text-[10px] font-bold text-indigo-400 capitalize"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Actions: Preview Button & Select Button */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        {onPreviewVoice && !isItemLocked && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreviewVoice(v);
                            }}
                            disabled={previewingVoiceId === v.voiceId}
                            className="px-3 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-app)] text-indigo-500 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {previewingVoiceId === v.voiceId ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : playingVoiceId === v.voiceId ? (
                              <Pause className="w-3.5 h-3.5 fill-indigo-500 animate-pulse" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-indigo-500" />
                            )}
                            <span>
                              {previewingVoiceId === v.voiceId
                                ? 'Loading...'
                                : playingVoiceId === v.voiceId
                                ? 'Stop'
                                : 'Preview'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(v);
                          }}
                          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                            isItemActive
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          }`}
                        >
                          {isItemActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Selected</span>
                            </>
                          ) : (
                            <span>Select Voice</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceExplorer;
