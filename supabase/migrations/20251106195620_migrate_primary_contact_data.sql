/*
  # Migrate primary_contact data to customer_contacts table

  1. Data Migration
    - Extract all existing primary_contact JSONB data from customers table
    - Insert as records into customer_contacts table
    - Mark all migrated contacts as is_primary = true

  2. Notes
    - Handles NULL values gracefully
    - Only migrates customers that have primary_contact data
*/

INSERT INTO customer_contacts (
  customer_number,
  first_name,
  last_name,
  email,
  phone,
  title,
  is_primary
)
SELECT 
  customer_number,
  COALESCE(primary_contact->>'first_name', 'Unknown') as first_name,
  COALESCE(primary_contact->>'last_name', 'Contact') as last_name,
  COALESCE(primary_contact->>'email', '') as email,
  primary_contact->>'phone' as phone,
  primary_contact->>'title' as title,
  true as is_primary
FROM customers
WHERE primary_contact IS NOT NULL
ON CONFLICT DO NOTHING;