'use client';

import React from 'react';

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
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {/* Label and Value */}
      <div className="flex justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
        <span>Voice Speed</span>
        <span className="font-mono text-indigo-400">{clampedSpeed.toFixed(2)}x</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.05"
        value={clampedSpeed}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
      />

      {/* Preset Action Buttons */}
      <div className="flex justify-between gap-1.5 text-[9px] mt-0.5">
        <button
          type="button"
          onClick={() => setPresetSpeed(0.5)}
          className={`flex-1 py-1.5 rounded-lg border transition font-bold cursor-pointer text-center ${
            Math.abs(clampedSpeed - 0.5) < 0.02
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/5'
              : 'border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/30'
          }`}
        >
          Slow (0.5x)
        </button>
        <button
          type="button"
          onClick={() => setPresetSpeed(1.0)}
          className={`flex-1 py-1.5 rounded-lg border transition font-bold cursor-pointer text-center ${
            Math.abs(clampedSpeed - 1.0) < 0.02
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/5'
              : 'border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/30'
          }`}
        >
          Normal (1.0x)
        </button>
        <button
          type="button"
          onClick={() => setPresetSpeed(1.5)}
          className={`flex-1 py-1.5 rounded-lg border transition font-bold cursor-pointer text-center ${
            Math.abs(clampedSpeed - 1.5) < 0.02
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/5'
              : 'border-[var(--border-app)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/30'
          }`}
        >
          Fast (1.5x)
        </button>
      </div>
    </div>
  );
};

export default VoiceSpeedControl;
