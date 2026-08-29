'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconEdit } from '@/components/icons';
import AdminModal from './AdminModal';

interface Vehicle {
  id: string;
  name: string;
  description: string | null;
  vehicle_class: string;
  max_passengers: number;
  max_bags: number;
  image_url: string | null;
  registration_number: string | null;
  is_active: boolean;
}

const VEHICLE_CLASSES = ['economy', 'comfort', 'luxury', 'van', 'minibus'];

const EMPTY_FORM = {
  name: '',
  description: '',
  vehicle_class: 'comfort',
  max_passengers: 4,
  max_bags: 2,
  image_url: '',
  registration_number: '',
};

export default function VehiclesPanel() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/vehicles');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load vehicles.');
        return;
      }
      setVehicles(await response.json());
    } catch {
      setLoadError('Network error while loading vehicles.');
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

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      name: v.name,
      description: v.description || '',
      vehicle_class: v.vehicle_class,
      max_passengers: v.max_passengers,
      max_bags: v.max_bags,
      image_url: v.image_url || '',
      registration_number: v.registration_number || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = editing ? { id: editing.id, ...form } : form;
      const response = await fetch('/api/admin/vehicles', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to save vehicle.');
        return;
      }

      setShowForm(false);
      load();
    } catch {
      setFormError('Network error while saving vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (v: Vehicle) => {
    try {
      if (v.is_active) {
        await fetch('/api/admin/vehicles', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: v.id }),
        });
      } else {
        await fetch('/api/admin/vehicles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: v.id, is_active: true }),
        });
      }
      load();
    } catch (error) {
      console.error('Failed to toggle vehicle status:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in the fleet.</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          <IconPlus className="w-4 h-4" />
          Add Vehicle
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
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Class</th>
                  <th className="px-5 py-3 font-medium">Passengers</th>
                  <th className="px-5 py-3 font-medium">Bags</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-900 font-medium">{v.name}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{v.vehicle_class}</td>
                    <td className="px-5 py-3 text-gray-600">{v.max_passengers}</td>
                    <td className="px-5 py-3 text-gray-600">{v.max_bags}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(v)}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: v.is_active ? '#dcfce7' : '#f3f4f6',
                          color: v.is_active ? '#166534' : '#6b7280',
                        }}
                      >
                        {v.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-gray-600">
                        <IconEdit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No vehicles yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <AdminModal title={editing ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={form.vehicle_class}
                  onChange={(e) => setForm({ ...form, vehicle_class: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {VEHICLE_CLASSES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration #</label>
                <input
                  type="text"
                  value={form.registration_number}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={form.max_passengers}
                  onChange={(e) => setForm({ ...form, max_passengers: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Bags</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_bags}
                  onChange={(e) => setForm({ ...form, max_bags: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
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
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
