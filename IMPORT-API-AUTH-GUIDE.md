# Import API Authentication Guide

Complete guide for securing your Product Import API with username/password authentication.

---

## Overview

The Import API Authentication feature allows you to:
- ✅ Secure import endpoints with username/password
- ✅ Use Basic Authentication (industry standard)
- ✅ Configure credentials via web interface
- ✅ Enable/disable authentication as needed
- ✅ Set rate limits

---

## Quick Start

### Step 1: Run Migration

Execute this migration in your Supabase SQL Editor:

```bash
File: supabase/migrations/20251022000005_add_import_api_auth.sql
```

This adds Import API authentication configuration fields.

### Step 2: Configure Authentication

1. Log into QuoteMaster Pro
2. Navigate to **Settings**
3. Scroll to **Import API Authentication** section
4. Toggle **Enable Authentication** ON
5. Set a **Username** (e.g., `api_user`)
6. Set a strong **Password**
7. Optionally adjust **Rate Limit**
8. Click **Save Configuration**

### Step 3: Use Authenticated API

Now all import API calls require authentication:

```bash
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/import-products' \
  -u 'username:password' \
  -H 'Content-Type: application/json' \
  -d '{
    "products": [...]
  }'
```

---

## Configuration Options

### Enable/Disable Authentication

**Toggle:** Enable Authentication

- **ON**: Requires username/password for all import requests
- **OFF**: Allows unauthenticated access (not recommended for production)

### Username

The username for Basic Authentication.

- **Recommended**: Use a descriptive name like `erp_api` or `import_service`
- **Format**: alphanumeric with underscores
- **Example**: `api_user`, `erp_sync`, `product_import`

### Password

The password for Basic Authentication.

- **Requirements**:
  - Strong password recommended (12+ characters)
  - Mix of letters, numbers, special characters
  - Stored securely in database
- **Example**: `MyStr0ng!Pass#2024`

### Rate Limit

Maximum API requests allowed per hour.

- **Default**: 100 requests/hour
- **Range**: 1-10,000 requests/hour
- **Use case**: Prevent API abuse and manage load

---

## Authentication Methods

### Method 1: Basic Authentication (Recommended)

Standard HTTP Basic Authentication:

```bash
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/import-products' \
  -u 'username:password' \
  -H 'Content-Type: application/json' \
  -d '{"products": [...]}'
```

**Python:**
```python
import requests

response = requests.post(
    'YOUR_SUPABASE_URL/functions/v1/import-products',
    auth=('username', 'password'),
    json={'products': products}
)
```

**Node.js:**
```javascript
const auth = Buffer.from('username:password').toString('base64');

const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ products })
});
```

### Method 2: Bearer Token (Fallback)

Use Supabase user tokens:

```bash
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/import-products' \
  -H 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"products": [...]}'
```

---

## Usage Examples

### Example 1: Python Script with Authentication

```python
import requests
import json

SUPABASE_URL = "https://your-project.supabase.co"
API_USERNAME = "api_user"
API_PASSWORD = "your_password"

def import_products_with_auth(products):
    url = f"{SUPABASE_URL}/functions/v1/import-products"

    response = requests.post(
        url,
        auth=(API_USERNAME, API_PASSWORD),
        json={
            "products": products,
            "mode": "upsert"
        }
    )

    if response.status_code == 401:
        print("Authentication failed! Check credentials.")
        return None

    if response.status_code == 200:
        result = response.json()
        print(f"Success: {result['imported']} products imported")
        return result
    else:
        print(f"Error: {response.text}")
        return None

# Usage
products = [
    {
        "sku": "PROD-001",
        "name": "Product 1",
        "category": "Electronics",
        "supplier": "Supplier A",
        "unit_cost": 50.00,
        "list_price": 75.00
    }
]

import_products_with_auth(products)
```

### Example 2: Node.js with Environment Variables

```javascript
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const API_USERNAME = process.env.IMPORT_API_USERNAME;
const API_PASSWORD = process.env.IMPORT_API_PASSWORD;

async function importProductsWithAuth(products) {
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');

    const response = await fetch(
        `${SUPABASE_URL}/functions/v1/import-products`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products,
                mode: 'upsert'
            })
        }
    );

    if (response.status === 401) {
        console.error('Authentication failed! Check credentials.');
        return null;
    }

    const result = await response.json();

    if (result.success) {
        console.log(`Success: ${result.imported} products imported`);
    } else {
        console.error(`Error: ${result.message}`);
    }

    return result;
}

// Usage
const products = [
    {
        sku: 'PROD-001',
        name: 'Product 1',
        category: 'Electronics',
        supplier: 'Supplier A',
        unit_cost: 50.00,
        list_price: 75.00
    }
];

importProductsWithAuth(products);
```

### Example 3: Bash Script with Credentials

```bash
#!/bin/bash

SUPABASE_URL="https://your-project.supabase.co"
API_USERNAME="api_user"
API_PASSWORD="your_password"

# Import products
curl -X POST \
  "${SUPABASE_URL}/functions/v1/import-products" \
  -u "${API_USERNAME}:${API_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "sku": "PROD-001",
        "name": "Product 1",
        "category": "Electronics",
        "supplier": "Supplier A",
        "unit_cost": 50.00,
        "list_price": 75.00
      }
    ],
    "mode": "upsert"
  }'
```

