-- ============================================================================
-- SUPABASE SEED DATA
-- Reference data for vehicles, zones, pricing, add-ons
-- Run: supabase db reset (applies migrations + seed)
-- ============================================================================

-- ============================================================================
-- ZONES (Geographic Service Areas)
-- ============================================================================

INSERT INTO public.zones (name, description, is_international, country_code, is_active) VALUES
  (
    'Cape Town Local',
    'Within Greater Cape Town metro (0-50km)',
    FALSE,
    'ZA',
    TRUE
  ),
  (
    'Western Cape Regional',
    'Stellenbosch, Franschhoek, Hermanus, Tulbagh, Montagu',
    FALSE,
    'ZA',
    TRUE
  ),
  (
    'Johannesburg Metro',
    'Gauteng Province (Johannesburg, Pretoria, Midrand)',
    FALSE,
    'ZA',
    TRUE
  ),
  (
    'Durban & KwaZulu-Natal',
    'Durban, Pietermaritzburg, Umhlanga',
    FALSE,
    'ZA',
    TRUE
  ),
  (
    'Southern Africa Regional',
    'Namibia, Botswana, Lesotho, Eswatini (Swaziland)',
    TRUE,
    'NA',
    TRUE
  ),
  (
    'International',
    'All other countries - premium pricing applies',
    TRUE,
    NULL,
    TRUE
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VEHICLES (Fleet Management)
-- ============================================================================

INSERT INTO public.vehicles (
  name,
  vehicle_class,
  max_passengers,
  max_bags,
  description,
  registration_number,
  is_active
) VALUES
  (
    'Comfort Sedan',
    'comfort',
    4,
    2,
    'Standard sedan for everyday trips. Comfortable seating for up to 4 passengers.',
    'CT-2024-001',
    TRUE
  ),
  (
    'Premium Sedan',
    'luxury',
    4,
    3,
    'Luxury sedan with premium leather seating, WiFi, and beverage service.',
    'CT-2024-002',
    TRUE
  ),
  (
    'Family Minivan',
    'van',
    6,
    4,
    'Spacious minivan perfect for families and small groups. Extra legroom and storage.',
    'CT-2024-003',
    TRUE
  ),
  (
    'Luxury SUV',
    'luxury',
    4,
    4,
    'Premium SUV with all amenities. Ideal for executive travel and comfort.',
    'CT-2024-004',
    TRUE
  ),
  (
    'Minibus',
    'minibus',
    8,
    6,
    'Large minibus for tours and group transport. Suitable for up to 8 passengers.',
    'CT-2024-005',
    TRUE
  ),
  (
    'Economy Sedan',
    'economy',
    4,
    1,
    'Budget-friendly option for short trips. Basic amenities.',
    'CT-2024-006',
    TRUE
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PRICING RULES (Vehicle × Zone = Fare)
-- ============================================================================

INSERT INTO public.pricing_rules (
  vehicle_id,
  zone_id,
  base_fee,
  per_km_rate,
  return_trip_multiplier,
  is_active
) VALUES
  -- COMFORT SEDAN: Cape Town Local (per your mockup: R730)
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    730.00,
    5.50,
    1.5,
    TRUE
  ),
  -- COMFORT SEDAN: Western Cape Regional
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
    850.00,
    6.00,
    1.4,
    TRUE
  ),
  -- COMFORT SEDAN: Johannesburg
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'Johannesburg Metro'),
    900.00,
    6.50,
    1.4,
    TRUE
  ),
  -- COMFORT SEDAN: Durban
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'Durban & KwaZulu-Natal'),
    850.00,
    6.00,
    1.4,
    TRUE
  ),
  -- COMFORT SEDAN: Southern Africa Regional (premium)
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'Southern Africa Regional'),
    1200.00,
    8.00,
    1.3,
    TRUE
  ),
  -- COMFORT SEDAN: International
  (
    (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
    (SELECT id FROM zones WHERE name = 'International'),
    1500.00,
    10.00,
    1.2,
    TRUE
  ),

  -- PREMIUM SEDAN: Cape Town Local
  (
    (SELECT id FROM vehicles WHERE name = 'Premium Sedan'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    950.00,
    6.50,
    1.5,
    TRUE
  ),
  -- PREMIUM SEDAN: Western Cape Regional
  (
    (SELECT id FROM vehicles WHERE name = 'Premium Sedan'),
    (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
    1100.00,
    7.00,
    1.4,
    TRUE
  ),
  -- PREMIUM SEDAN: Johannesburg
  (
    (SELECT id FROM vehicles WHERE name = 'Premium Sedan'),
    (SELECT id FROM zones WHERE name = 'Johannesburg Metro'),
    1150.00,
    7.50,
    1.4,
    TRUE
  ),

  -- FAMILY MINIVAN: Cape Town Local
  (
    (SELECT id FROM vehicles WHERE name = 'Family Minivan'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    1200.00,
    7.00,
    1.5,
    TRUE
  ),
  -- FAMILY MINIVAN: Western Cape Regional
  (
    (SELECT id FROM vehicles WHERE name = 'Family Minivan'),
    (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
    1400.00,
    7.50,
    1.4,
    TRUE
  ),

  -- LUXURY SUV: Cape Town Local
  (
    (SELECT id FROM vehicles WHERE name = 'Luxury SUV'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    1100.00,
    7.00,
    1.5,
    TRUE
  ),
  -- LUXURY SUV: Western Cape Regional
  (
    (SELECT id FROM vehicles WHERE name = 'Luxury SUV'),
    (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
    1250.00,
    7.50,
    1.4,
    TRUE
  ),

  -- MINIBUS: Cape Town Local
  (
    (SELECT id FROM vehicles WHERE name = 'Minibus'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    1500.00,
    8.00,
    1.5,
    TRUE
  ),
  -- MINIBUS: Western Cape Regional
  (
    (SELECT id FROM vehicles WHERE name = 'Minibus'),
    (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
    1800.00,
    8.50,
    1.4,
    TRUE
  ),

  -- ECONOMY SEDAN: Cape Town Local
  (
    (SELECT id FROM vehicles WHERE name = 'Economy Sedan'),
    (SELECT id FROM zones WHERE name = 'Cape Town Local'),
    550.00,
    4.50,
    1.5,
    TRUE
  ),
  -- ECONOMY SEDAN: Western Cape Regional
  (
    (SELECT id FROM vehicles WHERE name = 'Economy Sedan'),
    (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
    650.00,
    5.00,
    1.4,
    TRUE
  )
ON CONFLICT (vehicle_id, zone_id) DO NOTHING;

-- ============================================================================
-- ADD-ONS (Optional Extras)
-- ============================================================================

INSERT INTO public.addons (
  name,
  fee,
  description,
  is_active
) VALUES
  (
    'Baby Seat (0-9 months)',
    150.00,
    'Infant car seat with safety harness and base. Suitable for newborns to 9 months.'
  ),
  (
    'Child Booster (9mo-4yr)',
    100.00,
    'Child booster seat for toddlers 9 months to 4 years. Adjustable height.'
  ),
  (
    'WiFi Hotspot',
    50.00,
    'In-vehicle WiFi hotspot for connectivity during your journey. High-speed mobile data.'
  ),
  (
    'Luggage Trailer',
    200.00,
    'Additional luggage storage trailer. Perfect for airport runs with extra baggage.'
  ),
  (
    'Pet Carrier',
    75.00,
    'Secure pet carrier for small animals (maximum 5kg). Ventilated and comfortable.'
  ),
  (
    'Wheelchair Access',
    0.00,
    'Wheelchair-accessible vehicle with hydraulic lift. No additional charge.'
  ),
  (
    'Work Station',
    50.00,
    'Mobile work desk with fold-out surface. Ideal for business travelers.'
  ),
  (
    'Premium Amenities',
    100.00,
    'Complimentary refreshments, charging ports, neck pillows, and entertainment.'
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- BOOKING STATUS REFERENCE (Informational)
-- These are CHECK constraints, included here for documentation
-- Valid booking statuses: 'pending', 'confirmed', 'completed', 'cancelled'
-- ============================================================================

-- Booking statuses are enforced via CHECK constraint in bookings table:
-- status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))

-- ============================================================================
-- VERIFICATION: Display seeded data
-- ============================================================================

-- Show zones
SELECT 'ZONES' as section, COUNT(*) as count FROM zones WHERE is_active = TRUE;

-- Show vehicles
SELECT 'VEHICLES' as section, COUNT(*) as count FROM vehicles WHERE is_active = TRUE;

-- Show pricing rules
SELECT 'PRICING RULES' as section, COUNT(*) as count FROM pricing_rules WHERE is_active = TRUE;

-- Show add-ons
SELECT 'ADD-ONS' as section, COUNT(*) as count FROM addons WHERE is_active = TRUE;

-- Sample pricing: Show all Comfort Sedan pricing
SELECT
  'SAMPLE PRICING: Comfort Sedan' as section,
  z.name as zone,
  pr.base_fee as "Base Fee (R)",
  pr.per_km_rate as "Per-KM (R)",
  pr.return_trip_multiplier as "Return ×"
FROM pricing_rules pr
JOIN vehicles v ON pr.vehicle_id = v.id
JOIN zones z ON pr.zone_id = z.id
WHERE v.name = 'Comfort Sedan'
ORDER BY z.name;

-- Sample fare calculation
SELECT
  'SAMPLE BOOKING: Comfort Sedan, Cape Town, 25km, Return' as scenario,
  (SELECT base_fee FROM pricing_rules
   WHERE vehicle_id = (SELECT id FROM vehicles WHERE name = 'Comfort Sedan')
   AND zone_id = (SELECT id FROM zones WHERE name = 'Cape Town Local')) as base_fee,
  ((SELECT per_km_rate FROM pricing_rules
    WHERE vehicle_id = (SELECT id FROM vehicles WHERE name = 'Comfort Sedan')
    AND zone_id = (SELECT id FROM zones WHERE name = 'Cape Town Local')) * 25) as distance_charge,
  (
    (SELECT base_fee FROM pricing_rules
     WHERE vehicle_id = (SELECT id FROM vehicles WHERE name = 'Comfort Sedan')
     AND zone_id = (SELECT id FROM zones WHERE name = 'Cape Town Local'))
    +
    ((SELECT per_km_rate FROM pricing_rules
      WHERE vehicle_id = (SELECT id FROM vehicles WHERE name = 'Comfort Sedan')
      AND zone_id = (SELECT id FROM zones WHERE name = 'Cape Town Local')) * 25)
  ) * (SELECT return_trip_multiplier FROM pricing_rules
       WHERE vehicle_id = (SELECT id FROM vehicles WHERE name = 'Comfort Sedan')
       AND zone_id = (SELECT id FROM zones WHERE name = 'Cape Town Local')) as total_with_return;
