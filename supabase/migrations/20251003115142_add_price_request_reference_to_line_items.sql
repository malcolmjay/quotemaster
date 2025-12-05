/*
  # Add Price Request Reference to Quote Line Items

  1. Changes
    - Add `price_request_id` column to `quote_line_items` table
    - This creates a link between line items and price requests
    - When a price request is completed, the line item can reference it

  2. Notes
    - The column is nullable since not all line items will have price requests
    - Foreign key constraint ensures data integrity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'price_request_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN price_request_id uuid REFERENCES price_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quote_line_items_price_request_id ON quote_line_items(price_request_id);