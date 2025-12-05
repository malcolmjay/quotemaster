/*
  # Populate Product Effective Dates

  1. Updates
     - Set `cost_effective_from` to current date for all existing products
     - Set `cost_effective_to` to one year from now for most products
     - Create varied expiration dates to demonstrate the cost highlighting system
     - Some products will have expired costs (red highlighting)
     - Some products will expire within 30 days (orange highlighting)
     - Most products will be valid for longer periods (green highlighting)

  2. Test Data Scenarios
     - Products with expired costs (past effective_to dates)
     - Products expiring soon (within 30 days)
     - Products with valid long-term costs
*/

-- Update all existing products with effective dates
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE,
  cost_effective_to = CURRENT_DATE + INTERVAL '1 year'
WHERE cost_effective_from IS NULL OR cost_effective_to IS NULL;

-- Create test scenarios for cost highlighting demonstration
-- Set some products to have expired costs (red highlighting)
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE - INTERVAL '1 year',
  cost_effective_to = CURRENT_DATE - INTERVAL '30 days'
WHERE sku IN (
  SELECT sku FROM products 
  WHERE status = 'active' 
  ORDER BY created_at 
  LIMIT 2
);

-- Set some products to expire within 30 days (orange highlighting)
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE - INTERVAL '6 months',
  cost_effective_to = CURRENT_DATE + INTERVAL '15 days'
WHERE sku IN (
  SELECT sku FROM products 
  WHERE status = 'active' 
  AND cost_effective_to > CURRENT_DATE
  ORDER BY created_at 
  LIMIT 3
);

-- Set some products to expire within 30 days but later than the orange ones
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE - INTERVAL '3 months',
  cost_effective_to = CURRENT_DATE + INTERVAL '25 days'
WHERE sku IN (
  SELECT sku FROM products 
  WHERE status = 'active' 
  AND cost_effective_to > CURRENT_DATE + INTERVAL '20 days'
  ORDER BY created_at 
  LIMIT 2
);

-- Ensure remaining products have good long-term validity (green highlighting)
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE,
  cost_effective_to = CURRENT_DATE + INTERVAL '18 months'
WHERE cost_effective_to <= CURRENT_DATE + INTERVAL '2 months';

-- Add some products with costs effective from future dates
UPDATE products 
SET 
  cost_effective_from = CURRENT_DATE + INTERVAL '30 days',
  cost_effective_to = CURRENT_DATE + INTERVAL '2 years'
WHERE sku IN (
  SELECT sku FROM products 
  WHERE status = 'active' 
  ORDER BY updated_at DESC 
  LIMIT 1
);