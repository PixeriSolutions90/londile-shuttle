-- ============================================================================
-- PHASE 7: Fix Broken Booking Creation + Quotes & Invoices
--
-- Part A fixes three real bugs discovered while reconciling the schema,
-- unrelated to quotes/invoices but blocking real bookings from ever being
-- created:
--   1. bookings.vehicle_id / bookings.zone_id were given the WRONG foreign
--      key in migration 003 — they reference profiles(id) instead of
--      vehicles(id)/zones(id), making it impossible to store a real
--      vehicle or zone selection.
--   2. The booking_creator CHECK constraint (migration 001) requires
--      EXACTLY ONE of created_by_agent_id/created_by_user_id to be set —
--      guest bookings (neither set) violate it outright.
--   3. pickup_date/pickup_time/dropoff_date/dropoff_time became NOT NULL
--      in migration 003 with no default, but the API route inserting
--      bookings was never updated to populate them.
--
-- Part B adds the quotes and invoices tables from the build brief.
--
-- Every statement is safe to re-run.
-- ============================================================================

-- ============================================================================
-- PART A1: Fix vehicle_id / zone_id foreign keys
-- ============================================================================
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_vehicle_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_zone_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_zone_id_fkey
  FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE SET NULL;

-- ============================================================================
-- PART A2: Allow guest bookings (neither agent nor user set)
-- Was: exactly one of the two must be set. Now: at most one — both null
-- means a public guest booking, which is the majority of real traffic.
-- ============================================================================
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS booking_creator;
ALTER TABLE public.bookings
  ADD CONSTRAINT booking_creator CHECK (
    NOT (created_by_agent_id IS NOT NULL AND created_by_user_id IS NOT NULL)
  );

-- ============================================================================
-- PART A3: Deprecated trip_start_date/trip_end_date no longer need to be
-- populated now that the API route is being fixed to use pickup_date/
-- dropoff_date directly — loosen (not drop, to avoid touching historical
-- rows) so future inserts don't need to redundantly fill dead columns.
-- ============================================================================
ALTER TABLE public.bookings ALTER COLUMN trip_start_date DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN trip_end_date DROP NOT NULL;

-- ============================================================================
-- PART A4: source + payment_status (additive, from the build brief)
-- ============================================================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'public' CHECK (source IN ('public', 'agent'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- ============================================================================
-- PART B1: QUOTES TABLE
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'QT-' || LPAD(nextval('quote_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL UNIQUE,

  -- Client contact — mirrors the guest_* naming already used on bookings
  guest_name TEXT NOT NULL,
  guest_surname TEXT NOT NULL,
  guest_contact TEXT NOT NULL,
  guest_email TEXT,

  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,

  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_date DATE,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  is_return_trip BOOLEAN NOT NULL DEFAULT FALSE,

  quoted_total DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',

  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'expired')) DEFAULT 'draft',

  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS quotes_company_id_idx ON quotes(company_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE INDEX IF NOT EXISTS quotes_created_by_agent_id_idx ON quotes(created_by_agent_id);

DROP POLICY IF EXISTS "Admins can manage quotes" ON quotes;
CREATE POLICY "Admins can manage quotes" ON quotes
  FOR ALL USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Agents can read their company's quotes" ON quotes;
CREATE POLICY "Agents can read their company's quotes" ON quotes
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND company_id IS NOT NULL
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Agents can create quotes for their company" ON quotes;
CREATE POLICY "Agents can create quotes for their company" ON quotes
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'agent'
    AND created_by_agent_id = auth.uid()
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Agents can update their company's quotes" ON quotes;
CREATE POLICY "Agents can update their company's quotes" ON quotes
  FOR UPDATE USING (
    public.get_user_role() = 'agent'
    AND company_id IS NOT NULL
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART B2: INVOICES TABLE
-- No PDF generation exists yet — pdf_url stays null until that's built.
-- company_id is denormalized from the booking for simpler RLS (avoids a
-- join through bookings in every policy check).
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,

  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  pdf_url TEXT,

  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS invoices_booking_id_idx ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS invoices_company_id_idx ON invoices(company_id);

DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Agents can read their company's invoices" ON invoices;
CREATE POLICY "Agents can read their company's invoices" ON invoices
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND company_id IS NOT NULL
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
