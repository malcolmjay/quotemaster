/*
  # Add Supplier and Type Fields to Cross References

  1. Changes
    - Add `supplier` (text) - Supplier name/identifier for the cross-referenced part
    - Add `type` (text) - Type/category of the cross reference (e.g., 'direct', 'alternate', 'supersession')

  2. Notes
    - Both fields are optional (nullable) for backward compatibility
    - These fields help categorize and organize cross-reference relationships
    - Indexes added for filtering and searching
*/

-- Add supplier and type columns to cross_references table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cross_references' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE cross_references ADD COLUMN supplier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cross_references' AND column_name = 'type'
  ) THEN
    ALTER TABLE cross_references ADD COLUMN type text;
  END IF;
END $$;

-- Create indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_cross_references_supplier ON cross_references(supplier);
CREATE INDEX IF NOT EXISTS idx_cross_references_type ON cross_references(type);
