## ERP Inventory Integration Guide

This guide explains how to integrate your ERP system's REST API for real-time stock and inventory availability data in QuoteMaster Pro.

---

## Overview

The ERP integration provides:
- ✅ Real-time inventory lookups from your ERP system
- ✅ Automatic caching in Supabase for performance
- ✅ Fallback to cached data if ERP is unavailable
- ✅ Batch requests for efficient data fetching
- ✅ Automatic retry logic with exponential backoff
- ✅ Periodic background sync
- ✅ Health monitoring

**Architecture:**
```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         ├──────► useERPInventory Hook
         │
         ▼
┌────────────────────────────┐
│  Inventory Sync Service    │
│  - Cache Management        │
│  - Auto-sync Logic         │
└────────┬───────────────────┘
         │
         ├──────► Supabase (Cache)
         │
         ▼
┌────────────────────────────┐
│    ERP API Service         │
│  - HTTP Requests           │
│  - Retry Logic             │
│  - Request Caching         │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│   Your ERP REST API        │
│  (External System)         │
└────────────────────────────┘
```

---

## Quick Start

### Step 1: Configure Environment Variables

Add these to your `.env` file:

```bash
# ERP API Configuration
VITE_ERP_API_URL=https://your-erp-api.com/api
VITE_ERP_API_KEY=your_api_key_here
VITE_ERP_API_TIMEOUT=10000
VITE_ERP_API_RETRY_ATTEMPTS=3
```

### Step 2: ERP API Requirements

Your ERP API must provide these endpoints:

#### 1. Get Inventory by SKU
```
GET /inventory?sku={sku}&warehouse={warehouse}

Response:
{
  "sku": "PART-12345",
  "warehouseCode": "WH01",
  "quantityOnHand": 150,
  "quantityReserved": 25,
  "quantityAvailable": 125,
  "reorderPoint": 50,
  "reorderQuantity": 200,
  "lastRestockDate": "2025-10-15",
  "leadTimeDays": 14,
  "cost": 45.99,
  "location": "A-12-3"
}
```

#### 2. Get Batch Inventory (Optional but Recommended)
```
POST /inventory/batch
Content-Type: application/json

{
  "skus": ["PART-12345", "PART-67890"],
  "warehouse": "WH01"
}

Response:
[
  {
    "sku": "PART-12345",
    "warehouseCode": "WH01",
    "quantityOnHand": 150,
    "quantityReserved": 25,
    "quantityAvailable": 125
    // ...
  },
  {
    "sku": "PART-67890",
    // ...
  }
]
```

#### 3. Get Warehouse Inventory (Optional)
```
GET /inventory/warehouse/{warehouseCode}

Response: Array of inventory items
```

#### 4. Health Check (Optional)
```
GET /health

Response:
{
  "status": "ok"
}
```

### Step 3: Authentication

The integration supports two authentication methods:

**Option 1: Bearer Token (Recommended)**
```typescript
// Automatically added by erpApiService.ts
headers: {
  'Authorization': 'Bearer YOUR_API_KEY'
}
```

**Option 2: Custom Header**
Edit `src/services/erpApiService.ts` line 66:
```typescript
// Replace:
headers['Authorization'] = `Bearer ${this.config.apiKey}`;

// With your custom header:
headers['X-API-Key'] = this.config.apiKey;
// or
headers['X-Custom-Auth'] = this.config.apiKey;
```

---

## Usage Examples

### Example 1: Display Inventory for a Single Product

```typescript
import { useERPInventory } from '../hooks/useERPInventory';

function ProductCard({ sku }: { sku: string }) {
  const { inventory, loading, error, isStale, refresh } = useERPInventory({
    sku,
    warehouse: 'WH01',
    autoSync: true,
    syncInterval: 5 // minutes
  });

  if (loading) return <div>Loading inventory...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!inventory) return <div>No inventory data</div>;

  return (
    <div className="product-card">
      <h3>{sku}</h3>
      <p>On Hand: {inventory.quantityOnHand}</p>
      <p>Available: {inventory.quantityAvailable}</p>
      <p>Reserved: {inventory.quantityReserved}</p>

      {isStale && (
        <span className="badge-warning">Data may be stale</span>
      )}

      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Example 2: Batch Inventory for Quote Line Items

```typescript
import { useERPInventoryBatch } from '../hooks/useERPInventory';

