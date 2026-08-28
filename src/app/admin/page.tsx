'use client';

import { useState } from 'react';
import { MOCK_QUOTES, type MockQuote, type QuoteStatus } from '@/lib/mock/adminQuotesInvoices';

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  expired: 'bg-red-50 text-red-700',
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState(MOCK_QUOTES);
  const [actionMessage, setActionMessage] = useState('');

  const updateStatus = (id: string, status: QuoteStatus, message: string) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    setActionMessage(message);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const convertToBooking = (q: MockQuote) => {
    // NOTE: mock-only — a real conversion would insert into `bookings` and
    // set quotes.converted_booking_id, per the build brief.
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === q.id ? { ...quote, convertedBookingId: 'LS-PENDING' } : quote))
    );
    setActionMessage(`${q.quoteNumber} converted to a booking (mock).`);
    setTimeout(() => setActionMessage(''), 3000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-500 text-sm mt-1">
          All client quotes. {quotes.length} on record.
        </p>
      </div>

      {actionMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          {actionMessage}
        </div>
      )}

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
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5 font-semibold" style={{ color: '#003b70' }}>{q.quoteNumber}</td>
                  <td className="px-5 py-3.5 text-gray-700">{q.clientName}</td>
                  <td className="px-5 py-3.5 text-gray-600">{q.vehicleName}</td>
                  <td className="px-5 py-3.5 text-gray-600">{q.pickupDate}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">R{q.quotedTotal.toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      {q.status === 'draft' && (
                        <button
                          onClick={() => updateStatus(q.id, 'sent', `${q.quoteNumber} sent to ${q.clientName}.`)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
                        >
                          Send
                        </button>
                      )}
                      {q.status === 'sent' && !q.convertedBookingId && (
                        <button
                          onClick={() => updateStatus(q.id, 'accepted', `${q.quoteNumber} marked accepted.`)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
                        >
                          Mark Accepted
                        </button>
                      )}
                      {q.status === 'accepted' && !q.convertedBookingId && (
                        <button
                          onClick={() => convertToBooking(q)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md text-white"
                          style={{ backgroundColor: '#0068da' }}
                        >
                          Convert to Booking
                        </button>
                      )}
                      {q.convertedBookingId && (
                        <span className="text-xs text-gray-400">→ {q.convertedBookingId}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
