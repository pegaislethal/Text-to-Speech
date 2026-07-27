'use client';

import React from 'react';
import { useTheme } from '../context/themeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      className={`relative p-2 rounded-lg transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group ${
        theme === 'dark'
          ? 'bg-[#121217] border-[#22222e] text-neutral-300 hover:text-white hover:bg-[#181820]'
          : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400 transition-all duration-300 transform group-hover:scale-110 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-45" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
