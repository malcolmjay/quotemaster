/*
  # Clean up duplicate quote_line_items policies
  
  Removes the duplicate SELECT policy "Authenticated users can view all quote line items"
  since we already have "Authenticated users can view quote line items" with the same permissions.
  
  ## Changes
  - Drop duplicate SELECT policy to avoid confusion
*/

-- Remove the duplicate policy
DROP POLICY IF EXISTS "Authenticated users can view all quote line items" ON quote_line_items;
