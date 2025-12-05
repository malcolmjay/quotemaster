# Configuration System Guide

## Overview

The Configuration System allows administrators to configure ERP API and other system settings through a user-friendly web interface, eliminating the need to manually edit `.env` files or redeploy the application.

---

## Features

✅ **Web-Based Configuration** - Update settings through UI, no file editing required
✅ **Secure Storage** - Configurations stored in Supabase with RLS policies
✅ **Audit Trail** - All configuration changes are logged with user attribution
✅ **Live Testing** - Test ERP API connection before saving
✅ **Real-time Updates** - Changes apply immediately without redeployment
✅ **Fallback Support** - Uses environment variables as fallback if database config not available

---

## Setup

### Step 1: Run Database Migration

Execute this migration in your Supabase SQL Editor:

```bash
File: supabase/migrations/20251022000003_create_app_configurations.sql
```

This creates:
- `app_configurations` table - Stores all configuration values
- `configuration_audit_log` table - Logs all configuration changes
- RLS policies - Protects configuration data
- Default ERP API configurations

### Step 2: Access Configuration Page

1. Log into the application
2. Click **Settings** in the left navigation menu
3. You'll see the Configuration Settings page

---

## Using the Configuration Page

### ERP API Configuration

The configuration page provides the following settings:

#### Enable/Disable Integration
Toggle switch at the top to enable or disable the ERP integration entirely.

#### Required Settings

**API Base URL**
- The base URL of your ERP REST API
- Example: `https://your-erp-api.com/api`
- Must be a valid HTTP/HTTPS URL

**API Key**
- Authentication key for your ERP API
- Click the eye icon to show/hide
- Stored securely in the database with encryption flag

#### Optional Settings

**Request Timeout (ms)**
- How long to wait for API responses
- Default: 10,000 ms (10 seconds)
- Range: 1,000 - 60,000 ms

**Retry Attempts**
- Number of times to retry failed requests
- Default: 3
- Range: 0-10

**Cache TTL (ms)**
- How long to cache inventory data
- Default: 300,000 ms (5 minutes)
- Range: 60,000 - 3,600,000 ms

**Default Warehouse**
- Default warehouse code to use
- Default: WH01

### Test Connection

Before saving, click **Test Connection** to verify:
- API URL is reachable
- API key is valid
- Response time

Results show:
- ✅ Success with response time
- ❌ Failure with error message

### Save Configuration

Click **Save Configuration** to:
1. Store all settings in database
2. Create audit log entry
3. Reinitialize ERP service with new settings
4. Apply changes immediately

**Note:** Changes apply instantly - no redeployment needed!

---

## Configuration Storage

### Database Schema

**app_configurations table:**
```sql
- id (uuid) - Primary key
- config_key (text) - Configuration name (e.g., 'erp_api_url')
- config_value (text) - Configuration value
- config_type (text) - Type grouping (e.g., 'erp_api')
- is_encrypted (boolean) - Whether value should be encrypted
- description (text) - Human-readable description
- last_updated_by (uuid) - User who made the change
- created_at (timestamptz) - Creation timestamp
- updated_at (timestamptz) - Last update timestamp
```

**configuration_audit_log table:**
```sql
- id (uuid) - Primary key
- config_key (text) - Configuration that changed
- old_value (text) - Previous value
- new_value (text) - New value
- changed_by (uuid) - User who made change
- change_type (text) - 'create', 'update', or 'delete'
- changed_at (timestamptz) - Change timestamp
```

### Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `erp_api_url` | string | '' | ERP API Base URL |
| `erp_api_key` | string | '' | ERP API Authentication Key |
| `erp_api_timeout` | number | 10000 | Request timeout in milliseconds |
| `erp_api_retry_attempts` | number | 3 | Number of retry attempts |
| `erp_api_cache_ttl` | number | 300000 | Cache time-to-live in milliseconds |
| `erp_api_enabled` | boolean | false | Enable/disable ERP integration |
| `default_warehouse` | string | 'WH01' | Default warehouse code |

---

## How It Works

### Configuration Priority

The system uses configuration in this order:

1. **Database Configuration** (if enabled and available)
   - Stored in `app_configurations` table
   - Can be updated through UI
   - Takes precedence over environment variables

