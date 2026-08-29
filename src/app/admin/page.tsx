'use client';

import { useState, useEffect } from 'react';
import { IconPlus } from '@/components/icons';
import AdminModal from '@/components/admin/AdminModal';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired';

interface QuoteRow {
  id: string;
  quote_number: string;
  guest_name: string;
  guest_surname: string;
  guest_contact: string;
  pickup_date: string | null;
  passenger_count: number;
  is_return_trip: boolean;
  quoted_total: number;
  status: QuoteStatus;
  converted_booking_id: string | null;
  vehicles: { name: string } | { name: string }[] | null;
}

interface Option {
  id: string;
  name: string;
}

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  expired: 'bg-red-50 text-red-700',
};

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

const EMPTY_FORM = {
  guestFirstName: '',
  guestSurname: '',
  contactNumber: '',
  email: '',
  vehicleId: '',
  zoneId: '',
  pickupAddress: '',
  pickupDate: '',
  passengerCount: 1,
  isReturnTrip: false,
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [vehicles, setVehicles] = useState<Option[]>([]);
  const [zones, setZones] = useState<Option[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/quotes');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load quotes.');
        return;
      }
      setQuotes(await response.json());
    } catch {
      setLoadError('Network error while loading quotes.');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [vehiclesRes, zonesRes] = await Promise.all([
        fetch('/api/admin/vehicles'),
        fetch('/api/admin/zones'),
      ]);
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
    } catch (error) {
      console.error('Failed to load vehicle/zone options:', error);
    }
  };

  useEffect(() => {
    load();
    loadOptions();
  }, []);

  const flash = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const updateStatus = async (q: QuoteRow, status: QuoteStatus) => {
    try {
      const response = await fetch(`/api/quotes/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        flash(data.error || 'Failed to update quote.');
        return;
      }
      flash(`${q.quote_number} marked ${status}.`);
      load();
    } catch {
      flash('Network error updating quote.');
    }
  };

  const convertToBooking = async (q: QuoteRow) => {
    try {
      const response = await fetch(`/api/quotes/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convert: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        flash(data.error || 'Failed to convert quote.');
        return;
      }
      flash(`${q.quote_number} converted to booking ${data.bookingNumber}.`);
      load();
    } catch {
      flash('Network error converting quote.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to create quote.');
        return;
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch {
      setFormError('Network error while creating quote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-500 text-sm mt-1">{quotes.length} quote{quotes.length !== 1 ? 's' : ''} on record.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          <IconPlus className="w-4 h-4" />
          New Quote
        </button>
      </div>

      {actionMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          {actionMessage}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!loading && !loadError && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Quote #</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Pickup Date</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const vehicle = firstOf(q.vehicles);
                  return (
                    <tr key={q.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#003b70' }}>{q.quote_number}</td>
                      <td className="px-5 py-3.5 text-gray-700">{q.guest_name} {q.guest_surname}</td>
                      <td className="px-5 py-3.5 text-gray-600">{vehicle?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600">{q.pickup_date ?? '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">R{Number(q.quoted_total).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[q.status]}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          {q.status === 'draft' && (
                            <button
                              onClick={() => updateStatus(q, 'sent')}
                              className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
                            >
                              Send
                            </button>
                          )}
                          {q.status === 'sent' && !q.converted_booking_id && (
                            <button
                              onClick={() => updateStatus(q, 'accepted')}
                              className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
                            >
                              Mark Accepted
                            </button>
                          )}
                          {q.status === 'accepted' && !q.converted_booking_id && (
                            <button
                              onClick={() => convertToBooking(q)}
                              className="text-xs font-medium px-2.5 py-1 rounded-md text-white"
                              style={{ backgroundColor: '#0068da' }}
                            >
                              Convert to Booking
                            </button>
                          )}
                          {q.converted_booking_id && (
                            <span className="text-xs text-gray-400">Converted</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {quotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No quotes yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <AdminModal title="New Quote" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={form.guestFirstName}
                  onChange={(e) => setForm({ ...form, guestFirstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Surname</label>
                <input
                  type="text"
                  value={form.guestSurname}
                  onChange={(e) => setForm({ ...form, guestSurname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="+27 82 123 4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>Select…</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                <select
                  value={form.zoneId}
                  onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>Select…</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
              <input
                type="text"
                value={form.pickupAddress}
                onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
                <input
                  type="date"
                  value={form.pickupDate}
                  onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={form.passengerCount}
                  onChange={(e) => setForm({ ...form, passengerCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isReturnTrip}
                onChange={(e) => setForm({ ...form, isReturnTrip: e.target.checked })}
                className="w-4 h-4"
                style={{ accentColor: '#0068da' }}
              />
              Return trip
            </label>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{formError}</div>
            )}

            <p className="text-xs text-gray-500">
              The quoted price is calculated automatically from the vehicle and zone&apos;s pricing rule.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: '#0068da' }}
            >
              {submitting ? 'Creating…' : 'Create Quote'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
