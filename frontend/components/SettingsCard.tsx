'use client';

import React from 'react';

interface SettingsCardProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
  action,
}: SettingsCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-neutral-950/70 border border-neutral-900/80 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400 shrink-0">
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-neutral-200">{title}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
