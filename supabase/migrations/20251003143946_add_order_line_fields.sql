/*
  # Add Additional Fields to Sales Order Lines

  1. Changes
    - Add `warehouse` field to sales_order_lines for warehouse location tracking
    - Add `estimated_ship_date` field for internal shipping estimates
    - Add `shipping_instructions` field for special delivery instructions
    - Add `on_hand_qty` field to track available inventory at time of order

  2. Notes
    - These fields enhance the order management system with better inventory and shipping tracking
    - `warehouse` stores the location from which the item will ship
    - `estimated_ship_date` is for internal planning vs `requested_ship_date` which is customer-facing
    - `shipping_instructions` captures line-specific delivery requirements
    - `on_hand_qty` is a snapshot of inventory availability when the line was created
*/

-- Add new fields to sales_order_lines table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_order_lines' AND column_name = 'warehouse'
  ) THEN
    ALTER TABLE sales_order_lines ADD COLUMN warehouse text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_order_lines' AND column_name = 'estimated_ship_date'
  ) THEN
    ALTER TABLE sales_order_lines ADD COLUMN estimated_ship_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_order_lines' AND column_name = 'shipping_instructions'
  ) THEN
    ALTER TABLE sales_order_lines ADD COLUMN shipping_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_order_lines' AND column_name = 'on_hand_qty'
  ) THEN
    ALTER TABLE sales_order_lines ADD COLUMN on_hand_qty numeric DEFAULT 0;
  END IF;
END $$;

-- Create index on warehouse for filtering
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_warehouse ON sales_order_lines(warehouse);
