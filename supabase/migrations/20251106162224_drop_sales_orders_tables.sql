/*
  # Drop Sales Orders Tables

  1. Changes
    - Drop sales_order_lines table (child table)
    - Drop sales_orders table (parent table)
    
  2. Notes
    - Tables dropped in correct order to respect foreign key dependencies
    - All data in these tables will be permanently deleted
    - RLS policies will be automatically dropped with the tables
*/

-- Drop sales_order_lines table first (child table)
DROP TABLE IF EXISTS sales_order_lines CASCADE;

-- Drop sales_orders table (parent table)
DROP TABLE IF EXISTS sales_orders CASCADE;
