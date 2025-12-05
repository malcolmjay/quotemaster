/*
  # Add Supplier Currency, Email, and Document Fields to Price Requests

  1. Changes
    - Add `supplier_currency` column (text) - Currency code for supplier pricing
    - Add `supplier_email` column (text) - Email address of the supplier contact
    - Add `attachment_url` column (text) - URL to attached document in storage
    - Add `attachment_name` column (text) - Original filename of attached document
    - Add `attachment_size` column (integer) - Size of attached document in bytes
    - Add `attachment_type` column (text) - MIME type of attached document

  2. Notes
    - All new fields are optional/nullable
    - Documents will be stored in Supabase Storage
    - Currency should be ISO currency code (USD, EUR, GBP, etc.)
*/

-- Add new columns to price_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_requests' AND column_name = 'supplier_currency'
  ) THEN
    ALTER TABLE price_requests ADD COLUMN supplier_currency TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_requests' AND column_name = 'supplier_email'
  ) THEN
    ALTER TABLE price_requests ADD COLUMN supplier_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_requests' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE price_requests ADD COLUMN attachment_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_requests' AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE price_requests ADD COLUMN attachment_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_requests' AND column_name = 'attachment_size'
  ) THEN
    ALTER TABLE price_requests ADD COLUMN attachment_size INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_requests' AND column_name = 'attachment_type'
  ) THEN
    ALTER TABLE price_requests ADD COLUMN attachment_type TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN price_requests.supplier_currency IS 'ISO currency code for supplier pricing (e.g., USD, EUR, GBP)';
COMMENT ON COLUMN price_requests.supplier_email IS 'Email address of the supplier contact';
COMMENT ON COLUMN price_requests.attachment_url IS 'URL to attached document in Supabase Storage';
COMMENT ON COLUMN price_requests.attachment_name IS 'Original filename of the attached document';
COMMENT ON COLUMN price_requests.attachment_size IS 'Size of the attached document in bytes';
COMMENT ON COLUMN price_requests.attachment_type IS 'MIME type of the attached document';
