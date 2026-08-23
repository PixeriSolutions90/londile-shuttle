import { z } from "zod";

/**
 * Booking Form Schema
 * Used for both client-side and server-side validation
 * Validates guest and booking information
 */

// Base field definitions (kept separate from the refinements below so
// individual field validators can be reused, e.g. `BookingFields.shape.email`).
const BookingFields = z.object({
  // Guest Information (POPIA regulated)
  guestFirstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),

  guestSurname: z
    .string()
    .min(2, "Surname must be at least 2 characters")
    .max(50, "Surname must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Surname can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),

  // Contact Information (POPIA regulated)
  contactNumber: z
    .string()
    .regex(/^(\+27|0)[0-9]{9}$/, "Must be a valid South African phone number")
    .transform((val) => val.trim()),

  email: z
    .string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((val) => val || undefined),

  // Address (POPIA regulated)
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters")
    .trim(),

  // Outbound Trip (Operational)
  tripStartDate: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), "Pickup date must be in the future"),

  tripStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),

  tripEndDate: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), "Dropoff date must be in the future"),

  tripEndTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),

  // Return Trip (Optional)
  isReturnTrip: z
    .boolean()
    .default(false),

  returnDate: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .optional()
    .nullable(),

  returnTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional()
    .nullable(),

  // Passenger Count
  passengerCount: z
    .number()
    .int()
    .min(1, "At least 1 passenger required")
    .max(8, "Maximum 8 passengers per booking")
    .default(1),

  // Add-ons (optional extras: baby seat, trailer, WiFi, etc.)
  addonIds: z
    .array(z.string().uuid("Invalid addon ID"))
    .optional()
    .default([]),

  // Optional: Notes or special requests
  specialRequests: z
    .string()
    .max(500, "Special requests must be less than 500 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => val || undefined),

  // Consent (POPIA requirement)
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the Terms & Conditions"),

  agreeToPrivacy: z
    .boolean()
    .refine((val) => val === true, "You must agree to the Privacy Policy"),
});

export const BookingSchema = BookingFields
  // Custom validation: dropoff date must be on or after pickup date
  .refine(
    (data) => data.tripEndDate >= data.tripStartDate,
    {
      message: "Dropoff date must be on or after pickup date",
      path: ["tripEndDate"],
    }
  )
  // Custom validation: trip duration max 30 days
  .refine(
    (data) => {
      const days = Math.ceil(
        (data.tripEndDate.getTime() - data.tripStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return days <= 30;
    },
    {
      message: "Trip duration cannot exceed 30 days",
      path: ["tripEndDate"],
    }
  )
  // Custom validation: return date must be after dropoff if return trip
  .refine(
    (data) => {
      if (!data.isReturnTrip) return true;
      if (!data.returnDate) return false;
      return data.returnDate >= data.tripEndDate;
    },
    {
      message: "Return date must be on or after dropoff date",
      path: ["returnDate"],
    }
  )
  // Custom validation: return time required if return trip
  .refine(
    (data) => {
      if (!data.isReturnTrip) return true;
      return data.returnTime !== null && data.returnTime !== undefined;
    },
    {
      message: "Return time is required for return trips",
      path: ["returnTime"],
    }
  );

// Type inference from schema
export type BookingFormData = z.infer<typeof BookingSchema>;

/**
 * Booking Form UI Schema
 * Used for react-hook-form client-side validation on the booking wizard.
 * Reuses the same field-level validators as BookingSchema (name, phone, email,
 * address, consent) but works against the raw shape of the UI's date/time
 * pickers instead of the combined ISO datetime strings the API expects.
 */
export const BookingFormSchema = z
  .object({
    guestFirstName: BookingFields.shape.guestFirstName,
    guestSurname: BookingFields.shape.guestSurname,
    contactNumber: BookingFields.shape.contactNumber,
    email: BookingFields.shape.email,
    address: BookingFields.shape.address,

    pickupDate: z.string().min(1, "Pickup date is required"),
    pickupTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Pickup time is required"),

    isReturnTrip: z.boolean(),
    returnDate: z.string().optional().or(z.literal("")),
    returnTime: z.string().optional().or(z.literal("")),

    // Bound via register('passengers', { valueAsNumber: true }) so the form
    // always produces a number, keeping this schema's input/output types
    // identical (avoids z.coerce, which would otherwise make them diverge
    // and break zodResolver's inferred useForm<> generic).
    passengers: z
      .number()
      .int()
      .min(1, "At least 1 passenger required")
      .max(8, "Maximum 8 passengers per booking"),

    selectedAddonIds: z.array(z.string()),

    specialRequests: BookingFields.shape.specialRequests,

    agreeToTerms: BookingFields.shape.agreeToTerms,
    agreeToPrivacy: BookingFields.shape.agreeToPrivacy,
  })
  // No past pickup dates
  .refine(
    (data) => {
      const pickup = new Date(`${data.pickupDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !Number.isNaN(pickup.getTime()) && pickup >= today;
    },
    { message: "Pickup date cannot be in the past", path: ["pickupDate"] }
  )
  // Return date + time required if return trip is enabled
  .refine((data) => !data.isReturnTrip || !!data.returnDate, {
    message: "Return date is required for return trips",
    path: ["returnDate"],
  })
  .refine((data) => !data.isReturnTrip || !!data.returnTime, {
    message: "Return time is required for return trips",
    path: ["returnTime"],
  })
  // Return date must be on or after the outbound pickup date
  .refine(
    (data) => {
      if (!data.isReturnTrip || !data.returnDate) return true;
      return new Date(data.returnDate) >= new Date(data.pickupDate);
    },
    { message: "Return date must be on or after the pickup date", path: ["returnDate"] }
  );

// Output type (after Zod transforms/defaults run) — what handleSubmit's
// callback receives.
export type BookingFormValues = z.output<typeof BookingFormSchema>;
// Input type (before transforms) — what register()/watch()/setValue() and
// defaultValues work with. These diverge because of the .optional().transform()
// fields (email, specialRequests), so useForm must be typed with this one.
export type BookingFormInput = z.input<typeof BookingFormSchema>;

/**
 * Guest Booking Lookup Schema
 * For guests to find their booking without authentication
 */
export const GuestBookingLookupSchema = z.object({
  bookingNumber: z
    .string()
    .regex(/^LS-\d{5}$/, "Invalid booking number format (LS-00001)"),

  contactNumber: z
    .string()
    .regex(/^(\+27|0)[0-9]{9}$/, "Must be a valid South African phone number"),
});

export type GuestBookingLookupData = z.infer<typeof GuestBookingLookupSchema>;

/**
 * Validation helper: Safe parse with error formatting
 */
export function validateBookingForm(data: unknown) {
  const result = BookingSchema.safeParse(data);

  if (!result.success) {
    // Format errors for API response
    const errors: Record<string, string> = {};
    result.error.issues.forEach((err: any) => {
      const path = err.path.join(".");
      errors[path] = err.message;
    });
    return { valid: false, errors };
  }

  return { valid: true, data: result.data };
}
