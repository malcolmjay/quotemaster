/*
  # Fix Approval Actions Insert Policy

  1. Changes
    - Update approval_actions INSERT policy to properly check:
      - User is authenticated
      - User is the one performing the action (approver_id matches)
      - User has the appropriate role in user_roles table
      - User's role meets or exceeds the required approval level

  2. Security
    - Ensures only authenticated users with proper roles can create approval actions
    - Validates the user is approving as themselves
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can create approval actions if they have authority" ON approval_actions;

-- Create improved policy that checks both the approver_id and role
CREATE POLICY "Users can create approval actions if they have authority"
  ON approval_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be approving as themselves
    approver_id = (SELECT auth.uid())
    AND
    -- User must have a role that can approve at the required level
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.is_active = true
      AND (
        -- Check if user's role hierarchy >= required role hierarchy
        (ur.role = 'President' AND approver_role IN ('President', 'VP', 'Director', 'Manager', 'CSR')) OR
        (ur.role = 'VP' AND approver_role IN ('VP', 'Director', 'Manager', 'CSR')) OR
        (ur.role = 'Director' AND approver_role IN ('Director', 'Manager', 'CSR')) OR
        (ur.role = 'Manager' AND approver_role IN ('Manager', 'CSR')) OR
        (ur.role = 'CSR' AND approver_role = 'CSR') OR
        (ur.role = 'Admin')
      )
    )
  );
