'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingLookupForm } from './BookingLookupForm';
import BookingCard from './BookingCard';
import InternationalNotice from './InternationalNotice';
import {
  IconMapPinFrom,
  IconMapPinTo,
  IconCalendar,
  IconClock,
  IconUsers,
  IconGlobe,
  IconSearch,
  IconCar,
  IconChevronDown,
  IconMinus,
  IconPlus,
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
    returnPickup: '',
    returnDropoff: '',
    returnDate: '',
    returnTime: '',
    adults: 1,
    children: 0,
    infants: 0,
    babySeat: false,
    trailer: false,
    instructions: '',
  });

  const update = (field: string, value: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const adjustCount = (field: 'adults' | 'children' | 'infants', delta: number) => {
    setForm((prev) => {
      const min = field === 'adults' ? 1 : 0;
      const next = Math.max(min, Math.min(8, prev[field] + delta));
      return { ...prev, [field]: next };
    });
  };

  const [passengersOpen, setPassengersOpen] = useState(false);
  const passengersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (passengersRef.current && !passengersRef.current.contains(e.target as Node)) {
        setPassengersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const passengerSummary = () => {
    const parts: string[] = [];
    if (form.adults > 0) parts.push(`${form.adults} Adult${form.adults > 1 ? 's' : ''}`);
    if (form.children > 0) parts.push(`${form.children} Child${form.children > 1 ? 'ren' : ''}`);
    if (form.infants > 0) parts.push(`${form.infants} Infant${form.infants > 1 ? 's' : ''}`);
    return parts.length ? parts.join(', ') : 'No. of passengers';
  };

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
    <BookingCard tabs={tabs} activeTab={tab} onTabChange={(k) => setTab(k as Tab)} className="max-w-md">
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

            {/* Return Trip Details (expands when toggle is on) */}
            {form.isReturn && (
              <div className="space-y-3 pl-3 border-l-2" style={{ borderColor: '#0068da' }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Return Trip Details
                </p>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <IconMapPinFrom className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Return pickup address"
                    value={form.returnPickup}
                    onChange={(e) => update('returnPickup', e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <IconMapPinTo className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Return dropoff address"
                    value={form.returnDropoff}
                    onChange={(e) => update('returnDropoff', e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                    <IconCalendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => update('returnDate', e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-gray-700"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                    <IconClock className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="time"
                      value={form.returnTime}
                      onChange={(e) => update('returnTime', e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Passengers */}
            <div className="relative" ref={passengersRef}>
              <button
                type="button"
                onClick={() => setPassengersOpen((v) => !v)}
                className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-left"
              >
                <IconUsers className="w-4 h-4 text-gray-400 shrink-0" />
                <span className={`flex-1 text-sm ${form.adults + form.children + form.infants > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                  {passengerSummary()}
                </span>
                <IconChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${passengersOpen ? 'rotate-180' : ''}`} />
              </button>

              {passengersOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Adults</p>
                      <p className="text-xs text-gray-400">Age 13+</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustCount('adults', -1)}
                        disabled={form.adults <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400"
                      >
                        <IconMinus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium text-gray-800">{form.adults}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('adults', 1)}
                        disabled={form.adults >= 8}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400"
                      >
                        <IconPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Children</p>
                      <p className="text-xs text-gray-400">Age 2-12</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustCount('children', -1)}
                        disabled={form.children <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400"
                      >
                        <IconMinus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium text-gray-800">{form.children}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('children', 1)}
                        disabled={form.children >= 8}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400"
                      >
                        <IconPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Infants</p>
                      <p className="text-xs text-gray-400">Under 2</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustCount('infants', -1)}
                        disabled={form.infants <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400"
                      >
                        <IconMinus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium text-gray-800">{form.infants}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('infants', 1)}
                        disabled={form.infants >= 8}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400"
                      >
                        <IconPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPassengersOpen(false)}
                    className="w-full py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: '#0068da' }}
                  >
                    Done
                  </button>
                </div>
              )}
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

        {tab === 'international' && <InternationalNotice />}

        {tab === 'modify' && (
          <div className="[&_h2]:text-lg [&_h2]:mb-4">
            <BookingLookupForm />
          </div>
        )}
    </BookingCard>
  );
}
