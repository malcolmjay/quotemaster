/*
  # QuoteMaster Pro - Initial Database Schema

  1. New Tables
    - `profiles` - User profiles extending Supabase auth
    - `customers` - Customer management
    - `customer_users` - Customer user contacts
    - `products` - Product catalog
    - `inventory_levels` - Stock management
    - `quotes` - Quote management
    - `quote_line_items` - Quote line items
    - `cross_references` - Part number cross-references
    - `price_breaks` - Supplier price breaks
    - `reservations` - Inventory reservations
    - `cost_analysis` - Cost analysis data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  customer_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('federal', 'state', 'local', 'commercial')),
  segment TEXT NOT NULL CHECK (segment IN ('government', 'defense', 'education', 'healthcare', 'commercial')),
  contract_number TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  primary_contact JSONB,
  payment_terms TEXT DEFAULT 'NET 30',
  currency TEXT DEFAULT 'USD',
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (true);

-- Customer users table
CREATE TABLE IF NOT EXISTS customer_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customer users"
  ON customer_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage customer users"
  ON customer_users FOR ALL
  TO authenticated
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  supplier TEXT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  list_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  lead_time_text TEXT,
  warehouse TEXT DEFAULT 'main',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true);

-- Inventory levels table
CREATE TABLE IF NOT EXISTS inventory_levels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse TEXT NOT NULL DEFAULT 'main',
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_point INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  last_restock_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse)
);

ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory"
  ON inventory_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage inventory"
  ON inventory_levels FOR ALL
  TO authenticated
  USING (true);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_user_id UUID REFERENCES customer_users(id),
  quote_type TEXT NOT NULL DEFAULT 'Daily Quote' CHECK (quote_type IN ('Daily Quote', 'Bid')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'won', 'lost', 'expired')),
  valid_until DATE,
  ship_until DATE,
  customer_bid_number TEXT,
  purchase_order_number TEXT,
  total_value DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  total_margin DECIMAL(5,2) DEFAULT 0,
  line_item_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Bid-specific fields
  dbe_required BOOLEAN DEFAULT false,
  bid_bond_required BOOLEAN DEFAULT false,
  performance_bond_required BOOLEAN DEFAULT false,
  insurance_required BOOLEAN DEFAULT false,
  
  -- Loss tracking fields
  winning_competitor TEXT,
  loss_reason TEXT,
  loss_notes TEXT
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes they created"
  ON quotes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage quotes they created"
  ON quotes FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Quote line items table
CREATE TABLE IF NOT EXISTS quote_line_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  supplier TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  margin_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN unit_price > 0 THEN ((unit_price - unit_cost) / unit_price) * 100
      ELSE 0
    END
  ) STORED,
  lead_time TEXT,
  quoted_lead_time TEXT,
  next_available_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'price_request', 'lead_time_request', 'item_load', 'no_quote')),
  shipping_instructions TEXT,
  customer_part_number TEXT,
  is_replacement BOOLEAN DEFAULT false,
  replacement_type TEXT,
  replacement_reason TEXT,
  original_customer_sku TEXT,
  original_customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line items for their quotes"
  ON quote_line_items FOR SELECT
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage line items for their quotes"
  ON quote_line_items FOR ALL
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE created_by = auth.uid()
    )
  );

-- Cross references table
CREATE TABLE IF NOT EXISTS cross_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  customer_part_number TEXT NOT NULL,
  supplier_part_number TEXT,
  internal_part_number TEXT NOT NULL,
  description TEXT,
  last_used_at TIMESTAMPTZ,
  usage_frequency INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, customer_part_number, product_id)
);

ALTER TABLE cross_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cross references"
  ON cross_references FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage cross references"
  ON cross_references FOR ALL
  TO authenticated
  USING (true);

-- Price breaks table
CREATE TABLE IF NOT EXISTS price_breaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, min_quantity, max_quantity)
);

ALTER TABLE price_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view price breaks"
  ON price_breaks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage price breaks"
  ON price_breaks FOR ALL
  TO authenticated
  USING (true);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES quote_line_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity_reserved INTEGER NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released', 'converted')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage their reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Cost analysis table
CREATE TABLE IF NOT EXISTS cost_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  line_item_id UUID REFERENCES quote_line_items(id) ON DELETE CASCADE,
  base_cost DECIMAL(10,2) NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  overhead_rate DECIMAL(5,2) DEFAULT 0,
  overhead_amount DECIMAL(10,2) GENERATED ALWAYS AS (base_cost * overhead_rate / 100) STORED,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (base_cost + labor_cost + (base_cost * overhead_rate / 100)) STORED,
  target_margin DECIMAL(5,2) DEFAULT 0,
  margin_amount DECIMAL(10,2),
  suggested_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cost_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cost analysis for their quotes"
  ON cost_analysis FOR SELECT
  TO authenticated
  USING (
    line_item_id IN (
      SELECT qli.id FROM quote_line_items qli
      JOIN quotes q ON qli.quote_id = q.id
      WHERE q.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage cost analysis for their quotes"
  ON cost_analysis FOR ALL
  TO authenticated
  USING (
    line_item_id IN (
      SELECT qli.id FROM quote_line_items qli
      JOIN quotes q ON qli.quote_id = q.id
      WHERE q.created_by = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_product_id ON quote_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product_id ON inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_cross_references_customer_id ON cross_references(customer_id);
CREATE INDEX IF NOT EXISTS idx_cross_references_product_id ON cross_references(product_id);
CREATE INDEX IF NOT EXISTS idx_price_breaks_product_id ON price_breaks(product_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_users_updated_at BEFORE UPDATE ON customer_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_levels_updated_at BEFORE UPDATE ON inventory_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_line_items_updated_at BEFORE UPDATE ON quote_line_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cross_references_updated_at BEFORE UPDATE ON cross_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_price_breaks_updated_at BEFORE UPDATE ON price_breaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_analysis_updated_at BEFORE UPDATE ON cost_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();