# Bulk Data Insertion Guide

## Summary

I've generated SQL scripts to insert 1,000 customers and 1,000 products into your database.

**Status:**
- ✅ Generated SQL for 1,000 customers (CUST001000 through CUST001999)
- ✅ Generated SQL for 1,000 products (PROD001000 through PROD001999)
- ✅ Successfully inserted first 10 customers as a test (CUST001000-001009)
- ⏳ Remaining: 990 customers and 1,000 products ready to insert

## Generated Files

1. **scripts/all-batches.sql** - Complete file with all 200 INSERT statements (100 for customers, 100 for products)
   - Lines 2-101: Customer inserts (10 records per INSERT, 1000 total)
   - Lines 104-203: Product inserts (10 records per INSERT, 1000 total)

2. **scripts/bulk-customer-inserts.sql** - Customer inserts only (990 remaining)

## Suppliers Included

20 different suppliers across various categories:
- Acme Industries
- Global Supply Co
- Premier Parts
- Midwest Manufacturing
- Pacific Components
- Atlantic Wholesale
- Central Distribution
- Northern Supplies
- Southern Industrial
- Eastern Equipment
- Western Logistics
- Continental Parts
- National Components
- Regional Supply
- Metro Wholesale
- United Distributors
- Allied Manufacturing
- Standard Products
- Superior Components
- Quality Parts Co

## How to Complete the Data Insertion

### Using Supabase SQL Editor (Recommended)

**Step 1: Access the SQL Editor**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to "SQL Editor" in the left sidebar
4. Click "New query"

**Step 2: Execute Customer Inserts**
1. Open `scripts/all-batches.sql` in your code editor
2. Copy lines 3-101 (skip line 2 since those 10 customers are already inserted)
3. Paste into the SQL Editor
4. Click "Run" to execute all customer inserts at once

**Step 3: Execute Product Inserts**
1. Copy lines 104-203 from `scripts/all-batches.sql`
2. Paste into a new SQL Editor query
3. Click "Run" to execute all product inserts

**Note:** The Supabase SQL Editor can handle all batches at once since it runs with elevated privileges that bypass RLS.

### Option 2: Using the Migration System

Create a migration file:

```bash
# Extract customer inserts (skip first 10 already inserted)
sed -n '4,102p' scripts/all-batches.sql > supabase/migrations/$(date +%Y%m%d%H%M%S)_bulk_customers.sql

# Extract product inserts
sed -n '104,203p' scripts/all-batches.sql > supabase/migrations/$(date +%Y%m%d%H%M%S)_bulk_products.sql
```

Then apply the migrations through Supabase.

### Option 3: Programmatic Insertion

Use the provided Node.js script to execute batches:

```bash
export VITE_SUPABASE_URL=your_url
export VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key
node scripts/execute-batches.js
```

## Data Characteristics

### Customers
- Customer Types: Federal, State, Local, Commercial
- Segments: Government, Defense, Education, Healthcare, Commercial
- Tiers: Bronze, Silver, Gold, Platinum
- Payment Terms: NET 30, NET 60, NET 90, Prepaid, COD
- Assigned to 20 different managers and 50 different sales reps

### Products
- 20 different categories (Electronics, Hardware, Tools, etc.)
- 20 different suppliers
- Unit costs ranging from $100 to $10,000
- List prices with 20-80% markup
- Lead times from 1-90 days
- Various warehouses: Main, East, West, North, South, Central
- Countries of origin: USA, China, Germany, Japan, Mexico, Canada

## Verification

After insertion, verify with:

```sql
-- Check customer count
SELECT COUNT(*) FROM customers WHERE customer_number LIKE 'CUST001%';
-- Should return: 1000

-- Check product count
SELECT COUNT(*) FROM products WHERE sku LIKE 'PROD001%';
-- Should return: 1000

-- Check supplier distribution
SELECT supplier, COUNT(*) FROM products
WHERE sku LIKE 'PROD001%'
GROUP BY supplier ORDER BY supplier;
-- Should show 20 suppliers with ~50 products each
```

## Next Steps

1. Complete the remaining customer inserts (990 records)
2. Execute all product inserts (1000 records)
3. Verify data integrity
4. Optionally generate additional batches if needed

## Notes

- All customer numbers follow the pattern: CUST00xxxx
- All product SKUs follow the pattern: PROD00xxxx
- Contract numbers for non-commercial customers follow: CTR-xxxxxx
- All prices include reasonable cost/pricing relationships
- Lead times and inventory data are realistic
