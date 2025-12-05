/*
  # Create lost_details table

  1. New Tables
    - `lost_details`
      - `id` (uuid, primary key)
      - `line_item_id` (uuid, foreign key to quote_line_items)
      - `lost_reason` (text, required)
      - `competitor_1` (text, required)
      - `bid_price_1` (numeric, required)
      - `competitor_2` (text, optional)
      - `bid_price_2` (numeric, optional)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `lost_details` table
    - Add policy for users to manage lost details for their quotes

  3. Indexes
    - Index on line_item_id for performance
    - Index on created_by for user queries
*/

CREATE TABLE IF NOT EXISTS lost_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_item_id uuid NOT NULL REFERENCES quote_line_items(id) ON DELETE CASCADE,
  lost_reason text NOT NULL,
  competitor_1 text NOT NULL,
  bid_price_1 numeric(10,2) NOT NULL,
  competitor_2 text,
  bid_price_2 numeric(10,2),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lost_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage lost details for their quotes"
  ON lost_details
  FOR ALL
  TO authenticated
  USING (
    line_item_id IN (
      SELECT qli.id 
      FROM quote_line_items qli
      JOIN quotes q ON qli.quote_id = q.id
      WHERE q.created_by = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lost_details_line_item_id ON lost_details(line_item_id);
CREATE INDEX IF NOT EXISTS idx_lost_details_created_by ON lost_details(created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_lost_details_updated_at
  BEFORE UPDATE ON lost_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();