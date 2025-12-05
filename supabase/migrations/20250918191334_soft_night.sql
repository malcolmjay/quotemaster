/*
  # Add buyer field to products table

  1. New Columns
    - `buyer` (text) - Name of the buyer responsible for this product
  
  2. Data Updates
    - Populate existing products with test buyer names
    - Distribute buyers across different product categories
  
  3. Security
    - No RLS changes needed as products table already has proper policies
*/

-- Add buyer column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'buyer'
  ) THEN
    ALTER TABLE products ADD COLUMN buyer text;
  END IF;
END $$;

-- Update existing products with test buyer names
UPDATE products SET buyer = 'Sarah Johnson' WHERE category = 'cat-networking' AND buyer IS NULL;
UPDATE products SET buyer = 'Michael Chen' WHERE category = 'cat-servers' AND buyer IS NULL;
UPDATE products SET buyer = 'Emily Rodriguez' WHERE category = 'cat-security' AND buyer IS NULL;
UPDATE products SET buyer = 'David Thompson' WHERE category = 'cat-storage' AND buyer IS NULL;
UPDATE products SET buyer = 'Lisa Anderson' WHERE category = 'cat-software' AND buyer IS NULL;

-- For any remaining products without a buyer, assign a default
UPDATE products SET buyer = 'Alex Martinez' WHERE buyer IS NULL;

-- Create index for buyer field for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_buyer ON products(buyer);