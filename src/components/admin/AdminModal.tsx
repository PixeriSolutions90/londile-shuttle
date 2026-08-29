'use client';

import { IconX } from '@/components/icons';

interface AdminModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AdminModal({ title, onClose, children }: AdminModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 my-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
