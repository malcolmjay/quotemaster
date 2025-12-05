/*
  # Add Warehouse Fields to Customer Addresses

  1. Changes
    - Add `primary_warehouse` field to customer_addresses table
    - Add `second_warehouse` field to customer_addresses table
    - Add `third_warehouse` field to customer_addresses table
    - Add `fourth_warehouse` field to customer_addresses table
    - Add `fifth_warehouse` field to customer_addresses table
    
  2. Notes
    - All warehouse fields are optional text fields
    - Can store warehouse codes, names, or identifiers
    - Allows tracking multiple warehouse locations per customer address
*/

-- Add warehouse fields to customer_addresses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_addresses' AND column_name = 'primary_warehouse'
  ) THEN
    ALTER TABLE customer_addresses ADD COLUMN primary_warehouse text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_addresses' AND column_name = 'second_warehouse'
  ) THEN
    ALTER TABLE customer_addresses ADD COLUMN second_warehouse text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_addresses' AND column_name = 'third_warehouse'
  ) THEN
    ALTER TABLE customer_addresses ADD COLUMN third_warehouse text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_addresses' AND column_name = 'fourth_warehouse'
  ) THEN
    ALTER TABLE customer_addresses ADD COLUMN fourth_warehouse text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_addresses' AND column_name = 'fifth_warehouse'
  ) THEN
    ALTER TABLE customer_addresses ADD COLUMN fifth_warehouse text;
  END IF;
END $$;