/*
  # Consolidate Remaining Duplicate Policies

  Removes duplicate and overly permissive policies to improve security and eliminate warnings.
  
  ## Changes
  1. quote_approvals: Remove redundant SELECT policy (covered by ALL policy)
  2. reservations: Remove redundant SELECT policy (covered by ALL policy)
  3. user_roles: Remove overly permissive "System" policy, keep specific role-based policies
*/

-- quote_approvals: Remove redundant SELECT policy
-- The "System can manage quote approvals" policy already covers SELECT with USING (true)
DROP POLICY IF EXISTS "Users can view approvals for their quotes or if they can approv" ON quote_approvals;

-- reservations: Remove redundant SELECT policy
-- The "Users can manage their reservations" policy already covers SELECT
DROP POLICY IF EXISTS "Users can view their reservations" ON reservations;

-- user_roles: Remove overly permissive "System can manage user roles" policy
-- This policy allows all authenticated users full access, which overrides the restrictive policies
DROP POLICY IF EXISTS "System can manage user roles" ON user_roles;

-- Add a policy for authenticated users to view all user roles (for admin UI)
-- This is safer than the previous "System can manage user roles" policy
DROP POLICY IF EXISTS "Authenticated users can view all user roles" ON user_roles;
CREATE POLICY "Authenticated users can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);