---

## Error Responses

### 401 Unauthorized - No Credentials

```json
{
  "success": false,
  "message": "Authentication required. Please provide credentials."
}
```

**Response Headers:**
```
WWW-Authenticate: Basic realm="Import API"
```

### 401 Unauthorized - Invalid Credentials

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 401 Unauthorized - Invalid Token

```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

## Security Best Practices

### 1. Use Strong Passwords

```
✅ GOOD: MyStr0ng!Pass#2024
❌ BAD:  password123
```

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid dictionary words

### 2. Store Credentials Securely

**Environment Variables (.env):**
```bash
IMPORT_API_USERNAME=api_user
IMPORT_API_PASSWORD=your_secure_password
```

**Never commit credentials to git!**

```bash
# .gitignore
.env
config.json
**/credentials.*
```

### 3. Rotate Credentials Regularly

- Change password every 90 days
- Update in Settings → Import API Authentication
- Update in all client scripts

### 4. Use HTTPS Only

✅ Always use HTTPS URLs:
```
https://your-project.supabase.co/functions/v1/import-products
```

❌ Never use HTTP:
```
http://... (INSECURE!)
```

### 5. Limit IP Access (Optional)

Consider using Supabase Edge Function restrictions to limit access to specific IP ranges.

### 6. Monitor Usage

- Check import logs regularly
- Review audit trail for suspicious activity
- Set appropriate rate limits

---

## Troubleshooting

### Authentication Fails

**Symptom:** 401 Unauthorized error

**Solutions:**

1. **Check credentials are correct**
   ```bash
   # Test in Settings page
   Settings → Import API Authentication → verify username/password
   ```

2. **Verify authentication is enabled**
   ```bash
   # Should see "Enable Authentication" toggle is ON
   ```

3. **Check credentials format**
   ```python
   # Correct
   auth=('username', 'password')

   # Wrong
   auth=('username:password',)
   ```

4. **Verify Edge Function is deployed**
   ```bash
   # Check Supabase Dashboard → Edge Functions
   ```

### Authentication Not Required

**Symptom:** API works without credentials

**Cause:** Authentication not enabled

**Solution:**
1. Go to Settings → Import API Authentication
2. Toggle "Enable Authentication" ON
3. Save configuration

### Rate Limit Exceeded

**Symptom:** Requests blocked after many calls

**Solution:**
1. Go to Settings → Import API Authentication
2. Increase "Rate Limit" value
3. Save configuration

---

## Migration Guide

### From Unauthenticated to Authenticated

**Step 1:** Enable authentication in Settings

**Step 2:** Update all client scripts to include credentials:

**Before:**
```python
response = requests.post(url, json=data)
```

**After:**
```python
response = requests.post(
    url,
    auth=('username', 'password'),
    json=data
)
```

**Step 3:** Test with one client first

**Step 4:** Roll out to all clients

**Step 5:** Monitor import logs for errors

---

## API Reference

### Configuration Endpoints

Managed through Settings UI - no direct API access needed.

### Import Endpoints (Authenticated)

All existing import endpoints now require authentication when enabled:

- `POST /import-products` - Batch import
- `POST /import-products/single` - Single product
- `GET /import-products/logs` - Import history
- `DELETE /import-products/all` - Clear products

---

## Testing

### Test Authentication Setup

**1. Configure credentials in Settings**
```
Username: test_user
Password: test_pass_123
Enable Authentication: ON
```

**2. Test with correct credentials**
```bash
curl -X POST \
  'YOUR_URL/functions/v1/import-products' \
  -u 'test_user:test_pass_123' \
  -H 'Content-Type: application/json' \
  -d '{"products": [{"sku": "TEST", "name": "Test", "category": "Test", "supplier": "Test"}]}'
```

Expected: Success

**3. Test with wrong credentials**
```bash
curl -X POST \
  'YOUR_URL/functions/v1/import-products' \
  -u 'wrong:wrong' \
  ...
```

Expected: 401 Unauthorized

**4. Test without credentials**
```bash
curl -X POST \
  'YOUR_URL/functions/v1/import-products' \
  -H 'Content-Type: application/json' \
  ...
```

Expected: 401 Unauthorized

---

## FAQ

**Q: Is authentication required?**
A: No, it's optional. You can toggle it on/off in Settings.

**Q: What authentication methods are supported?**
A: Basic Authentication (username/password) and Bearer tokens.

**Q: Are credentials encrypted?**
A: Yes, stored securely in the database with encryption flag.

**Q: Can I have multiple users?**
A: Currently one set of credentials. For multiple users, use Supabase user tokens.

**Q: What happens if I forget the password?**
A: Reset it in Settings → Import API Authentication.

**Q: Does this affect the web UI?**
A: No, web UI uses Supabase user authentication separately.

**Q: Can I use API keys instead?**
A: Basic Auth and Bearer tokens are supported. API keys could be added as a future enhancement.

---

## Next Steps

1. ✅ Enable authentication in Settings
2. ✅ Set strong credentials
3. ✅ Test with one client
4. ✅ Update all client scripts
5. ✅ Monitor import logs
6. ✅ Set appropriate rate limits

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** October 22, 2025
