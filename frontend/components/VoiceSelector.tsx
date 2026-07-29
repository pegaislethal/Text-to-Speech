'use client';

import React from 'react';
import VoiceLibrary from './VoiceLibrary';
import { VoiceOption } from './VoiceCard';

export type { VoiceOption };

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
  systemVoices: VoiceOption[];
  customVoices: VoiceOption[];
  previewingVoiceId: string | null;
  onPreviewVoice: (voice: VoiceOption) => void;
  playingVoiceId?: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onChange,
  systemVoices,
  customVoices,
  previewingVoiceId,
  onPreviewVoice,
  playingVoiceId = null,
}) => {
  return (
    <VoiceLibrary
      systemVoices={systemVoices}
      customVoices={customVoices}
      selectedVoiceId={selectedVoiceId}
      onSelectVoice={(v) => onChange(v.voiceId)}
      onPreviewVoice={onPreviewVoice}
      previewingVoiceId={previewingVoiceId}
      playingVoiceId={playingVoiceId}
      actionLabel="Use Voice"
      maxHeight="380px"
      gridCols="grid-cols-1 sm:grid-cols-2"
      showFilters={true}
    />
  );
};

export default VoiceSelector;
