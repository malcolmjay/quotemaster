/*
  # Create Item Relationships Table

  1. New Tables
    - `item_relationships`
      - `id` (uuid, primary key)
      - `from_item_id` (uuid, foreign key to products.id) - The source product
      - `to_item_id` (uuid, foreign key to products.id) - The target/related product
      - `type` (text) - Relationship type: Up-Sell, Substitute, Superseded, Related, Complementary, Mandatory Charge
      - `reciprocal` (boolean) - Whether the relationship applies in both directions
      - `effective_from` (date) - When the relationship becomes effective
      - `effective_to` (date) - When the relationship ends
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `item_relationships` table
    - Add policies for authenticated users to manage item relationships

  3. Indexes
    - Index on from_item_id for faster lookups
    - Index on to_item_id for reverse lookups
    - Index on type for filtering by relationship type
*/

-- Create item_relationships table
CREATE TABLE IF NOT EXISTS item_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  to_item_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Up-Sell', 'Substitute', 'Superseded', 'Related', 'Complementary', 'Mandatory Charge')),
  reciprocal BOOLEAN DEFAULT false,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_items CHECK (from_item_id != to_item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_item_relationships_from_item 
ON item_relationships(from_item_id);

CREATE INDEX IF NOT EXISTS idx_item_relationships_to_item 
ON item_relationships(to_item_id);

CREATE INDEX IF NOT EXISTS idx_item_relationships_type 
ON item_relationships(type);

-- Enable RLS
ALTER TABLE item_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view item relationships"
  ON item_relationships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert item relationships"
  ON item_relationships FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update item relationships"
  ON item_relationships FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete item relationships"
  ON item_relationships FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_item_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_relationships_updated_at
  BEFORE UPDATE ON item_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_item_relationships_updated_at();
