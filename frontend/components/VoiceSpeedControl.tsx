'use client';

import React from 'react';
import { Gauge } from 'lucide-react';

interface VoiceSpeedControlProps {
  speed: number;
  onChange: (newSpeed: number) => void;
  className?: string;
}

export const VoiceSpeedControl: React.FC<VoiceSpeedControlProps> = ({
  speed,
  onChange,
  className = '',
}) => {
  // Clamp helper for input values
  const clampedSpeed = Math.min(1.5, Math.max(0.5, speed));

  // Preset label helper
  const getPresetLabel = (val: number) => {
    if (Math.abs(val - 0.5) < 0.02) return 'Very Slow';
    if (Math.abs(val - 0.75) < 0.02) return 'Slow';
    if (Math.abs(val - 1.0) < 0.02) return 'Normal';
    if (Math.abs(val - 1.25) < 0.02) return 'Fast';
    if (Math.abs(val - 1.5) < 0.02) return 'Very Fast';
    return 'Custom Speed';
  };

  const getDropdownValue = () => {
    if (Math.abs(clampedSpeed - 0.5) < 0.02) return '0.5';
    if (Math.abs(clampedSpeed - 0.75) < 0.02) return '0.75';
    if (Math.abs(clampedSpeed - 1.0) < 0.02) return '1.0';
    if (Math.abs(clampedSpeed - 1.25) < 0.02) return '1.25';
    if (Math.abs(clampedSpeed - 1.5) < 0.02) return '1.5';
    return 'custom';
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.min(1.5, Math.max(0.5, val)));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.min(1.5, Math.max(0.5, val)));
    }
  };

  return (
    <div className={`space-y-4 p-5 rounded-2xl border bg-card text-card-foreground border-input shadow-lg backdrop-blur-xl transition-all duration-200 ${className}`}>
      {/* Header Label & Badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
          <Gauge className="w-4 h-4 text-indigo-500" /> Voice Speed: {clampedSpeed.toFixed(2)}x
        </label>
        <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
          {getPresetLabel(clampedSpeed)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Option 1: Continuous Slider (0.5x - 1.5x) */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tight">
            <span>0.5x (Very Slow)</span>
            <span>1.0x (Normal)</span>
            <span>1.5x (Very Fast)</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={clampedSpeed}
            onChange={handleSliderChange}
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {/* Option 2: Preset Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Speed Preset Selection
          </label>
          <select
            value={getDropdownValue()}
            onChange={handleDropdownChange}
            className="w-full text-xs font-semibold rounded-xl px-3.5 py-2.5 border bg-background text-foreground border-input focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
          >
            <option value="0.5">Very Slow (0.50x)</option>
            <option value="0.75">Slow (0.75x)</option>
            <option value="1.0">Normal (1.00x)</option>
            <option value="1.25">Fast (1.25x)</option>
            <option value="1.5">Very Fast (1.50x)</option>
            {getDropdownValue() === 'custom' && (
              <option value="custom">Custom Speed ({clampedSpeed.toFixed(2)}x)</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

export default VoiceSpeedControl;
