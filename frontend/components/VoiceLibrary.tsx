'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import VoiceSearch from './VoiceSearch';
import VoiceFilters, { CategoryFilter } from './VoiceFilters';
import VoiceCard, { VoiceOption } from './VoiceCard';
import { Mic, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceLibraryProps {
  systemVoices: VoiceOption[];
  customVoices: VoiceOption[];
  selectedVoiceId?: string;
  onSelectVoice?: (voice: VoiceOption) => void;
  onPreviewVoice?: (voice: VoiceOption) => void;
  onDeleteVoice?: (voiceId: string) => void;
  onGenerateSpeech?: (voice: VoiceOption) => void;
  previewingVoiceId?: string | null;
  playingVoiceId?: string | null;
  actionLabel?: string;
  maxHeight?: string;
  gridCols?: string;
  showFilters?: boolean;
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  systemVoices = [],
  customVoices = [],
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  onDeleteVoice,
  onGenerateSpeech,
  previewingVoiceId = null,
  playingVoiceId = null,
  actionLabel,
  maxHeight = '520px',
  gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  showFilters = true,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedAccent, setSelectedAccent] = useState<string>('All Accents');
  const [selectedStyle, setSelectedStyle] = useState<string>('All Styles');

  // Unified All Voices array
  const allVoices = useMemo(() => {
    const sys = systemVoices.map((v) => ({ ...v, isCustom: false }));
    const cust = customVoices.map((v) => ({ ...v, isCustom: true, category: 'custom' }));
    return [...sys, ...cust];
  }, [systemVoices, customVoices]);

  // Compute category counts
  const counts = useMemo(() => {
    return {
      all: allVoices.length,
      male: allVoices.filter((v) => (v.gender || '').toLowerCase() === 'male').length,
      female: allVoices.filter((v) => (v.gender || '').toLowerCase() === 'female').length,
      premium: allVoices.filter((v) => v.premium || v.isPremium).length,
      free: allVoices.filter((v) => !v.premium && !v.isPremium).length,
      custom: customVoices.length,
    };
  }, [allVoices, customVoices]);

  // Filtered voice list matching search query, style, accent, and category filter
  const filteredVoices = useMemo(() => {
    return allVoices.filter((v) => {
      // 1. Category Filter
      if (activeCategory === 'male' && (v.gender || '').toLowerCase() !== 'male') return false;
      if (activeCategory === 'female' && (v.gender || '').toLowerCase() !== 'female') return false;
      if (activeCategory === 'premium' && !(v.premium || v.isPremium)) return false;
      if (activeCategory === 'free' && (v.premium || v.isPremium)) return false;
      if (activeCategory === 'custom' && !v.isCustom) return false;

      // 2. Accent Filter
      if (selectedAccent !== 'All Accents') {
        const accLower = selectedAccent.toLowerCase();
        const vAcc = (v.accent || v.language || '').toLowerCase();
        if (!vAcc.includes(accLower)) return false;
      }

      // 3. Style Filter
      if (selectedStyle !== 'All Styles') {
        const styleLower = selectedStyle.toLowerCase();
        const vStyle = (v.style || v.category || '').toLowerCase();
        if (!vStyle.includes(styleLower)) return false;
      }

      // 4. Search Query Filtering across Name, Style, Accent, Gender, Category, Description
      if (searchQuery.trim()) {
        const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
        const searchableText = `${v.name} ${v.style || ''} ${v.accent || ''} ${v.language || ''} ${v.gender || ''} ${v.category || ''} ${v.description || ''} ${v.provider || ''}`.toLowerCase();
        
        const matchesAllTokens = tokens.every((token) => searchableText.includes(token));
        if (!matchesAllTokens) return false;
      }

      return true;
    });
  }, [allVoices, activeCategory, selectedAccent, selectedStyle, searchQuery]);

  const handleVoiceSelect = (v: VoiceOption) => {
    const isLocked = (v.premium || v.isPremium) && user && !user.premiumAccess;
    if (isLocked) {
      showToast('Upgrade to Premium to unlock this voice profile.', 'error');
      return;
    }
    if (onSelectVoice) {
      onSelectVoice(v);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Search & Filter Bar */}
      <VoiceSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search voice by name, style, accent..."
        onSelectQuickFilter={(tag) => {
          if (!tag) {
            setSearchQuery('');
          } else {
            setSearchQuery(tag);
          }
        }}
      />

      {showFilters && (
        <VoiceFilters
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedAccent={selectedAccent}
          onAccentChange={setSelectedAccent}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          counts={counts}
        />
      )}

      {/* Voice Grid Container */}
      {filteredVoices.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-[var(--border-app)] rounded-3xl bg-[var(--bg-card)]/50 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Mic className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-[var(--text-primary)]">No voice profiles found</p>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">
              Try adjusting your search terms or filter selection to discover available voices.
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setSelectedAccent('All Accents');
                setSelectedStyle('All Styles');
              }}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-bold border border-indigo-500/20 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid ${gridCols} gap-3.5 overflow-y-auto pr-1 text-left`}
          style={{ maxHeight: maxHeight }}
        >
          {filteredVoices.map((v) => {
            const isSelected = selectedVoiceId === v.voiceId;
            const isLocked = (v.premium || v.isPremium) && user && !user.premiumAccess;
            const isPreviewing = previewingVoiceId === v.voiceId;
            const isPlaying = playingVoiceId === v.voiceId;

            return (
              <VoiceCard
                key={v.voiceId}
                voice={v}
                isSelected={isSelected}
                isLocked={Boolean(isLocked)}
                isPreviewing={isPreviewing}
                isPlayingPreview={isPlaying}
                onSelect={onSelectVoice ? handleVoiceSelect : undefined}
                onPreview={onPreviewVoice}
                onDelete={onDeleteVoice}
                onGenerateSpeech={onGenerateSpeech}
                actionLabel={actionLabel}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VoiceLibrary;
