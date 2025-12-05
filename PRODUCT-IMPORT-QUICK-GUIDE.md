# Product Import Quick Guide

## Correct Product Schema

### Required Fields
- `sku` (string) - Unique stock keeping unit
- `name` (string) - Product name  
- `category` (string) - Product category
- `supplier` (string) - Supplier name

### Optional Fields
- `description` (string) - Product description
- `unit_cost` (number) - Unit cost (default: 0)
- `list_price` (number) - List price (default: 0)
- `lead_time_days` (number) - Lead time in days (default: 0)
- `lead_time_text` (string) - Lead time description
- `warehouse` (string) - Warehouse code (default: 'main')
- `status` (string) - 'active', 'inactive', or 'discontinued' (default: 'active')

## Example JSON

```json
[
  {
    "sku": "PROD-001",
    "name": "Industrial Widget",
    "category": "Industrial Equipment",
    "supplier": "WidgetCo Manufacturing",
    "unit_cost": 125.50,
    "list_price": 199.99,
    "lead_time_days": 14,
    "lead_time_text": "2-3 weeks",
    "warehouse": "main",
    "status": "active"
  },
  {
    "sku": "PROD-002",
    "name": "Office Desk",
    "category": "Office Furniture",
    "supplier": "Office Depot",
    "unit_cost": 250.00,
    "list_price": 399.99,
    "description": "Adjustable height office desk",
    "lead_time_days": 7,
    "warehouse": "main",
    "status": "active"
  }
]
```

## Quick Start

### Via Web UI
1. Navigate to **Product Import** in the menu
2. Click "Load Sample Data" to see correct format
3. Replace with your data
4. Click "Import Products"

### Via API

```bash
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/import-products' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "products": [
      {
        "sku": "PROD-001",
        "name": "Product Name",
        "category": "Category Name",
        "supplier": "Supplier Name",
        "unit_cost": 50.00,
        "list_price": 75.00
      }
    ],
    "mode": "upsert"
  }'
```

## Common Errors

**Missing category or supplier**
- Solution: Always include `category` and `supplier` fields
- If not provided, defaults are used ('Uncategorized', 'Unknown')

**Wrong field names**
- Use `unit_cost` NOT `cost`
- Use `supplier` NOT `manufacturer`
- Use `status` NOT `is_active`

## Import Modes

- **upsert** (recommended) - Updates existing products, inserts new ones
- **insert** - Only inserts new products, skips duplicates

## Tips

1. Always test with 1-2 products first
2. Use "Load Sample Data" button to see correct format
3. Download template for reference
4. Check import history for errors

For complete documentation, see `PRODUCT-IMPORT-API-GUIDE.md`
