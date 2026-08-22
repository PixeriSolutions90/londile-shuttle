import { z } from "zod";

/**
 * Booking Form Schema
 * Used for both client-side and server-side validation
 * Validates guest and booking information
 */

export const BookingSchema = z.object({
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

  // Trip Details (Operational)
  tripStartDate: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), "Trip start date must be in the future"),

  tripEndDate: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), "Trip end date must be in the future"),

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
})
  // Custom validation: end date must be after start date
  .refine(
    (data) => data.tripEndDate > data.tripStartDate,
    {
      message: "Trip end date must be after start date",
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
  );

// Type inference from schema
export type BookingFormData = z.infer<typeof BookingSchema>;

/**
 * Agent Booking Schema
 * For agents creating bookings for clients
 * Same as above but no email field (agent uses their own)
 */
export const AgentBookingSchema = BookingSchema.omit({ email: true });

export type AgentBookingFormData = z.infer<typeof AgentBookingSchema>;

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
