'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Turnstile from 'react-turnstile';
import { BookingFormSchema, type BookingFormValues, type BookingFormInput } from '@/lib/schemas/booking';
import AddressAutocomplete from './AddressAutocomplete';
import { QUOTE_SESSION_KEY, type QuoteResponse, type VehicleQuote } from '@/lib/types/quote';

interface Addon {
  id: string;
  name: string;
  fee: number;
  description?: string;
}

type Step = 'vehicle' | 'personal' | 'payment';

const DEFAULT_VALUES: BookingFormInput = {
  guestFirstName: '',
  guestSurname: '',
  contactNumber: '',
  email: '',
  address: '',
  pickupDate: '',
  pickupTime: '10:00',
  isReturnTrip: false,
  returnDate: '',
  returnTime: '',
  passengers: 1,
  selectedAddonIds: [],
  specialRequests: '',
  agreeToTerms: false,
  agreeToPrivacy: false,
};

export default function BookingSouthAfrica() {
  const [step, setStep] = useState<Step>('vehicle');
  const [quotes, setQuotes] = useState<VehicleQuote[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteError, setQuoteError] = useState('');

  const selectedQuote = quotes.find((q) => q.vehicleId === selectedVehicleId) ?? null;

  const [bookingDetails, setBookingDetails] = useState<BookingFormValues | null>(null);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBookingNumber, setConfirmedBookingNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const isReturnTrip = watch('isReturnTrip');
  const selectedAddonIds = watch('selectedAddonIds');

  const toggleAddon = (id: string) => {
    const set = new Set(selectedAddonIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    setValue('selectedAddonIds', Array.from(set), { shouldValidate: true });
  };

  const handleReturnTripChange = (checked: boolean) => {
    setValue('isReturnTrip', checked, { shouldValidate: true });
    if (!checked) {
      setValue('returnDate', '');
      setValue('returnTime', '');
    }
  };

  const fetchQuote = async (passengerCount: number, isReturn: boolean) => {
    setQuoteError('');
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerCount, isReturnTrip: isReturn }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setQuoteError(data.message || 'Could not load pricing right now.');
        return;
      }

      const quote: QuoteResponse = await response.json();
      setQuotes(quote.quotes);
    } catch {
      setQuoteError('Network error while loading pricing.');
    }
  };

  // On mount: use the quote from the homepage widget if the guest arrived
  // with one already (sessionStorage), otherwise fetch a default quote
  // (1 passenger, one-way) so /book still works when visited directly.
  useEffect(() => {
    async function init() {
      try {
        const stored = sessionStorage.getItem(QUOTE_SESSION_KEY);
        if (stored) {
          const quote: QuoteResponse = JSON.parse(stored);
          setQuotes(quote.quotes);
        } else {
          await fetchQuote(1, false);
        }
      } catch {
        await fetchQuote(1, false);
      }

      try {
        const addonsRes = await fetch('/api/addons/list');
        if (addonsRes.ok) {
          setAddons(await addonsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch addons:', error);
      } finally {
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passengers = watch('passengers');

  // Keep displayed fares accurate: re-quote whenever the return-trip toggle
  // or passenger count changes in Step 2, skipping the very first render
  // (the mount effect above already loaded an initial quote).
  const isFirstQuoteRender = useRef(true);
  useEffect(() => {
    if (isFirstQuoteRender.current) {
      isFirstQuoteRender.current = false;
      return;
    }
    fetchQuote(passengers || 1, isReturnTrip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReturnTrip, passengers]);

  const buildApiPayload = (data: BookingFormValues) => {
    const pickupISO = new Date(`${data.pickupDate}T${data.pickupTime}`).toISOString();
    const returnISO = data.isReturnTrip && data.returnDate && data.returnTime
      ? new Date(`${data.returnDate}T${data.returnTime}`).toISOString()
      : null;

    return {
      guestFirstName: data.guestFirstName,
      guestSurname: data.guestSurname,
      contactNumber: data.contactNumber,
      email: data.email,
      address: data.address,
      tripStartDate: pickupISO,
      tripStartTime: data.pickupTime,
      tripEndDate: pickupISO,
      tripEndTime: data.pickupTime,
      isReturnTrip: data.isReturnTrip,
      returnDate: returnISO,
      returnTime: data.isReturnTrip ? data.returnTime : null,
      passengerCount: data.passengers,
      addonIds: data.selectedAddonIds,
      specialRequests: data.specialRequests,
      agreeToTerms: data.agreeToTerms,
      agreeToPrivacy: data.agreeToPrivacy,
    };
  };

  const onPersonalDetailsValid = (data: BookingFormValues) => {
    setBookingDetails(data);
    setStep('payment');
  };

  const handleConfirmAndPay = async () => {
    if (!bookingDetails) return;

    if (!turnstileToken) {
      setSubmitErrors({ turnstile: 'Please complete the bot verification' });
      return;
    }

    setSubmitting(true);
    setSubmitErrors({});

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildApiPayload(bookingDetails), turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitErrors({ submit: data.message || 'Booking failed. Please try again.' });
        return;
      }

      setConfirmedBookingNumber(data.bookingNumber);
    } catch (error) {
      setSubmitErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#0068da' }}></div>
        <p className="text-gray-600 mt-4">Loading vehicles...</p>
      </div>
    );
  }

  // Booking confirmed screen
  if (confirmedBookingNumber) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#e8f1fb' }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#0068da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed</h1>
        <p className="text-gray-600 mb-6">
          Your booking number is <span className="font-semibold" style={{ color: '#003b70' }}>{confirmedBookingNumber}</span>.
          A confirmation has been sent to your contact number.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: '#003b70' }}
        >
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step 1: Choose Vehicle */}
      {step === 'vehicle' && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Choose your ride</h1>
          <p className="text-gray-600 mb-6 sm:mb-8">Your ride, your choice! Take a look and pick the perfect one.</p>

          {quoteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {quoteError}
            </div>
          )}

          {quotes.length === 0 && !quoteError && (
            <p className="text-gray-500 text-sm">No vehicles available right now. Please try again shortly.</p>
          )}

          <div className="grid gap-4 sm:gap-6">
            {quotes.map((quote) => (
              <div
                key={quote.vehicleId}
                className={`border-2 rounded-lg p-4 sm:p-6 cursor-pointer transition-all ${
                  selectedVehicleId === quote.vehicleId
                    ? 'bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                style={selectedVehicleId === quote.vehicleId ? { borderColor: '#0068da' } : undefined}
                onClick={() => setSelectedVehicleId(quote.vehicleId)}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
                  <div className="w-full h-40 sm:h-32 sm:w-48 sm:flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                    {quote.imageUrl ? (
                      <img src={quote.imageUrl} alt={quote.vehicleName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {quote.vehicleName} ({quote.maxPassengers} seater)
                    </h2>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-gray-600 text-sm">
                        Max {quote.maxPassengers} Persons
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        {quote.maxBags} large bags
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-4 sm:h-32">
                    <div>
                      <p className="text-sm text-gray-600">Fee</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">R{quote.totalFare.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedVehicleId(quote.vehicleId);
                        setStep('personal');
                      }}
                      className="text-white px-5 sm:px-6 py-2 rounded-lg font-medium transition-colors shrink-0"
                      style={{ backgroundColor: '#003b70' }}
                    >
                      Select Car
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Personal Details */}
      {step === 'personal' && selectedQuote && (
        <div>
          <button
            onClick={() => setStep('vehicle')}
            className="flex items-center font-medium mb-6"
            style={{ color: '#0068da' }}
          >
            ← Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Selected Vehicle Preview */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <h3 className="font-bold text-gray-900 mb-4">{selectedQuote.vehicleName}</h3>
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  {selectedQuote.imageUrl ? (
                    <img src={selectedQuote.imageUrl} alt={selectedQuote.vehicleName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Passengers:</span> {selectedQuote.maxPassengers}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Bags:</span> {selectedQuote.maxBags}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {isReturnTrip ? 'Estimated Fee (return trip)' : 'Estimated Fee'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">R{selectedQuote.totalFare.toFixed(2)}</p>
                  {quoteError && <p className="text-xs text-red-500 mt-1">{quoteError}</p>}
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <form onSubmit={handleSubmit(onPersonalDetailsValid)} noValidate className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-6 sm:space-y-8">
              {/* Your Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      {...register('guestFirstName')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.guestFirstName ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="John"
                    />
                    {errors.guestFirstName && <p className="text-xs text-red-500 mt-1">{errors.guestFirstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Surname</label>
                    <input
                      type="text"
                      {...register('guestSurname')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.guestSurname ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="Smith"
                    />
                    {errors.guestSurname && <p className="text-xs text-red-500 mt-1">{errors.guestSurname.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      {...register('contactNumber')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.contactNumber ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="+27 82 123 4567"
                    />
                    {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Trip Details</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <AddressAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="123 Main Street, Cape Town, 8000"
                        wrapperClassName={`w-full px-3 py-2 border rounded-lg ${errors.address ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    )}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      {...register('pickupDate')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.pickupDate ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {errors.pickupDate && <p className="text-xs text-red-500 mt-1">{errors.pickupDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      {...register('pickupTime')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.pickupTime ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {errors.pickupTime && <p className="text-xs text-red-500 mt-1">{errors.pickupTime.message}</p>}
                  </div>
                </div>

                {isReturnTrip && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Return Date</label>
                      <input
                        type="date"
                        {...register('returnDate')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.returnDate ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      />
                      {errors.returnDate && <p className="text-xs text-red-500 mt-1">{errors.returnDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Return Time</label>
                      <input
                        type="time"
                        {...register('returnTime')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${errors.returnTime ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      />
                      {errors.returnTime && <p className="text-xs text-red-500 mt-1">{errors.returnTime.message}</p>}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
                  <label className="text-sm font-medium text-gray-700">Add return trip</label>
                  <button
                    type="button"
                    onClick={() => handleReturnTripChange(!isReturnTrip)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ backgroundColor: isReturnTrip ? '#0068da' : '#d1d5db' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isReturnTrip ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. of Passengers</label>
                  <select
                    {...register('passengers', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  {errors.passengers && <p className="text-xs text-red-500 mt-1">{errors.passengers.message}</p>}
                </div>

                {addons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Additional Request</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {addons.map((addon) => (
                        <label key={addon.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedAddonIds.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: '#0068da' }}
                          />
                          <span className="text-gray-700">{addon.name} (R{addon.fee})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Instruction</label>
                  <textarea
                    {...register('specialRequests')}
                    placeholder="Please enter note"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none ${errors.specialRequests ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                  />
                  {errors.specialRequests && <p className="text-xs text-red-500 mt-1">{errors.specialRequests.message}</p>}
                </div>
              </div>

              {/* Consent */}
              <div className="space-y-2 pt-6 border-t border-gray-100">
                <label className="flex items-start gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    {...register('agreeToTerms')}
                    className="mt-0.5 w-4 h-4"
                    style={{ accentColor: '#0068da' }}
                  />
                  I agree to the{' '}
                  <a href="/policies/terms" target="_blank" className="underline" style={{ color: '#0068da' }}>Terms &amp; Conditions</a>
                </label>
                {errors.agreeToTerms && <p className="text-xs text-red-500">{errors.agreeToTerms.message}</p>}

                <label className="flex items-start gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    {...register('agreeToPrivacy')}
                    className="mt-0.5 w-4 h-4"
                    style={{ accentColor: '#0068da' }}
                  />
                  I agree to the{' '}
                  <a href="/policies/privacy" target="_blank" className="underline" style={{ color: '#0068da' }}>Privacy Policy</a>
                </label>
                {errors.agreeToPrivacy && <p className="text-xs text-red-500">{errors.agreeToPrivacy.message}</p>}
              </div>

              <button
                type="submit"
                className="w-full text-white font-medium py-3 rounded-lg transition-colors"
                style={{ backgroundColor: '#003b70' }}
              >
                Book Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && selectedQuote && bookingDetails && (
        <div>
          <button
            onClick={() => setStep('personal')}
            className="flex items-center font-medium mb-6"
            style={{ color: '#0068da' }}
          >
            ← Back
          </button>

          <div className="max-w-lg mx-auto bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment</h1>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-x-2">
                <span className="text-gray-600">Vehicle</span>
                <span className="font-medium text-gray-900">{selectedQuote.vehicleName}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-2">
                <span className="text-gray-600">Guest</span>
                <span className="font-medium text-gray-900">{bookingDetails.guestFirstName} {bookingDetails.guestSurname}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-2">
                <span className="text-gray-600">Pickup</span>
                <span className="font-medium text-gray-900">{bookingDetails.pickupDate} at {bookingDetails.pickupTime}</span>
              </div>
              {bookingDetails.isReturnTrip && (
                <div className="flex flex-wrap justify-between gap-x-2">
                  <span className="text-gray-600">Return</span>
                  <span className="font-medium text-gray-900">{bookingDetails.returnDate} at {bookingDetails.returnTime}</span>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-x-2">
                <span className="text-gray-600">Passengers</span>
                <span className="font-medium text-gray-900">{bookingDetails.passengers}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold" style={{ color: '#003b70' }}>R{selectedQuote.totalFare.toFixed(2)}</span>
              </div>
            </div>

            {/* Turnstile widget has a fixed internal width; allow horizontal
                scroll instead of clipping on very narrow viewports (<300px). */}

            {/* Turnstile Bot Protection */}
            <div className="flex justify-center overflow-x-auto">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                action="booking"
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => {
                  setTurnstileToken('');
                  setSubmitErrors((prev) => ({ ...prev, turnstile: 'Bot verification failed' }));
                }}
                theme="light"
              />
            </div>
            {submitErrors.turnstile && <p className="text-sm text-red-500 text-center">{submitErrors.turnstile}</p>}
            {submitErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{submitErrors.submit}</p>
              </div>
            )}

            <button
              onClick={handleConfirmAndPay}
              disabled={submitting}
              className="w-full text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#003b70' }}
            >
              {submitting ? 'Processing...' : 'Confirm & Pay'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Payment is confirmed on pickup. Online card payments are coming soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
