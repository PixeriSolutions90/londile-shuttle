'use client';

import { BookingLookupForm } from './BookingLookupForm';

export default function ModifyOrCancelBooking() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Modify or Cancel Booking</h1>
      <p className="text-gray-600 mb-8">Find your booking to modify details or cancel it.</p>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <BookingLookupForm />
      </div>
    </div>
  );
}
