/*
  # Fix Overly Permissive RLS Policies

  1. Security Issues Fixed
    - Remove policies with USING (true) that allow unrestricted access
    - Add proper authorization checks for sensitive operations
    - Implement role-based access control where needed

  2. Changes Made
    - app_configurations: Restrict delete to Admin users only
    - user_roles: Add Admin-only policies for sensitive operations
    - role_approval_limits: Restrict modifications to Admin users
    - customer_addresses, customer_contacts: Restrict delete to authorized users
    - item_relationships: Restrict delete to authorized users

  3. Security Principles Applied
    - Least privilege: Users can only access what they need
    - Defense in depth: Multiple layers of security checks
    - No unrestricted access: All policies check authentication and authorization
*/

-- ============================================================================
-- APP CONFIGURATIONS - Restrict deletion to Admin users only
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete configurations" ON app_configurations;

CREATE POLICY "Admin users can delete configurations"
  ON app_configurations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  );

-- ============================================================================
-- USER ROLES - Add Admin-only policies for sensitive operations
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete role assignments" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can update role assignments" ON user_roles;

-- Only Admins can delete role assignments
CREATE POLICY "Admin users can delete role assignments"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'Admin'
        AND ur.is_active = true
    )
  );

-- Only Admins can update role assignments
CREATE POLICY "Admin users can update role assignments"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'Admin'
        AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'Admin'
        AND ur.is_active = true
    )
  );

-- ============================================================================
-- ROLE APPROVAL LIMITS - Restrict to Admin users only
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete approval limits" ON role_approval_limits;
DROP POLICY IF EXISTS "Authenticated users can insert approval limits" ON role_approval_limits;
DROP POLICY IF EXISTS "Authenticated users can update approval limits" ON role_approval_limits;

CREATE POLICY "Admin users can delete approval limits"
  ON role_approval_limits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  );

CREATE POLICY "Admin users can insert approval limits"
  ON role_approval_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  );

CREATE POLICY "Admin users can update approval limits"
  ON role_approval_limits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  );

-- ============================================================================
-- CUSTOMER ADDRESSES - Restrict deletion
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete customer addresses" ON customer_addresses;

CREATE POLICY "Admin users can delete customer addresses"
  ON customer_addresses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('Admin', 'Manager', 'Director')
        AND user_roles.is_active = true
    )
  );

-- ============================================================================
-- CUSTOMER CONTACTS - Restrict deletion
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete customer contacts" ON customer_contacts;

CREATE POLICY "Admin users can delete customer contacts"
  ON customer_contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('Admin', 'Manager', 'Director')
        AND user_roles.is_active = true
    )
  );

-- ============================================================================
-- ITEM RELATIONSHIPS - Restrict deletion
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete item relationships" ON item_relationships;

CREATE POLICY "Admin users can delete item relationships"
  ON item_relationships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  );

-- ============================================================================
-- USER METADATA - Restrict modifications
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can update user metadata" ON user_metadata;

CREATE POLICY "Admin users can update user metadata"
  ON user_metadata
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'Admin'
        AND user_roles.is_active = true
    )
  );
