/*
  # Add Supplier Email to Products Table

  1. Changes
    - Add `supplier_email` column (text) - Email address of the supplier contact
    
  2. Notes
    - Field is optional/nullable
    - Email should be valid email format
*/

-- Add supplier_email column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supplier_email'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_email TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN products.supplier_email IS 'Email address of the supplier contact';
