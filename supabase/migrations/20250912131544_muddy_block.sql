/*
  # Insert Automotive Test Parts

  1. New Data
    - Insert 20 automotive test parts into products table
    - Include superseded and active parts with realistic data
    - Add corresponding inventory levels for each product
    - Add price breaks for volume discounts

  2. Categories
    - Engine components (fuel injectors, oil filters, radiators, etc.)
    - Electrical parts (alternators, sensors, ignition coils)
    - Brake components (pads, rotors)
    - Suspension parts (struts, shocks, tie rods)
    - Filters (oil, air, cabin filters)

  3. Manufacturers
    - OEM: Ford, GM, Toyota, Honda, BMW, Nissan, Hyundai, VW, Subaru, Mazda, Mitsubishi, Lexus
    - Aftermarket: ACDelco, Denso, Bosch, Moog, Valvoline

  4. Supersession Relationships
    - 12 superseded parts with replacement relationships
    - 8 active/current parts including replacements
*/

-- Insert automotive test parts
INSERT INTO products (sku, name, description, category, supplier, unit_cost, list_price, lead_time_days, lead_time_text, warehouse, status) VALUES
-- SUPERSEDED PARTS (60% - 12 items)
('FOR-6C3Z-6584-AA', 'Engine Oil Filter - Standard Duty', 'Standard duty oil filter for Ford F-150 and Mustang GT applications', 'filters', 'Ford Motor Company', 12.50, 24.99, 0, 'Superseded - See FOR-7C3Z-6584-AB', 'main', 'discontinued'),
('GM-12611801', 'Fuel Injector Assembly - Port Injection', 'Port fuel injection assembly for Chevrolet Silverado 1500 5.3L engine', 'engine', 'General Motors', 89.75, 179.99, 14, 'Superseded - See GM-12635273', 'main', 'discontinued'),
('TOY-04465-02180', 'Front Brake Pad Set - Ceramic', 'Ceramic brake pad set for Toyota Camry and Avalon front axle', 'brakes', 'Toyota Motor Corporation', 45.25, 89.99, 7, 'Superseded - See TOY-04465-02190', 'main', 'discontinued'),
('HON-31200-RCA-A02', 'Alternator Assembly - 130 Amp', '130 amp alternator assembly for Honda Accord 2.4L engine', 'electrical', 'Honda Motor Company', 156.80, 289.99, 10, 'Superseded - See HON-31200-RCA-A03', 'main', 'discontinued'),
('BMW-31316786425', 'Front Strut Assembly - Standard Suspension', 'Front strut assembly for BMW 3 Series F30 standard suspension', 'suspension', 'BMW Group', 234.50, 449.99, 21, 'Superseded - See BMW-31316786430', 'main', 'discontinued'),
('NIS-16546-ED000', 'Air Filter Element - Paper Type', 'Paper air filter element for Nissan Altima 2.5L engine', 'filters', 'Nissan Motor Company', 18.90, 34.99, 5, 'Superseded - See NIS-16546-ED025', 'main', 'discontinued'),
('HYU-35100-2E100', 'Ignition Coil Pack - Single Cylinder', 'Single cylinder ignition coil pack for Hyundai Elantra 1.8L', 'engine', 'Hyundai Motor Company', 67.25, 124.99, 12, 'Superseded - See HYU-35100-2E150', 'main', 'discontinued'),
('VW-1K0615301AA', 'Brake Rotor - Front Vented', 'Front vented brake rotor for Volkswagen Golf and Jetta', 'brakes', 'Volkswagen AG', 78.40, 149.99, 18, 'Superseded - See VW-1K0615301AB', 'main', 'discontinued'),
('SUB-22401AA540', 'Radiator Assembly - Aluminum Core', 'Aluminum core radiator assembly for Subaru Impreza and Forester', 'engine', 'Subaru Corporation', 189.60, 349.99, 25, 'Superseded - See SUB-22401AA560', 'main', 'discontinued'),
('MAZ-BP4K-18-741', 'Oxygen Sensor - Upstream', 'Upstream oxygen sensor for Mazda CX-5 2.0L engine', 'electrical', 'Mazda Motor Corporation', 95.30, 179.99, 8, 'Superseded - See MAZ-BP4K-18-741A', 'main', 'discontinued'),
('MIT-4605A536', 'Shock Absorber - Rear', 'Rear shock absorber for Mitsubishi Outlander', 'suspension', 'Mitsubishi Motors', 112.75, 199.99, 16, 'Superseded - See MIT-4605A540', 'main', 'discontinued'),
('LEX-90915-YZZD1', 'Oil Filter - Premium Synthetic', 'Premium synthetic oil filter for Lexus ES350 and RX350', 'filters', 'Lexus (Toyota)', 16.85, 32.99, 3, 'Superseded - See LEX-90915-YZZD2', 'main', 'discontinued'),

