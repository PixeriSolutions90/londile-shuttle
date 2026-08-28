'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconX } from '@/components/icons';

interface AgentRow {
  id: string;
  role: 'agent' | 'admin';
  firstName: string | null;
  surname: string | null;
  email: string | null;
  contactNumber: string | null;
  companyName: string | null;
  createdAt: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCompany, setInviteCompany] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const loadAgents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/agents');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load agents.');
        return;
      }
      setAgents(await response.json());
    } catch {
      setLoadError('Network error while loading agents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSubmitting(true);

    try {
      const response = await fetch('/api/admin/agents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, companyName: inviteCompany || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invite.');
        return;
      }

      setInviteSuccess(data.message || `Invite sent to ${inviteEmail}.`);
      setInviteEmail('');
      setInviteCompany('');
      setShowInvite(false);
      loadAgents();
      setTimeout(() => setInviteSuccess(''), 5000);
    } catch {
      setInviteError('Network error while sending invite.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 text-sm mt-1">Agent and admin accounts. Agents are added by invitation only.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          <IconPlus className="w-4 h-4" />
          Invite Agent
        </button>
      </div>

      {inviteSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {inviteSuccess}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading agents…</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!loading && !loadError && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => {
                  const name = [a.firstName, a.surname].filter(Boolean).join(' ');
                  return (
                    <tr key={a.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3.5 text-gray-900 font-medium">
                        {name || <span className="text-gray-400 italic">Invite pending</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{a.email}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: a.role === 'admin' ? '#fef3c7' : '#e8f1fb',
                            color: a.role === 'admin' ? '#92400e' : '#0068da',
                          }}
                        >
                          {a.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{a.companyName || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No agents yet. Invite one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowInvite(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Invite Agent</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name (optional)</label>
                <input
                  type="text"
                  value={inviteCompany}
                  onChange={(e) => setInviteCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {inviteError}
                </div>
              )}

              <p className="text-xs text-gray-500">
                We&apos;ll email them a link to set their own password. Their account is created with agent access immediately.
              </p>

              <button
                type="submit"
                disabled={inviteSubmitting}
                className="w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: '#0068da' }}
              >
                {inviteSubmitting ? 'Sending invite…' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
