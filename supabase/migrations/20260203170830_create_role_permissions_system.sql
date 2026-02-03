/*
  # Create Role-Based Permission System
  
  ## Overview
  This migration creates a comprehensive role-based permission system that allows
  administrators to define custom roles and configure granular CRUD permissions
  for each database table.
  
  ## New Tables
  
  ### 1. `roles`
  Stores role definitions with descriptions
  - `id` (uuid, primary key)
  - `name` (text, unique) - Role name (e.g., "Admin", "Manager")
  - `description` (text) - User-friendly description of the role
  - `is_system_role` (boolean) - Whether this is a built-in system role
  - `is_active` (boolean) - Whether the role is currently active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. `role_permissions`
  Stores CRUD permissions for each role per table
  - `id` (uuid, primary key)
  - `role_id` (uuid, references roles)
  - `table_name` (text) - Name of the database table
  - `can_create` (boolean) - Can insert records
  - `can_read` (boolean) - Can select/view records
  - `can_update` (boolean) - Can update records
  - `can_delete` (boolean) - Can delete records
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on both tables
  - Only Admin users can manage roles and permissions
  - All authenticated users can view roles and permissions
  
  ## Initial Data
  - Create default system roles (Admin, Manager, Director, VP, President, CSR)
  - Set up Admin role with full permissions
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  can_create boolean DEFAULT false,
  can_read boolean DEFAULT false,
  can_update boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, table_name)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "All authenticated users can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can update roles"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can delete non-system roles"
  ON roles
  FOR DELETE
  TO authenticated
  USING (
    NOT is_system_role
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- RLS Policies for role_permissions table
CREATE POLICY "All authenticated users can view role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create role permissions"
  ON role_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can update role permissions"
  ON role_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can delete role permissions"
  ON role_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_table_name ON role_permissions(table_name);

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('Admin', 'Full system access with ability to manage users, roles, and all data', true),
  ('Manager', 'Can manage quotes, customers, and products with approval authority', true),
  ('Director', 'Senior management role with extended approval limits', true),
  ('VP', 'Vice President with high-level approval authority', true),
  ('President', 'Highest level of approval authority', true),
  ('CSR', 'Customer Service Representative with basic quote and customer management', true)
ON CONFLICT (name) DO NOTHING;

-- Set up Admin role with full permissions on all main tables
DO $$
DECLARE
  admin_role_id uuid;
  table_names text[] := ARRAY[
    'quotes',
    'quote_line_items',
    'customers',
    'customer_addresses',
    'customer_contacts',
    'products',
    'cross_references',
    'item_relationships',
    'price_requests',
    'approval_actions',
    'user_roles',
    'roles',
    'role_permissions',
    'app_configurations',
    'tasks',
    'messages',
    'notifications',
    'ai_conversations'
  ];
  tbl_name text;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
  
  FOREACH tbl_name IN ARRAY table_names
  LOOP
    INSERT INTO role_permissions (role_id, table_name, can_create, can_read, can_update, can_delete)
    VALUES (admin_role_id, tbl_name, true, true, true, true)
    ON CONFLICT (role_id, table_name) DO UPDATE
    SET can_create = true, can_read = true, can_update = true, can_delete = true;
  END LOOP;
END $$;

-- Create a helper function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_table_name text,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_perm boolean := false;
BEGIN
  SELECT 
    CASE p_permission
      WHEN 'create' THEN bool_or(rp.can_create)
      WHEN 'read' THEN bool_or(rp.can_read)
      WHEN 'update' THEN bool_or(rp.can_update)
      WHEN 'delete' THEN bool_or(rp.can_delete)
      ELSE false
    END INTO has_perm
  FROM user_roles ur
  JOIN roles r ON r.name = ur.role::text
  JOIN role_permissions rp ON rp.role_id = r.id
  WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND r.is_active = true
    AND rp.table_name = p_table_name;
  
  RETURN COALESCE(has_perm, false);
END;
$$;

-- Create a view to show user permissions
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  ur.user_id,
  ur.role::text as role,
  rp.table_name,
  rp.can_create,
  rp.can_read,
  rp.can_update,
  rp.can_delete
FROM user_roles ur
JOIN roles r ON r.name = ur.role::text
JOIN role_permissions rp ON rp.role_id = r.id
WHERE ur.is_active = true
  AND r.is_active = true;

GRANT SELECT ON user_permissions TO authenticated;