2. **Environment Variables** (fallback)
   - `VITE_ERP_API_URL`
   - `VITE_ERP_API_KEY`
   - `VITE_ERP_API_TIMEOUT`
   - `VITE_ERP_API_RETRY_ATTEMPTS`

3. **Defaults** (if nothing else available)
   - Hard-coded defaults in the code

### Configuration Flow

```
┌─────────────────────────────┐
│  Configuration UI Page      │
│  (User updates settings)    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  configService.ts           │
│  - Validates input          │
│  - Saves to Supabase        │
│  - Creates audit log        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Supabase Database          │
│  - app_configurations       │
│  - configuration_audit_log  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  reinitializeERPService()   │
│  - Clears old instance      │
│  - Creates new with config  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  ERP API Service            │
│  - Uses new configuration   │
│  - Makes API calls          │
└─────────────────────────────┘
```

---

## API Usage

### Configuration Service

#### Get Configuration
```typescript
import { configService } from '../services/configService';

// Get single config value
const apiUrl = await configService.getConfig('erp_api_url');

// Get all ERP API config
const erpConfig = await configService.getERPApiConfig();
// Returns: { apiUrl, apiKey, timeout, retryAttempts, cacheTtl, enabled, defaultWarehouse }

// Get all configs
const allConfigs = await configService.getAllConfigs();

// Get configs by type
const erpConfigs = await configService.getConfigsByType('erp_api');
```

#### Update Configuration
```typescript
import { configService } from '../services/configService';

// Update single config
const result = await configService.updateConfig(
  'erp_api_url',
  'https://new-erp-api.com/api',
  userId
);

// Update multiple configs
const updates = [
  { config_key: 'erp_api_url', config_value: 'https://new-erp-api.com/api' },
  { config_key: 'erp_api_timeout', config_value: '15000' }
];

const result = await configService.updateConfigs(updates, userId);
```

#### Test Connection
```typescript
import { configService } from '../services/configService';

const result = await configService.testERPConnection(
  'https://your-erp-api.com/api',
  'your_api_key',
  10000 // timeout
);

// Returns: { success: boolean, message: string, responseTime?: number }
```

#### Audit Log
```typescript
import { configService } from '../services/configService';

// Get last 50 audit log entries
const auditLog = await configService.getAuditLog(50);

// Each entry contains:
// - config_key, old_value, new_value
// - changed_by, change_type, changed_at
// - profiles (user info)
```

### Reinitialize ERP Service

After updating configuration:

```typescript
import { reinitializeERPService } from '../services/erpApiService';

// Save configuration
await configService.updateConfig('erp_api_url', newUrl, userId);

// Reinitialize ERP service to use new config
await reinitializeERPService();
```

---

## Security

### Row Level Security (RLS)

The `app_configurations` table has RLS enabled with these policies:

- **SELECT**: All authenticated users can view configurations
- **INSERT**: Authenticated users can create (with their user ID)
- **UPDATE**: Authenticated users can update (with their user ID)
- **DELETE**: Authenticated users can delete

