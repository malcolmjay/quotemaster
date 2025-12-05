/*
  # Add User Metadata Table

  1. New Tables
    - `user_metadata` - Stores additional user information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Unique reference to auth user
      - `display_name` (text) - User's display name
      - `is_disabled` (boolean) - Whether the user account is disabled
      - `disabled_at` (timestamptz) - When the account was disabled
      - `disabled_by` (uuid) - Who disabled the account
      - `disabled_reason` (text) - Reason for disabling
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_metadata` table
    - Authenticated users can view all user metadata
    - Only authenticated users can manage user metadata

  3. View Update
    - Update user_profiles view to include display_name and is_disabled
*/

-- Create user_metadata table
CREATE TABLE IF NOT EXISTS user_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  is_disabled boolean DEFAULT false,
  disabled_at timestamptz,
  disabled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  disabled_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view user metadata
CREATE POLICY "Authenticated users can view all user metadata"
  ON user_metadata
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert user metadata
CREATE POLICY "Authenticated users can insert user metadata"
  ON user_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update user metadata
CREATE POLICY "Authenticated users can update user metadata"
  ON user_metadata
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_disabled ON user_metadata(is_disabled) WHERE is_disabled = true;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_user_metadata_updated_at ON user_metadata;
CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON user_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update user_profiles view to include metadata
DROP VIEW IF EXISTS user_profiles;
CREATE VIEW user_profiles AS
SELECT
  u.id,
  u.email,
  u.created_at as user_created_at,
  u.last_sign_in_at,
  COALESCE(um.display_name, split_part(u.email, '@', 1)) as display_name,
  COALESCE(um.is_disabled, false) as is_disabled,
  um.disabled_at,
  um.disabled_by,
  um.disabled_reason,
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
LEFT JOIN user_metadata um ON u.id = um.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, um.display_name, um.is_disabled, um.disabled_at, um.disabled_by, um.disabled_reason;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;