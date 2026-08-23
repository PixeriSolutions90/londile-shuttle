import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { QuoteRequestSchema } from "@/lib/schemas/booking";
import { quoteRateLimit, checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/quote
 *
 * Public, unauthenticated fare estimate — no PII collected, so no Turnstile
 * check (unlike booking creation), just rate limiting against scraping/abuse.
 *
 * Returns one quote per active vehicle that both seats the requested party
 * and has an active pricing rule for the resolved zone, cheapest first.
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(quoteRateLimit(clientIp), "quote");

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many quote requests",
        message: "You've requested too many quotes. Please try again shortly.",
        retryAfter: rateLimitResult.headers?.["Retry-After"],
      },
      { status: 429, headers: rateLimitResult.headers }
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
    const body = await request.json();
    const result = QuoteRequestSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        errors[err.path.join(".")] = err.message;
      });
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const { passengerCount, isReturnTrip, estimatedKm, zoneName } = result.data;

    // Resolve the pricing zone
    const { data: zone, error: zoneError } = await supabase
      .from("zones")
      .select("id, name")
      .eq("name", zoneName)
      .eq("is_active", true)
      .single();

    if (zoneError || !zone) {
      return NextResponse.json(
        {
          error: "Unknown pricing zone",
          message: `No active pricing zone named "${zoneName}".`,
        },
        { status: 404, headers: rateLimitResult.headers }
      );
    }

    // Pricing rules for that zone, joined to their vehicle
    const { data: rules, error: rulesError } = await supabase
      .from("pricing_rules")
      .select(
        "base_fee, per_km_rate, return_trip_multiplier, vehicles(id, name, vehicle_class, max_passengers, max_bags, image_url, is_active)"
      )
      .eq("zone_id", zone.id)
      .eq("is_active", true);

    if (rulesError) {
      console.error("Quote pricing lookup error:", rulesError);
      return NextResponse.json(
        { error: "Failed to calculate quote" },
        { status: 500, headers: rateLimitResult.headers }
      );
    }

    const quotes = (rules ?? [])
      .map((rule) => {
        const vehicle = Array.isArray(rule.vehicles) ? rule.vehicles[0] : rule.vehicles;
        if (!vehicle || !vehicle.is_active) return null;
        if (vehicle.max_passengers < passengerCount) return null;

        const baseFee = Number(rule.base_fee);
        const perKmCharge = rule.per_km_rate ? Number(rule.per_km_rate) * estimatedKm : 0;
        const subtotal = baseFee + perKmCharge;
        const returnMultiplier = isReturnTrip ? Number(rule.return_trip_multiplier ?? 1.5) : 1;
        const totalFare = Math.round(subtotal * returnMultiplier * 100) / 100;

        return {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehicleClass: vehicle.vehicle_class,
          maxPassengers: vehicle.max_passengers,
          maxBags: vehicle.max_bags,
          imageUrl: vehicle.image_url,
          baseFee,
          perKmCharge: Math.round(perKmCharge * 100) / 100,
          subtotal: Math.round(subtotal * 100) / 100,
          returnMultiplier,
          totalFare,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .sort((a, b) => a.totalFare - b.totalFare);

    return NextResponse.json(
      {
        zone: { id: zone.id, name: zone.name },
        isReturnTrip,
        estimatedKm,
        passengerCount,
        quotes,
      },
      { status: 200, headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error("Quote API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
