'use client';

import { useState } from 'react';
import { IconX } from '@/components/icons';
import type { AgentBookingRecord, BookingStatus, PaymentStatus } from '@/lib/mock/agentBookings';

interface BookingDetailPanelProps {
  booking: AgentBookingRecord;
  onClose: () => void;
  onSave: (updated: AgentBookingRecord) => void;
}

const BOOKING_STATUS_OPTIONS: BookingStatus[] = ['pending_payment', 'confirmed', 'modified', 'cancelled', 'completed'];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

/**
 * Render with `key={booking.id}` from the parent so React remounts (and
 * resets `draft`/`saved`) whenever a different booking is opened, instead
 * of syncing props into state via an effect.
 */
export default function BookingDetailPanel({ booking, onClose, onSave }: BookingDetailPanelProps) {
  const [draft, setDraft] = useState<AgentBookingRecord>(booking);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AgentBookingRecord>(field: K, value: AgentBookingRecord[K]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(draft);
    // NOTE: mock-only — a real save would PATCH the booking and write an
    // audit_log row (old value, new value, agent id, timestamp) per the brief.
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-gray-400">Booking</p>
            <h2 className="text-lg font-bold" style={{ color: '#003b70' }}>{draft.bookingNumber}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Status controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Booking Status</label>
              <select
                value={draft.bookingStatus}
                onChange={(e) => update('bookingStatus', e.target.value as BookingStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm capitalize focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {BOOKING_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Status</label>
              <select
                value={draft.paymentStatus}
                onChange={(e) => update('paymentStatus', e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm capitalize focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Client Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={draft.contactFullName}
                  onChange={(e) => update('contactFullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(e) => update('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={draft.contactPhone}
                    onChange={(e) => update('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trip */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Trip Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Pickup Address</label>
                <input
                  type="text"
                  value={draft.pickupAddress}
                  onChange={(e) => update('pickupAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Dropoff Address</label>
                <input
                  type="text"
                  value={draft.dropoffAddress}
                  onChange={(e) => update('dropoffAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Pickup Date</label>
                  <input
                    type="date"
                    value={draft.pickupDate}
                    onChange={(e) => update('pickupDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Pickup Time</label>
                  <input
                    type="time"
                    value={draft.pickupTime}
                    onChange={(e) => update('pickupTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={draft.passengerCount}
                  onChange={(e) => update('passengerCount', Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Special Instructions</label>
                <textarea
                  value={draft.specialInstructions}
                  onChange={(e) => update('specialInstructions', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Fare (read-only — snapshot values, never recalculated silently) */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Fare Breakdown</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fare</span>
                <span className="text-gray-900">R{draft.baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons</span>
                <span className="text-gray-900">R{draft.addonsFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200 font-semibold">
                <span className="text-gray-900">Total</span>
                <span style={{ color: '#003b70' }}>R{draft.totalFare.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white transition-colors"
            style={{ backgroundColor: saved ? '#16a34a' : '#003b70' }}
          >
            {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
