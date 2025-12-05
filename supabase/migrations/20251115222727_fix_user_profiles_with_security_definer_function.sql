/*
  # Fix user_profiles Access with Security Definer Function

  1. Problem
    - The user_profiles view uses security_invoker which runs with caller's permissions
    - Authenticated users don't have direct access to auth.users table
    - This causes "permission denied for table users" errors

  2. Solution
    - Create a SECURITY DEFINER function that safely fetches all user profiles
    - Function runs with elevated privileges to access auth.users
    - Add proper security checks (Admin-only access)
    - Function returns the same data structure as the view

  3. Security
    - Function is SECURITY DEFINER (runs with creator's privileges)
    - Only accessible to authenticated users
    - Returns data only if user is Admin (enforced in function)
    - All queries are parameterized and safe
*/

-- ============================================================================
-- Create secure function to get all user profiles (Admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_all_user_profiles()
RETURNS TABLE (
    id uuid,
    email text,
    user_created_at timestamptz,
    last_sign_in_at timestamptz,
    display_name text,
    is_disabled boolean,
    disabled_at timestamptz,
    disabled_by uuid,
    disabled_reason text,
    roles json
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requesting user is Admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'Admin'
      AND user_roles.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required to view all user profiles';
  END IF;

  -- Return all user profiles with elevated permissions
  RETURN QUERY
  SELECT 
      u.id,
      u.email::text,
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
  GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, 
           um.display_name, um.is_disabled, um.disabled_at, 
           um.disabled_by, um.disabled_reason
  ORDER BY u.created_at DESC;
END;
$$;

-- ============================================================================
-- Set proper permissions on the function
-- ============================================================================

-- Revoke all existing grants
REVOKE ALL ON FUNCTION public.get_all_user_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_all_user_profiles() FROM anon;

-- Grant execute only to authenticated users (function enforces Admin check)
GRANT EXECUTE ON FUNCTION public.get_all_user_profiles() TO authenticated;

-- Document the function
COMMENT ON FUNCTION public.get_all_user_profiles() IS 
  'Securely fetches all user profiles with auth.users data. Admin-only access enforced within function. Use this instead of querying user_profiles view directly.';
