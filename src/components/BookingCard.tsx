'use client';

import { ReactNode } from 'react';

export interface BookingTabDef {
  key: string;
  label: string;
  icon: ReactNode;
}

interface BookingCardProps {
  tabs: BookingTabDef[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: ReactNode;
  className?: string;
}

export default function BookingCard({ tabs, activeTab, onTabChange, children, className = '' }: BookingCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-medium transition-colors border-b-2 min-w-0 ${
              activeTab === t.key ? '' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            style={activeTab === t.key ? { color: '#0068da', borderColor: '#0068da' } : undefined}
          >
            {t.icon}
            <span className="leading-tight text-center break-words">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
