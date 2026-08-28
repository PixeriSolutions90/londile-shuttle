'use client';

import type { AgentBookingRecord, BookingStatus, PaymentStatus } from '@/lib/mock/agentBookings';

interface OrdersTableProps {
  bookings: AgentBookingRecord[];
  onRowClick: (booking: AgentBookingRecord) => void;
}

const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  pending_payment: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  modified: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-green-50 text-green-700',
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-purple-50 text-purple-700',
};

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${className}`}>
      {label.replace('_', ' ')}
    </span>
  );
}

export default function OrdersTable({ bookings, onRowClick }: OrdersTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500 text-sm">
        No orders in this view.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Booking #</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Pickup</th>
              <th className="px-5 py-3 font-medium">Vehicle</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr
                key={b.id}
                onClick={() => onRowClick(b)}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3.5 font-semibold" style={{ color: '#003b70' }}>{b.bookingNumber}</td>
                <td className="px-5 py-3.5 text-gray-700">{b.contactFullName}</td>
                <td className="px-5 py-3.5 text-gray-600">{b.pickupDate} · {b.pickupTime}</td>
                <td className="px-5 py-3.5 text-gray-600">{b.vehicleName}</td>
                <td className="px-5 py-3.5 font-medium text-gray-900">R{b.totalFare.toFixed(2)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge label={b.paymentStatus} className={PAYMENT_STATUS_STYLES[b.paymentStatus]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {bookings.map((b) => (
          <button
            key={b.id}
            onClick={() => onRowClick(b)}
            className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm" style={{ color: '#003b70' }}>{b.bookingNumber}</span>
              <StatusBadge label={b.bookingStatus} className={BOOKING_STATUS_STYLES[b.bookingStatus]} />
            </div>
            <p className="text-sm text-gray-700 mb-1">{b.contactFullName}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{b.vehicleName} · {b.pickupDate} {b.pickupTime}</span>
              <span className="font-medium text-gray-900">R{b.totalFare.toFixed(2)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
