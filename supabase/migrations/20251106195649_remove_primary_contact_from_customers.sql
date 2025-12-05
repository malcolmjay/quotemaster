/*
  # Remove primary_contact column from customers table

  1. Changes
    - Drop the primary_contact JSONB column from customers table
    - This data has been migrated to the customer_contacts table

  2. Notes
    - Safe to remove as data is now in customer_contacts table
    - All existing contact information is preserved
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'primary_contact'
  ) THEN
    ALTER TABLE customers DROP COLUMN primary_contact;
  END IF;
END $$;