-- ============================================================================
-- PHASE 6: Companies & Company-Scoped Agent Access
--
-- Introduces a Company entity so multiple invited agent users can belong to
-- the same company and share visibility into that company's bookings —
-- instead of agents being flat individuals who (per the pre-existing policy
-- this migration replaces) could read EVERY booking on the platform
-- regardless of who created it.
--
-- Every statement below is safe to re-run: tables/columns/indexes use
-- IF NOT EXISTS, and every policy/trigger is dropped-if-exists before being
-- recreated. This script does not need a clean slate to apply successfully.
-- ============================================================================

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL UNIQUE,
  vat_number TEXT,
  registration_number TEXT,
  address TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS companies_is_active_idx ON companies(is_active);

-- ============================================================================
-- LINK PROFILES TO COMPANIES
-- Must happen BEFORE any policy references profiles.company_id (Postgres
-- validates column references at CREATE POLICY time, not just at query
-- time) — this is why the first version of this migration failed.
--
-- Supersedes the free-text company_name/vat_number/company_registration/
-- company_address fields for agents going forward. Those columns are left
-- in place (unused by the invite flow now) rather than dropped, since the
-- request_agent_role() self-service RPC still writes to them and removing
-- them isn't necessary to ship this.
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_company_id_idx ON profiles(company_id);

-- ============================================================================
-- COMPANIES RLS (now safe — profiles.company_id exists)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Agents can read own company" ON companies;
CREATE POLICY "Agents can read own company" ON companies
  FOR SELECT USING (
    id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- LINK BOOKINGS TO COMPANIES
-- Additive + nullable: public guest bookings (source of most existing rows)
-- have no company and remain unaffected.
-- ============================================================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_company_id_idx ON bookings(company_id);

-- ============================================================================
-- TIGHTEN AGENT RLS ON BOOKINGS: company-scoped, not platform-wide
-- ============================================================================
DROP POLICY IF EXISTS "Agents can read all bookings" ON bookings;
DROP POLICY IF EXISTS "Agents can create bookings" ON bookings;
DROP POLICY IF EXISTS "Agents can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Agents can read their company's bookings" ON bookings;
DROP POLICY IF EXISTS "Agents can create bookings for their company" ON bookings;
DROP POLICY IF EXISTS "Agents can update their company's bookings" ON bookings;

-- Any agent at the same company sees the same shared queue of bookings —
-- that's the point of grouping them under a company — not just bookings
-- they personally created.
CREATE POLICY "Agents can read their company's bookings" ON bookings
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND company_id IS NOT NULL
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Agents can create bookings for their company" ON bookings
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'agent'
    AND created_by_agent_id = auth.uid()
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Agents can update their company's bookings" ON bookings
  FOR UPDATE USING (
    public.get_user_role() = 'agent'
    AND company_id IS NOT NULL
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Admins remain unscoped (see/manage every company) — their existing
-- "Admins can read/update all bookings" policies from migration 002 are
-- untouched by this migration.
