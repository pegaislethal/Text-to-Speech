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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border shadow-sm ${
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
      } ${className}`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
          <span>🌙 Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
          <span>☀️ Light</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
