/*
  # Link Internal Part Number to Product SKU

  1. Changes
    - Add foreign key constraint linking `internal_part_number` to `products.sku`
    - This ensures data integrity and allows proper lookups

  2. Notes
    - The internal_part_number will now reference actual product SKUs
    - This creates a direct relationship to the products table via SKU
    - Existing data should have valid SKUs or this migration may fail
*/

-- Add foreign key constraint linking internal_part_number to products.sku
DO $$
BEGIN
  -- First check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cross_references_internal_part_number'
    AND table_name = 'cross_references'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE cross_references 
    ADD CONSTRAINT fk_cross_references_internal_part_number 
    FOREIGN KEY (internal_part_number) 
    REFERENCES products(sku);
  END IF;
END $$;

-- Create an index on internal_part_number for better query performance
CREATE INDEX IF NOT EXISTS idx_cross_references_internal_part_number 
ON cross_references(internal_part_number);
