/*
  # Remove Sales Order References from Quotes Table

  1. Changes
    - Drop foreign key constraint on sales_order_id if exists
    - Drop sales_order_id column from quotes table
    
  2. Notes
    - This removes the link between quotes and sales orders
    - Prepares for complete removal of sales order functionality
*/

-- Drop foreign key constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quotes_sales_order_id_fkey'
    AND table_name = 'quotes'
  ) THEN
    ALTER TABLE quotes DROP CONSTRAINT quotes_sales_order_id_fkey;
  END IF;
END $$;

-- Drop sales_order_id column from quotes table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'sales_order_id'
  ) THEN
    ALTER TABLE quotes DROP COLUMN sales_order_id;
  END IF;
END $$;
