'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconEdit } from '@/components/icons';
import AdminModal from './AdminModal';

interface Addon {
  id: string;
  name: string;
  fee: number;
  description: string | null;
  notes: string | null;
  is_active: boolean;
}

const EMPTY_FORM = { name: '', fee: '', description: '', notes: '' };

export default function AddonsPanel() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState<Addon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/addons');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load add-ons.');
        return;
      }
      setAddons(await response.json());
    } catch {
      setLoadError('Network error while loading add-ons.');
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

  const openEdit = (a: Addon) => {
    setEditing(a);
    setForm({ name: a.name, fee: String(a.fee), description: a.description || '', notes: a.notes || '' });
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
        name: form.name,
        fee: Number(form.fee),
        description: form.description || null,
        notes: form.notes || null,
      };

      const response = await fetch('/api/admin/addons', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to save add-on.');
        return;
      }

      setShowForm(false);
      load();
    } catch {
      setFormError('Network error while saving add-on.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (a: Addon) => {
    try {
      if (a.is_active) {
        await fetch('/api/admin/addons', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: a.id }),
        });
      } else {
        await fetch('/api/admin/addons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: a.id, is_active: true }),
        });
      }
      load();
    } catch (error) {
      console.error('Failed to toggle addon status:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{addons.length} add-on{addons.length !== 1 ? 's' : ''} available.</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          <IconPlus className="w-4 h-4" />
          Add Add-on
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
                  <th className="px-5 py-3 font-medium">Fee</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {addons.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-900 font-medium">{a.name}</td>
                    <td className="px-5 py-3 text-gray-600">R{Number(a.fee).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{a.description || '—'}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(a)}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: a.is_active ? '#dcfce7' : '#f3f4f6',
                          color: a.is_active ? '#166534' : '#6b7280',
                        }}
                      >
                        {a.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-gray-600">
                        <IconEdit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {addons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No add-ons yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <AdminModal title={editing ? 'Edit Add-on' : 'Add Add-on'} onClose={() => setShowForm(false)}>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fee (R)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
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

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{formError}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: '#0068da' }}
            >
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Add-on'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
