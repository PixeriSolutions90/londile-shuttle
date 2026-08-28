'use client';

import { useState } from 'react';
import OrdersTable from '@/components/agent/OrdersTable';
import BookingDetailPanel from '@/components/agent/BookingDetailPanel';
import { MOCK_AGENT_BOOKINGS, type AgentBookingRecord } from '@/lib/mock/agentBookings';

export default function PendingOrdersPage() {
  const [bookings, setBookings] = useState(MOCK_AGENT_BOOKINGS);
  const [selected, setSelected] = useState<AgentBookingRecord | null>(null);

  const pending = bookings.filter((b) => b.bookingStatus === 'pending_payment');

  const handleSave = (updated: AgentBookingRecord) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelected(updated);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bookings awaiting payment. {pending.length} order{pending.length !== 1 ? 's' : ''} need attention.
        </p>
      </div>

      <OrdersTable bookings={pending} onRowClick={setSelected} />

      {selected && (
        <BookingDetailPanel key={selected.id} booking={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      )}
    </div>
  );
}
