/*
  # Add Warehouse Field to Quote Line Items

  1. Changes
    - Add `warehouse` column to `quote_line_items` table
      - Type: text (to allow for flexible configuration)
      - Nullable: true (optional field)
      - Default: null
    
  2. Configuration
    - Add default warehouse options to `app_configurations` table
      - Key: 'warehouse_options'
      - Value: JSON array of warehouse codes ['MB', 'CA', 'ON', 'KY', 'NJ']
    
  3. Notes
    - Warehouse field is user-entered with dropdown selection
    - Options are configurable through the settings page
    - Default options: MB, CA, ON, KY, NJ
*/

-- Add warehouse column to quote_line_items
ALTER TABLE quote_line_items 
ADD COLUMN IF NOT EXISTS warehouse text;

-- Create index for filtering by warehouse
CREATE INDEX IF NOT EXISTS idx_quote_line_items_warehouse 
ON quote_line_items(warehouse);

-- Insert default warehouse configuration
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted, created_at, updated_at)
VALUES (
  'warehouse_options',
  '["MB", "CA", "ON", "KY", "NJ"]',
  'general',
  'Available warehouse location options for quote line items',
  false,
  now(),
  now()
)
ON CONFLICT (config_key) DO UPDATE
SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = now();
