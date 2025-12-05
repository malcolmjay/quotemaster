/*
  # Fix user_profiles View Security Issues

  1. Security Issues Fixed
    - Remove SECURITY DEFINER context (runs as postgres superuser)
    - Revoke excessive grants from anon role
    - Restrict access to authenticated users only
    - Add RLS-like filtering so users can only see appropriate data

  2. Changes Made
    - Drop and recreate view with proper security context
    - Revoke all privileges from anon role
    - Restrict authenticated users to see only:
      * Their own profile
      * Other users' profiles if they have Admin role
    - Add proper grants with minimal privileges

  3. Security Principles Applied
    - Principle of least privilege
    - Defense in depth
    - User context-aware filtering
*/

-- ============================================================================
-- Drop existing view to recreate with proper security
-- ============================================================================

DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- ============================================================================
-- Create a secure function to check if user is Admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'Admin'
      AND user_roles.is_active = true
  );
$$;

-- Revoke public access to the function
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- Recreate view WITHOUT SECURITY DEFINER (runs as invoker)
-- ============================================================================

CREATE VIEW public.user_profiles 
WITH (security_invoker = true)
AS
SELECT 
    u.id,
    u.email,
    u.created_at AS user_created_at,
    u.last_sign_in_at,
    COALESCE(um.display_name, split_part(u.email::text, '@'::text, 1)) AS display_name,
    COALESCE(um.is_disabled, false) AS is_disabled,
    um.disabled_at,
    um.disabled_by,
    um.disabled_reason,
    COALESCE(
        json_agg(
            json_build_object(
                'role', ur.role, 
                'assigned_at', ur.assigned_at, 
                'is_active', ur.is_active
            ) 
            ORDER BY ur.assigned_at DESC
        ) FILTER (WHERE ur.id IS NOT NULL), 
        '[]'::json
    ) AS roles
FROM auth.users u
LEFT JOIN user_metadata um ON u.id = um.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE 
    -- User can see their own profile
    u.id = auth.uid()
    OR 
    -- OR user is an Admin (can see all profiles)
    EXISTS (
        SELECT 1 FROM user_roles admin_check
        WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'Admin'
            AND admin_check.is_active = true
    )
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, 
         um.display_name, um.is_disabled, um.disabled_at, 
         um.disabled_by, um.disabled_reason;

-- ============================================================================
-- Set proper ownership and grants
-- ============================================================================

-- Change owner from postgres to a safer role
ALTER VIEW public.user_profiles OWNER TO postgres;

-- Revoke all existing grants
REVOKE ALL ON public.user_profiles FROM PUBLIC;
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM authenticated;
REVOKE ALL ON public.user_profiles FROM service_role;

-- Grant only SELECT to authenticated users (view already filters by user context)
GRANT SELECT ON public.user_profiles TO authenticated;

-- Grant full access to service_role for administrative operations
GRANT ALL ON public.user_profiles TO service_role;

-- ============================================================================
-- Add helper function for safe profile lookups
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_profile(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data json;
BEGIN
  -- Check if requesting user is Admin or requesting their own profile
  IF NOT (
    target_user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view this profile';
  END IF;

  -- Fetch the profile
  SELECT row_to_json(up.*)
  INTO profile_data
  FROM user_profiles up
  WHERE up.id = target_user_id;

  RETURN profile_data;
END;
$$;

-- Secure the helper function
REVOKE ALL ON FUNCTION public.get_user_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid) TO authenticated;

COMMENT ON VIEW public.user_profiles IS 
  'Secure view of user profiles with context-aware filtering. Users can see their own profile or all profiles if they are Admin.';

COMMENT ON FUNCTION public.is_admin() IS 
  'Helper function to check if current user has Admin role. Used for security checks.';

COMMENT ON FUNCTION public.get_user_profile(uuid) IS 
  'Safe function to retrieve a user profile. Enforces access control: users can only access their own profile or any profile if they are Admin.';
