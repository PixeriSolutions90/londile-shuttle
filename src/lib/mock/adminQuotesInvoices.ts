/**
 * Mock invoices for the Admin Dashboard UI pass.
 *
 * The `invoices` table now exists for real (see migration 007), but there's
 * still no invoice-GENERATION flow (no PDF generation, nothing writes rows
 * to it yet), so the Admin Invoices page stays on this mock data until that
 * feature is built. Quotes moved off mock data in the same migration pass —
 * see /api/quotes and src/app/admin/page.tsx.
 */

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  bookingNumber: string;
  clientName: string;
  amount: number;
  currency: 'ZAR';
  issuedAt: string;
  createdByAgentName: string | null;
}

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2026-0031',
    bookingNumber: 'LS-00031',
    clientName: 'Michael van der Berg',
    amount: 1100,
    currency: 'ZAR',
    issuedAt: '2026-08-18',
    createdByAgentName: 'Priya Naidoo',
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2026-0028',
    bookingNumber: 'LS-00028',
    clientName: 'Sarah Botha',
    amount: 1500,
    currency: 'ZAR',
    issuedAt: '2026-08-12',
    createdByAgentName: null,
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV-2026-0039',
    bookingNumber: 'LS-00039',
    clientName: 'Aisha Adams',
    amount: 1550,
    currency: 'ZAR',
    issuedAt: '2026-08-22',
    createdByAgentName: null,
  },
];
