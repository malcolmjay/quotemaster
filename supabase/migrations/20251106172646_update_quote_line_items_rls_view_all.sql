/*
  # Update Quote Line Items RLS to Allow Viewing All

  1. Problem
    - Current RLS policy only allows users to see line items for quotes they created
    - Users need to see line items for all quotes in Quote Management
    
  2. Solution
    - Allow all authenticated users to view all quote line items
    - Maintain restriction that users can only edit/delete line items for their own quotes
    
  3. Changes
    - Drop the restrictive SELECT policy
    - Create new SELECT policy that allows viewing all line items
    - Keep INSERT/UPDATE/DELETE restrictions to quote creator only
*/

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Users can view line items for their quotes" ON quote_line_items;
DROP POLICY IF EXISTS "Users can manage line items for their quotes" ON quote_line_items;

-- Allow viewing all quote line items
CREATE POLICY "Authenticated users can view all quote line items"
  ON quote_line_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow inserting line items only for own quotes
CREATE POLICY "Users can create line items for own quotes"
  ON quote_line_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
  );

-- Allow updating line items only for own quotes
CREATE POLICY "Users can update line items for own quotes"
  ON quote_line_items
  FOR UPDATE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
  );

-- Allow deleting line items only for own quotes
CREATE POLICY "Users can delete line items for own quotes"
  ON quote_line_items
  FOR DELETE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
  );