function QuoteLineItems({ lineItems }: { lineItems: LineItem[] }) {
  const skus = lineItems.map(item => item.sku);

  const { inventories, loading, error } = useERPInventoryBatch(
    skus,
    'WH01',
    true // use cache
  );

  if (loading) return <div>Loading inventories...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Quantity Needed</th>
          <th>Available</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {lineItems.map(item => {
          const inventory = inventories.get(item.sku);

          return (
            <tr key={item.sku}>
              <td>{item.sku}</td>
              <td>{item.quantity}</td>
              <td>{inventory?.quantityAvailable || 'N/A'}</td>
              <td>
                {inventory && inventory.quantityAvailable >= item.quantity
                  ? <span className="text-green">In Stock</span>
                  : <span className="text-red">Insufficient</span>
                }
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

### Example 3: Manual API Calls

```typescript
import { getERPApiService } from '../services/erpApiService';

async function checkInventory(sku: string) {
  const erpService = getERPApiService();

  // Get single item
  const response = await erpService.getInventoryBySKU(sku, 'WH01', false);

  if (response.success && response.data) {
    console.log('Inventory:', response.data);
    console.log('Available:', response.data.quantityAvailable);
  } else {
    console.error('Error:', response.error);
  }
}
```

### Example 4: Sync Service (Background Operations)

```typescript
import { getInventorySyncService } from '../services/inventorySyncService';

// Sync single SKU
const syncService = getInventorySyncService();
const result = await syncService.syncInventoryBySKU('PART-12345', 'WH01');

console.log(`Synced ${result.itemsSynced} items`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}

// Start periodic sync (15-minute interval)
const syncInterval = syncService.startPeriodicSync(15, 'WH01');

// Stop periodic sync when needed
clearInterval(syncInterval);
```

### Example 5: Health Monitoring

```typescript
import { useERPHealth } from '../hooks/useERPInventory';

function ERPStatusIndicator() {
  const { isHealthy, checking, lastCheck, checkHealth } = useERPHealth();

  return (
    <div className="status-indicator">
      <span className={isHealthy ? 'status-dot green' : 'status-dot red'} />
      <span>ERP: {isHealthy ? 'Connected' : 'Disconnected'}</span>

      {lastCheck && (
        <small>Last check: {lastCheck.toLocaleTimeString()}</small>
      )}

      <button onClick={checkHealth} disabled={checking}>
        {checking ? 'Checking...' : 'Check Now'}
      </button>
    </div>
  );
}
```

---

## Advanced Configuration

### Custom Cache TTL

Edit `src/services/erpApiService.ts`:

```typescript
// Change default cache duration (5 minutes)
private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000;

// To:
private readonly DEFAULT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
```

### Custom Retry Logic

Edit `src/services/erpApiService.ts`:

```typescript
constructor(config: ERPApiConfig) {
  this.config = {
    timeout: 10000,     // Request timeout
    retryAttempts: 3,   // Number of retries
    retryDelay: 1000,   // Initial delay (exponential backoff)
    ...config
  };
}
```

### Reservation Support (Optional)

If your ERP supports inventory reservations:

```typescript
import { getERPApiService } from '../services/erpApiService';

const erpService = getERPApiService();

// Reserve inventory
const reserveResponse = await erpService.reserveInventory(
  'PART-12345',  // SKU
  10,            // Quantity
  'WH01',        // Warehouse
  'QUOTE-001'    // Reference ID
);

if (reserveResponse.success && reserveResponse.data) {
  const { reservationId, expiresAt } = reserveResponse.data;
  console.log(`Reserved: ${reservationId}, expires: ${expiresAt}`);
}

// Release reservation later
await erpService.releaseReservation(reservationId);
```

---

## ERP API Endpoint Customization

If your ERP uses different endpoint structures, edit `src/services/erpApiService.ts`:

### Example: Different Path Structure

**Your ERP:** `/api/v1/stock/item/{sku}`

```typescript
// In getInventoryBySKU method, change:
const response = await this.makeRequest<ERPInventoryItem>(
  `/inventory?${params.toString()}`
);

// To:
const response = await this.makeRequest<ERPInventoryItem>(
  `/v1/stock/item/${sku}${warehouseCode ? `?warehouse=${warehouseCode}` : ''}`
);
```

### Example: Different Response Format

**Your ERP returns:** `{ stock: { onHand: 100, available: 75 } }`

Add a transformation function:

```typescript
private transformERPResponse(erpData: any): ERPInventoryItem {
  return {
    sku: erpData.itemCode,
    warehouseCode: erpData.location,
    quantityOnHand: erpData.stock.onHand,
    quantityReserved: erpData.stock.onHand - erpData.stock.available,
    quantityAvailable: erpData.stock.available,
    reorderPoint: erpData.reorderLevel,
    reorderQuantity: erpData.reorderQty
  };
}
```

Then use it after fetching:

```typescript
const data = await response.json();
const transformed = this.transformERPResponse(data);
return { success: true, data: transformed, timestamp: new Date().toISOString() };
```

---

## Troubleshooting

### Issue: API requests timing out

**Solution 1:** Increase timeout
```bash
# In .env
VITE_ERP_API_TIMEOUT=30000  # 30 seconds
```

**Solution 2:** Check ERP API performance
```typescript
// Add timing logs in erpApiService.ts
const startTime = Date.now();
const response = await fetch(url, options);
const duration = Date.now() - startTime;
logger.info('Request duration', { endpoint, duration });
```

### Issue: Authentication failures

**Check 1:** Verify API key is correct
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-erp-api.com/api/inventory?sku=TEST
```

**Check 2:** Verify header format matches your ERP
```typescript
// Try different auth formats in erpApiService.ts:
headers['Authorization'] = `Bearer ${this.config.apiKey}`;
// or
headers['X-API-Key'] = this.config.apiKey;
// or
headers['ApiKey'] = this.config.apiKey;
```

### Issue: CORS errors

**Solution:** Configure CORS in your ERP API to allow requests from your domain

If you control the ERP API, add these headers:
```
Access-Control-Allow-Origin: https://your-app-domain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

**Workaround:** Use a Supabase Edge Function as a proxy:
```typescript
// Create supabase/functions/erp-proxy/index.ts
Deno.serve(async (req) => {
  const { sku } = await req.json();

  const response = await fetch(
    `${ERP_API_URL}/inventory?sku=${sku}`,
    {
      headers: {
        'Authorization': `Bearer ${ERP_API_KEY}`
      }
    }
  );

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Issue: Stale cache data

**Solution 1:** Force refresh
```typescript
const { refresh } = useERPInventory({ sku: 'PART-12345' });
await refresh(); // Forces fresh fetch from ERP
```

**Solution 2:** Reduce cache TTL
```typescript
// In inventorySyncService.ts
isCacheStale(lastSyncedAt: string, thresholdMinutes = 5): boolean {
  // Change to 2 minutes
  isCacheStale(lastSyncedAt: string, thresholdMinutes = 2): boolean {
```

**Solution 3:** Clear cache
```typescript
import { getERPApiService } from '../services/erpApiService';

const erpService = getERPApiService();
erpService.clearCache(); // Clears in-memory cache
```

---

## Performance Optimization

### 1. Use Batch Requests

**Bad:**
```typescript
// Fetches inventory one at a time (slow)
for (const item of lineItems) {
  const inv = await getInventory(item.sku);
}
```

**Good:**
```typescript
// Fetches all at once (fast)
const skus = lineItems.map(item => item.sku);
const { inventories } = useERPInventoryBatch(skus);
```

### 2. Enable Caching

```typescript
// Use cache for better performance
const { inventory } = useERPInventory({
  sku: 'PART-12345',
  useCache: true,        // ✅ Uses Supabase cache
  autoSync: true,        // ✅ Auto-refreshes stale data
  syncInterval: 5        // Refresh every 5 minutes
});
```

### 3. Pre-load Inventory

```typescript
// On app startup or warehouse change
import { getInventorySyncService } from '../services/inventorySyncService';

const syncService = getInventorySyncService();

// Sync entire warehouse inventory in background
syncService.syncWarehouseInventory('WH01').then(result => {
  console.log(`Pre-loaded ${result.itemsSynced} items`);
});
```

### 4. Monitor Cache Hit Rate

```typescript
import { getERPApiService } from '../services/erpApiService';

const erpService = getERPApiService();
const stats = erpService.getCacheStats();

console.log(`Cache size: ${stats.size} items`);
console.log(`Cached keys:`, stats.keys);
```

---

## Security Best Practices

### 1. Never Expose API Keys in Code

✅ **Correct:**
```bash
# In .env (not committed to git)
VITE_ERP_API_KEY=secret_key_here
```

❌ **Wrong:**
```typescript
// In code (exposed in browser)
const API_KEY = 'secret_key_here';
```

### 2. Use Supabase Edge Functions for Sensitive Operations

For write operations (reservations, adjustments), use Edge Functions:

```typescript
// supabase/functions/reserve-inventory/index.ts
Deno.serve(async (req) => {
  // Server-side only, API key not exposed
  const ERP_API_KEY = Deno.env.get('ERP_API_KEY');

  const { sku, quantity } = await req.json();

  const response = await fetch(
    `${ERP_API_URL}/inventory/reserve`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ERP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sku, quantity })
    }
  );

  return response;
});
```

### 3. Validate API Responses

```typescript
// In erpApiService.ts, add validation
const data = await response.json();

if (!data.sku || typeof data.quantityAvailable !== 'number') {
  throw new Error('Invalid API response format');
}
```

---

## Migration Guide

### Migrating from Static Inventory

**Before (static data):**
```typescript
const inventory = {
  sku: 'PART-12345',
  quantity: 100,
  available: 75
};
```

**After (ERP integration):**
```typescript
const { inventory, loading, error } = useERPInventory({
  sku: 'PART-12345'
});

if (loading) return <Spinner />;
if (error) return <Error message={error} />;

// Use inventory.quantityAvailable
```

### Update Existing Components

Find components that display inventory and update them:

```typescript
// Old
<span>In Stock: {product.stock}</span>

// New
const { inventory } = useERPInventory({ sku: product.sku });
<span>In Stock: {inventory?.quantityAvailable || 'Loading...'}</span>
```

---

## Testing

### Mock ERP API for Development

If your ERP isn't available during development:

```typescript
// Create mock-erp-server.js
const express = require('express');
const app = express();

app.get('/api/inventory', (req, res) => {
  const { sku } = req.query;

  res.json({
    sku,
    warehouseCode: 'WH01',
    quantityOnHand: Math.floor(Math.random() * 200),
    quantityReserved: 10,
    quantityAvailable: Math.floor(Math.random() * 190),
    reorderPoint: 50,
    reorderQuantity: 100
  });
});

app.listen(3000, () => console.log('Mock ERP API running on :3000'));
```

Then:
```bash
# In .env for development
VITE_ERP_API_URL=http://localhost:3000/api
```

---

## Support & Next Steps

### Documentation
- Review `src/services/erpApiService.ts` for API methods
- Review `src/hooks/useERPInventory.ts` for React hooks
- Check browser console for detailed logs (development mode)

### Common Next Steps
1. ✅ Configure environment variables
2. ✅ Test API connection with health check
3. ✅ Update product catalog to show real-time inventory
4. ✅ Add inventory checks to quote builder
5. ✅ Implement reservation system (optional)
6. ✅ Set up monitoring and alerts

### Need Help?
- Check logs in browser console (development)
- Review error messages from `useERPInventory` hook
- Verify ERP API endpoints with curl/Postman
- Check network tab in browser DevTools

---

**Status:** ✅ Ready to use
**Version:** 1.0.0
**Last Updated:** October 22, 2025
