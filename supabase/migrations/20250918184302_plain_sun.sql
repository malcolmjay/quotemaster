/*
  # Add quote status field to quotes table

  1. New Columns
    - `quote_status` (text) - Quote approval status with values: 'draft', 'pending_approval', 'approved'
  
  2. Changes
    - Add check constraint to ensure only valid status values are allowed
    - Set default value to 'draft' for all new quotes
    - Update existing quotes to have 'draft' status
  
  3. Security
    - No RLS changes needed as quotes table already has proper policies
*/

-- Add the quote_status column with default value
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_status text DEFAULT 'draft';

-- Add check constraint to ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quotes_quote_status_check' 
    AND table_name = 'quotes'
  ) THEN
    ALTER TABLE quotes 
    ADD CONSTRAINT quotes_quote_status_check 
    CHECK (quote_status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text]));
  END IF;
END $$;

-- Update any existing quotes that might have NULL quote_status
UPDATE quotes 
SET quote_status = 'draft' 
WHERE quote_status IS NULL;