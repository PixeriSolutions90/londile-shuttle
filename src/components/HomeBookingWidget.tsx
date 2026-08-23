'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingLookupForm } from './BookingLookupForm';
import {
  IconMapPinFrom,
  IconMapPinTo,
  IconCalendar,
  IconClock,
  IconUsers,
  IconGlobe,
  IconSearch,
  IconCar,
} from './icons';

type Tab = 'local' | 'international' | 'modify';

export default function HomeBookingWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('local');

  const [form, setForm] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    isReturn: false,
    passengers: '',
    babySeat: false,
    trailer: false,
    instructions: '',
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleQuote = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/book');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'local', label: 'South Africa', icon: <IconCar className="w-4 h-4" /> },
    { key: 'international', label: 'Outside South Africa', icon: <IconGlobe className="w-4 h-4" /> },
    { key: 'modify', label: 'Modify or Cancel', icon: <IconSearch className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-md">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors border-b-2 ${
              tab === t.key
                ? 'border-current text-white'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            style={tab === t.key ? { color: '#0068da', borderColor: '#0068da' } : undefined}
          >
            {t.icon}
            <span className="leading-tight text-center">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'local' && (
          <form onSubmit={handleQuote} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ride Details
            </p>

            {/* Pickup / Dropoff */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <IconMapPinFrom className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Pickup address"
                  value={form.pickup}
                  onChange={(e) => update('pickup', e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <IconMapPinTo className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Dropoff address"
                  value={form.dropoff}
                  onChange={(e) => update('dropoff', e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Date &amp; Time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <IconCalendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => update('date', e.target.value)}
                    className="w-full bg-transparent text-sm outline-none text-gray-700"
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <IconClock className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => update('time', e.target.value)}
                    className="w-full bg-transparent text-sm outline-none text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Return trip toggle */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700">Add return trip</label>
              <button
                type="button"
                onClick={() => update('isReturn', !form.isReturn)}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                style={{ backgroundColor: form.isReturn ? '#0068da' : '#d1d5db' }}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    form.isReturn ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Passengers */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <IconUsers className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={form.passengers}
                onChange={(e) => update('passengers', e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-gray-700"
              >
                <option value="">No. of passengers</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} passenger{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Add-ons */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Additional Request
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.babySeat}
                    onChange={(e) => update('babySeat', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: '#0068da' }}
                  />
                  Baby seat
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.trailer}
                    onChange={(e) => update('trailer', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: '#0068da' }}
                  />
                  Trailer
                </label>
              </div>
            </div>

            {/* Special instructions */}
            <textarea
              placeholder="Special instruction (optional)"
              value={form.instructions}
              onChange={(e) => update('instructions', e.target.value)}
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 resize-none"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white transition-colors"
              style={{ backgroundColor: '#003b70' }}
            >
              Get Instant Quote
            </button>
          </form>
        )}

        {tab === 'international' && (
          <div className="text-center py-8 space-y-3">
            <IconGlobe className="w-10 h-10 mx-auto text-gray-300" />
            <h3 className="font-semibold text-gray-900">Cross-Border &amp; International Transfers</h3>
            <p className="text-sm text-gray-500">
              Travelling beyond South Africa? Our team arranges cross-border and international shuttle transfers on request.
            </p>
            <a
              href="mailto:info@londileshuttle.co.za"
              className="inline-block mt-2 px-6 py-2.5 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: '#0068da' }}
            >
              Contact Us
            </a>
          </div>
        )}

        {tab === 'modify' && (
          <div className="[&_h2]:text-lg [&_h2]:mb-4">
            <BookingLookupForm />
          </div>
        )}
      </div>
    </div>
  );
}
