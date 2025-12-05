/*
  # Insert Realistic Customer Test Data

  1. New Records
    - 10 customer records based on real public entities
    - Geographic diversity across US and Canada
    - Complete contact information and addresses
    - Realistic customer users for each entity

  2. Data Structure
    - Government agencies (federal, state, local)
    - Educational institutions
    - Healthcare organizations
    - Mix of customer types and segments

  3. Contact Information
    - Realistic but fictional contact persons
    - Appropriate email domains
    - Regional phone number formats
    - Complete mailing addresses
*/

-- Insert 10 realistic customers based on real public entities
INSERT INTO customers (
  name,
  customer_number,
  type,
  segment,
  contract_number,
  billing_address,
  shipping_address,
  primary_contact,
  payment_terms,
  currency,
  tier
) VALUES
-- 1. City of Toronto (Canada)
(
  'City of Toronto',
  'CUST-2025-001',
  'local',
  'government',
  'COT-2025-IT-001',
  '{"street1": "100 Queen Street West", "city": "Toronto", "state": "ON", "postal_code": "M5H 2N2", "country": "Canada"}',
  '{"street1": "100 Queen Street West", "city": "Toronto", "state": "ON", "postal_code": "M5H 2N2", "country": "Canada"}',
  '{"first_name": "Sarah", "last_name": "Mitchell", "email": "sarah.mitchell@toronto.ca", "phone": "+1 (416) 392-7885", "title": "IT Procurement Manager"}',
  'NET 30',
  'CAD',
  'gold'
),

-- 2. University of California, Berkeley
(
  'University of California, Berkeley',
  'CUST-2025-002',
  'state',
  'education',
  'UCB-2025-TECH-002',
  '{"street1": "200 California Hall", "city": "Berkeley", "state": "CA", "postal_code": "94720", "country": "United States"}',
  '{"street1": "2195 Hearst Avenue", "city": "Berkeley", "state": "CA", "postal_code": "94720", "country": "United States"}',
  '{"first_name": "Dr. Michael", "last_name": "Chen", "email": "mchen@berkeley.edu", "phone": "+1 (510) 642-6000", "title": "Director of IT Services"}',
  'NET 45',
  'USD',
  'platinum'
),

-- 3. Department of Veterans Affairs
(
  'Department of Veterans Affairs',
  'CUST-2025-003',
  'federal',
  'government',
  'VA-2025-MED-003',
  '{"street1": "810 Vermont Avenue NW", "city": "Washington", "state": "DC", "postal_code": "20420", "country": "United States"}',
  '{"street1": "810 Vermont Avenue NW", "city": "Washington", "state": "DC", "postal_code": "20420", "country": "United States"}',
  '{"first_name": "Colonel James", "last_name": "Rodriguez", "email": "james.rodriguez@va.gov", "phone": "+1 (202) 461-4800", "title": "Chief Technology Officer"}',
  'NET 30',
  'USD',
  'platinum'
),

-- 4. Mayo Clinic
(
  'Mayo Clinic',
  'CUST-2025-004',
  'commercial',
  'healthcare',
  'MAYO-2025-IT-004',
  '{"street1": "200 First Street SW", "city": "Rochester", "state": "MN", "postal_code": "55905", "country": "United States"}',
  '{"street1": "200 First Street SW", "city": "Rochester", "state": "MN", "postal_code": "55905", "country": "United States"}',
  '{"first_name": "Dr. Lisa", "last_name": "Thompson", "email": "thompson.lisa@mayo.edu", "phone": "+1 (507) 284-2511", "title": "Chief Information Officer"}',
  'NET 30',
  'USD',
  'gold'
),

-- 5. Province of British Columbia
(
  'Province of British Columbia',
  'CUST-2025-005',
  'state',
  'government',
  'BC-2025-GOV-005',
  '{"street1": "Parliament Buildings", "street2": "501 Belleville Street", "city": "Victoria", "state": "BC", "postal_code": "V8V 2L8", "country": "Canada"}',
  '{"street1": "Parliament Buildings", "street2": "501 Belleville Street", "city": "Victoria", "state": "BC", "postal_code": "V8V 2L8", "country": "Canada"}',
  '{"first_name": "David", "last_name": "Kim", "email": "david.kim@gov.bc.ca", "phone": "+1 (250) 387-1234", "title": "Director of Digital Services"}',
  'NET 30',
  'CAD',
  'gold'
),

-- 6. Texas A&M University System
(
  'Texas A&M University System',
  'CUST-2025-006',
  'state',
  'education',
  'TAMU-2025-SYS-006',
  '{"street1": "301 Tarrow Street", "city": "College Station", "state": "TX", "postal_code": "77840", "country": "United States"}',
  '{"street1": "301 Tarrow Street", "city": "College Station", "state": "TX", "postal_code": "77840", "country": "United States"}',
  '{"first_name": "Maria", "last_name": "Gonzalez", "email": "mgonzalez@tamus.edu", "phone": "+1 (979) 458-6000", "title": "Associate Vice Chancellor for IT"}',
  'NET 45',
  'USD',
  'silver'
),

-- 7. City of Seattle
(
  'City of Seattle',
  'CUST-2025-007',
  'local',
  'government',
  'SEA-2025-TECH-007',
  '{"street1": "600 4th Avenue", "city": "Seattle", "state": "WA", "postal_code": "98104", "country": "United States"}',
  '{"street1": "600 4th Avenue", "city": "Seattle", "state": "WA", "postal_code": "98104", "country": "United States"}',
  '{"first_name": "Jennifer", "last_name": "Park", "email": "jennifer.park@seattle.gov", "phone": "+1 (206) 684-4000", "title": "Chief Technology Officer"}',
  'NET 30',
  'USD',
  'gold'
),

