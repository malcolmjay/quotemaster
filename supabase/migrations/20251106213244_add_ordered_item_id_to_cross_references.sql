/*
  # Add ordered_item_id to cross_references table

  1. Changes
    - Add `ordered_item_id` column to cross_references table
      - Type: text (to accommodate various ERP ID formats)
      - Nullable: true (not all cross references may have ERP IDs initially)
      - Indexed: for fast lookups when syncing from ERP
      - Unique: to prevent duplicate ERP items from being imported

  2. Notes
    - This column stores the unique ERP ID for ordered items
    - Will be populated when cross references are synced through the import API
    - Using text type to support various ERP ID formats (numeric, alphanumeric, UUID, etc.)
    - Unique constraint ensures one-to-one mapping between ERP ordered items and cross references
*/

-- Add ordered_item_id column to cross_references table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cross_references' AND column_name = 'ordered_item_id'
  ) THEN
    ALTER TABLE cross_references ADD COLUMN ordered_item_id text;
  END IF;
END $$;

-- Create unique index on ordered_item_id for fast lookups and uniqueness constraint
CREATE UNIQUE INDEX IF NOT EXISTS cross_references_ordered_item_id_key 
  ON cross_references(ordered_item_id) 
  WHERE ordered_item_id IS NOT NULL;

-- Create regular index for queries that don't require uniqueness
CREATE INDEX IF NOT EXISTS cross_references_ordered_item_id_idx 
  ON cross_references(ordered_item_id);

-- Add comment to document the column
COMMENT ON COLUMN cross_references.ordered_item_id IS 'Unique ERP ID for ordered items. Populated when cross reference is synced through API.';