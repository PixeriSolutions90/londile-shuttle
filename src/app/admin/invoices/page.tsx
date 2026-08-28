'use client';

import { MOCK_INVOICES } from '@/lib/mock/adminQuotesInvoices';

export default function AdminInvoicesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-500 text-sm mt-1">
          {MOCK_INVOICES.length} invoice{MOCK_INVOICES.length !== 1 ? 's' : ''} on record.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Booking #</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Issued</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Created By</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5 font-semibold" style={{ color: '#003b70' }}>{inv.invoiceNumber}</td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.bookingNumber}</td>
                  <td className="px-5 py-3.5 text-gray-700">{inv.clientName}</td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.issuedAt}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">R{inv.amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-gray-500">{inv.createdByAgentName ?? 'Public booking'}</td>
                  <td className="px-5 py-3.5">
                    <button
                      disabled
                      title="PDF generation isn't wired up yet"
                      className="text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200 text-gray-400 cursor-not-allowed"
                    >
                      Download PDF
                    </button>
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