-- 8. McGill University
(
  'McGill University',
  'CUST-2025-008',
  'commercial',
  'education',
  'MCGILL-2025-IT-008',
  '{"street1": "845 Sherbrooke Street West", "city": "Montreal", "state": "QC", "postal_code": "H3A 0G4", "country": "Canada"}',
  '{"street1": "845 Sherbrooke Street West", "city": "Montreal", "state": "QC", "postal_code": "H3A 0G4", "country": "Canada"}',
  '{"first_name": "Dr. Pierre", "last_name": "Dubois", "email": "pierre.dubois@mcgill.ca", "phone": "+1 (514) 398-4455", "title": "Director of Information Technology"}',
  'NET 45',
  'CAD',
  'silver'
),

-- 9. Johns Hopkins Hospital
(
  'Johns Hopkins Hospital',
  'CUST-2025-009',
  'commercial',
  'healthcare',
  'JHH-2025-MED-009',
  '{"street1": "1800 Orleans Street", "city": "Baltimore", "state": "MD", "postal_code": "21287", "country": "United States"}',
  '{"street1": "1800 Orleans Street", "city": "Baltimore", "state": "MD", "postal_code": "21287", "country": "United States"}',
  '{"first_name": "Dr. Robert", "last_name": "Williams", "email": "rwilliams@jhmi.edu", "phone": "+1 (410) 955-5000", "title": "Chief Information Officer"}',
  'NET 30',
  'USD',
  'platinum'
),

-- 10. State of Florida
(
  'State of Florida',
  'CUST-2025-010',
  'state',
  'government',
  'FL-2025-STATE-010',
  '{"street1": "400 S Monroe Street", "city": "Tallahassee", "state": "FL", "postal_code": "32399", "country": "United States"}',
  '{"street1": "400 S Monroe Street", "city": "Tallahassee", "state": "FL", "postal_code": "32399", "country": "United States"}',
  '{"first_name": "Amanda", "last_name": "Johnson", "email": "amanda.johnson@myflorida.com", "phone": "+1 (850) 488-1234", "title": "State Chief Information Officer"}',
  'NET 30',
  'USD',
  'gold'
);

-- Insert corresponding customer users for each customer
INSERT INTO customer_users (
  customer_id,
  first_name,
  last_name,
  email,
  phone,
  title,
  is_primary
) VALUES
-- Customer users for each of the 10 customers
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-001'), 'Sarah', 'Mitchell', 'sarah.mitchell@toronto.ca', '+1 (416) 392-7885', 'IT Procurement Manager', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-001'), 'Mark', 'Thompson', 'mark.thompson@toronto.ca', '+1 (416) 392-7890', 'Senior Procurement Specialist', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-002'), 'Dr. Michael', 'Chen', 'mchen@berkeley.edu', '+1 (510) 642-6000', 'Director of IT Services', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-002'), 'Jennifer', 'Lee', 'jlee@berkeley.edu', '+1 (510) 642-6010', 'IT Procurement Coordinator', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-003'), 'Colonel James', 'Rodriguez', 'james.rodriguez@va.gov', '+1 (202) 461-4800', 'Chief Technology Officer', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-003'), 'Major Susan', 'Davis', 'susan.davis@va.gov', '+1 (202) 461-4805', 'IT Acquisition Manager', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-004'), 'Dr. Lisa', 'Thompson', 'thompson.lisa@mayo.edu', '+1 (507) 284-2511', 'Chief Information Officer', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-004'), 'Robert', 'Anderson', 'anderson.robert@mayo.edu', '+1 (507) 284-2520', 'IT Infrastructure Manager', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-005'), 'David', 'Kim', 'david.kim@gov.bc.ca', '+1 (250) 387-1234', 'Director of Digital Services', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-005'), 'Emily', 'Wong', 'emily.wong@gov.bc.ca', '+1 (250) 387-1240', 'Technology Procurement Lead', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-006'), 'Maria', 'Gonzalez', 'mgonzalez@tamus.edu', '+1 (979) 458-6000', 'Associate Vice Chancellor for IT', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-006'), 'John', 'Martinez', 'jmartinez@tamus.edu', '+1 (979) 458-6010', 'IT Procurement Director', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-007'), 'Jennifer', 'Park', 'jennifer.park@seattle.gov', '+1 (206) 684-4000', 'Chief Technology Officer', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-007'), 'Kevin', 'Brown', 'kevin.brown@seattle.gov', '+1 (206) 684-4010', 'IT Procurement Manager', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-008'), 'Dr. Pierre', 'Dubois', 'pierre.dubois@mcgill.ca', '+1 (514) 398-4455', 'Director of Information Technology', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-008'), 'Marie', 'Tremblay', 'marie.tremblay@mcgill.ca', '+1 (514) 398-4460', 'IT Services Coordinator', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-009'), 'Dr. Robert', 'Williams', 'rwilliams@jhmi.edu', '+1 (410) 955-5000', 'Chief Information Officer', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-009'), 'Patricia', 'Miller', 'pmiller@jhmi.edu', '+1 (410) 955-5010', 'IT Procurement Specialist', false),

((SELECT id FROM customers WHERE customer_number = 'CUST-2025-010'), 'Amanda', 'Johnson', 'amanda.johnson@myflorida.com', '+1 (850) 488-1234', 'State Chief Information Officer', true),
((SELECT id FROM customers WHERE customer_number = 'CUST-2025-010'), 'Carlos', 'Rivera', 'carlos.rivera@myflorida.com', '+1 (850) 488-1240', 'State IT Procurement Director', false);