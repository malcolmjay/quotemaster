/*
  # Add Award Info and Bid Info fields to quote_line_items

  Adds columns to track award and competitive bid information at the
  individual line item level.

  1. Modified Tables
    - `quote_line_items`
      - Award Info fields:
        - `award_company_id` (uuid, FK to companies) - company that won the award
        - `award_price` (numeric) - the winning price
        - `award_quantity` (integer) - awarded quantity
        - `award_contract_number` (text) - associated contract number
      - Bid Info fields:
        - `bid_competitor_1_id` (uuid, FK to companies) - first competitor
        - `bid_price_1` (numeric) - first competitor's bid price
        - `bid_price_2` (numeric) - first competitor's second bid price
        - `bid_competitor_2_id` (uuid, FK to companies) - second competitor
        - `bid_competitor_2_price` (numeric) - second competitor's bid price

  2. Security
    - Existing RLS policies on quote_line_items cover these new columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'award_company_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN award_company_id uuid REFERENCES companies(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'award_price'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN award_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'award_quantity'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN award_quantity integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'award_contract_number'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN award_contract_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'bid_competitor_1_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN bid_competitor_1_id uuid REFERENCES companies(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'bid_price_1'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN bid_price_1 numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'bid_price_2'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN bid_price_2 numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'bid_competitor_2_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN bid_competitor_2_id uuid REFERENCES companies(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'bid_competitor_2_price'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN bid_competitor_2_price numeric;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qli_award_company ON quote_line_items (award_company_id);
CREATE INDEX IF NOT EXISTS idx_qli_bid_competitor_1 ON quote_line_items (bid_competitor_1_id);
CREATE INDEX IF NOT EXISTS idx_qli_bid_competitor_2 ON quote_line_items (bid_competitor_2_id);
