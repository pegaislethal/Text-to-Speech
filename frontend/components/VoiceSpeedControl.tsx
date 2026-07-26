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
  // Preset values mapping
  const getPresetLabel = (val: number) => {
    if (val <= 0.2) return 'Very Slow';
    if (Math.abs(val - 0.5) < 0.05) return 'Slow';
    if (Math.abs(val - 0.75) < 0.05) return 'Normal';
    if (Math.abs(val - 1.0) < 0.05) return 'Fast';
    return 'Custom';
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  return (
    <div className={`space-y-3 p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-colors duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 opacity-90">
          <Gauge className="w-3.5 h-3.5 text-indigo-500" /> Speech Speed
        </label>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          {speed.toFixed(2)}x ({getPresetLabel(speed)})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Option 1: Slider (Range 0 - 1) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
            <span>0 (Very slow)</span>
            <span>0.5 (Slow)</span>
            <span>0.75</span>
            <span>1 (Fast)</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={speed}
            onChange={handleSliderChange}
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
        </div>

        {/* Option 2: Preset Dropdown */}
        <div className="space-y-1">
          <select
            value={Math.abs(speed - 0.5) < 0.05 ? '0.5' : Math.abs(speed - 0.75) < 0.05 ? '0.75' : Math.abs(speed - 1.0) < 0.05 ? '1' : 'custom'}
            onChange={handleDropdownChange}
            className="w-full text-xs rounded-lg px-3 py-2 border bg-background text-foreground border-input focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
          >
            <option value="0.5">Slow (0.50x)</option>
            <option value="0.75">Normal (0.75x)</option>
            <option value="1">Fast (1.00x)</option>
            {Math.abs(speed - 0.5) >= 0.05 && Math.abs(speed - 0.75) >= 0.05 && Math.abs(speed - 1.0) >= 0.05 && (
              <option value="custom">Custom ({speed.toFixed(2)}x)</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

export default VoiceSpeedControl;
