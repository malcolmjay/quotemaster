/*
  # Add supplier cost and supplier currency to products

  1. Modified Tables
    - `products`
      - `supplier_cost` (numeric(18,4), nullable) - The cost from the supplier in the supplier's native currency
      - `supplier_currency` (text, default 'USD') - The currency code of the supplier cost (e.g. EUR, GBP, CNH)

  2. Notes
    - supplier_cost is separate from unit_cost to preserve the original supplier-quoted price
    - supplier_currency indicates which currency the supplier_cost is denominated in
    - Defaults to USD so existing records are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supplier_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_cost numeric(18,4);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supplier_currency'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_currency text DEFAULT 'USD';
  END IF;
END $$;