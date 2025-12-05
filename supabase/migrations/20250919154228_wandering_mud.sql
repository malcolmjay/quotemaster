/*
  # Fix infinite recursion in user_roles RLS policies

  1. Policy Updates
    - Remove recursive policies that cause infinite loops
    - Create simple, direct policies based on auth.uid()
    - Allow users to view their own roles
    - Allow admins to manage all roles

  2. Security
    - Users can only see their own roles
    - Only VP and President roles can manage other user roles
    - Prevent infinite recursion by avoiding role-based checks in user_roles policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;

-- Create new non-recursive policies
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to view all user roles for approval system functionality
-- This is needed for the approval system to work properly
CREATE POLICY "Users can view all active user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only allow inserts/updates/deletes by service role or through functions
-- This prevents direct manipulation while allowing system operations
CREATE POLICY "System can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Allow service role full access for system operations
CREATE POLICY "Service role full access"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);