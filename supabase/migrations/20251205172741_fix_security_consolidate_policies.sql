/*
  # Consolidate Multiple Permissive Policies

  Merges redundant view and manage policies into single efficient policies.
  Improves security policy clarity and reduces policy evaluation overhead.
  
  ## Tables Affected
  - cross_references
  - customer_users
  - customers
  - inventory_levels
  - price_breaks
  - products
  - quote_approvals
  - user_roles
*/

-- cross_references: Merge view and manage policies
DROP POLICY IF EXISTS "Authenticated users can view cross references" ON cross_references;
DROP POLICY IF EXISTS "Authenticated users can manage cross references" ON cross_references;
CREATE POLICY "Authenticated users can access cross references"
  ON cross_references FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- customer_users: Merge view and manage policies
DROP POLICY IF EXISTS "Authenticated users can view customer users" ON customer_users;
DROP POLICY IF EXISTS "Authenticated users can manage customer users" ON customer_users;
CREATE POLICY "Authenticated users can access customer users"
  ON customer_users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- customers: Merge view and manage policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
CREATE POLICY "Authenticated users can access customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- inventory_levels: Merge view and manage policies
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory_levels;
DROP POLICY IF EXISTS "Authenticated users can manage inventory" ON inventory_levels;
CREATE POLICY "Authenticated users can access inventory"
  ON inventory_levels FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- price_breaks: Merge view and manage policies
DROP POLICY IF EXISTS "Authenticated users can view price breaks" ON price_breaks;
DROP POLICY IF EXISTS "Authenticated users can manage price breaks" ON price_breaks;
CREATE POLICY "Authenticated users can access price breaks"
  ON price_breaks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- products: Merge view and manage policies
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
CREATE POLICY "Authenticated users can access products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- quote_approvals: Keep system policy, optimize user policy
DROP POLICY IF EXISTS "System can manage quote approvals" ON quote_approvals;
CREATE POLICY "System can manage quote approvals"
  ON quote_approvals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- user_roles: Consolidate view policies (keep admin policies separate as they were already optimized)
DROP POLICY IF EXISTS "Authenticated users can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view all active user roles" ON user_roles;
DROP POLICY IF EXISTS "System can manage user roles" ON user_roles;
CREATE POLICY "System can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);