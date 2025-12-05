/*
  # Add Cost Effective Dates to Quote Line Items

  1. Changes
    - Add `cost_effective_from` (date) column to quote_line_items
    - Add `cost_effective_to` (date) column to quote_line_items
    
  2. Purpose
    - Store the cost effective date range from the product at the time the line item is created
    - Enable tracking of expired costs in quotes
    - Provide visibility to users about cost validity periods
    
  3. Notes
    - These fields are nullable as existing line items won't have this data
    - Values should be populated from products table when creating new line items
    - Helps identify when quoted costs need to be refreshed
*/

-- Add cost effective date fields to quote_line_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'cost_effective_from'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN cost_effective_from date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'cost_effective_to'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN cost_effective_to date;
  END IF;
END $$;