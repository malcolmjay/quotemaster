/*
  # Create Price Requests Table

  1. New Tables
    - `price_requests`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to quotes)
      - `quote_line_item_id` (uuid, reference to the line item)
      - `product_number` (text)
      - `description` (text)
      - `supplier_name` (text)
      - `buyer_name` (text)
      - `customer_name` (text)
      - `quote_number` (text)
      - `quote_type` (text)
      - `item_quantity` (numeric)
      - `supplier_pricing` (numeric, nullable)
      - `effective_start_date` (date, nullable)
      - `effective_end_date` (date, nullable)
      - `moq` (numeric, nullable - minimum order quantity)
      - `price_breaks` (jsonb, nullable - array of quantity/price pairs)
      - `supplier_quote_number` (text, nullable)
      - `status` (text, default 'pending')
      - `requested_at` (timestamptz, default now)
      - `completed_at` (timestamptz, nullable)
      - `requested_by` (uuid, foreign key to auth.users)
      - `completed_by` (uuid, foreign key to auth.users, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
  
  2. Security
    - Enable RLS on `price_requests` table
    - Add policies for authenticated users to:
      - View all price requests
      - Create new price requests
      - Update price requests they're assigned to or created
</security>

## Notes
  - The price_breaks field stores an array of objects with quantity and price
  - Status can be: 'pending', 'in_progress', 'completed', 'cancelled'
  - Once completed, the related quote line item should return to 'Pending' status
*/

CREATE TABLE IF NOT EXISTS price_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  quote_line_item_id uuid,
  product_number text NOT NULL,
  description text NOT NULL,
  supplier_name text,
  buyer_name text,
  customer_name text NOT NULL,
  quote_number text NOT NULL,
  quote_type text NOT NULL,
  item_quantity numeric NOT NULL,
  supplier_pricing numeric,
  effective_start_date date,
  effective_end_date date,
  moq numeric,
  price_breaks jsonb DEFAULT '[]'::jsonb,
  supplier_quote_number text,
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  requested_by uuid REFERENCES auth.users(id),
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE price_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all price requests"
  ON price_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create price requests"
  ON price_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update price requests"
  ON price_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requested_by OR auth.uid() = completed_by OR buyer_name IS NOT NULL);

CREATE POLICY "Users can delete price requests"
  ON price_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requested_by);

CREATE INDEX IF NOT EXISTS idx_price_requests_quote_id ON price_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_price_requests_status ON price_requests(status);
CREATE INDEX IF NOT EXISTS idx_price_requests_requested_by ON price_requests(requested_by);