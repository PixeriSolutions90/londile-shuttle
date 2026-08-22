"use client";

import { useState } from "react";
import { BookingSchema, type BookingFormData } from "@/lib/schemas/booking";
import { ZodError } from "zod";

interface BookingFormProps {
  onSubmit?: (data: BookingFormData) => void;
  isLoading?: boolean;
}

export function BookingForm({ onSubmit, isLoading = false }: BookingFormProps) {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    guestFirstName: "",
    guestSurname: "",
    contactNumber: "",
    email: "",
    address: "",
    tripStartDate: "",
    tripEndDate: "",
    specialRequests: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  // Validate a single field (for real-time feedback)
  const validateField = (name: string, value: unknown) => {
    try {
      // Create a partial schema for single field validation
      const fieldSchema = BookingSchema.pick({
        [name]: true,
      } as any);

      fieldSchema.parse({ [name]: value });
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors[0]?.message || "Invalid input";
        setErrors((prev) => ({ ...prev, [name]: message }));
      }
      return false;
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    const parsedValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    // Validate field if it's been touched
    if (fieldTouched[name]) {
      validateField(name, parsedValue);
    }
  };

  // Handle field blur (mark as touched)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFieldTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, parsedValue);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prepare data for validation (convert date strings to Date objects)
    const dataToValidate = {
      ...formData,
      tripStartDate:
        formData.tripStartDate instanceof Date
          ? formData.tripStartDate.toISOString()
          : formData.tripStartDate,
      tripEndDate:
        formData.tripEndDate instanceof Date
          ? formData.tripEndDate.toISOString()
          : formData.tripEndDate,
    };

    // Validate entire form
    const result = BookingSchema.safeParse(dataToValidate);

    if (!result.success) {
      // Display all errors
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    // Form is valid, submit to server
    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrors({ submit: error.message || "Booking failed" });
        return;
      }

      const booking = await response.json();
      onSubmit?.(result.data);

      // Show success (you can replace with toast notification)
      alert(`Booking confirmed! Your booking number is: ${booking.bookingNumber}`);
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    }
  };

  const getFieldError = (fieldName: string) => {
    return fieldTouched[fieldName] ? errors[fieldName] : undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Book Your Shuttle</h2>

      {/* Guest Information Section */}
      <fieldset className="space-y-4 border-b pb-6">
        <legend className="text-lg font-semibold">Personal Information</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="guestFirstName" className="block text-sm font-medium">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="guestFirstName"
              name="guestFirstName"
              value={formData.guestFirstName || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("guestFirstName")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
              placeholder="John"
            />
            {getFieldError("guestFirstName") && (
              <p className="mt-1 text-sm text-red-500">{getFieldError("guestFirstName")}</p>
            )}
          </div>

          {/* Surname */}
          <div>
            <label htmlFor="guestSurname" className="block text-sm font-medium">
              Surname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="guestSurname"
              name="guestSurname"
              value={formData.guestSurname || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("guestSurname")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
              placeholder="Smith"
            />
            {getFieldError("guestSurname") && (
              <p className="mt-1 text-sm text-red-500">{getFieldError("guestSurname")}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("contactNumber")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
              placeholder="+27123456789 or 0123456789"
            />
            {getFieldError("contactNumber") && (
              <p className="mt-1 text-sm text-red-500">{getFieldError("contactNumber")}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("email")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
              placeholder="john@example.com"
            />
            {getFieldError("email") && (
              <p className="mt-1 text-sm text-red-500">{getFieldError("email")}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              getFieldError("address")
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-brand-primary"
            }`}
            placeholder="123 Main Street, Cape Town, 8000"
          />
          {getFieldError("address") && (
            <p className="mt-1 text-sm text-red-500">{getFieldError("address")}</p>
          )}
        </div>
      </fieldset>

      {/* Trip Details Section */}
      <fieldset className="space-y-4 border-b pb-6">
        <legend className="text-lg font-semibold">Trip Details</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label htmlFor="tripStartDate" className="block text-sm font-medium">
              Trip Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="tripStartDate"
              name="tripStartDate"
              value={formData.tripStartDate || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("tripStartDate")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
            />
            {getFieldError("tripStartDate") && (
              <p className="mt-1 text-sm text-red-500">{getFieldError("tripStartDate")}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="tripEndDate" className="block text-sm font-medium">
              Trip End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="tripEndDate"
              name="tripEndDate"
              value={formData.tripEndDate || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("tripEndDate")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-brand-primary"
              }`}
            />
            {getFieldError("tripEndDate") && (
              <p className="mt-1 text-sm text-red-500">{getFieldError("tripEndDate")}</p>
            )}
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label htmlFor="specialRequests" className="block text-sm font-medium">
            Special Requests (Optional)
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              getFieldError("specialRequests")
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-brand-primary"
            }`}
            placeholder="Any special requests? E.g., wheelchair accessibility, late pickup, etc."
          />
          {getFieldError("specialRequests") && (
            <p className="mt-1 text-sm text-red-500">{getFieldError("specialRequests")}</p>
          )}
        </div>
      </fieldset>

      {/* Consent Section */}
      <fieldset className="space-y-4 border-b pb-6">
        <legend className="text-lg font-semibold">Agreements</legend>

        <div className="space-y-3">
          {/* Terms Consent */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms || false}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 h-4 w-4 text-brand-primary"
            />
            <label htmlFor="agreeToTerms" className="ml-3 text-sm">
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                Terms & Conditions
              </a>{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>
          {getFieldError("agreeToTerms") && (
            <p className="text-sm text-red-500">{getFieldError("agreeToTerms")}</p>
          )}

          {/* Privacy Consent */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="agreeToPrivacy"
              name="agreeToPrivacy"
              checked={formData.agreeToPrivacy || false}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 h-4 w-4 text-brand-primary"
            />
            <label htmlFor="agreeToPrivacy" className="ml-3 text-sm">
              I have read and agree to the{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                Privacy Policy
              </a>{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>
          {getFieldError("agreeToPrivacy") && (
            <p className="text-sm text-red-500">{getFieldError("agreeToPrivacy")}</p>
          )}
        </div>
      </fieldset>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {isLoading ? "Processing..." : "Confirm Booking"}
        </button>
        <button
          type="reset"
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition"
        >
          Clear
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="text-xs text-gray-600">
        Your personal information is protected under POPIA. See our{" "}
        <a href="/data-retention" className="text-brand-primary hover:underline">
          Data Retention Policy
        </a>{" "}
        to learn how long we keep your data.
      </div>
    </form>
  );
}
