/*
  # Add Ship-To Address to Quotes

  1. Changes
    - Add `ship_to_address_id` column to `quotes` table
    - This allows a default shipping address to be set at the quote level
    - Foreign key references `customer_addresses` table
    - Nullable field (defaults to customer's primary shipping address if not specified)

  2. Indexes
    - Add index on `ship_to_address_id` for join performance

  3. Security
    - No additional RLS changes needed, existing quote policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'ship_to_address_id'
  ) THEN
    ALTER TABLE quotes
    ADD COLUMN ship_to_address_id uuid REFERENCES customer_addresses(id);

    CREATE INDEX IF NOT EXISTS idx_quotes_ship_to_address
    ON quotes(ship_to_address_id);
  END IF;
END $$;
