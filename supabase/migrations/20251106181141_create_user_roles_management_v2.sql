/*
  # Create User Roles Management System

  1. New Tables
    - `user_roles` - Maps users to their assigned roles with metadata
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text) - Role name: Admin, Manager, Director, VP, President, CSR
      - `assigned_by` (uuid, references auth.users) - Who assigned this role
      - `assigned_at` (timestamptz) - When the role was assigned
      - `is_active` (boolean) - Whether the role is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_roles` table
    - Authenticated users can view all user roles
    - Only users can manage role assignments (will be enforced by app logic)

  3. Indexes
    - Index on user_id for fast lookups
    - Index on role for filtering by role type
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('Admin', 'Manager', 'Director', 'VP', 'President', 'CSR')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view user roles
CREATE POLICY "Authenticated users can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create role assignments
CREATE POLICY "Authenticated users can create role assignments"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (assigned_by = auth.uid());

-- Allow authenticated users to update role assignments
CREATE POLICY "Authenticated users can update role assignments"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete role assignments
CREATE POLICY "Authenticated users can delete role assignments"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;

-- Create updated_at trigger (drop first if exists)
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view to get user details with their roles
DROP VIEW IF EXISTS user_profiles;
CREATE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  u.last_sign_in_at,
  COALESCE(
    json_agg(
      json_build_object(
        'role', ur.role,
        'assigned_at', ur.assigned_at,
        'is_active', ur.is_active
      ) ORDER BY ur.assigned_at DESC
    ) FILTER (WHERE ur.id IS NOT NULL),
    '[]'::json
  ) as roles
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;