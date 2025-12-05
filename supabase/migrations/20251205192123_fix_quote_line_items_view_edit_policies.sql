/*
  # Fix Quote Line Items View and Edit Policies
  
  Restores missing SELECT and UPDATE policies for quote_line_items that were
  accidentally dropped during security optimization.
  
  ## Changes
  1. Add SELECT policy to allow all authenticated users to view quote line items
  2. Add UPDATE policy to allow all authenticated users to edit quote line items
  
  ## Security Notes
  - All authenticated users can view and edit any quote line items
  - This matches the application's requirement that any user can work with quotes
*/

-- Add SELECT policy for viewing quote line items
DROP POLICY IF EXISTS "Authenticated users can view quote line items" ON quote_line_items;
CREATE POLICY "Authenticated users can view quote line items"
  ON quote_line_items FOR SELECT
  TO authenticated
  USING (true);

-- Add UPDATE policy for editing quote line items
DROP POLICY IF EXISTS "Authenticated users can update quote line items" ON quote_line_items;
CREATE POLICY "Authenticated users can update quote line items"
  ON quote_line_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
