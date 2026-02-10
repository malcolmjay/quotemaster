/*
  # Add currency field to quotes table

  1. Modified Tables
    - `quotes`
      - `currency` (text, default 'USD') - The currency for this quote, defaults from the customer's currency setting

  2. Notes
    - Currency defaults to 'USD' matching the customer table convention
    - Existing quotes will get 'USD' as default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'currency'
  ) THEN
    ALTER TABLE quotes ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
END $$;
