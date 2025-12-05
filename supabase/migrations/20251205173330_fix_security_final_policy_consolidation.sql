/*
  # Final Policy Consolidation

  Remove remaining duplicate SELECT policy from user_roles.
  Keep the more permissive policy since the system needs to view all user roles.
*/

-- user_roles: Remove redundant "Users can view own roles" policy
-- The "Authenticated users can view all user roles" policy already covers this
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;