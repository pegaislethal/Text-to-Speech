'use client';

import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  onClick: () => void;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onClick,
  label = 'Download',
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none';

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
    secondary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
    outline: 'border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-6 py-3 text-sm gap-2.5',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        icon
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>{label}</span>
    </button>
  );
};

export default DownloadButton;
