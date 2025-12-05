/*
  # Create Customer Addresses Table

  1. Purpose
    - Support multiple addresses per customer for ERP data synchronization
    - Separate address data from customers table for better normalization
    - Link addresses to customers via customer_number field

  2. New Table: customer_addresses
    - `id` (uuid, primary key) - Unique identifier for each address
    - `customer_number` (text, required) - Links to customers.customer_number
    - `site_use_id` (text) - ERP site use identifier
    - `address_line_1` (text, required) - Primary address line
    - `address_line_2` (text) - Secondary address line
    - `address_line_3` (text) - Tertiary address line
    - `city` (text, required) - City name
    - `postal_code` (text, required) - ZIP/Postal code
    - `state` (text) - State/Province
    - `country` (text, required) - Country code or name
    - `is_shipping` (boolean) - Address can be used for shipping
    - `is_billing` (boolean) - Address can be used for billing
    - `is_primary` (boolean) - Primary address for customer
    - `is_credit_hold` (boolean) - Credit hold status for this site
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  3. Indexes
    - Index on customer_number for efficient lookups
    - Index on site_use_id for ERP synchronization
    - Composite index on customer_number + is_primary for primary address queries

  4. Security
    - Enable RLS
    - Authenticated users can view all addresses
    - Only authenticated users can insert/update/delete addresses
*/

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_number text NOT NULL,
  site_use_id text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  address_line_3 text,
  city text NOT NULL,
  postal_code text NOT NULL,
  state text,
  country text NOT NULL,
  is_shipping boolean DEFAULT false,
  is_billing boolean DEFAULT false,
  is_primary boolean DEFAULT false,
  is_credit_hold boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_number 
  ON customer_addresses(customer_number);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_site_use_id 
  ON customer_addresses(site_use_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_primary 
  ON customer_addresses(customer_number, is_primary) 
  WHERE is_primary = true;

-- Add updated_at trigger
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all customer addresses"
  ON customer_addresses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customer addresses"
  ON customer_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customer addresses"
  ON customer_addresses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customer addresses"
  ON customer_addresses
  FOR DELETE
  TO authenticated
  USING (true);