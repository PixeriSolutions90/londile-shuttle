import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BookingSchema } from "@/lib/schemas/booking";
import { nanoid } from "nanoid";
import {
  bookingRateLimit,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

/**
 * POST /api/bookings/create
 *
 * Creates a new booking after server-side validation
 * - Validates request body with Zod schema
 * - Generates booking number
 * - Saves to Supabase
 * - Returns booking confirmation
 * - Rate limited: 10 requests per hour per IP
 */
export async function POST(request: NextRequest) {
  // ============================================================================
  // RATE LIMITING: 10 requests per hour per IP
  // ============================================================================
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(
    bookingRateLimit(clientIp),
    "booking-create"
  );

  if (!rateLimitResult.allowed) {
    // Rate limit exceeded
    return NextResponse.json(
      {
        error: "Too many booking requests",
        message:
          "You have made too many booking requests in the last hour. Please try again later.",
        retryAfter: rateLimitResult.headers?.["Retry-After"],
      },
      {
        status: 429, // Too Many Requests
        headers: rateLimitResult.headers,
      }
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Parse request body
    const body = await request.json();

    // ============================================================================
    // BOT PROTECTION: Verify Turnstile Token (Canonical Siteverify)
    // ============================================================================
    const turnstileToken = body.turnstileToken;
    const turnstileVerification = await verifyTurnstileToken(
      turnstileToken,
      clientIp,
      "booking"
    );

    if (!turnstileVerification.success) {
      return NextResponse.json(
        {
          error: "Bot verification failed",
          message: turnstileVerification.error,
        },
        {
          status: 403,
          headers: rateLimitResult.headers,
        }
      );
    }

    // ============================================================================
    // SERVER-SIDE VALIDATION (Never trust the client!)
    // ============================================================================
    // Remove turnstileToken from body before validation
    const { turnstileToken: _, ...bodyWithoutToken } = body;
    const validationResult = BookingSchema.safeParse(bodyWithoutToken);

    if (!validationResult.success) {
      // Return validation errors
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors,
        },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    const data = validationResult.data;

    // ============================================================================
    // GENERATE BOOKING NUMBER (Sequential: LS-00001, LS-00002, etc.)
    // ============================================================================
    const bookingNumber = await generateBookingNumber(supabase);

    // ============================================================================
    // GENERATE VERIFICATION CODE (For guest lookup without auth)
    // ============================================================================
    const verificationCode = nanoid(8); // e.g., "abc12xyz"

    // ============================================================================
    // INSERT BOOKING INTO DATABASE
    // ============================================================================
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        guest_name: data.guestFirstName,
        guest_surname: data.guestSurname,
        guest_contact: data.contactNumber,
        guest_address: data.address,
        status: "pending",
        trip_start_date: data.tripStartDate.toISOString().split("T")[0], // YYYY-MM-DD
        trip_end_date: data.tripEndDate.toISOString().split("T")[0], // YYYY-MM-DD
        verification_code: verificationCode,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create booking",
          message: "An error occurred while processing your booking. Please try again.",
        },
        {
          status: 500,
          headers: rateLimitResult.headers,
        }
      );
    }

    // ============================================================================
    // SEND CONFIRMATION (SMS/Email)
    // ============================================================================
    try {
      // TODO: Implement SMS/Email sending
      // await sendBookingConfirmation({
      //   contactNumber: data.contactNumber,
      //   email: data.email,
      //   bookingNumber,
      //   verificationCode,
      // });

      console.log(
        `📧 Booking confirmation would be sent to ${data.contactNumber}`
      );
    } catch (err) {
      console.error("Failed to send confirmation:", err);
      // Don't fail the whole request if notification fails
    }

    // ============================================================================
    // LOG BOOKING CREATION (Audit trail)
    // ============================================================================
    try {
      await supabase.from("audit_logs").insert({
        user_id: null, // Guest booking, no user ID
        action: "booking_created",
        resource: `booking:${booking.id}`,
        details: {
          booking_number: bookingNumber,
          guest_name: data.guestFirstName,
          trip_dates: `${data.tripStartDate.toDateString()} - ${data.tripEndDate.toDateString()}`,
        },
      });
    } catch (err) {
      console.error("Failed to log booking:", err);
      // Don't fail if audit logging fails
    }

    // ============================================================================
    // RETURN SUCCESS RESPONSE (No sensitive data exposed to client)
    // ============================================================================
    // NOTE: Verification code is only sent via SMS/Email, never in API response
    return NextResponse.json(
      {
        success: true,
        message: "Booking confirmed!",
        bookingNumber: booking.booking_number,
        // Confirmation details for display (no internal IDs or verification codes)
        confirmation: {
          title: `Booking Confirmed - ${bookingNumber}`,
          message: `Your shuttle booking has been confirmed. Your booking number is ${bookingNumber}. Please keep this number safe for reference. A confirmation has been sent to your contact number.`,
        },
      },
      {
        status: 201,
        headers: rateLimitResult.headers,
      }
    );
  } catch (error) {
    console.error("API error:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
        },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
        headers: rateLimitResult.headers,
      }
    );
  }
}

/**
 * Generate next sequential booking number
 * Uses Supabase sequence to ensure uniqueness
 */
async function generateBookingNumber(supabase: any): Promise<string> {
  try {
    // Call Supabase function that uses booking_number_seq
    const { data, error } = await supabase.rpc("generate_booking_number");

    if (error) {
      console.error("Booking number generation error:", error);
      // Fallback: Generate manually (less ideal but works)
      return `LS-${Math.random().toString().slice(2, 7).padStart(5, "0")}`;
    }

    return data;
  } catch (err) {
    console.error("Error generating booking number:", err);
    // Fallback
    return `LS-${Math.random().toString().slice(2, 7).padStart(5, "0")}`;
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
