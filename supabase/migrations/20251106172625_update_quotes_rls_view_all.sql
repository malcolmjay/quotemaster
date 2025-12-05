/*
  # Update Quotes RLS to Allow Viewing All Quotes

  1. Problem
    - Current RLS policy only allows users to see quotes they created
    - Quote Management page shows "1 of 1" when there are 11 quotes in database
    - Users need to see all quotes for management purposes

  2. Solution
    - Allow all authenticated users to view all quotes
    - Maintain restriction that users can only edit/delete their own quotes
    
  3. Changes
    - Drop the restrictive SELECT policy
    - Create new SELECT policy that allows viewing all quotes
    - Keep UPDATE/DELETE restrictions to quote creator only
*/

-- Drop the old restrictive view policy
DROP POLICY IF EXISTS "Users can view quotes they created" ON quotes;

-- Create new policy to allow viewing all quotes
CREATE POLICY "Authenticated users can view all quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the management policy is properly restricted
DROP POLICY IF EXISTS "Users can manage quotes they created" ON quotes;

-- Allow users to insert their own quotes
CREATE POLICY "Users can create quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow users to update only their own quotes
CREATE POLICY "Users can update own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete only their own quotes
CREATE POLICY "Users can delete own quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
