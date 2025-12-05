/*
  # Create Role Approval Limits Configuration

  1. New Tables
    - `role_approval_limits`
      - `id` (uuid, primary key)
      - `role` (user_role_type, unique) - The role this limit applies to
      - `min_amount` (numeric) - Minimum approval amount for this role
      - `max_amount` (numeric) - Maximum approval amount for this role
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `role_approval_limits` table
    - Allow all authenticated users to view approval limits
    - Only authenticated users can modify approval limits (requires admin check in application)
  
  3. Default Values
    - CSR: $0 - $10,000
    - Manager: $10,001 - $50,000
    - Director: $50,001 - $100,000
    - VP: $100,001 - $250,000
    - President: $250,001 - $1,000,000
    - Admin: $0 - $999,999,999 (unlimited)
*/

-- Create role_approval_limits table
CREATE TABLE IF NOT EXISTS role_approval_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE,
  min_amount numeric(15,2) NOT NULL DEFAULT 0,
  max_amount numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_amount_range CHECK (min_amount >= 0 AND max_amount >= min_amount)
);

-- Enable RLS
ALTER TABLE role_approval_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view role approval limits"
  ON role_approval_limits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert approval limits"
  ON role_approval_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update approval limits"
  ON role_approval_limits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete approval limits"
  ON role_approval_limits
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_role_approval_limits_role ON role_approval_limits(role);

-- Create trigger for updated_at
CREATE TRIGGER update_role_approval_limits_updated_at
  BEFORE UPDATE ON role_approval_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default approval limits for each role
INSERT INTO role_approval_limits (role, min_amount, max_amount) VALUES
  ('CSR', 0, 10000),
  ('Manager', 10001, 50000),
  ('Director', 50001, 100000),
  ('VP', 100001, 250000),
  ('President', 250001, 1000000),
  ('Admin', 0, 999999999)
ON CONFLICT (role) DO NOTHING;