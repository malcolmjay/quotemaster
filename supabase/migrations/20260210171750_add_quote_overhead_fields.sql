/*
  # Add Carrying Cost and Freight Overhead to Quotes

  ## Changes
  - Adds `carrying_cost_percent` field to `quotes` table (stores the carrying cost percentage, default 0)
  - Adds `freight_overhead_percent` field to `quotes` table (stores the freight overhead percentage, default 0)

  ## Purpose
  These fields are used at the quote header level to standardize margin calculations across all line items.
  The Cost Analysis tool will use these values instead of custom overhead rates.

  ## Notes
  - Values are stored as percentages (e.g., 15.00 means 15%)
  - Both fields default to 0 for backward compatibility
  - These are reference values that inform pricing decisions but don't automatically affect line item calculations
*/

-- Add carrying cost and freight overhead fields to quotes table
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS carrying_cost_percent DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freight_overhead_percent DECIMAL(5,2) DEFAULT 0;