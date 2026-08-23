'use client';

import { useState } from 'react';
import BookingSouthAfrica from '@/components/BookingSouthAfrica';
import ModifyOrCancelBooking from '@/components/ModifyOrCancelBooking';
import BookingCard from '@/components/BookingCard';
import InternationalNotice from '@/components/InternationalNotice';
import { IconCar, IconGlobe, IconSearch } from '@/components/icons';

type Tab = 'south-africa' | 'international' | 'modify-cancel';

export default function BookPage() {
  const [activeTab, setActiveTab] = useState<Tab>('south-africa');

  const tabs = [
    { key: 'south-africa', label: 'South Africa', icon: <IconCar className="w-4 h-4" /> },
    { key: 'international', label: 'Outside South Africa', icon: <IconGlobe className="w-4 h-4" /> },
    { key: 'modify-cancel', label: 'Modify or Cancel Booking', icon: <IconSearch className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BookingCard
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(k) => setActiveTab(k as Tab)}
        >
          {activeTab === 'south-africa' && <BookingSouthAfrica />}
          {activeTab === 'international' && <InternationalNotice />}
          {activeTab === 'modify-cancel' && <ModifyOrCancelBooking />}
        </BookingCard>
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
