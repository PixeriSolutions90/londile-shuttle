/**
 * Mock quotes/invoices for the Admin Dashboard UI pass.
 *
 * The `quotes` and `invoices` tables from the build brief don't exist in
 * the database yet (schema reconciliation is still pending), so this
 * mirrors the field names from the brief as a stand-in — same approach
 * used for the Agent Dashboard's mock bookings.
 */

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired';

export interface MockQuote {
  id: string;
  quoteNumber: string;
  clientName: string;
  vehicleName: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDate: string;
  passengerCount: number;
  isReturnTrip: boolean;
  quotedTotal: number;
  currency: 'ZAR';
  status: QuoteStatus;
  createdByAgentName: string | null;
  convertedBookingId: string | null;
  expiresAt: string;
}

export const MOCK_QUOTES: MockQuote[] = [
  {
    id: 'q1',
    quoteNumber: 'QT-1042',
    clientName: 'Corporate Events SA',
    vehicleName: 'Minibus',
    pickupAddress: 'Century City Conference Centre',
    dropoffAddress: 'Cape Town International Airport',
    pickupDate: '2026-09-05',
    passengerCount: 8,
    isReturnTrip: false,
    quotedTotal: 1500,
    currency: 'ZAR',
    status: 'sent',
    createdByAgentName: 'Priya Naidoo',
    convertedBookingId: null,
    expiresAt: '2026-09-01',
  },
  {
    id: 'q2',
    quoteNumber: 'QT-1041',
    clientName: 'Lindiwe Dlamini',
    vehicleName: 'Premium Sedan',
    pickupAddress: 'One&Only Cape Town',
    dropoffAddress: 'Stellenbosch Wine Estate',
    pickupDate: '2026-08-30',
    passengerCount: 2,
    isReturnTrip: true,
    quotedTotal: 1725,
    currency: 'ZAR',
    status: 'accepted',
    createdByAgentName: 'Priya Naidoo',
    convertedBookingId: 'LS-00043',
    expiresAt: '2026-08-28',
  },
  {
    id: 'q3',
    quoteNumber: 'QT-1039',
    clientName: 'Ben Carstens',
    vehicleName: 'Comfort Sedan',
    pickupAddress: 'Camps Bay',
    dropoffAddress: 'Cape Town International Airport',
    pickupDate: '2026-08-20',
    passengerCount: 1,
    isReturnTrip: false,
    quotedTotal: 730,
    currency: 'ZAR',
    status: 'expired',
    createdByAgentName: null,
    convertedBookingId: null,
    expiresAt: '2026-08-19',
  },
  {
    id: 'q4',
    quoteNumber: 'QT-1044',
    clientName: 'Grace Okafor',
    vehicleName: 'Family Minivan',
    pickupAddress: 'Constantia',
    dropoffAddress: 'V&A Waterfront',
    pickupDate: '2026-09-10',
    passengerCount: 5,
    isReturnTrip: false,
    quotedTotal: 1200,
    currency: 'ZAR',
    status: 'draft',
    createdByAgentName: null,
    convertedBookingId: null,
    expiresAt: '2026-09-08',
  },
];

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
