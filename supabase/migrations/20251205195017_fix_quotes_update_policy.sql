/*
  # Fix quotes UPDATE policy
  
  Updates the restrictive UPDATE policy on quotes table to allow all authenticated
  users to update quotes, not just the creator.
  
  ## Changes
  - Replace "Users can update own quotes" policy with a policy that allows all
    authenticated users to update any quote
  
  ## Security Notes
  - All authenticated users can update any quote
  - This matches the application's collaborative workflow where any user can work on quotes
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;

-- Create a permissive policy for all authenticated users
CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
