# Product Import API Guide

Complete guide for importing product/item data from your ERP system into the QuoteMaster Pro database.

---

## Overview

The Product Import API allows you to:
- ✅ Import products in batch from your ERP system
- ✅ Update existing products or insert new ones (upsert)
- ✅ Track import history and errors
- ✅ Validate data before importing
- ✅ Use via API calls or web UI

---

## Quick Start

### Step 1: Run Database Migration

Execute this migration in your Supabase SQL Editor:

```bash
File: supabase/migrations/20251022000004_create_products_table.sql
```

This creates:
- `products` table - Stores all product data
- `product_import_logs` table - Tracks all imports

### Step 2: Deploy Edge Function

The Edge Function is already created at:
```
supabase/functions/import-products/index.ts
```

Deploy it using the Supabase CLI or dashboard.

### Step 3: Start Importing

Use either the web UI or API endpoints to import products.

---

## Product Schema

### Required Fields
- `sku` (string) - Stock Keeping Unit, must be unique
- `name` (string) - Product name

### Optional Fields
- `erp_item_id` (string) - Your ERP's item ID (unique)
- `description` (string) - Full product description
- `category` (string) - Product category
- `manufacturer` (string) - Manufacturer name
- `manufacturer_part_number` (string) - MPN
- `uom` (string) - Unit of measure (default: 'EA')
- `cost` (number) - Base cost
- `list_price` (number) - List price
- `weight` (number) - Weight in lbs
- `dimensions` (object) - `{ length, width, height }`
- `is_active` (boolean) - Active status (default: true)
- `is_discontinued` (boolean) - Discontinued flag (default: false)
- `tags` (array) - Search tags
- `metadata` (object) - Additional ERP data

### Example Product Object

```json
{
  "sku": "PROD-12345",
  "erp_item_id": "ERP-67890",
  "name": "Industrial Widget Pro",
  "description": "High-performance industrial widget with advanced features",
  "category": "Industrial Equipment",
  "manufacturer": "WidgetCo",
  "manufacturer_part_number": "WC-IW-PRO-001",
  "uom": "EA",
  "cost": 125.50,
  "list_price": 199.99,
  "weight": 15.5,
  "dimensions": {
    "length": 12,
    "width": 8,
    "height": 6
  },
  "is_active": true,
  "is_discontinued": false,
  "tags": ["industrial", "widget", "pro", "heavy-duty"],
  "metadata": {
    "supplier_id": "SUP-123",
    "lead_time_days": 14,
    "minimum_order_quantity": 1,
    "hazmat": false,
    "country_of_origin": "USA"
  }
}
```

---

## Using the Web UI

### Access Product Import Page

1. Log into QuoteMaster Pro
2. Click **Product Import** in the left navigation
3. You'll see the import interface

### Import Methods

#### Method 1: Upload JSON File
1. Click "Upload JSON File"
2. Select your `.json` file containing products array
3. Click "Import Products"

#### Method 2: Paste JSON Data
1. Paste JSON array directly into the text area
2. Click "Import Products"

#### Method 3: Load Sample Data
1. Click "Load Sample Data" to see example format
2. Modify as needed
3. Click "Import Products"

### Import Mode

**Upsert (Recommended)**
- Updates existing products (matched by SKU)
- Inserts new products
- Best for syncing data

**Insert Only**
- Only inserts new products
- Skips duplicates
- Best for initial load

### View Import History

Click **"Import History"** to see:
- All previous imports
- Success/failure counts
- Error messages
- Timestamps

---

## Using the API

### Base URL

```
{YOUR_SUPABASE_URL}/functions/v1/import-products
```

### Authentication

Include your Supabase anon key or user token:

```bash
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

## API Endpoints

### 1. Batch Import Products

**Endpoint:** `POST /import-products`

**Purpose:** Import multiple products at once

**Request Body:**
```json
{
  "products": [
    {
      "sku": "PROD-001",
      "name": "Product 1",
      "cost": 50.00,
      "list_price": 75.00
    },
    {
      "sku": "PROD-002",
      "name": "Product 2",
      "cost": 100.00,
      "list_price": 150.00
    }
  ],
  "mode": "upsert"
}
```

**Parameters:**
- `products` (array, required) - Array of product objects
- `mode` (string, optional) - "upsert" or "insert" (default: "upsert")

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 2 product(s)",
  "imported": 2,
  "failed": 0,
  "import_log_id": "uuid-here"
}
```

