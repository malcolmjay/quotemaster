/*
  # Create Sales Orders Tables

  1. New Tables
    - `sales_orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique) - Auto-generated SO number
      - `customer_id` (uuid, foreign key to customers)
      - `customer_user_id` (uuid, foreign key to customer_users)
      - `customer_po_number` (text) - Customer's purchase order number
      - `order_date` (date, default today)
      - `requested_ship_date` (date)
      - `requested_delivery_date` (date)
      - `ship_to_address` (jsonb)
      - `bill_to_address` (jsonb)
      - `payment_terms` (text)
      - `currency` (text, default 'USD')
      - `order_type` (text) - Standard, Rush, Drop Ship, etc.
      - `status` (text) - Draft, Confirmed, Processing, Shipped, Delivered, Cancelled
      - `total_value` (numeric)
      - `total_cost` (numeric)
      - `total_margin` (numeric)
      - `line_item_count` (integer)
      - `notes` (text)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `sales_order_lines`
      - `id` (uuid, primary key)
      - `sales_order_id` (uuid, foreign key to sales_orders)
      - `line_number` (integer) - Sequential line number within order
      - `product_id` (uuid, foreign key to products)
      - `sku` (text)
      - `product_name` (text)
      - `supplier` (text)
      - `category` (text)
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `unit_cost` (numeric)
      - `discount_percent` (numeric, default 0)
      - `discount_amount` (numeric, default 0)
      - `subtotal` (numeric, generated)
      - `total_cost` (numeric, generated)
      - `margin_percent` (numeric, generated)
      - `requested_ship_date` (date)
      - `promised_date` (date)
      - `line_status` (text) - Open, Allocated, Picked, Shipped, Delivered, Cancelled
      - `quote_id` (uuid, foreign key to quotes) - Reference to source quote
      - `quote_line_item_id` (uuid, foreign key to quote_line_items) - Reference to specific quote line
      - `quote_number` (text) - Denormalized for easy reference
      - `notes` (text)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to view and manage orders

  3. Indexes
    - Index on order_number for quick lookups
    - Index on customer_id for customer order history
    - Index on quote_id and quote_line_item_id for quote tracking
    - Index on status for filtering

  4. Notes
    - When an order line is created from a quote, the quote line status should be updated to 'won'
    - The quote record should also reference the sales order
    - Pricing is automatically pulled from matching quote lines if available
*/

-- Sales Orders table
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  customer_user_id uuid REFERENCES customer_users(id) ON DELETE SET NULL,
  customer_po_number text,
  order_date date DEFAULT CURRENT_DATE NOT NULL,
  requested_ship_date date,
  requested_delivery_date date,
  ship_to_address jsonb,
  bill_to_address jsonb,
  payment_terms text DEFAULT 'NET 30',
  currency text DEFAULT 'USD',
  order_type text DEFAULT 'Standard' CHECK (order_type IN ('Standard', 'Rush', 'Drop Ship', 'Blanket', 'Sample')),
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'On Hold')),
  total_value numeric(12,2) DEFAULT 0,
  total_cost numeric(12,2) DEFAULT 0,
  total_margin numeric(5,2) DEFAULT 0,
  line_item_count integer DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sales orders"
  ON sales_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sales orders"
  ON sales_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update sales orders"
  ON sales_orders
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete sales orders"
  ON sales_orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Sales Order Lines table
CREATE TABLE IF NOT EXISTS sales_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
  line_number integer NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  product_name text NOT NULL,
  supplier text,
  category text,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  subtotal numeric(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount) STORED,
  total_cost numeric(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  margin_percent numeric(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN (unit_price - (discount_amount / NULLIF(quantity, 0))) > 0 
      THEN (((unit_price - (discount_amount / NULLIF(quantity, 0))) - unit_cost) / (unit_price - (discount_amount / NULLIF(quantity, 0)))) * 100
      ELSE 0
    END
  ) STORED,
  requested_ship_date date,
  promised_date date,
  line_status text DEFAULT 'Open' CHECK (line_status IN ('Open', 'Allocated', 'Picked', 'Shipped', 'Delivered', 'Cancelled', 'Backordered')),
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  quote_line_item_id uuid REFERENCES quote_line_items(id) ON DELETE SET NULL,
  quote_number text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(sales_order_id, line_number)
);

ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sales order lines"
  ON sales_order_lines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sales order lines"
  ON sales_order_lines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sales order lines"
  ON sales_order_lines
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete sales order lines"
  ON sales_order_lines
  FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by ON sales_orders(created_by);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_order_id ON sales_order_lines(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_product_id ON sales_order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_quote_id ON sales_order_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_quote_line_id ON sales_order_lines(quote_line_item_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_sku ON sales_order_lines(sku);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_status ON sales_order_lines(line_status);

-- Add sales_order_id reference to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'sales_order_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN sales_order_id uuid REFERENCES sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add sales_order_line_id reference to quote_line_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'sales_order_line_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN sales_order_line_id uuid REFERENCES sales_order_lines(id) ON DELETE SET NULL;
  END IF;
END $$;