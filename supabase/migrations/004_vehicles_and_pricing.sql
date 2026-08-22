-- ============================================================================
-- PHASE 4: Vehicles & Pricing Rules
-- Allows admins to manage fleet and pricing without code changes
-- ============================================================================

-- ============================================================================
-- VEHICLES TABLE (Fleet Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vehicle identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Capacity constraints
  max_passengers INTEGER NOT NULL CHECK (max_passengers > 0 AND max_passengers <= 8),
  max_bags INTEGER NOT NULL CHECK (max_bags >= 0),

  -- Vehicle classification (for UI grouping)
  vehicle_class TEXT NOT NULL CHECK (vehicle_class IN ('economy', 'comfort', 'luxury', 'van', 'minibus'))
    DEFAULT 'comfort',

  -- Asset management
  image_url TEXT,
  registration_number TEXT UNIQUE,

  -- Operational
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE INDEX vehicles_is_active_idx ON vehicles(is_active);
CREATE INDEX vehicles_vehicle_class_idx ON vehicles(vehicle_class);

-- RLS: Anyone can read active vehicles (for booking form)
CREATE POLICY "Anyone can read active vehicles" ON vehicles
  FOR SELECT USING (is_active = TRUE);

-- RLS: Only admins can manage vehicles
CREATE POLICY "Admins can manage vehicles" ON vehicles
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- ZONES TABLE (Geographic Service Areas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Zone identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Zone classification
  is_international BOOLEAN NOT NULL DEFAULT FALSE,
  country_code TEXT, -- e.g., 'ZA', 'NA', 'BW' (for international zones)

  -- Geographic bounds (optional, for mapping)
  min_latitude DECIMAL,
  max_latitude DECIMAL,
  min_longitude DECIMAL,
  max_longitude DECIMAL,

  -- Operational
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE INDEX zones_is_active_idx ON zones(is_active);
CREATE INDEX zones_is_international_idx ON zones(is_international);

-- RLS: Anyone can read active zones
CREATE POLICY "Anyone can read active zones" ON zones
  FOR SELECT USING (is_active = TRUE);

-- RLS: Only admins can manage zones
CREATE POLICY "Admins can manage zones" ON zones
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- PRICING RULES TABLE (Flexible Fare Calculation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,

  -- Pricing model (base fee + optional per-km rate)
  base_fee DECIMAL(10, 2) NOT NULL CHECK (base_fee > 0),
  per_km_rate DECIMAL(10, 2), -- Optional: NULL means flat rate, otherwise per-km

  -- Return trip multiplier (if different from base_fee)
  return_trip_multiplier DECIMAL(3, 2) DEFAULT 1.5, -- 1.5x = 50% premium

  -- Operational
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: Only one active rule per vehicle/zone combination
  CONSTRAINT unique_active_pricing UNIQUE (vehicle_id, zone_id)
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX pricing_rules_vehicle_id_idx ON pricing_rules(vehicle_id);
CREATE INDEX pricing_rules_zone_id_idx ON pricing_rules(zone_id);
CREATE INDEX pricing_rules_is_active_idx ON pricing_rules(is_active);

-- RLS: Anyone can read active pricing (for quote generation)
CREATE POLICY "Anyone can read active pricing" ON pricing_rules
  FOR SELECT USING (is_active = TRUE);

-- RLS: Only admins can manage pricing
CREATE POLICY "Admins can manage pricing" ON pricing_rules
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- FUNCTION: Calculate fare for a booking
-- Used by quote/booking endpoints to ensure consistent pricing
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_fare(
  p_vehicle_id UUID,
  p_zone_id UUID,
  p_is_return_trip BOOLEAN DEFAULT FALSE,
  p_estimated_km DECIMAL DEFAULT 0
)
RETURNS TABLE (
  base_fee DECIMAL,
  per_km_charge DECIMAL,
  subtotal DECIMAL,
  return_multiplier DECIMAL,
  total_fare DECIMAL
) AS $$
DECLARE
  rule pricing_rules%ROWTYPE;
  km_charge DECIMAL := 0;
  subtotal_amount DECIMAL;
  return_mult DECIMAL := 1;
  final_total DECIMAL;
BEGIN
  -- Get the pricing rule for this vehicle/zone combination
  SELECT * INTO rule
  FROM pricing_rules
  WHERE vehicle_id = p_vehicle_id
    AND zone_id = p_zone_id
    AND is_active = TRUE;

  IF rule.id IS NULL THEN
    RAISE EXCEPTION 'No active pricing rule for vehicle % in zone %', p_vehicle_id, p_zone_id;
  END IF;

  -- Calculate per-km charge if applicable
  IF rule.per_km_rate IS NOT NULL AND p_estimated_km > 0 THEN
    km_charge := rule.per_km_rate * p_estimated_km;
  END IF;

  -- Calculate subtotal
  subtotal_amount := rule.base_fee + km_charge;

  -- Apply return trip multiplier if applicable
  IF p_is_return_trip THEN
    return_mult := COALESCE(rule.return_trip_multiplier, 1.5);
    final_total := subtotal_amount * return_mult;
  ELSE
    return_mult := 1;
    final_total := subtotal_amount;
  END IF;

  RETURN QUERY SELECT
    rule.base_fee,
    km_charge,
    subtotal_amount,
    return_mult,
    final_total;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ADDONS TABLE (Optional Extras: Baby Seat, Trailer, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Addon identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Pricing
  fee DECIMAL(10, 2) NOT NULL CHECK (fee > 0),

  -- Operational
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE INDEX addons_is_active_idx ON addons(is_active);

-- RLS: Anyone can read active addons
CREATE POLICY "Anyone can read active addons" ON addons
  FOR SELECT USING (is_active = TRUE);

-- RLS: Only admins can manage addons
CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- BOOKING_ADDONS TABLE (Junction: Addons selected for a booking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,

  -- Price snapshot (store at booking time in case addon price changes)
  fee_at_booking DECIMAL(10, 2) NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate addons per booking
  UNIQUE(booking_id, addon_id)
);

ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
CREATE INDEX booking_addons_booking_id_idx ON booking_addons(booking_id);
CREATE INDEX booking_addons_addon_id_idx ON booking_addons(addon_id);

-- RLS: Users can see addons for their own bookings
CREATE POLICY "Users can see booking addons" ON booking_addons
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE created_by_user_id = auth.uid()
        OR created_by_agent_id = auth.uid()
    )
  );

-- RLS: Admins can see all booking addons
CREATE POLICY "Admins can see all booking addons" ON booking_addons
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- SEED DATA (Optional: Pre-load for testing)
-- Uncomment to populate default fleet and zones
-- ============================================================================

-- INSERT INTO public.zones (name, is_international, description) VALUES
--   ('Cape Town Local', FALSE, 'Local trips within Cape Town metro'),
--   ('Western Cape Regional', FALSE, 'Stellenbosch, Franschhoek, Hermanus'),
--   ('Johannesburg', FALSE, 'Gauteng Province'),
--   ('Southern Africa', TRUE, 'Namibia, Botswana, Lesotho'),
--   ('International', TRUE, 'Other countries')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO public.vehicles (name, vehicle_class, max_passengers, max_bags, description, image_url) VALUES
--   ('Comfort Sedan', 'comfort', 4, 2, 'Standard sedan for up to 4 passengers', NULL),
--   ('Premium Sedan', 'luxury', 4, 3, 'Luxury sedan with premium amenities', NULL),
--   ('Minivan', 'van', 6, 4, 'Spacious van for families and small groups', NULL),
--   ('Minibus', 'minibus', 8, 6, 'Large minibus for tours and group transport', NULL)
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO public.pricing_rules (vehicle_id, zone_id, base_fee, per_km_rate, return_trip_multiplier) VALUES
--   (
--     (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
--     (SELECT id FROM zones WHERE name = 'Cape Town Local'),
--     730.00,
--     5.50,
--     1.5
--   ),
--   (
--     (SELECT id FROM vehicles WHERE name = 'Comfort Sedan'),
--     (SELECT id FROM zones WHERE name = 'Western Cape Regional'),
--     850.00,
--     6.00,
--     1.4
--   )
-- ON CONFLICT (vehicle_id, zone_id) DO NOTHING;

-- INSERT INTO public.addons (name, fee, description) VALUES
--   ('Baby Seat', 150.00, 'Infant car seat (0-9 months)'),
--   ('Child Booster', 100.00, 'Child booster seat (9+ months to 4 years)'),
--   ('WiFi Hotspot', 50.00, 'In-vehicle WiFi for your journey'),
--   ('Luggage Trailer', 200.00, 'Additional luggage trailer for extra baggage')
-- ON CONFLICT (name) DO NOTHING;
