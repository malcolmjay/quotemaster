/*
  # Fix Price Requests Update Policy

  1. Changes
    - Drop the existing update policy that has problematic conditions
    - Create a new update policy that allows:
      - The user who created the request (requested_by) to update it
      - Any authenticated user to complete it (set completed_by)
    
  2. Security
    - Maintains RLS protection
    - Allows proper workflow for price request completion
*/

DROP POLICY IF EXISTS "Users can update price requests" ON price_requests;

CREATE POLICY "Users can update price requests"
  ON price_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    auth.uid() = requested_by 
    OR auth.uid() = completed_by
  );
