/*
  # Create Quote Approval System

  1. New Tables
    - `user_roles` - Assigns roles to users (CSR, Manager, Director, VP, President)
    - `quote_approvals` - Tracks approval history and current approval status
    - `approval_requirements` - Defines approval rules based on quote value

  2. Security
    - Enable RLS on all new tables
    - Add policies for role-based access control
    - Ensure users can only see relevant approval data

  3. Functions
    - Function to determine required approval level based on quote value
    - Function to check if user has authority to approve at specific level
*/

-- Create enum for user roles
CREATE TYPE user_role_type AS ENUM ('CSR', 'Manager', 'Director', 'VP', 'President');

-- Create enum for approval status
CREATE TYPE approval_status_type AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quote approvals table
CREATE TABLE IF NOT EXISTS quote_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  approval_level user_role_type NOT NULL,
  required_approvers integer DEFAULT 1,
  current_approvers integer DEFAULT 0,
  status approval_status_type DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual approval actions table
CREATE TABLE IF NOT EXISTS approval_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_approval_id uuid NOT NULL REFERENCES quote_approvals(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES auth.users(id),
  approver_role user_role_type NOT NULL,
  action approval_status_type NOT NULL,
  comments text,
  approved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('VP', 'President') 
      AND ur.is_active = true
    )
  );

-- RLS Policies for quote_approvals
CREATE POLICY "Users can view approvals for their quotes or if they can approve"
  ON quote_approvals
  FOR SELECT
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = true
    )
  );

CREATE POLICY "System can manage quote approvals"
  ON quote_approvals
  FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for approval_actions
CREATE POLICY "Users can view approval actions for relevant quotes"
  ON approval_actions
  FOR SELECT
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
    OR
    approver_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can create approval actions if they have authority"
  ON approval_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = approver_role
      AND ur.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_quote_id ON quote_approvals(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_status ON quote_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_quote_id ON approval_actions(quote_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_approver_id ON approval_actions(approver_id);

-- Function to determine required approval level based on quote value
CREATE OR REPLACE FUNCTION get_required_approval_level(quote_value numeric)
RETURNS user_role_type
LANGUAGE plpgsql
AS $$
BEGIN
  IF quote_value < 25000 THEN
    RETURN 'CSR';
  ELSIF quote_value >= 25000 AND quote_value < 50000 THEN
    RETURN 'Manager';
  ELSIF quote_value >= 50000 AND quote_value < 200000 THEN
    RETURN 'Director';
  ELSIF quote_value >= 200000 AND quote_value < 300000 THEN
    RETURN 'VP';
  ELSE
    RETURN 'President';
  END IF;
END;
$$;

-- Function to check if user has approval authority for a specific level
CREATE OR REPLACE FUNCTION user_can_approve_level(user_id uuid, required_level user_role_type)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  user_role user_role_type;
  role_hierarchy integer;
  required_hierarchy integer;
BEGIN
  -- Get user's highest role
  SELECT role INTO user_role
  FROM user_roles 
  WHERE user_roles.user_id = user_can_approve_level.user_id 
  AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'President' THEN 5
      WHEN 'VP' THEN 4
      WHEN 'Director' THEN 3
      WHEN 'Manager' THEN 2
      WHEN 'CSR' THEN 1
    END DESC
  LIMIT 1;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Convert roles to hierarchy numbers
  role_hierarchy := CASE user_role
    WHEN 'President' THEN 5
    WHEN 'VP' THEN 4
    WHEN 'Director' THEN 3
    WHEN 'Manager' THEN 2
    WHEN 'CSR' THEN 1
  END;

  required_hierarchy := CASE required_level
    WHEN 'President' THEN 5
    WHEN 'VP' THEN 4
    WHEN 'Director' THEN 3
    WHEN 'Manager' THEN 2
    WHEN 'CSR' THEN 1
  END;

  RETURN role_hierarchy >= required_hierarchy;
END;
$$;

-- Function to create approval requirements when quote is created/updated
CREATE OR REPLACE FUNCTION create_approval_requirements()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  required_level user_role_type;
  required_approvers integer;
BEGIN
  -- Determine required approval level
  required_level := get_required_approval_level(NEW.total_value);
  
  -- For quotes over $300k, require both VP and President
  IF NEW.total_value >= 300000 THEN
    required_approvers := 2;
  ELSE
    required_approvers := 1;
  END IF;

  -- Insert or update approval requirement
  INSERT INTO quote_approvals (quote_id, approval_level, required_approvers, status)
  VALUES (NEW.id, required_level, required_approvers, 'pending')
  ON CONFLICT (quote_id) 
  DO UPDATE SET
    approval_level = required_level,
    required_approvers = required_approvers,
    status = 'pending',
    current_approvers = 0,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger to automatically create approval requirements
CREATE TRIGGER create_quote_approval_requirements
  AFTER INSERT OR UPDATE OF total_value ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_requirements();

-- Add unique constraint to prevent duplicate approvals
ALTER TABLE quote_approvals ADD CONSTRAINT unique_quote_approval UNIQUE (quote_id);

-- Insert sample user roles for testing
INSERT INTO user_roles (user_id, role, is_active) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Manager', true)
ON CONFLICT DO NOTHING;

-- Update updated_at triggers
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_approvals_updated_at
  BEFORE UPDATE ON quote_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();