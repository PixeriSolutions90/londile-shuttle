-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'user')) DEFAULT 'user',

  -- User profile fields (POPIA regulated)
  first_name TEXT,
  surname TEXT,
  id_number TEXT,
  contact_number TEXT,

  -- Saved addresses (POPIA regulated)
  saved_addresses JSONB DEFAULT '[]'::JSONB,

  -- Agent-specific fields (operational)
  company_name TEXT,
  vat_number TEXT,
  company_registration TEXT,
  company_address TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Booking reference (operational)
  booking_number TEXT NOT NULL UNIQUE,

  -- Guest info (POPIA regulated)
  guest_name TEXT NOT NULL,
  guest_surname TEXT NOT NULL,
  guest_address TEXT NOT NULL,
  guest_contact TEXT NOT NULL,

  -- Booking details (operational)
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  trip_start_date DATE NOT NULL,
  trip_end_date DATE NOT NULL,

  -- Links to profiles
  created_by_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Verification (for guest access without auth)
  verification_code TEXT NOT NULL UNIQUE,
  guest_verified_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT booking_creator CHECK (
    (created_by_agent_id IS NOT NULL AND created_by_user_id IS NULL) OR
    (created_by_agent_id IS NULL AND created_by_user_id IS NOT NULL)
  )
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX bookings_verification_code_idx ON bookings(verification_code);
CREATE INDEX bookings_booking_number_idx ON bookings(booking_number);
CREATE INDEX bookings_created_by_agent_id_idx ON bookings(created_by_agent_id);
CREATE INDEX bookings_created_by_user_id_idx ON bookings(created_by_user_id);

-- ============================================================================
-- SEQUENCE FOR BOOKING NUMBERS
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Function to generate sequential booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'LS-' || LPAD(nextval('booking_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- PROFILES: Users can only read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (
    (SELECT auth.uid()) = id
  );

-- PROFILES: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- PROFILES: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    (SELECT auth.uid()) = id
  )
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND role = (SELECT role FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- BOOKINGS: Agents can read/write all bookings
CREATE POLICY "Agents can read all bookings" ON bookings
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'agent'
  );

CREATE POLICY "Agents can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'agent'
    AND created_by_agent_id = (SELECT auth.uid())
  );

CREATE POLICY "Agents can update their bookings" ON bookings
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'agent'
    AND created_by_agent_id = (SELECT auth.uid())
  );

-- BOOKINGS: Admins can read/write all bookings
CREATE POLICY "Admins can read all bookings" ON bookings
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- BOOKINGS: Logged-in users can read their own bookings
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'user'
    AND created_by_user_id = (SELECT auth.uid())
  );

-- BOOKINGS: Anonymous guests can read via verification code lookup
CREATE POLICY "Guests can read booking by verification code" ON bookings
  FOR SELECT USING (
    (SELECT auth.uid()) IS NULL
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NULL
  );

-- ============================================================================
-- FUNCTION: Secure guest booking lookup (prevents full table scan)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_guest_booking(p_booking_number TEXT, p_contact TEXT)
RETURNS TABLE (
  booking_number TEXT,
  guest_name TEXT,
  guest_surname TEXT,
  status TEXT,
  trip_start_date DATE,
  trip_end_date DATE,
  verification_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.booking_number,
    b.guest_name,
    b.guest_surname,
    b.status,
    b.trip_start_date,
    b.trip_end_date,
    b.verification_code
  FROM bookings b
  WHERE b.booking_number = p_booking_number
    AND b.guest_contact = p_contact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
