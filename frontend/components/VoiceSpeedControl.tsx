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
  const clampedSpeed = Math.min(1.5, Math.max(0.5, speed));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.min(1.5, Math.max(0.5, val)));
    }
  };

  const setPresetSpeed = (preset: number) => {
    onChange(preset);
  };

  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      {/* Label and Value */}
      <div className="flex justify-between items-center text-xs font-bold text-neutral-400">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <Gauge className="w-3.5 h-3.5 text-indigo-500" /> Voice Speed
        </span>
        <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          {clampedSpeed.toFixed(2)}x
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.05"
        value={clampedSpeed}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
      />

      {/* Preset Action Buttons */}
      <div className="grid grid-cols-3 gap-2 text-xs mt-0.5">
        <button
          type="button"
          onClick={() => setPresetSpeed(0.5)}
          className={`py-2 rounded-xl border transition-all font-bold cursor-pointer text-center ${
            Math.abs(clampedSpeed - 0.5) < 0.03
              ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-md shadow-indigo-500/10'
              : 'border-input bg-card text-neutral-400 hover:text-foreground hover:border-neutral-700'
          }`}
        >
          Slow (0.5x)
        </button>
        <button
          type="button"
          onClick={() => setPresetSpeed(1.0)}
          className={`py-2 rounded-xl border transition-all font-bold cursor-pointer text-center ${
            Math.abs(clampedSpeed - 1.0) < 0.03
              ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-md shadow-indigo-500/10'
              : 'border-input bg-card text-neutral-400 hover:text-foreground hover:border-neutral-700'
          }`}
        >
          Normal (1.0x)
        </button>
        <button
          type="button"
          onClick={() => setPresetSpeed(1.5)}
          className={`py-2 rounded-xl border transition-all font-bold cursor-pointer text-center ${
            Math.abs(clampedSpeed - 1.5) < 0.03
              ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-md shadow-indigo-500/10'
              : 'border-input bg-card text-neutral-400 hover:text-foreground hover:border-neutral-700'
          }`}
        >
          Fast (1.5x)
        </button>
      </div>
    </div>
  );
};

export default VoiceSpeedControl;
