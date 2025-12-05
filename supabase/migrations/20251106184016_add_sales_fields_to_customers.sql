/*
  # Add Sales Manager and Sales Rep to Customers Table

  1. Purpose
    - Add sales management fields to track customer ownership and responsibility
    - Enable reporting and filtering by sales team members

  2. Changes
    - Add `sales_manager` field (text) - Name or ID of the sales manager
    - Add `sales_rep` field (text) - Name or ID of the sales representative

  3. Fields
    - `sales_manager` (text, nullable) - Sales manager responsible for this customer
    - `sales_rep` (text, nullable) - Sales representative responsible for this customer

  4. Notes
    - Both fields are optional to support gradual data population
    - Can store names or employee IDs depending on business requirements
    - Can be easily indexed if needed for performance
*/

-- Add sales_manager and sales_rep columns to customers table
DO $$ 
BEGIN
  -- Add sales_manager if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'sales_manager'
  ) THEN
    ALTER TABLE customers ADD COLUMN sales_manager text;
  END IF;

  -- Add sales_rep if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'sales_rep'
  ) THEN
    ALTER TABLE customers ADD COLUMN sales_rep text;
  END IF;
END $$;

-- Add indexes for efficient filtering and reporting
CREATE INDEX IF NOT EXISTS idx_customers_sales_manager 
  ON customers(sales_manager) 
  WHERE sales_manager IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_sales_rep 
  ON customers(sales_rep) 
  WHERE sales_rep IS NOT NULL;