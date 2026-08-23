'use client';

import { useState } from 'react';
import BookingSouthAfrica from '@/components/BookingSouthAfrica';
import ModifyOrCancelBooking from '@/components/ModifyOrCancelBooking';

export default function BookPage() {
  const [activeTab, setActiveTab] = useState<'south-africa' | 'modify-cancel'>('south-africa');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 py-4">
            <button
              onClick={() => setActiveTab('south-africa')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'south-africa'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ✓ South Africa
            </button>
            <button
              onClick={() => setActiveTab('modify-cancel')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'modify-cancel'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Modify or Cancel Booking
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'south-africa' && <BookingSouthAfrica />}
        {activeTab === 'modify-cancel' && <ModifyOrCancelBooking />}
      </div>

      {/* Footer Attribution */}
      <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-200">
        <p>This site is protected by Cloudflare Turnstile and is subject to the</p>
        <a href="https://www.cloudflare.com/privacypolicy/" className="text-blue-600 hover:underline">
          Cloudflare Privacy Policy
        </a>
        {' and '}
        <a href="https://www.cloudflare.com/website-terms/" className="text-blue-600 hover:underline">
          Terms of Service
        </a>
        .
      </div>
    </div>
  );
}
