/*
  # Create customer_contacts table

  1. New Tables
    - `customer_contacts`
      - `id` (uuid, primary key) - Unique identifier for the contact
      - `customer_number` (text, foreign key) - References customers table
      - `first_name` (text) - Contact's first name
      - `last_name` (text) - Contact's last name
      - `email` (text) - Contact's email address
      - `phone` (text, nullable) - Contact's phone number
      - `title` (text, nullable) - Contact's job title
      - `department` (text, nullable) - Contact's department
      - `is_primary` (boolean) - Whether this is the primary contact
      - `notes` (text, nullable) - Additional notes about the contact
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `customer_contacts` table
    - Add policy for authenticated users to view all contacts
    - Add policy for authenticated users to insert contacts
    - Add policy for authenticated users to update contacts
    - Add policy for authenticated users to delete contacts

  3. Indexes
    - Add index on customer_number for faster lookups
    - Add index on email for searching by email
    - Add index on is_primary for finding primary contacts

  4. Constraints
    - Ensure only one primary contact per customer with a unique partial index
*/

CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number text NOT NULL REFERENCES customers(customer_number) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  title text,
  department text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all customer contacts"
  ON customer_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert customer contacts"
  ON customer_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customer contacts"
  ON customer_contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete customer contacts"
  ON customer_contacts
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_number 
  ON customer_contacts(customer_number);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_email 
  ON customer_contacts(email);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_is_primary 
  ON customer_contacts(is_primary) WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_contact_per_customer 
  ON customer_contacts(customer_number) WHERE is_primary = true;

CREATE OR REPLACE FUNCTION update_customer_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_customer_contacts_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_customer_contacts_updated_at_trigger
      BEFORE UPDATE ON customer_contacts
      FOR EACH ROW
      EXECUTE FUNCTION update_customer_contacts_updated_at();
  END IF;
END $$;