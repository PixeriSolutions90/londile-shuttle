'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconEdit } from '@/components/icons';
import AdminModal from './AdminModal';

interface PricingRule {
  id: string;
  vehicle_id: string;
  zone_id: string;
  base_fee: number;
  per_km_rate: number | null;
  return_trip_multiplier: number;
  is_active: boolean;
  notes: string | null;
  vehicles: { name: string; vehicle_class: string } | { name: string; vehicle_class: string }[] | null;
  zones: { name: string; is_international: boolean } | { name: string; is_international: boolean }[] | null;
}

interface Option {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  vehicle_id: '',
  zone_id: '',
  base_fee: '',
  per_km_rate: '',
  return_trip_multiplier: '1.5',
  notes: '',
};

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default function PricingPanel() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [vehicles, setVehicles] = useState<Option[]>([]);
  const [zones, setZones] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [rulesRes, vehiclesRes, zonesRes] = await Promise.all([
        fetch('/api/admin/pricing'),
        fetch('/api/admin/vehicles'),
        fetch('/api/admin/zones'),
      ]);

      if (!rulesRes.ok) {
        const data = await rulesRes.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load pricing rules.');
        return;
      }

      setRules(await rulesRes.json());
      if (vehiclesRes.ok) setVehicles((await vehiclesRes.json()).map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })));
      if (zonesRes.ok) setZones((await zonesRes.json()).map((z: { id: string; name: string }) => ({ id: z.id, name: z.name })));
    } catch {
      setLoadError('Network error while loading pricing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (r: PricingRule) => {
    setEditing(r);
    setForm({
      vehicle_id: r.vehicle_id,
      zone_id: r.zone_id,
      base_fee: String(r.base_fee),
      per_km_rate: r.per_km_rate != null ? String(r.per_km_rate) : '',
      return_trip_multiplier: String(r.return_trip_multiplier),
      notes: r.notes || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        vehicle_id: form.vehicle_id,
        zone_id: form.zone_id,
        base_fee: Number(form.base_fee),
        per_km_rate: form.per_km_rate ? Number(form.per_km_rate) : null,
        return_trip_multiplier: Number(form.return_trip_multiplier),
        notes: form.notes || null,
      };

      const response = await fetch('/api/admin/pricing', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to save pricing rule.');
        return;
      }

      setShowForm(false);
      load();
    } catch {
      setFormError('Network error while saving pricing rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (r: PricingRule) => {
    try {
      if (r.is_active) {
        await fetch('/api/admin/pricing', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: r.id }),
        });
      } else {
        await fetch('/api/admin/pricing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: r.id, is_active: true }),
        });
      }
      load();
    } catch (error) {
      console.error('Failed to toggle pricing rule status:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{rules.length} pricing rule{rules.length !== 1 ? 's' : ''}.</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          <IconPlus className="w-4 h-4" />
          Add Pricing Rule
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!loading && !loadError && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Zone</th>
                  <th className="px-5 py-3 font-medium">Base Fee</th>
                  <th className="px-5 py-3 font-medium">Per KM</th>
                  <th className="px-5 py-3 font-medium">Return ×</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const vehicle = firstOf(r.vehicles);
                  const zone = firstOf(r.zones);
                  return (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-gray-900 font-medium">{vehicle?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{zone?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">R{Number(r.base_fee).toFixed(2)}</td>
                      <td className="px-5 py-3 text-gray-600">{r.per_km_rate ? `R${Number(r.per_km_rate).toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{r.return_trip_multiplier}×</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleActive(r)}
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: r.is_active ? '#dcfce7' : '#f3f4f6',
                            color: r.is_active ? '#166534' : '#6b7280',
                          }}
                        >
                          {r.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-gray-600">
                          <IconEdit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No pricing rules yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <AdminModal title={editing ? 'Edit Pricing Rule' : 'Add Pricing Rule'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
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
                  value={form.zone_id}
                  onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="" disabled>Select…</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Fee (R)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.base_fee}
                  onChange={(e) => setForm({ ...form, base_fee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Per KM (R)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.per_km_rate}
                  onChange={(e) => setForm({ ...form, per_km_rate: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Return ×</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={form.return_trip_multiplier}
                  onChange={(e) => setForm({ ...form, return_trip_multiplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{formError}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: '#0068da' }}
            >
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Pricing Rule'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