**cURL Example:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/import-products' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "products": [
      {
        "sku": "TEST-001",
        "name": "Test Product",
        "cost": 10.00,
        "list_price": 15.00
      }
    ],
    "mode": "upsert"
  }'
```

### 2. Import Single Product

**Endpoint:** `POST /import-products/single`

**Purpose:** Import one product

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Product Name",
  "cost": 50.00,
  "list_price": 75.00,
  "category": "Electronics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 1 product(s)",
  "imported": 1,
  "failed": 0,
  "import_log_id": "uuid-here"
}
```

### 3. Get Import History

**Endpoint:** `GET /import-products/logs?limit=50`

**Purpose:** Retrieve import history

**Query Parameters:**
- `limit` (number, optional) - Number of logs to return (default: 50)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "import_type": "full",
      "total_records": 100,
      "successful_records": 95,
      "failed_records": 5,
      "errors": ["Error 1", "Error 2"],
      "import_source": "api",
      "started_at": "2025-10-22T10:00:00Z",
      "completed_at": "2025-10-22T10:01:00Z",
      "status": "completed_with_errors"
    }
  ]
}
```

### 4. Delete All Products (CAUTION!)

**Endpoint:** `DELETE /import-products/all?confirm=yes-delete-all`

**Purpose:** Clear all products from database

**Query Parameters:**
- `confirm` (string, required) - Must be "yes-delete-all"

**Response:**
```json
{
  "success": true,
  "message": "All products deleted successfully"
}
```

**⚠️ WARNING:** This permanently deletes ALL products. Use with extreme caution!

---

## Integration Examples

### Example 1: Python Script

```python
import requests
import json

SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"

def import_products_from_erp():
    # Get products from your ERP
    erp_products = fetch_from_erp()  # Your ERP API call

    # Transform to our format
    products = []
    for erp_product in erp_products:
        products.append({
            "sku": erp_product["item_code"],
            "erp_item_id": erp_product["id"],
            "name": erp_product["description"],
            "cost": erp_product["unit_cost"],
            "list_price": erp_product["selling_price"],
            "category": erp_product["category"],
            "is_active": erp_product["status"] == "active"
        })

    # Import to QuoteMaster
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/import-products",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "products": products,
            "mode": "upsert"
        }
    )

    result = response.json()
    print(f"Imported: {result['imported']}, Failed: {result['failed']}")

    if result.get('errors'):
        print("Errors:", result['errors'])

# Run import
import_products_from_erp()
```

### Example 2: Node.js Script

```javascript
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