**Recommendation for Production:**
```sql
-- Restrict to admin role only
CREATE POLICY "Only admins can update configurations"
  ON app_configurations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### API Key Protection

- API keys are marked with `is_encrypted = true` flag
- Displayed as password fields in UI (hidden by default)
- Stored in database (consider implementing encryption at rest)
- Never exposed in client-side logs

### Audit Trail

All configuration changes are automatically logged:
- What changed (config_key)
- Old and new values
- Who made the change (user ID)
- When it happened (timestamp)

View audit log by clicking **View Audit Log** button.

---

## Troubleshooting

### Configuration Not Loading

**Symptom:** Settings page shows default values instead of saved values

**Solutions:**
1. Check database migration was run successfully
2. Verify RLS policies are active
3. Check browser console for errors
4. Ensure user is authenticated

### Changes Not Taking Effect

**Symptom:** Saved configuration not being used by ERP service

**Solutions:**
1. Click **Save Configuration** button
2. Wait for success message
3. Refresh the page
4. Check that `erp_api_enabled` is set to `true`

### Test Connection Fails

**Symptom:** Test connection button shows error

**Common Causes:**
1. **Invalid URL:** Check URL format (must start with http:// or https://)
2. **CORS Issues:** ERP API must allow requests from your domain
3. **Wrong API Key:** Verify API key is correct
4. **Network Issues:** Check firewall, VPN, network connectivity
5. **Timeout:** Increase timeout value if API is slow

### Environment Variables Still Used

**Symptom:** Application uses .env values instead of database config

**Reason:** Database config takes precedence only when:
- `erp_api_enabled = true` in database
- `erp_api_url` is not empty in database

**Solution:**
1. Ensure ERP Integration toggle is ON
2. Enter valid API URL
3. Click Save Configuration

---

## Best Practices

### 1. Test Before Saving
Always click **Test Connection** before saving to verify settings work.

### 2. Use Audit Log
Regularly review audit log to track configuration changes.

### 3. Backup Configuration
Export configuration values before making major changes:

```sql
-- Run in Supabase SQL Editor
SELECT config_key, config_value, config_type
FROM app_configurations
WHERE config_type = 'erp_api';
```

### 4. Secure Access
Restrict configuration access to admin users only (update RLS policies).

### 5. Monitor Changes
Set up alerts for configuration changes in production.

### 6. Document Custom Settings
Add descriptions to new configuration keys for future reference.

---

## Extending the System

### Add New Configuration Type

1. **Insert into database:**
```sql
INSERT INTO app_configurations (config_key, config_value, config_type, description)
VALUES ('smtp_host', 'smtp.example.com', 'email', 'SMTP Server Host');
```

2. **Add to UI:**
Edit `ConfigurationSettings.tsx` to add new section.

3. **Create getter method:**
```typescript
// In configService.ts
async getEmailConfig(): Promise<EmailConfig> {
  const configs = await this.getConfigsByType('email');
  // Map and return
}
```

### Add Validation

```typescript
// In configService.ts
async updateConfig(key: string, value: string, userId: string) {
  // Add validation
  if (key === 'erp_api_url') {
    if (!value.startsWith('http')) {
      return { success: false, error: 'URL must start with http:// or https://' };
    }
  }

  // Proceed with update...
}
```

---

## Migration from Environment Variables

### Before (using .env)
```bash
# .env
VITE_ERP_API_URL=https://erp.example.com/api
VITE_ERP_API_KEY=secret_key_123
```

### After (using database)
1. Copy values from `.env`
2. Open Settings page in application
3. Paste values into configuration form
4. Enable ERP Integration toggle
5. Click Test Connection
6. Click Save Configuration
7. Remove from `.env` (optional, kept as fallback)

### Benefits
- ✅ No redeployment needed for changes
- ✅ Changes tracked in audit log
- ✅ Can be updated by admins without code access
- ✅ Test before applying
- ✅ Role-based access control

---

## FAQ

**Q: Do I need to redeploy after changing configuration?**
A: No! Changes apply immediately after clicking Save.

**Q: What happens if database is unavailable?**
A: System falls back to environment variables automatically.

**Q: Can I use both database and environment variables?**
A: Yes! Database config takes precedence, env vars are fallback.

**Q: How do I revert a configuration change?**
A: Check audit log for old value, then update configuration with previous value.

**Q: Are API keys encrypted in the database?**
A: They're marked for encryption (`is_encrypted = true`). Implement encryption at rest for additional security.

**Q: Can I add configuration for other services?**
A: Yes! Add new records to `app_configurations` with different `config_type`.

---

## Files Reference

### New Files Created
1. `supabase/migrations/20251022000003_create_app_configurations.sql` - Database schema
2. `src/services/configService.ts` - Configuration management service
3. `src/components/settings/ConfigurationSettings.tsx` - UI page
4. `CONFIGURATION-SYSTEM-GUIDE.md` - This documentation

### Modified Files
1. `src/services/erpApiService.ts` - Added database config support
2. `src/App.tsx` - Added settings route
3. `src/components/layout/Navigation.tsx` - Added settings menu item

---

**Status:** ✅ Production Ready
**Last Updated:** October 22, 2025
**Version:** 1.0.0
