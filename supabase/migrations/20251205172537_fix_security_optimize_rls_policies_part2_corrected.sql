/*
  # Optimize RLS Policies - Part 2 (Corrected)

  Continues wrapping auth functions in SELECT for remaining tables.
  
  ## Tables Affected
  - user_roles
  - price_requests
  - app_configurations
  - quotes
  - quote_line_items
*/

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create role assignments" ON user_roles;
CREATE POLICY "Authenticated users can create role assignments"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin users can update role assignments" ON user_roles;
CREATE POLICY "Admin users can update role assignments"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin users can delete role assignments" ON user_roles;
CREATE POLICY "Admin users can delete role assignments"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- price_requests
DROP POLICY IF EXISTS "Users can create price requests" ON price_requests;
CREATE POLICY "Users can create price requests"
  ON price_requests FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update price requests" ON price_requests;
CREATE POLICY "Users can update price requests"
  ON price_requests FOR UPDATE
  TO authenticated
  USING (requested_by = (select auth.uid()) OR completed_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete price requests" ON price_requests;
CREATE POLICY "Users can delete price requests"
  ON price_requests FOR DELETE
  TO authenticated
  USING (requested_by = (select auth.uid()));

-- app_configurations
DROP POLICY IF EXISTS "Authenticated users can insert configurations" ON app_configurations;
CREATE POLICY "Authenticated users can insert configurations"
  ON app_configurations FOR INSERT
  TO authenticated
  WITH CHECK (last_updated_by = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update configurations" ON app_configurations;
CREATE POLICY "Authenticated users can update configurations"
  ON app_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (last_updated_by = (select auth.uid()));

DROP POLICY IF EXISTS "Admin users can delete configurations" ON app_configurations;
CREATE POLICY "Admin users can delete configurations"
  ON app_configurations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (select auth.uid())
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- quotes
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;
CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own quotes" ON quotes;
CREATE POLICY "Users can delete own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- quote_line_items
DROP POLICY IF EXISTS "Users can create line items for own quotes" ON quote_line_items;
CREATE POLICY "Users can create line items for own quotes"
  ON quote_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_line_items.quote_id
      AND quotes.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete line items for own quotes" ON quote_line_items;
CREATE POLICY "Users can delete line items for own quotes"
  ON quote_line_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_line_items.quote_id
      AND quotes.created_by = (select auth.uid())
    )
  );