/*
  # Optimize RLS Policies - Part 3

  Final batch of RLS policy optimizations.
  
  ## Tables Affected
  - role_approval_limits
  - customer_addresses
  - customer_contacts
  - item_relationships
  - user_metadata
*/

-- role_approval_limits
DROP POLICY IF EXISTS "Admin users can insert approval limits" ON role_approval_limits;
CREATE POLICY "Admin users can insert approval limits"
  ON role_approval_limits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin users can update approval limits" ON role_approval_limits;
CREATE POLICY "Admin users can update approval limits"
  ON role_approval_limits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin users can delete approval limits" ON role_approval_limits;
CREATE POLICY "Admin users can delete approval limits"
  ON role_approval_limits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- customer_addresses
DROP POLICY IF EXISTS "Admin users can delete customer addresses" ON customer_addresses;
CREATE POLICY "Admin users can delete customer addresses"
  ON customer_addresses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- customer_contacts
DROP POLICY IF EXISTS "Admin users can delete customer contacts" ON customer_contacts;
CREATE POLICY "Admin users can delete customer contacts"
  ON customer_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- item_relationships
DROP POLICY IF EXISTS "Admin users can delete item relationships" ON item_relationships;
CREATE POLICY "Admin users can delete item relationships"
  ON item_relationships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- user_metadata
DROP POLICY IF EXISTS "Admin users can update user metadata" ON user_metadata;
CREATE POLICY "Admin users can update user metadata"
  ON user_metadata FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );