/*
  # Fix Quote Line Items Update Policy

  1. Changes
    - Drop the existing restrictive update policy
    - Create a new update policy that allows all authenticated users to update line items
    - This enables buyers to complete price requests and update costs on quotes they didn't create
    
  2. Security
    - Maintains RLS protection (only authenticated users)
    - Enables collaborative workflow where buyers can update pricing on any quote
    - Consistent with the existing SELECT policy that allows viewing all line items
*/

DROP POLICY IF EXISTS "Users can update line items for own quotes" ON quote_line_items;

CREATE POLICY "Authenticated users can update quote line items"
  ON quote_line_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
