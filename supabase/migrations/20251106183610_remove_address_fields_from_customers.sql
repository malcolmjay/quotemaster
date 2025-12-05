/*
  # Remove Address Fields from Customers Table

  1. Purpose
    - Remove billing_address and shipping_address JSONB fields
    - Address data now lives in the customer_addresses table
    - Maintains data integrity by keeping customer core info separate

  2. Changes
    - Drop billing_address column (JSONB)
    - Drop shipping_address column (JSONB)
    - Customers table now focuses on core customer information
    - Addresses are managed separately via customer_number link

  3. Important Notes
    - This is a destructive operation - existing address data will be lost
    - Ensure any existing address data is migrated to customer_addresses table first
    - Applications should now query customer_addresses table for address information
*/

-- Drop address columns from customers table
DO $$ 
BEGIN
  -- Drop billing_address if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE customers DROP COLUMN billing_address;
  END IF;

  -- Drop shipping_address if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'shipping_address'
  ) THEN
    ALTER TABLE customers DROP COLUMN shipping_address;
  END IF;
END $$;