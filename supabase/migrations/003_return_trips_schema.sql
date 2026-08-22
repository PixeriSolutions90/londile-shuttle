-- ============================================================================
-- PHASE 3: Return Trip Support
-- Migrate from simple trip_start_date/trip_end_date to explicit pickup/dropoff
-- with optional return trip fields
-- ============================================================================

-- ============================================================================
-- UPDATE BOOKINGS TABLE: Add return trip fields
-- ============================================================================

-- Add new columns for pickup/dropoff details
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS dropoff_date DATE,
ADD COLUMN IF NOT EXISTS dropoff_time TIME,
ADD COLUMN IF NOT EXISTS is_return_trip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS return_time TIME;

-- Backfill new columns from existing trip_start_date/trip_end_date
UPDATE bookings
SET
  pickup_date = trip_start_date,
  pickup_time = '09:00:00'::TIME,
  dropoff_date = trip_end_date,
  dropoff_time = '17:00:00'::TIME,
  is_return_trip = FALSE
WHERE pickup_date IS NULL;

-- Make the new columns NOT NULL after backfill
ALTER TABLE bookings
ALTER COLUMN pickup_date SET NOT NULL,
ALTER COLUMN pickup_time SET NOT NULL,
ALTER COLUMN dropoff_date SET NOT NULL,
ALTER COLUMN dropoff_time SET NOT NULL;

-- Add constraint: Return date must be >= dropoff date
ALTER TABLE bookings
ADD CONSTRAINT return_date_after_dropoff CHECK (
  return_date IS NULL OR return_date >= dropoff_date
);

-- Add constraint: Return time only if is_return_trip is true
ALTER TABLE bookings
ADD CONSTRAINT return_time_requires_return_trip CHECK (
  (is_return_trip = TRUE AND return_date IS NOT NULL AND return_time IS NOT NULL) OR
  (is_return_trip = FALSE AND return_date IS NULL AND return_time IS NULL)
);

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS bookings_pickup_date_idx ON bookings(pickup_date);
CREATE INDEX IF NOT EXISTS bookings_is_return_trip_idx ON bookings(is_return_trip);

-- ============================================================================
-- ADD OPERATIONAL FIELDS
-- ============================================================================

-- Vehicle and zone links for pricing
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Pricing snapshot (always store the fare at booking time)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS base_fare DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS addons_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fare DECIMAL(10, 2);

-- Passenger count and special requests
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Consent tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- HELPER FUNCTION: Get fare for a booking (debugging)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_booking_fare_breakdown(booking_id UUID)
RETURNS TABLE (
  base_fare DECIMAL,
  addons_fee DECIMAL,
  total_fare DECIMAL,
  is_return_trip BOOLEAN,
  booking_number TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.base_fare,
    b.addons_fee,
    COALESCE(b.base_fare, 0) + COALESCE(b.addons_fee, 0) AS total,
    b.is_return_trip,
    b.booking_number
  FROM bookings b
  WHERE b.id = booking_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEPRECATION WARNING: Old trip_start_date/trip_end_date columns
-- ============================================================================

-- These columns are retained for backward compatibility but should not be used
-- All new code should use pickup_date/dropoff_date/return_date instead
-- Plan to drop these columns in a future migration after code cleanup
COMMENT ON COLUMN bookings.trip_start_date IS 'DEPRECATED: Use pickup_date + pickup_time instead';
COMMENT ON COLUMN bookings.trip_end_date IS 'DEPRECATED: Use dropoff_date + dropoff_time instead';
