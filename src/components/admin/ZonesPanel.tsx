'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconEdit } from '@/components/icons';
import AdminModal from './AdminModal';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  is_international: boolean;
  country_code: string | null;
  is_active: boolean;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  is_international: false,
  country_code: '',
};

export default function ZonesPanel() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState<Zone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/zones');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load zones.');
        return;
      }
      setZones(await response.json());
    } catch {
      setLoadError('Network error while loading zones.');
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

  const openEdit = (z: Zone) => {
    setEditing(z);
    setForm({
      name: z.name,
      description: z.description || '',
      is_international: z.is_international,
      country_code: z.country_code || '',
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
      const response = await fetch('/api/admin/zones', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to save zone.');
        return;
      }

      setShowForm(false);
      load();
    } catch {
      setFormError('Network error while saving zone.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (z: Zone) => {
    try {
      if (z.is_active) {
        await fetch('/api/admin/zones', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: z.id }),
        });
      } else {
        await fetch('/api/admin/zones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: z.id, is_active: true }),
        });
      }
      load();
    } catch (error) {
      console.error('Failed to toggle zone status:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{zones.length} zone{zones.length !== 1 ? 's' : ''} configured.</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          <IconPlus className="w-4 h-4" />
          Add Zone
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
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-900 font-medium">{z.name}</td>
                    <td className="px-5 py-3 text-gray-600">{z.is_international ? 'International' : 'Local'}</td>
                    <td className="px-5 py-3 text-gray-600">{z.country_code || '—'}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(z)}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: z.is_active ? '#dcfce7' : '#f3f4f6',
                          color: z.is_active ? '#166534' : '#6b7280',
                        }}
                      >
                        {z.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openEdit(z)} className="text-gray-400 hover:text-gray-600">
                        <IconEdit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {zones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No zones yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <AdminModal title={editing ? 'Edit Zone' : 'Add Zone'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cape Town Local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
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
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_international}
                onChange={(e) => setForm({ ...form, is_international: e.target.checked })}
                className="w-4 h-4"
                style={{ accentColor: '#0068da' }}
              />
              International zone
            </label>
            {form.is_international && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                <input
                  type="text"
                  value={form.country_code}
                  onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  placeholder="NA"
                  maxLength={2}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{formError}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: '#0068da' }}
            >
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Zone'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
