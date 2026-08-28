/**
 * Mock booking records for the Agent Dashboard UI pass.
 *
 * Field names follow the schema described in the Londile build brief
 * (docs/database-schema.dbml) — booking_status, contact_full_name, etc.
 * These do NOT exist in the current Supabase schema yet (which uses
 * guest_name/guest_contact and a different status enum). This file is a
 * deliberate stand-in until the dashboard is wired to real data and the
 * schema is reconciled — see the "UI first, mock data" decision.
 */

export type BookingStatus = 'pending_payment' | 'confirmed' | 'modified' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type BookingSource = 'public' | 'agent';

export interface AgentBookingRecord {
  id: string;
  bookingNumber: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  vehicleName: string;
  zoneName: string;
  isInternational: boolean;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDate: string;
  pickupTime: string;
  isReturnTrip: boolean;
  returnDate: string | null;
  returnTime: string | null;
  passengerCount: number;
  specialInstructions: string;
  baseFare: number;
  addonsFee: number;
  totalFare: number;
  currency: 'ZAR';
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  source: BookingSource;
  createdByAgentId: string | null;
  createdAt: string;
}

export const MOCK_AGENT_BOOKINGS: AgentBookingRecord[] = [
  {
    id: '1',
    bookingNumber: 'LS-00042',
    contactFullName: 'Naledi Khumalo',
    contactEmail: 'naledi.k@example.com',
    contactPhone: '+27821234567',
    vehicleName: 'Comfort Sedan',
    zoneName: 'Cape Town Local',
    isInternational: false,
    pickupAddress: 'Cape Town International Airport, Matroosfontein',
    dropoffAddress: '14 Long Street, Cape Town City Centre',
    pickupDate: '2026-08-29',
    pickupTime: '14:30',
    isReturnTrip: false,
    returnDate: null,
    returnTime: null,
    passengerCount: 2,
    specialInstructions: 'Two large suitcases, please arrange a spacious boot.',
    baseFare: 730,
    addonsFee: 0,
    totalFare: 730,
    currency: 'ZAR',
    bookingStatus: 'pending_payment',
    paymentStatus: 'pending',
    source: 'public',
    createdByAgentId: null,
    createdAt: '2026-08-24T09:12:00Z',
  },
  {
    id: '2',
    bookingNumber: 'LS-00043',
    contactFullName: 'Johan Pretorius',
    contactEmail: 'johan.p@example.com',
    contactPhone: '+27835557890',
    vehicleName: 'Premium Sedan',
    zoneName: 'Cape Town Local',
    isInternational: false,
    pickupAddress: '22 Kloof Street, Gardens',
    dropoffAddress: 'V&A Waterfront, Cape Town',
    pickupDate: '2026-08-30',
    pickupTime: '09:00',
    isReturnTrip: true,
    returnDate: '2026-08-30',
    returnTime: '18:00',
    passengerCount: 3,
    specialInstructions: '',
    baseFare: 950,
    addonsFee: 100,
    totalFare: 1575,
    currency: 'ZAR',
    bookingStatus: 'pending_payment',
    paymentStatus: 'pending',
    source: 'public',
    createdByAgentId: null,
    createdAt: '2026-08-24T11:47:00Z',
  },
  {
    id: '3',
    bookingNumber: 'LS-00039',
    contactFullName: 'Aisha Adams',
    contactEmail: 'aisha.adams@example.com',
    contactPhone: '+27718889900',
    vehicleName: 'Family Minivan',
    zoneName: 'Western Cape Regional',
    isInternational: false,
    pickupAddress: '5 Church Street, Stellenbosch',
    dropoffAddress: 'Cape Town International Airport, Matroosfontein',
    pickupDate: '2026-08-22',
    pickupTime: '06:15',
    isReturnTrip: false,
    returnDate: null,
    returnTime: null,
    passengerCount: 5,
    specialInstructions: 'Baby seat required, booked as add-on.',
    baseFare: 1400,
    addonsFee: 150,
    totalFare: 1550,
    currency: 'ZAR',
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    source: 'public',
    createdByAgentId: null,
    createdAt: '2026-08-20T15:03:00Z',
  },
  {
    id: '4',
    bookingNumber: 'LS-00031',
    contactFullName: 'Michael van der Berg',
    contactEmail: 'michael.vdb@example.com',
    contactPhone: '+27823334455',
    vehicleName: 'Luxury SUV',
    zoneName: 'Cape Town Local',
    isInternational: false,
    pickupAddress: 'One&Only Cape Town, V&A Waterfront',
    dropoffAddress: 'Cape Town International Airport, Matroosfontein',
    pickupDate: '2026-08-18',
    pickupTime: '11:00',
    isReturnTrip: false,
    returnDate: null,
    returnTime: null,
    passengerCount: 4,
    specialInstructions: '',
    baseFare: 1100,
    addonsFee: 0,
    totalFare: 1100,
    currency: 'ZAR',
    bookingStatus: 'completed',
    paymentStatus: 'paid',
    source: 'agent',
    createdByAgentId: 'agent-priya-naidoo',
    createdAt: '2026-08-15T08:30:00Z',
  },
  {
    id: '5',
    bookingNumber: 'LS-00028',
    contactFullName: 'Sarah Botha',
    contactEmail: 'sarah.botha@example.com',
    contactPhone: '+27847778899',
    vehicleName: 'Minibus',
    zoneName: 'Cape Town Local',
    isInternational: false,
    pickupAddress: 'Century City Conference Centre',
    dropoffAddress: 'Cape Town International Airport, Matroosfontein',
    pickupDate: '2026-08-12',
    pickupTime: '16:45',
    isReturnTrip: false,
    returnDate: null,
    returnTime: null,
    passengerCount: 8,
    specialInstructions: 'Corporate group booking — 8 conference delegates.',
    baseFare: 1500,
    addonsFee: 0,
    totalFare: 1500,
    currency: 'ZAR',
    bookingStatus: 'completed',
    paymentStatus: 'paid',
    source: 'public',
    createdByAgentId: null,
    createdAt: '2026-08-09T13:20:00Z',
  },
  {
    id: '6',
    bookingNumber: 'LS-00044',
    contactFullName: 'Thabo Mokoena',
    contactEmail: 'thabo.m@example.com',
    contactPhone: '+27829990011',
    vehicleName: 'Comfort Sedan',
    zoneName: 'Cape Town Local',
    isInternational: false,
    pickupAddress: '3 Kildare Road, Newlands',
    dropoffAddress: 'Cape Town International Airport, Matroosfontein',
    pickupDate: '2026-08-31',
    pickupTime: '05:30',
    isReturnTrip: false,
    returnDate: null,
    returnTime: null,
    passengerCount: 1,
    specialInstructions: 'Early morning flight, please confirm driver 30 mins prior.',
    baseFare: 730,
    addonsFee: 0,
    totalFare: 730,
    currency: 'ZAR',
    bookingStatus: 'pending_payment',
    paymentStatus: 'failed',
    source: 'public',
    createdByAgentId: null,
    createdAt: '2026-08-25T07:02:00Z',
  },
];

export const CURRENT_MOCK_AGENT = {
  id: 'agent-priya-naidoo',
  fullName: 'Priya Naidoo',
  email: 'priya.naidoo@londileshuttle.co.za',
};
