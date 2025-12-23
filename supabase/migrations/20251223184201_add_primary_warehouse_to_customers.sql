/*
  # Add Primary Warehouse to Customers

  1. Changes
    - Add `primary_warehouse` column to `customers` table
      - Type: text (references warehouse_options configuration)
      - Nullable: true (optional field)
      - Default: null
    
  2. Notes
    - Primary warehouse field indicates the default warehouse for customer orders
    - Uses the same warehouse options configured in app_configurations
    - Can be displayed on quote headers and used for default selections
*/

-- Add primary_warehouse column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS primary_warehouse text;

-- Create index for filtering by warehouse
CREATE INDEX IF NOT EXISTS idx_customers_primary_warehouse 
ON customers(primary_warehouse);

-- Add comment for documentation
COMMENT ON COLUMN customers.primary_warehouse IS 'Default warehouse location for this customer, references warehouse_options in app_configurations';
