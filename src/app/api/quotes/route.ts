import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CreateQuoteSchema } from "@/lib/schemas/booking";
import { calculateFareForVehicle } from "@/lib/pricing";

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

/**
 * Quotes API — GET list, POST create.
 *
 * Deliberately uses the session-scoped (anon key) client, not a service-role
 * client: RLS on `quotes` already does exactly the right scoping (admins see
 * everything, agents see only their own company's rows), so there's no need
 * to duplicate that filtering logic here.
 */
export async function GET() {
  const cookieStore = await cookies();
  const supabase = getClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, guest_name, guest_surname, guest_contact, guest_email, pickup_address, dropoff_address, pickup_date, passenger_count, is_return_trip, quoted_total, currency, status, converted_booking_id, expires_at, created_at, vehicles(name), companies(name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch quotes:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = getClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", session.user.id)
    .single();

  if (callerProfile?.role !== "admin" && callerProfile?.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = CreateQuoteSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        errors[err.path.join(".")] = err.message;
      });
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const data = result.data;

    const fare = await calculateFareForVehicle(supabase, data.vehicleId, data.zoneId, data.isReturnTrip, 0);
    if (!fare) {
      return NextResponse.json(
        { error: "No active pricing exists for that vehicle in this zone." },
        { status: 400 }
      );
    }

    const { data: quoteNumber, error: numberError } = await supabase.rpc("generate_quote_number");
    if (numberError || !quoteNumber) {
      console.error("Quote number generation error:", numberError);
      return NextResponse.json({ error: "Failed to generate quote number" }, { status: 500 });
    }

    // Agents can only create quotes for their own company (RLS enforces
    // this too, but resolving it here gives a clearer error than a bare
    // RLS rejection). Admins may optionally leave a quote unassigned.
    const companyId = callerProfile.role === "agent" ? callerProfile.company_id : null;

    const { data: quote, error: insertError } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        guest_name: data.guestFirstName,
        guest_surname: data.guestSurname,
        guest_contact: data.contactNumber,
        guest_email: data.email ?? null,
        vehicle_id: data.vehicleId,
        zone_id: data.zoneId,
        pickup_address: data.pickupAddress ?? null,
        dropoff_address: data.dropoffAddress ?? null,
        pickup_date: data.pickupDate ?? null,
        passenger_count: data.passengerCount,
        is_return_trip: data.isReturnTrip,
        quoted_total: fare.totalFare,
        status: "draft",
        company_id: companyId,
        created_by_agent_id: callerProfile.role === "agent" ? session.user.id : null,
        expires_at: data.expiresAt ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create quote:", insertError);
      return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Quotes API error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
