"use client";

import { useState, useRef } from "react";
import { GuestBookingLookupSchema } from "@/lib/schemas/booking";
import Turnstile from "react-turnstile";

export function BookingLookupForm() {
  const [formData, setFormData] = useState({
    bookingNumber: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setBookingResult(null);

    // Validate inputs
    const result = GuestBookingLookupSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        const path = err.path.join(".");
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    // Check Turnstile token
    if (!turnstileToken) {
      setErrors({ turnstile: "Please complete the bot verification" });
      return;
    }

    // Submit to server
    setIsLoading(true);
    try {
      const response = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.message || "Booking not found" });
        return;
      }

      setBookingResult(data.booking);
      // Reset form
      setFormData({ bookingNumber: "", contactNumber: "" });
      setTurnstileToken("");
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {!bookingResult ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Find Your Booking</h2>

          {/* Booking Number */}
          <div>
            <label htmlFor="bookingNumber" className="block text-sm font-medium">
              Booking Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bookingNumber"
              name="bookingNumber"
              value={formData.bookingNumber}
              onChange={handleChange}
              placeholder="LS-00001"
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.bookingNumber
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
            />
            {errors.bookingNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.bookingNumber}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+27123456789"
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.contactNumber
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
            />
            {errors.contactNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>
            )}
          </div>

          {/* Turnstile Bot Protection */}
          <div className="flex justify-center py-4">
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              action="lookup"
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => {
                setTurnstileToken("");
                setErrors((prev) => ({ ...prev, turnstile: "Bot verification failed" }));
              }}
              theme="light"
            />
          </div>
          {errors.turnstile && (
            <p className="text-sm text-red-500 text-center">{errors.turnstile}</p>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            {isLoading ? "Searching..." : "Find Booking"}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Enter your booking number and contact number to find your booking details.
          </p>
        </form>
      ) : (
        // Booking Found
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-900 mb-3">
              ✓ Booking Found: {bookingResult.bookingNumber}
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Guest:</strong> {bookingResult.guestName}
              </p>
              <p>
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    bookingResult.status === "confirmed"
                      ? "bg-green-200 text-green-800"
                      : bookingResult.status === "pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {bookingResult.status.toUpperCase()}
                </span>
              </p>
              <p>
                <strong>Trip Dates:</strong> {bookingResult.tripStartDate} to{" "}
                {bookingResult.tripEndDate}
              </p>
              <p className="mt-3 text-gray-700">{bookingResult.statusMessage}</p>
            </div>
          </div>

          <button
            onClick={() => setBookingResult(null)}
            className="w-full bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 font-medium transition"
          >
            Search Another Booking
          </button>
        </div>
      )}
    </div>
  );
}
