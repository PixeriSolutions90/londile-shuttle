import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

function getClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

async function generateBookingNumber(supabase: ReturnType<typeof getClient>): Promise<string> {
  const { data, error } = await supabase.rpc("generate_booking_number");
  if (error || !data) return `LS-${nanoid(5).toUpperCase()}`;
  return data;
}

/**
 * PATCH /api/quotes/[id]
 *
 * Two things this route can do, mutually exclusive per call:
 *  - { status: 'sent' | 'accepted' | 'expired' } — a plain status transition
 *  - { convert: true, pickupTime? } — turns an accepted quote into a real
 *    booking. Relies entirely on RLS for authorization (both quotes and
 *    bookings tables already scope agents to their own company), so this
 *    uses the session-scoped client throughout, not service role.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = getClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.convert) {
      return await convertToBooking(supabase, id, body.pickupTime);
    }

    if (body.status && ["draft", "sent", "accepted", "expired"].includes(body.status)) {
      const { data, error } = await supabase
        .from("quotes")
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Failed to update quote status:", error);
        return NextResponse.json({ error: "Failed to update quote" }, { status: 400 });
      }

      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    console.error("Quote PATCH error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

async function convertToBooking(
  supabase: ReturnType<typeof getClient>,
  quoteId: string,
  pickupTime?: string
) {
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status !== "accepted") {
    return NextResponse.json(
      { error: "Only an accepted quote can be converted to a booking" },
      { status: 400 }
    );
  }

  if (quote.converted_booking_id) {
    return NextResponse.json(
      { error: "This quote has already been converted", bookingId: quote.converted_booking_id },
      { status: 400 }
    );
  }

  if (!quote.pickup_address || !quote.pickup_date) {
    return NextResponse.json(
      { error: "Quote needs a pickup address and date before it can be converted" },
      { status: 400 }
    );
  }

  const bookingNumber = await generateBookingNumber(supabase);
  const verificationCode = nanoid(8);
  const time = pickupTime && /^\d{2}:\d{2}$/.test(pickupTime) ? pickupTime : "09:00";

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      booking_number: bookingNumber,
      guest_name: quote.guest_name,
      guest_surname: quote.guest_surname,
      guest_contact: quote.guest_contact,
      guest_email: quote.guest_email,
      guest_address: quote.pickup_address,
      status: "pending",
      payment_status: "pending",
      source: "agent",
      vehicle_id: quote.vehicle_id,
      zone_id: quote.zone_id,
      pickup_date: quote.pickup_date,
      pickup_time: time,
      dropoff_date: quote.pickup_date,
      dropoff_time: time,
      is_return_trip: quote.is_return_trip,
      passenger_count: quote.passenger_count,
      base_fare: quote.quoted_total,
      addons_fee: 0,
      total_fare: quote.quoted_total,
      company_id: quote.company_id,
      created_by_agent_id: quote.created_by_agent_id,
      consent_given_at: new Date().toISOString(),
      verification_code: verificationCode,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create booking from quote:", insertError);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("quotes")
    .update({ converted_booking_id: booking.id, updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (updateError) {
    console.error("Failed to link quote to booking:", updateError);
    // The booking was created successfully; this is a non-fatal follow-up.
  }

  return NextResponse.json(
    { success: true, bookingNumber: booking.booking_number, bookingId: booking.id },
    { status: 201 }
  );
}
