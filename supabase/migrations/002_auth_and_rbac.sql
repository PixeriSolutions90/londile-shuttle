-- ============================================================================
-- PHASE 2: Auto-Profile Creation & JWT Claims
-- ============================================================================

-- ============================================================================
-- FUNCTION: Create profile on user signup (handles new auth.users)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profiles on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Get user role from JWT or database
-- Optimized for RLS policies: checks JWT first, falls back to DB
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Try to get role from JWT custom claims
  user_role := (current_setting('request.jwt.claims', true)::jsonb->>'role');

  -- If not in JWT, query database
  IF user_role IS NULL THEN
    SELECT role INTO user_role FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Assign role to user (admin only)
-- Creates audit log and updates JWT claims
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assign_role_to_user(
  target_user_id UUID,
  new_role TEXT
)
RETURNS jsonb AS $$
DECLARE
  current_user_role TEXT;
  result JSONB;
BEGIN
  -- Check if current user is admin
  current_user_role := public.get_user_role();

  IF current_user_role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only admins can assign roles');
  END IF;

  -- Validate role
  IF new_role NOT IN ('admin', 'agent', 'user') THEN
    RETURN jsonb_build_object('error', 'Invalid role: ' || new_role);
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET role = new_role, updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;

  -- Update Supabase custom claims
  UPDATE auth.users
  SET raw_app_meta_data =
    CASE
      WHEN raw_app_meta_data IS NULL THEN
        jsonb_build_object('role', new_role)
      ELSE
        raw_app_meta_data || jsonb_build_object('role', new_role)
    END
  WHERE id = target_user_id;

  -- Log the role assignment
  INSERT INTO public.audit_logs (user_id, action, resource, details)
  VALUES (
    auth.uid(),
    'role_assigned',
    'user:' || target_user_id::text,
    jsonb_build_object('new_role', new_role, 'target_user', target_user_id)
  );

  result := jsonb_build_object(
    'success', true,
    'message', 'Role assigned successfully',
    'user_id', target_user_id,
    'new_role', new_role
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCTION: Request agent role (user applies to become agent)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.request_agent_role(
  company_name TEXT,
  vat_number TEXT,
  company_registration TEXT,
  company_address TEXT
)
RETURNS jsonb AS $$
DECLARE
  result JSONB;
  user_id UUID;
BEGIN
  user_id := auth.uid();

  -- Check if user already has agent role
  IF (SELECT role FROM profiles WHERE id = user_id) = 'agent' THEN
    RETURN jsonb_build_object('error', 'User already has agent role');
  END IF;

  -- Update profile with agent details
  UPDATE public.profiles
  SET
    company_name = request_agent_role.company_name,
    vat_number = request_agent_role.vat_number,
    company_registration = request_agent_role.company_registration,
    company_address = request_agent_role.company_address,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id;

  -- Create pending approval record
  INSERT INTO public.role_requests (user_id, requested_role, company_details, status)
  VALUES (
    user_id,
    'agent',
    jsonb_build_object(
      'company_name', company_name,
      'vat_number', vat_number,
      'company_registration', company_registration,
      'company_address', company_address
    ),
    'pending'
  );

  -- Log the request
  INSERT INTO public.audit_logs (user_id, action, resource, details)
  VALUES (
    user_id,
    'agent_role_requested',
    'user:' || user_id::text,
    jsonb_build_object('company_name', company_name)
  );

  result := jsonb_build_object(
    'success', true,
    'message', 'Agent role request submitted. Awaiting admin approval.',
    'user_id', user_id
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- FUNCTION: Approve or reject agent role request (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.review_agent_request(
  request_id UUID,
  approved BOOLEAN,
  admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  current_user_role TEXT;
  target_user_id UUID;
  result JSONB;
BEGIN
  -- Check if current user is admin
  current_user_role := public.get_user_role();

  IF current_user_role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only admins can review agent requests');
  END IF;

  -- Get the user ID from the request
  SELECT user_id INTO target_user_id FROM public.role_requests WHERE id = request_id;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;

  -- Update request status
  UPDATE public.role_requests
  SET
    status = CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    reviewed_at = CURRENT_TIMESTAMP,
    reviewed_by = auth.uid(),
    admin_notes = review_agent_request.admin_notes,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = request_id;

  -- If approved, assign agent role
  IF approved THEN
    PERFORM public.assign_role_to_user(target_user_id, 'agent');

    result := jsonb_build_object(
      'success', true,
      'message', 'Agent request approved',
      'user_id', target_user_id,
      'status', 'approved'
    );
  ELSE
    result := jsonb_build_object(
      'success', true,
      'message', 'Agent request rejected',
      'user_id', target_user_id,
      'status', 'rejected'
    );
  END IF;

  -- Log the review
  INSERT INTO public.audit_logs (user_id, action, resource, details)
  VALUES (
    auth.uid(),
    'agent_request_' || CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    'user:' || target_user_id::text,
    jsonb_build_object('request_id', request_id, 'notes', admin_notes)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ROLE REQUESTS TABLE (for agent approvals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('agent', 'admin')),
  company_details JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX role_requests_user_id_idx ON role_requests(user_id);
CREATE INDEX role_requests_status_idx ON role_requests(status);

-- RLS: Users can see their own requests
CREATE POLICY "Users can see own role requests" ON role_requests
  FOR SELECT USING (user_id = auth.uid());

-- RLS: Admins can see all requests
CREATE POLICY "Admins can see all role requests" ON role_requests
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS: Admins can update requests
CREATE POLICY "Admins can review role requests" ON role_requests
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- AUDIT LOGS TABLE (security logging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- RLS: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- UPDATE RLS POLICIES TO USE JWT-OPTIMIZED get_user_role()
-- ============================================================================

-- Drop old policies that use inline role checks
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Agents can read all bookings" ON bookings;
DROP POLICY IF EXISTS "Agents can create bookings" ON bookings;
DROP POLICY IF EXISTS "Agents can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can read all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;

-- Recreate with optimized function
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Agents can read all bookings" ON bookings
  FOR SELECT USING (
    public.get_user_role() = 'agent'
  );

CREATE POLICY "Agents can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'agent'
    AND created_by_agent_id = auth.uid()
  );

CREATE POLICY "Agents can update their bookings" ON bookings
  FOR UPDATE USING (
    public.get_user_role() = 'agent'
    AND created_by_agent_id = auth.uid()
  );

CREATE POLICY "Admins can read all bookings" ON bookings
  FOR SELECT USING (
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (
    public.get_user_role() = 'admin'
  );
