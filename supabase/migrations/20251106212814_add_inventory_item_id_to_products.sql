/*
  # Add inventory_item_id to products table

  1. Changes
    - Add `inventory_item_id` column to products table
      - Type: text (to accommodate various ERP ID formats)
      - Nullable: true (not all products may have ERP IDs initially)
      - Indexed: for fast lookups when syncing from ERP
      - Unique: to prevent duplicate ERP items from being imported

  2. Notes
    - This column stores the foreign key reference from the source ERP system
    - Will be populated when items are synced through the import API
    - Using text type to support various ERP ID formats (numeric, alphanumeric, UUID, etc.)
    - Unique constraint ensures one-to-one mapping between ERP items and products
*/

-- Add inventory_item_id column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'inventory_item_id'
  ) THEN
    ALTER TABLE products ADD COLUMN inventory_item_id text;
  END IF;
END $$;

-- Create unique index on inventory_item_id for fast lookups and uniqueness constraint
CREATE UNIQUE INDEX IF NOT EXISTS products_inventory_item_id_key 
  ON products(inventory_item_id) 
  WHERE inventory_item_id IS NOT NULL;

-- Create regular index for queries that don't require uniqueness
CREATE INDEX IF NOT EXISTS products_inventory_item_id_idx 
  ON products(inventory_item_id);

-- Add comment to document the column
COMMENT ON COLUMN products.inventory_item_id IS 'Foreign key reference from source ERP system. Populated when item is synced through API.';