async function importProductsFromERP() {
  // Get products from your ERP
  const erpProducts = await fetchFromERP(); // Your ERP API call

  // Transform to our format
  const products = erpProducts.map(erpProduct => ({
    sku: erpProduct.item_code,
    erp_item_id: erpProduct.id,
    name: erpProduct.description,
    cost: parseFloat(erpProduct.unit_cost),
    list_price: parseFloat(erpProduct.selling_price),
    category: erpProduct.category,
    is_active: erpProduct.status === 'active'
  }));

  // Import to QuoteMaster
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/import-products`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        products,
        mode: 'upsert'
      })
    }
  );

  const result = await response.json();
  console.log(`Imported: ${result.imported}, Failed: ${result.failed}`);

  if (result.errors) {
    console.log('Errors:', result.errors);
  }
}

// Run import
importProductsFromERP();
```

### Example 3: Scheduled Import (Cron Job)

```bash
#!/bin/bash
# scheduled-import.sh
# Run this with cron: 0 2 * * * /path/to/scheduled-import.sh

SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"

# Export products from ERP to JSON
# (Replace with your ERP export command)
./export-erp-products.sh > /tmp/products.json

# Import to QuoteMaster
curl -X POST \
  "${SUPABASE_URL}/functions/v1/import-products" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d @/tmp/products.json

# Clean up
rm /tmp/products.json

echo "Import completed at $(date)"
```

---

## Error Handling

### Common Errors

**Missing Required Fields**
```json
{
  "success": false,
  "message": "Imported 0 product(s), 1 failed",
  "errors": ["Product at index 0: Missing required field 'sku' or 'name'"]
}
```

**Duplicate SKU (Insert Mode)**
```json
{
  "success": false,
  "message": "Database error: duplicate key value violates unique constraint",
  "errors": ["Duplicate SKU: PROD-001"]
}
```

**Invalid Data Type**
```json
{
  "errors": ["Product at index 5: 'cost' must be a number"]
}
```

### Best Practices

1. **Always validate data before importing**
   ```javascript
   function validateProduct(product) {
     if (!product.sku || !product.name) {
       throw new Error('Missing required fields');
     }
     if (product.cost && typeof product.cost !== 'number') {
       throw new Error('Cost must be a number');
     }
     return true;
   }
   ```

2. **Use upsert mode for syncs**
   - Upsert updates existing products
   - Prevents duplicate errors
   - Keeps data in sync

3. **Batch imports in chunks**
   ```javascript
   // Import in batches of 100
   const batchSize = 100;
   for (let i = 0; i < products.length; i += batchSize) {
     const batch = products.slice(i, i + batchSize);
     await importBatch(batch);
   }
   ```

4. **Check import logs**
   - Always review import logs
   - Check for failed records
   - Fix and re-import failures

---

## Performance Tips

### 1. Optimize Batch Size

- **Recommended:** 100-500 products per batch
- **Too small:** Many API calls, slow overall
- **Too large:** Timeout risk, large memory usage

### 2. Use Incremental Updates

Instead of importing all products:
```javascript
// Only import products updated since last sync
const lastSync = await getLastSyncTime();
const updatedProducts = await getProductsUpdatedSince(lastSync);
```

### 3. Schedule During Off-Peak Hours

Run large imports during low-traffic times (e.g., 2 AM).

### 4. Enable Compression

```bash
curl -X POST \
  --compressed \
  -H "Content-Encoding: gzip" \
  ...
```

---

## Security

### API Key Protection

- Never expose API keys in client-side code
- Use server-side scripts for imports
- Consider using service role key for imports

### Row Level Security (RLS)

The products table has RLS enabled:
- Anyone can read active products
- Only service role can write
- Authenticated users can read all products

### Audit Trail

All imports are logged in `product_import_logs`:
- Who imported (user ID)
- When (timestamps)
- What (product count, errors)
- Source (API, manual, scheduled)

---

## Troubleshooting

### Import Timing Out

**Solution 1:** Reduce batch size
```javascript
const batchSize = 50; // Smaller batches
```

**Solution 2:** Increase Edge Function timeout (in Supabase dashboard)

### Products Not Appearing

**Check 1:** Verify import succeeded
```javascript
if (result.success && result.imported > 0) {
  console.log('Products imported successfully');
}
```

**Check 2:** Check `is_active` field
```sql
SELECT * FROM products WHERE is_active = false;
```

**Check 3:** Review import logs
```sql
SELECT * FROM product_import_logs ORDER BY started_at DESC LIMIT 10;
```

### Duplicate SKU Errors

**Solution:** Use upsert mode
```json
{
  "mode": "upsert"
}
```

---

## Database Queries

### View All Products

```sql
SELECT * FROM products ORDER BY created_at DESC;
```

### Count Products

```sql
SELECT COUNT(*) as total_products FROM products WHERE is_active = true;
```

### Find Products by Category

```sql
SELECT * FROM products WHERE category = 'Electronics';
```

### Search by Tags

```sql
SELECT * FROM products WHERE 'industrial' = ANY(tags);
```

### Products Needing Sync

```sql
SELECT * FROM products
WHERE last_synced_at < NOW() - INTERVAL '24 hours'
OR last_synced_at IS NULL;
```

---

## Maintenance

### Clear Old Import Logs

```sql
DELETE FROM product_import_logs
WHERE started_at < NOW() - INTERVAL '90 days';
```

### Update All Prices

```sql
UPDATE products
SET list_price = list_price * 1.10,
    updated_at = NOW()
WHERE category = 'Electronics';
```

### Mark Discontinued Products

```sql
UPDATE products
SET is_discontinued = true,
    is_active = false,
    updated_at = NOW()
WHERE sku IN ('OLD-001', 'OLD-002', 'OLD-003');
```

---

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy Edge Function
3. ✅ Test with sample data
4. ✅ Create import script for your ERP
5. ✅ Schedule regular syncs
6. ✅ Monitor import logs

---

## Support

### Documentation
- Product schema: See `products` table in database
- Import logs: `product_import_logs` table
- Web UI: Navigation → Product Import

### Common Issues
- Check browser console for errors
- Review import logs in database
- Verify API key is correct
- Ensure Edge Function is deployed

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** October 22, 2025
