'use client';

import { useState, useEffect } from 'react';

interface Vehicle {
  id: string;
  name: string;
  vehicle_class: string;
  max_passengers: number;
  max_bags: number;
  image_url?: string;
}

export default function BookingSouthAfrica() {
  const [step, setStep] = useState<'vehicle' | 'details'>('vehicle');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    pickupDate: '',
    pickupTime: '10:00',
    dropoffDate: '',
    dropoffTime: '14:00',
    isReturnTrip: false,
    returnDate: '',
    returnTime: '',
    passengers: 1,
    addBabySeat: false,
    addTrailer: false,
    specialInstructions: '',
  });

  // Fetch vehicles on mount
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch('/api/admin/vehicles');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.filter((v: Vehicle) => v.vehicle_class === 'comfort'));
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, []);

  const handleDateChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReturnTripChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isReturnTrip: checked,
      returnDate: checked ? '' : '',
      returnTime: checked ? '' : '',
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step 1: Choose Vehicle */}
      {step === 'vehicle' && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose your ride</h1>
          <p className="text-gray-600 mb-8">Your ride, your choice! Take a look and pick the perfect one.</p>

          <div className="grid gap-6">
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedVehicle?.id === vehicle.id
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400 bg-white'
                }`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="flex gap-6 items-start">
                  {/* Vehicle Image */}
                  <div className="flex-shrink-0 w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
                    {vehicle.image_url ? (
                      <img
                        src={vehicle.image_url}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {vehicle.name} ({vehicle.max_passengers} seater)
                    </h2>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-gray-600">
                        <span className="text-lg mr-2">👥</span>
                        Max {vehicle.max_passengers} Persons
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-lg mr-2">👜</span>
                        {vehicle.max_bags} large bags
                      </div>
                    </div>
                  </div>

                  {/* Price and Select Button */}
                  <div className="flex flex-col items-end justify-between h-32">
                    <div>
                      <p className="text-sm text-gray-600">Fee</p>
                      <p className="text-2xl font-bold text-gray-900">R730.00</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setStep('details');
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      ✓ Select Car
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Booking Details */}
      {step === 'details' && selectedVehicle && (
        <div>
          <button
            onClick={() => setStep('vehicle')}
            className="flex items-center text-teal-600 hover:text-teal-700 font-medium mb-6"
          >
            ← Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Selected Vehicle Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">{selectedVehicle.name}</h3>
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  {selectedVehicle.image_url ? (
                    <img
                      src={selectedVehicle.image_url}
                      alt={selectedVehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Passengers:</span> {selectedVehicle.max_passengers}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Bags:</span> {selectedVehicle.max_bags}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Estimated Fee</p>
                  <p className="text-2xl font-bold text-gray-900">R730.00</p>
                </div>
              </div>
            </div>

            {/* Right: Booking Form */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Date
                  </label>
                  <input
                    type="date"
                    value={formData.pickupDate}
                    onChange={e => handleDateChange('pickupDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.pickupDate || '2026-08-28'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏰ Time
                  </label>
                  <input
                    type="time"
                    value={formData.pickupTime}
                    onChange={e => handleDateChange('pickupTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Return Date & Time */}
              {formData.isReturnTrip && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Return Date
                    </label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      onChange={e => handleDateChange('returnDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⏰ Return Time
                    </label>
                    <input
                      type="time"
                      value={formData.returnTime}
                      onChange={e => handleDateChange('returnTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Add Return Trip Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
                <label className="text-sm font-medium text-gray-700">Add return trip</label>
                <button
                  onClick={() => handleReturnTripChange(!formData.isReturnTrip)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isReturnTrip ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isReturnTrip ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. of Passengers
                </label>
                <select
                  value={formData.passengers}
                  onChange={e => handleDateChange('passengers', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                >
                  {[1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add-ons */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Additional Request</p>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.addBabySeat}
                      onChange={e => setFormData(prev => ({ ...prev, addBabySeat: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Add baby seat</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.addTrailer}
                      onChange={e => setFormData(prev => ({ ...prev, addTrailer: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Trailer</span>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instruction
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={e => handleDateChange('specialInstructions', e.target.value)}
                  placeholder="Please enter note"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none"
                />
              </div>

              {/* CTA Button */}
              <button className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 rounded-lg transition-colors">
                Get Instant Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