-- ACTIVE/CURRENT PARTS (40% - 8 items)
('FOR-7C3Z-6584-AB', 'Engine Oil Filter - Heavy Duty', 'Heavy duty oil filter with improved filtration media and seal design', 'filters', 'Ford Motor Company', 14.75, 28.99, 2, '2 days', 'main', 'active'),
('GM-12635273', 'Fuel Injector Assembly - Direct Injection', 'Direct injection fuel injector with enhanced spray pattern and durability', 'engine', 'General Motors', 98.50, 199.99, 7, '7 days', 'main', 'active'),
('TOY-04465-02190', 'Front Brake Pad Set - Low Dust Ceramic', 'Low dust ceramic brake pads with improved stopping performance', 'brakes', 'Toyota Motor Corporation', 52.80, 99.99, 4, '4 days', 'main', 'active'),
('ACE-AC4815C', 'Cabin Air Filter - Carbon Activated', 'Carbon activated cabin air filter for Chevrolet Malibu and Cruze', 'filters', 'ACDelco', 22.40, 42.99, 3, '3 days', 'main', 'active'),
('DEN-234-4536', 'Spark Plug - Iridium Tip', 'Iridium tip spark plug for Honda Civic 1.5L Turbo engine', 'engine', 'Denso Corporation', 8.95, 16.99, 1, '1 day', 'main', 'active'),
('BOS-0986494623', 'ABS Wheel Speed Sensor - Front', 'Front ABS wheel speed sensor for BMW X3 and X4', 'electrical', 'Robert Bosch GmbH', 145.60, 279.99, 14, '14 days', 'main', 'active'),
('MOO-MS851449', 'Tie Rod End - Outer', 'Outer tie rod end for Ford Explorer steering system', 'suspension', 'Moog Parts', 34.75, 67.99, 6, '6 days', 'main', 'active'),
('VAL-882752', 'Engine Valve Cover Gasket Set', 'Complete valve cover gasket set for Audi A4 2.0L TFSI engine', 'engine', 'Valvoline Instant Oil Change', 67.20, 124.99, 9, '9 days', 'main', 'active');

-- Insert corresponding inventory levels
INSERT INTO inventory_levels (product_id, warehouse, quantity_on_hand, quantity_reserved, reorder_point, reorder_quantity) 
SELECT 
  p.id,
  'main',
  CASE 
    WHEN p.status = 'discontinued' THEN FLOOR(RANDOM() * 10)  -- 0-9 for discontinued
    ELSE FLOOR(RANDOM() * 50) + 10  -- 10-59 for active
  END,
  FLOOR(RANDOM() * 5),  -- 0-4 reserved
  CASE 
    WHEN p.category = 'engine' THEN 5
    WHEN p.category = 'electrical' THEN 8
    WHEN p.category = 'brakes' THEN 10
    WHEN p.category = 'suspension' THEN 6
    WHEN p.category = 'filters' THEN 15
    ELSE 5
  END,
  CASE 
    WHEN p.category = 'engine' THEN 15
    WHEN p.category = 'electrical' THEN 20
    WHEN p.category = 'brakes' THEN 25
    WHEN p.category = 'suspension' THEN 12
    WHEN p.category = 'filters' THEN 30
    ELSE 15
  END
FROM products p 
WHERE p.sku IN (
  'FOR-6C3Z-6584-AA', 'GM-12611801', 'TOY-04465-02180', 'HON-31200-RCA-A02', 
  'BMW-31316786425', 'NIS-16546-ED000', 'HYU-35100-2E100', 'VW-1K0615301AA',
  'SUB-22401AA540', 'MAZ-BP4K-18-741', 'MIT-4605A536', 'LEX-90915-YZZD1',
  'FOR-7C3Z-6584-AB', 'GM-12635273', 'TOY-04465-02190', 'ACE-AC4815C',
  'DEN-234-4536', 'BOS-0986494623', 'MOO-MS851449', 'VAL-882752'
);

-- Insert price breaks for volume discounts
INSERT INTO price_breaks (product_id, min_quantity, max_quantity, unit_cost, description, discount_percent, effective_date)
SELECT 
  p.id,
  1,
  4,
  p.unit_cost,
  'Standard pricing',
  0,
  CURRENT_DATE
FROM products p 
WHERE p.sku IN (
  'FOR-7C3Z-6584-AB', 'GM-12635273', 'TOY-04465-02190', 'ACE-AC4815C',
  'DEN-234-4536', 'BOS-0986494623', 'MOO-MS851449', 'VAL-882752'
)
AND p.status = 'active';

-- Add volume discounts for active parts
INSERT INTO price_breaks (product_id, min_quantity, max_quantity, unit_cost, description, discount_percent, effective_date)
SELECT 
  p.id,
  5,
  19,
  p.unit_cost * 0.95,
  '5+ units - 5% discount',
  5.0,
  CURRENT_DATE
FROM products p 
WHERE p.sku IN (
  'FOR-7C3Z-6584-AB', 'GM-12635273', 'TOY-04465-02190', 'ACE-AC4815C',
  'DEN-234-4536', 'BOS-0986494623', 'MOO-MS851449', 'VAL-882752'
)
AND p.status = 'active';

INSERT INTO price_breaks (product_id, min_quantity, max_quantity, unit_cost, description, discount_percent, effective_date)
SELECT 
  p.id,
  20,
  999,
  p.unit_cost * 0.88,
  '20+ units - 12% discount',
  12.0,
  CURRENT_DATE
FROM products p 
WHERE p.sku IN (
  'FOR-7C3Z-6584-AB', 'GM-12635273', 'TOY-04465-02190', 'ACE-AC4815C',
  'DEN-234-4536', 'BOS-0986494623', 'MOO-MS851449', 'VAL-882752'
)
AND p.status = 'active';