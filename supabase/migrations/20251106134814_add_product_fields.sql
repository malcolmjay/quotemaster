/*
  # Add Extended Product Fields

  1. Changes
    - Add new fields to products table:
      - `category_set` (text) - Product category grouping
      - `assignment` (text) - Product assignment/allocation
      - `long_description` (text) - Extended product description
      - `item_type` (text) - Type classification of item
      - `unit_of_measure` (text) - UOM (e.g., EA, BOX, LB)
      - `moq` (integer) - Minimum Order Quantity
      - `min_quantity` (integer) - Minimum stock level
      - `max_quantity` (integer) - Maximum stock level
      - `weight` (decimal) - Product weight
      - `length` (decimal) - Product length dimension
      - `width` (decimal) - Product width dimension
      - `height` (decimal) - Product height dimension
      - `fleet` (text) - Fleet designation
      - `country_of_origin` (text) - Manufacturing country
      - `tariff_amount` (decimal) - Import tariff amount
      - `cs_notes` (text) - Customer service notes
      - `average_lead_time` (integer) - Average lead time in days
      - `rep_code` (text) - Sales representative code
      - `rep_by` (text) - Representative name
      - `revision` (text) - Product revision number

  2. Notes
    - All fields are optional (nullable) for backward compatibility
    - Numeric fields use appropriate types (integer for counts, decimal for measurements)
    - Fields support existing products without requiring immediate updates
*/

-- Add new fields to products table
DO $$
BEGIN
  -- Category and classification fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_set'
  ) THEN
    ALTER TABLE products ADD COLUMN category_set text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'assignment'
  ) THEN
    ALTER TABLE products ADD COLUMN assignment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'long_description'
  ) THEN
    ALTER TABLE products ADD COLUMN long_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE products ADD COLUMN item_type text;
  END IF;

  -- Unit and quantity fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit_of_measure'
  ) THEN
    ALTER TABLE products ADD COLUMN unit_of_measure text DEFAULT 'EA';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'moq'
  ) THEN
    ALTER TABLE products ADD COLUMN moq integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'min_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN min_quantity integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'max_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN max_quantity integer;
  END IF;

  -- Dimension and weight fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'weight'
  ) THEN
    ALTER TABLE products ADD COLUMN weight decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'length'
  ) THEN
    ALTER TABLE products ADD COLUMN length decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'width'
  ) THEN
    ALTER TABLE products ADD COLUMN width decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'height'
  ) THEN
    ALTER TABLE products ADD COLUMN height decimal(10,2);
  END IF;

  -- Origin and logistics fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'fleet'
  ) THEN
    ALTER TABLE products ADD COLUMN fleet text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'country_of_origin'
  ) THEN
    ALTER TABLE products ADD COLUMN country_of_origin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'tariff_amount'
  ) THEN
    ALTER TABLE products ADD COLUMN tariff_amount decimal(10,2);
  END IF;

  -- Notes and reference fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cs_notes'
  ) THEN
    ALTER TABLE products ADD COLUMN cs_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'average_lead_time'
  ) THEN
    ALTER TABLE products ADD COLUMN average_lead_time integer;
  END IF;

  -- Sales representative fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'rep_code'
  ) THEN
    ALTER TABLE products ADD COLUMN rep_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'rep_by'
  ) THEN
    ALTER TABLE products ADD COLUMN rep_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'revision'
  ) THEN
    ALTER TABLE products ADD COLUMN revision text;
  END IF;
END $$;

-- Create indexes for commonly searched/filtered fields
CREATE INDEX IF NOT EXISTS idx_products_category_set ON products(category_set);
CREATE INDEX IF NOT EXISTS idx_products_item_type ON products(item_type);
CREATE INDEX IF NOT EXISTS idx_products_rep_code ON products(rep_code);
CREATE INDEX IF NOT EXISTS idx_products_country_of_origin ON products(country_of_origin);
CREATE INDEX IF NOT EXISTS idx_products_fleet ON products(fleet);
