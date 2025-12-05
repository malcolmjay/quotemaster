/*
  # Add cost effective date tracking to products table

  1. New Columns
    - `cost_effective_from` (date) - When the current cost becomes effective
    - `cost_effective_to` (date) - When the current cost expires
  
  2. Default Values
    - Set cost_effective_from to current date for existing products
    - Set cost_effective_to to one year from now for existing products
  
  3. Indexes
    - Add index on cost_effective_to for efficient expiration queries
    - Add composite index for cost validity checks
*/

-- Add the new columns to the products table
DO $$
BEGIN
  -- Add cost_effective_from column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cost_effective_from'
  ) THEN
    ALTER TABLE products ADD COLUMN cost_effective_from date DEFAULT CURRENT_DATE;
  END IF;

  -- Add cost_effective_to column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cost_effective_to'
  ) THEN
    ALTER TABLE products ADD COLUMN cost_effective_to date DEFAULT (CURRENT_DATE + INTERVAL '1 year');
  END IF;
END $$;

-- Update existing products to have default effective dates
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE,
  cost_effective_to = CURRENT_DATE + INTERVAL '1 year'
WHERE 
  cost_effective_from IS NULL 
  OR cost_effective_to IS NULL;

-- Create indexes for efficient cost validity queries
CREATE INDEX IF NOT EXISTS idx_products_cost_effective_to 
ON products (cost_effective_to);

CREATE INDEX IF NOT EXISTS idx_products_cost_validity 
ON products (cost_effective_from, cost_effective_to);

-- Add comments for documentation
COMMENT ON COLUMN products.cost_effective_from IS 'Date when the current unit cost becomes effective';
COMMENT ON COLUMN products.cost_effective_to IS 'Date when the current unit cost expires and needs to be updated';