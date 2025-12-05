/*
  # Make Customer Part Number Optional

  1. Changes
    - Alter `customer_part_number` column in `cross_references` table to allow NULL values
    - Update unique constraint to handle NULL customer_part_number values properly

  2. Notes
    - Only `internal_part_number` remains required
    - This allows creating cross references without requiring customer-specific part numbers
*/

-- Drop the existing unique constraint
ALTER TABLE cross_references DROP CONSTRAINT IF EXISTS cross_references_customer_id_customer_part_number_product_id_key;

-- Make customer_part_number nullable
ALTER TABLE cross_references ALTER COLUMN customer_part_number DROP NOT NULL;

-- Recreate a more flexible unique constraint
-- This constraint only applies when customer_id and customer_part_number are both present
CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_references_unique_customer_part 
ON cross_references (customer_id, customer_part_number, product_id) 
WHERE customer_id IS NOT NULL AND customer_part_number IS NOT NULL;
