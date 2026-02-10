/*
  # Create companies table

  This table stores company names used as dropdown options for competitors
  and award winners on quote line items.

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null) - the company/competitor name
      - `is_active` (boolean, default true) - soft disable for dropdown visibility
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `companies` table
    - Authenticated users can read active companies
    - Authenticated users can insert/update companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies (is_active);
