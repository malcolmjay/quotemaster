/*
  # Add ERP reference IDs to quote_line_items

  1. Changes
    - Add `inventory_item_id` column to quote_line_items table
      - Type: text (to match products.inventory_item_id)
      - Nullable: true (not all line items may have ERP IDs)
      - Stores the ERP inventory item ID from the product at the time of quote creation
    
    - Add `ordered_item_id` column to quote_line_items table
      - Type: text (to match cross_references.ordered_item_id)
      - Nullable: true (not all line items may have ordered item IDs)
      - Stores the ERP ordered item ID from cross references when applicable

  2. Notes
    - These columns capture ERP reference IDs at the time a product is added to a quote
    - They provide a snapshot of the ERP relationship for historical tracking
    - Unlike foreign keys, these are reference-only fields that don't enforce relationships
    - This allows quotes to maintain ERP references even if the source data changes
    - Indexed for reporting and ERP integration queries
*/

-- Add inventory_item_id column to quote_line_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'inventory_item_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN inventory_item_id text;
  END IF;
END $$;

-- Add ordered_item_id column to quote_line_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'ordered_item_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN ordered_item_id text;
  END IF;
END $$;

-- Create indexes for reporting and ERP integration queries
CREATE INDEX IF NOT EXISTS quote_line_items_inventory_item_id_idx 
  ON quote_line_items(inventory_item_id) 
  WHERE inventory_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS quote_line_items_ordered_item_id_idx 
  ON quote_line_items(ordered_item_id) 
  WHERE ordered_item_id IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN quote_line_items.inventory_item_id IS 'ERP inventory item ID captured from product at time of quote creation. Reference-only field for historical tracking.';
COMMENT ON COLUMN quote_line_items.ordered_item_id IS 'ERP ordered item ID from cross references when applicable. Reference-only field for historical tracking.';