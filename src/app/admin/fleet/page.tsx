'use client';

import { useState } from 'react';
import VehiclesPanel from '@/components/admin/VehiclesPanel';
import ZonesPanel from '@/components/admin/ZonesPanel';
import PricingPanel from '@/components/admin/PricingPanel';
import AddonsPanel from '@/components/admin/AddonsPanel';

type Tab = 'vehicles' | 'zones' | 'pricing' | 'addons';

const TABS: { key: Tab; label: string }[] = [
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'zones', label: 'Zones' },
  { key: 'pricing', label: 'Pricing Rules' },
  { key: 'addons', label: 'Add-ons' },
];

export default function AdminFleetPage() {
  const [tab, setTab] = useState<Tab>('vehicles');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fleet &amp; Pricing</h1>
        <p className="text-gray-500 text-sm mt-1">Manage vehicles, service zones, pricing rules, and add-ons.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? '' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t.key ? { color: '#0068da', borderColor: '#0068da' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vehicles' && <VehiclesPanel />}
      {tab === 'zones' && <ZonesPanel />}
      {tab === 'pricing' && <PricingPanel />}
      {tab === 'addons' && <AddonsPanel />}
    </div>
  );
}
