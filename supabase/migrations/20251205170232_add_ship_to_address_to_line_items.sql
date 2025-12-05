/*
  # Add Ship-To Address to Quote Line Items

  1. Changes
    - Add `ship_to_address_id` column to `quote_line_items` table
    - This allows each line item to have a different shipping address
    - Foreign key references `customer_addresses` table
    - Nullable field (defaults to customer's default address if not specified)

  2. Security
    - RLS policies already cover this through quote access
    - No additional policies needed
*/

-- Add ship_to_address_id column to quote_line_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'ship_to_address_id'
  ) THEN
    ALTER TABLE quote_line_items 
    ADD COLUMN ship_to_address_id uuid REFERENCES customer_addresses(id);
    
    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS idx_quote_line_items_ship_to_address 
    ON quote_line_items(ship_to_address_id);
  END IF;
END $$;