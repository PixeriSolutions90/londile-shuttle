'use client';

import { useState, useEffect } from 'react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { IconMapPinFrom, IconMapPinTo, IconCar } from '@/components/icons';
import { CURRENT_MOCK_AGENT } from '@/lib/mock/agentBookings';
import type { VehicleQuote, QuoteResponse } from '@/lib/types/quote';

type Step = 'vehicle' | 'details' | 'payment';
type PaymentMethod = 'cash' | 'eft' | 'gateway';

export default function AgentNewBooking() {
  const [step, setStep] = useState<Step>('vehicle');
  const [quotes, setQuotes] = useState<VehicleQuote[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientFullName: '',
    clientEmail: '',
    clientPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    pickupDate: '',
    pickupTime: '10:00',
    isReturnTrip: false,
    returnDate: '',
    returnTime: '',
    passengerCount: 1,
    specialInstructions: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);
  const [savedBookingNumber, setSavedBookingNumber] = useState<string | null>(null);

  const update = (field: string, value: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedQuote = quotes.find((q) => q.vehicleId === selectedVehicleId) ?? null;

  const fetchQuote = async (passengerCount: number, isReturnTrip: boolean) => {
    setQuoteLoading(true);
    setQuoteError('');
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerCount, isReturnTrip }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setQuoteError(data.message || 'Could not load pricing.');
        return;
      }
      const quote: QuoteResponse = await response.json();
      setQuotes(quote.quotes);
    } catch {
      setQuoteError('Network error while loading pricing.');
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote(form.passengerCount, form.isReturnTrip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.passengerCount, form.isReturnTrip]);

  const handleSaveBooking = () => {
    setSaving(true);
    // NOTE: mock-only for now — a real save would POST to a booking-creation
    // endpoint with source: 'agent', created_by_agent_id: CURRENT_MOCK_AGENT.id,
    // and the chosen paymentMethod, skipping Turnstile/card entry entirely
    // since the agent is authenticated and taking payment out-of-band.
    setTimeout(() => {
      const mockNumber = `LS-${Math.floor(10000 + Math.random() * 89999)}`;
      setSavedBookingNumber(mockNumber);
      setSaving(false);
    }, 600);
  };

  if (savedBookingNumber) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#e8f1fb' }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#0068da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Created</h2>
        <p className="text-gray-600 mb-6">
          <span className="font-semibold" style={{ color: '#003b70' }}>{savedBookingNumber}</span> has been created for{' '}
          {form.clientFullName}, marked as <span className="font-medium capitalize">{paymentMethod}</span>.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-lg font-medium text-white text-sm"
          style={{ backgroundColor: '#003b70' }}
        >
          Create Another Booking
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Make a Booking</h1>
        <p className="text-gray-500 text-sm mt-1">Book on behalf of a client and record how they paid.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs font-medium text-gray-400">
        <span style={step === 'vehicle' ? { color: '#0068da' } : undefined}>1. Vehicle</span>
        <span>→</span>
        <span style={step === 'details' ? { color: '#0068da' } : undefined}>2. Client & Trip Details</span>
        <span>→</span>
        <span style={step === 'payment' ? { color: '#0068da' } : undefined}>3. Payment Method</span>
      </div>

      {/* Step 1: Vehicle */}
      {step === 'vehicle' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Passengers</label>
              <select
                value={form.passengerCount}
                onChange={(e) => update('passengerCount', Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.isReturnTrip}
                onChange={(e) => update('isReturnTrip', e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: '#0068da' }}
              />
              Return trip
            </label>
          </div>

          {quoteLoading && <p className="text-sm text-gray-500">Loading pricing…</p>}
          {quoteError && <p className="text-sm text-red-500">{quoteError}</p>}

          <div className="grid gap-3">
            {quotes.map((q) => (
              <div
                key={q.vehicleId}
                onClick={() => setSelectedVehicleId(q.vehicleId)}
                className={`flex items-center gap-4 border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                  selectedVehicleId === q.vehicleId ? 'bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={selectedVehicleId === q.vehicleId ? { borderColor: '#0068da' } : undefined}
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0" style={{ backgroundColor: '#eef4fb' }}>
                  <IconCar className="w-6 h-6 text-[#0068da]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{q.vehicleName}</p>
                  <p className="text-xs text-gray-500">Up to {q.maxPassengers} passengers · {q.maxBags} bags</p>
                </div>
                <p className="font-bold text-gray-900 shrink-0">R{q.totalFare.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <button
            disabled={!selectedVehicleId}
            onClick={() => setStep('details')}
            className="mt-5 w-full py-2.5 rounded-lg font-medium text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#003b70' }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Client & Trip Details */}
      {step === 'details' && selectedQuote && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client Details</h3>
            <input
              type="text"
              placeholder="Full name"
              value={form.clientFullName}
              onChange={(e) => update('clientFullName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel"
                placeholder="Phone number"
                value={form.clientPhone}
                onChange={(e) => update('clientPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={form.clientEmail}
                onChange={(e) => update('clientEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trip Details</h3>
            <AddressAutocomplete
              value={form.pickupAddress}
              onChange={(v) => update('pickupAddress', v)}
              placeholder="Pickup address"
              icon={<IconMapPinFrom className="w-4 h-4 text-gray-400 shrink-0" />}
            />
            <AddressAutocomplete
              value={form.dropoffAddress}
              onChange={(v) => update('dropoffAddress', v)}
              placeholder="Dropoff address"
              icon={<IconMapPinTo className="w-4 h-4 text-gray-400 shrink-0" />}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={form.pickupDate}
                onChange={(e) => update('pickupDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="time"
                value={form.pickupTime}
                onChange={(e) => update('pickupTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {form.isReturnTrip && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.returnDate}
                  onChange={(e) => update('returnDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="time"
                  value={form.returnTime}
                  onChange={(e) => update('returnTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <textarea
              placeholder="Special instructions (optional)"
              value={form.specialInstructions}
              onChange={(e) => update('specialInstructions', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('vehicle')}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              disabled={!form.clientFullName || !form.clientPhone || !form.pickupAddress || !form.pickupDate}
              onClick={() => setStep('payment')}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#003b70' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Method */}
      {step === 'payment' && selectedQuote && (
        <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Client</span><span className="font-medium text-gray-900">{form.clientFullName}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Vehicle</span><span className="font-medium text-gray-900">{selectedQuote.vehicleName}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Pickup</span><span className="font-medium text-gray-900">{form.pickupDate} at {form.pickupTime}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-gray-200 font-semibold">
              <span className="text-gray-900">Total</span>
              <span style={{ color: '#003b70' }}>R{selectedQuote.totalFare.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">How did the client pay?</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'eft', 'gateway'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 rounded-lg text-sm font-medium capitalize border-2 transition-colors ${
                    paymentMethod === method ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  style={paymentMethod === method ? { backgroundColor: '#0068da', borderColor: '#0068da' } : undefined}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('details')}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSaveBooking}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: '#003b70' }}
            >
              {saving ? 'Saving…' : 'Save Booking'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Booking will be recorded as created by {CURRENT_MOCK_AGENT.fullName}.
          </p>
        </div>
      )}
    </div>
  );
}
