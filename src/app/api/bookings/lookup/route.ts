import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GuestBookingLookupSchema } from "@/lib/schemas/booking";
import {
  bookingLookupRateLimit,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

/**
 * POST /api/bookings/lookup
 *
 * Allows guests to lookup their booking without authentication
 * Uses secure lookup function that requires booking number + contact number
 *
 * Rate limited: 20 requests/minute per IP
 */
export async function POST(request: NextRequest) {
  // ============================================================================
  // RATE LIMITING: 20 requests per minute per IP
  // ============================================================================
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(
    bookingLookupRateLimit(clientIp),
    "booking-lookup"
  );

  if (!rateLimitResult.allowed) {
    // Rate limit exceeded
    return NextResponse.json(
      {
        error: "Too many requests",
        message:
          "You have made too many booking lookup requests. Please wait a moment and try again.",
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
    // ============================================================================
    // VALIDATE REQUEST
    // ============================================================================
    const body = await request.json();

    const validationResult = GuestBookingLookupSchema.safeParse(body);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return NextResponse.json(
        {
          error: "Invalid request",
          details: errors,
        },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    const { bookingNumber, contactNumber } = validationResult.data;

    // ============================================================================
    // LOOKUP BOOKING
    // ============================================================================
    const { data: bookings, error: lookupError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        booking_number,
        guest_name,
        guest_surname,
        guest_contact,
        status,
        trip_start_date,
        trip_end_date,
        created_at,
        updated_at
      `
      )
      .eq("booking_number", bookingNumber)
      .eq("guest_contact", contactNumber)
      .single();

    if (lookupError) {
      if (lookupError.code === "PGRST116") {
        // No row found - booking doesn't exist or contact doesn't match
        return NextResponse.json(
          {
            error: "Booking not found",
            message:
              "No booking found with this booking number and contact number combination.",
          },
          {
            status: 404,
            headers: rateLimitResult.headers,
          }
        );
      }

      console.error("Booking lookup error:", lookupError);
      return NextResponse.json(
        {
          error: "Lookup failed",
          message: "An error occurred while looking up your booking.",
        },
        {
          status: 500,
          headers: rateLimitResult.headers,
        }
      );
    }

    if (!bookings) {
      return NextResponse.json(
        {
          error: "Booking not found",
          message:
            "No booking found with this booking number and contact number combination.",
        },
        {
          status: 404,
          headers: rateLimitResult.headers,
        }
      );
    }

    // ============================================================================
    // LOG LOOKUP (Audit trail)
    // ============================================================================
    try {
      await supabase.from("audit_logs").insert({
        user_id: null,
        action: "booking_lookup",
        resource: `booking:${bookings.id}`,
        details: {
          booking_number: bookingNumber,
          ip: clientIp,
        },
      });
    } catch (err) {
      console.error("Failed to log booking lookup:", err);
      // Don't fail if audit logging fails
    }

    // ============================================================================
    // RETURN BOOKING DETAILS
    // ============================================================================
    return NextResponse.json(
      {
        success: true,
        booking: {
          bookingNumber: bookings.booking_number,
          guestName: `${bookings.guest_name} ${bookings.guest_surname}`,
          status: bookings.status, // pending, confirmed, completed, cancelled
          tripStartDate: bookings.trip_start_date,
          tripEndDate: bookings.trip_end_date,
          createdAt: bookings.created_at,
          updatedAt: bookings.updated_at,
          // Status-specific messages
          statusMessage: getStatusMessage(bookings.status),
        },
      },
      {
        status: 200,
        headers: rateLimitResult.headers,
      }
    );
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Request body must be valid JSON",
        },
        {
          status: 400,
          headers: rateLimitResult.headers,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      {
        status: 500,
        headers: rateLimitResult.headers,
      }
    );
  }
}

/**
 * Get user-friendly status message
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: "Your booking is pending confirmation. We will contact you soon.",
    confirmed: "Your booking is confirmed. See you on your trip date!",
    completed:
      "Your booking has been completed. Thank you for using Londile Shuttle.",
    cancelled: "Your booking has been cancelled. Please contact support for refunds.",
  };

  return messages[status] || "Booking status unknown";
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
