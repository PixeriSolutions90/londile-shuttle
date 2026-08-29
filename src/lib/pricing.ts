import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side fare calculation for a SPECIFIC vehicle+zone combo (as opposed
 * to /api/quote's "list every matching vehicle" use case). Used wherever a
 * vehicle has already been chosen — booking creation, quote creation — so
 * the price actually charged is always recomputed from the live
 * pricing_rules table, never trusted from client input.
 */
export interface FareBreakdown {
  baseFee: number;
  perKmCharge: number;
  subtotal: number;
  returnMultiplier: number;
  totalFare: number;
}

export async function calculateFareForVehicle(
  supabase: SupabaseClient,
  vehicleId: string,
  zoneId: string,
  isReturnTrip: boolean,
  estimatedKm: number = 0
): Promise<FareBreakdown | null> {
  const { data: rule, error } = await supabase
    .from("pricing_rules")
    .select("base_fee, per_km_rate, return_trip_multiplier")
    .eq("vehicle_id", vehicleId)
    .eq("zone_id", zoneId)
    .eq("is_active", true)
    .single();

  if (error || !rule) return null;

  const baseFee = Number(rule.base_fee);
  const perKmCharge = rule.per_km_rate ? Number(rule.per_km_rate) * estimatedKm : 0;
  const subtotal = baseFee + perKmCharge;
  const returnMultiplier = isReturnTrip ? Number(rule.return_trip_multiplier ?? 1.5) : 1;
  const totalFare = Math.round(subtotal * returnMultiplier * 100) / 100;

  return {
    baseFee,
    perKmCharge: Math.round(perKmCharge * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    returnMultiplier,
    totalFare,
  };
}

export interface AddonSelection {
  id: string;
  name: string;
  fee: number;
}

/**
 * Look up the real, current fee for each selected add-on (never trust a
 * client-supplied total) and return both the sum and the individual rows,
 * the latter needed to snapshot fee_at_booking in booking_addons.
 */
export async function resolveAddonFees(
  supabase: SupabaseClient,
  addonIds: string[]
): Promise<{ total: number; addons: AddonSelection[] }> {
  if (addonIds.length === 0) return { total: 0, addons: [] };

  const { data, error } = await supabase
    .from("addons")
    .select("id, name, fee")
    .in("id", addonIds)
    .eq("is_active", true);

  if (error || !data) return { total: 0, addons: [] };

  const addons = data.map((a) => ({ id: a.id, name: a.name, fee: Number(a.fee) }));
  const total = Math.round(addons.reduce((sum, a) => sum + a.fee, 0) * 100) / 100;

  return { total, addons };
}
