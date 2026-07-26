'use client';

import React from 'react';
import { User as UserIcon, Shield, Star, CheckCircle } from 'lucide-react';

interface ProfileAvatarProps {
  name: string;
  email: string;
  imageUrl?: string | null;
  role?: string;
  premiumAccess?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export default function ProfileAvatar({
  name,
  email,
  imageUrl,
  role = 'user',
  premiumAccess = false,
  size = 'lg',
  showBadge = true,
}: ProfileAvatarProps) {
  const getInitials = (str: string) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-base',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl',
  }[size];

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[10px]',
    lg: 'w-7 h-7 text-xs',
    xl: 'w-8 h-8 text-sm',
  }[size];

  const isAdmin = role === 'admin';

  return (
    <div className="relative inline-block shrink-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border-2 border-neutral-800 shadow-xl bg-neutral-900`}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLElement).style.display = 'none';
            const fallback = (e.target as HTMLElement).nextElementSibling;
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
      ) : null}

      <div
        className={`${sizeClasses} ${
          imageUrl ? 'hidden' : 'flex'
        } rounded-full border-2 border-neutral-800 shadow-xl bg-gradient-to-tr from-indigo-900 via-neutral-900 to-violet-900 items-center justify-center font-bold text-white tracking-wider`}
      >
        {getInitials(name)}
      </div>

      {showBadge && (
        <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
          {isAdmin ? (
            <span
              className={`${badgeSizeClasses} rounded-full bg-amber-500 text-neutral-950 font-extrabold flex items-center justify-center border-2 border-[#09090b] shadow-md`}
              title="Admin Account"
            >
              <Shield className="w-3.5 h-3.5 fill-current" />
            </span>
          ) : premiumAccess ? (
            <span
              className={`${badgeSizeClasses} rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center border-2 border-[#09090b] shadow-md animate-pulse`}
              title="Premium Member"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
            </span>
          ) : (
            <span
              className={`${badgeSizeClasses} rounded-full bg-neutral-800 text-neutral-400 font-medium flex items-center justify-center border-2 border-[#09090b] shadow-md`}
              title="Free User"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
