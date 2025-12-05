/*
  # Add foreign key constraint to customer_addresses

  1. Changes
    - Add foreign key constraint from customer_addresses.customer_number to customers.customer_number
    - This enables proper relationship queries in Supabase

  2. Notes
    - This constraint was missing from the original customer_addresses table creation
    - Ensures referential integrity between customers and their addresses
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'customer_addresses_customer_number_fkey'
    AND table_name = 'customer_addresses'
  ) THEN
    ALTER TABLE customer_addresses
    ADD CONSTRAINT customer_addresses_customer_number_fkey
    FOREIGN KEY (customer_number)
    REFERENCES customers(customer_number)
    ON DELETE CASCADE;
  END IF;
END $$;