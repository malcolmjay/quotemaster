/*
  # Add currency fields to products table

  1. Modified Tables
    - `products`
      - `unit_cost_currency` (text, default 'USD') - Currency code for the unit cost
      - `list_price_currency` (text, default 'USD') - Currency code for the list price

  2. Notes
    - Both fields default to 'USD' so existing records are unaffected
    - Allows products to have different currencies for cost vs. list price
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit_cost_currency'
  ) THEN
    ALTER TABLE products ADD COLUMN unit_cost_currency text DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'list_price_currency'
  ) THEN
    ALTER TABLE products ADD COLUMN list_price_currency text DEFAULT 'USD';
  END IF;
END $$;