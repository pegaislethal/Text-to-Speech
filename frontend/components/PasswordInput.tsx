'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  disabled = false,
  error,
  label,
  icon,
  className = '',
  containerClassName = '',
  required = false,
  id,
  name,
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Leading Icon (default: Lock) */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
          {icon ? icon : <Lock className="w-4 h-4" />}
        </div>

        {/* Password Input */}
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-[var(--bg-input)] border text-xs text-[var(--text-primary)] rounded-xl pl-10 pr-10 py-3 outline-none transition placeholder:text-[var(--text-muted)] ${
            error
              ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-[var(--border-app)] focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          {...rest}
        />

        {/* Show/Hide Password Toggle Button */}
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:text-[var(--text-primary)] transition p-1 rounded-md cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 transition-transform duration-150" />
          ) : (
            <Eye className="w-4 h-4 transition-transform duration-150" />
          )}
        </button>
      </div>

      {typeof error === 'string' && error && (
        <span className="text-[11px] font-medium text-red-400 mt-0.5">{error}</span>
      )}
    </div>
  );
}
