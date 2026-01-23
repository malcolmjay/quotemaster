/*
  # Add Customer Notes Field

  1. Changes
    - Add `customer_notes` column to customers table
      - Type: text (unlimited length for free-form notes)
      - Nullable: true (optional field)
      - Default: null
  
  2. Security
    - No RLS changes needed (inherits existing customer table policies)
*/

-- Add customer_notes column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_notes text DEFAULT NULL;

-- Add index for potential future search functionality
CREATE INDEX IF NOT EXISTS idx_customers_notes_search 
ON customers USING gin(to_tsvector('english', customer_notes))
WHERE customer_notes IS NOT NULL;
