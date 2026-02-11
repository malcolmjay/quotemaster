/*
  # Create currency conversions table

  1. New Tables
    - `currency_conversions`
      - `id` (uuid, primary key)
      - `from_currency` (text, not null) - Source currency code (e.g. EUR, GBP, CNH)
      - `to_currency` (text, not null) - Target currency code (USD or CAD)
      - `spot_rate` (numeric(18,8), not null) - The conversion rate
      - `effective_from` (date, not null) - Start date for this rate
      - `effective_to` (date) - End date for this rate (null means current/open-ended)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `currency_conversions` table
    - Authenticated users can read all conversion rates
    - Authenticated users can insert, update, and delete rates

  3. Indexes
    - Unique constraint on (from_currency, to_currency, effective_from) to prevent duplicate entries
    - Index on (from_currency, to_currency) for fast lookups

  4. Seed Data
    - Initial placeholder rates for CAD, EUR, GBP, USD, CNH converting to both USD and CAD
*/

CREATE TABLE IF NOT EXISTS currency_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  spot_rate numeric(18,8) NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_currency_conv_unique
  ON currency_conversions (from_currency, to_currency, effective_from);

CREATE INDEX IF NOT EXISTS idx_currency_conv_pair
  ON currency_conversions (from_currency, to_currency);

ALTER TABLE currency_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view currency conversions"
  ON currency_conversions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert currency conversions"
  ON currency_conversions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update currency conversions"
  ON currency_conversions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete currency conversions"
  ON currency_conversions FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Seed initial conversion rates (placeholder values as of early 2026)
-- From CAD to USD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('CAD', 'USD', 0.73500000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From EUR to USD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('EUR', 'USD', 1.08500000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From GBP to USD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('GBP', 'USD', 1.27000000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From USD to USD (identity)
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('USD', 'USD', 1.00000000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From CNH to USD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('CNH', 'USD', 0.13800000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From CAD to CAD (identity)
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('CAD', 'CAD', 1.00000000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From EUR to CAD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('EUR', 'CAD', 1.47600000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From GBP to CAD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('GBP', 'CAD', 1.72800000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From USD to CAD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('USD', 'CAD', 1.36050000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- From CNH to CAD
INSERT INTO currency_conversions (from_currency, to_currency, spot_rate, effective_from)
VALUES ('CNH', 'CAD', 0.18780000, '2026-01-01')
ON CONFLICT DO NOTHING;