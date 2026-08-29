-- ============================================================================
-- PHASE 8: Capture first_name/surname at signup
--
-- handle_new_user() previously only set role='user', leaving first_name/
-- surname null. The client used to fill them in with a follow-up UPDATE
-- right after signUp() — but that update runs unauthenticated (no session
-- yet) whenever the project requires email confirmation, so RLS silently
-- blocked it and every new profile ended up with a blank name.
--
-- Fix: read the name straight from auth.users.raw_user_meta_data, which
-- Supabase populates from signUp()'s `options.data` at the same moment it
-- creates the user row — no session or RLS involved, works every time.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, surname)
  VALUES (
    new.id,
    'user',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'surname'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- BACKFILL existing profiles that were created with this bug — pulls the
-- name out of auth.users' metadata for anyone who signed up before this
-- fix and still has a blank profiles.first_name.
-- ============================================================================
UPDATE public.profiles p
SET
  first_name = u.raw_user_meta_data->>'first_name',
  surname = u.raw_user_meta_data->>'surname'
FROM auth.users u
WHERE p.id = u.id
  AND p.first_name IS NULL
  AND u.raw_user_meta_data->>'first_name' IS NOT NULL;
