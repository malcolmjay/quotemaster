/*
  # Add missing quote form fields

  1. New Columns
    - `question_period` (date) - Question period deadline
    - `acceptance_period_days` (integer) - Acceptance period in days
    - `estimated_award_date` (date) - Estimated award date
    - `customer_delivery_req` (boolean) - Customer delivery requirement
    - `stock_requirement` (boolean) - Stock requirement
    - `inventory_impact` (boolean) - Inventory impact
    - `packaging_labelling` (boolean) - Packaging & labelling requirement
    - `special_requirements` (boolean) - Special requirements
    - `liquidated_damages` (boolean) - Liquidated damages clause
    - `buy_america_req` (boolean) - Buy America requirement
    - `eeo_app` (boolean) - EEO/APP requirement
    - `all_or_nothing_bid` (boolean) - All or nothing bid
    - `one_time_buy` (boolean) - One time buy
    - `contract_details` (boolean) - Contract details requirement
    - `amendments` (boolean) - Amendments
    - `alternates_allowed` (boolean) - Alternates allowed
    - `oem_brand_specific` (boolean) - OEM brand specific
    - `kinetik` (boolean) - Kinetik requirement
    - `price_negotiable` (boolean) - Price negotiable

  2. Security
    - All new columns are accessible through existing RLS policies
*/

-- Add missing date and numeric fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'question_period'
  ) THEN
    ALTER TABLE quotes ADD COLUMN question_period date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'acceptance_period_days'
  ) THEN
    ALTER TABLE quotes ADD COLUMN acceptance_period_days integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'estimated_award_date'
  ) THEN
    ALTER TABLE quotes ADD COLUMN estimated_award_date date;
  END IF;
END $$;

-- Add boolean requirement fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_delivery_req'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_delivery_req boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'stock_requirement'
  ) THEN
    ALTER TABLE quotes ADD COLUMN stock_requirement boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'inventory_impact'
  ) THEN
    ALTER TABLE quotes ADD COLUMN inventory_impact boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'packaging_labelling'
  ) THEN
    ALTER TABLE quotes ADD COLUMN packaging_labelling boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'special_requirements'
  ) THEN
    ALTER TABLE quotes ADD COLUMN special_requirements boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'liquidated_damages'
  ) THEN
    ALTER TABLE quotes ADD COLUMN liquidated_damages boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'buy_america_req'
  ) THEN
    ALTER TABLE quotes ADD COLUMN buy_america_req boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'eeo_app'
  ) THEN
    ALTER TABLE quotes ADD COLUMN eeo_app boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'all_or_nothing_bid'
  ) THEN
    ALTER TABLE quotes ADD COLUMN all_or_nothing_bid boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'one_time_buy'
  ) THEN
    ALTER TABLE quotes ADD COLUMN one_time_buy boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'contract_details'
  ) THEN
    ALTER TABLE quotes ADD COLUMN contract_details boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'amendments'
  ) THEN
    ALTER TABLE quotes ADD COLUMN amendments boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'alternates_allowed'
  ) THEN
    ALTER TABLE quotes ADD COLUMN alternates_allowed boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'oem_brand_specific'
  ) THEN
    ALTER TABLE quotes ADD COLUMN oem_brand_specific boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'kinetik'
  ) THEN
    ALTER TABLE quotes ADD COLUMN kinetik boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'price_negotiable'
  ) THEN
    ALTER TABLE quotes ADD COLUMN price_negotiable boolean DEFAULT false;
  END IF;
END $$;