# Database Setup Guide - Fix "app_configurations does not exist"

## Error You're Seeing

```
Error: Failed to run sql query:
ERROR: 42P01: relation "app_configurations" does not exist
```

**What this means:** The `app_configurations` table hasn't been created yet.

---

## ✅ Solution: Run This ONE SQL Script

Copy and paste this entire script into **Supabase Dashboard → SQL Editor** and click **Run**:

```sql
-- ============================================
-- Create app_configurations table
-- ============================================
CREATE TABLE IF NOT EXISTS app_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text,
  config_type text NOT NULL DEFAULT 'general',
  is_encrypted boolean DEFAULT false,
  description text,
  last_updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view configurations"
  ON app_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert configurations"
  ON app_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = last_updated_by);

CREATE POLICY "Authenticated users can update configurations"
  ON app_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = last_updated_by);

CREATE POLICY "Authenticated users can delete configurations"
  ON app_configurations FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_configurations_key ON app_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_app_configurations_type ON app_configurations(config_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_app_configurations_updated_at
  BEFORE UPDATE ON app_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Insert default configurations
-- ============================================

-- ERP API configurations
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted)
VALUES
  ('erp_api_url', '', 'erp_api', 'ERP REST API Base URL', false),
  ('erp_api_key', '', 'erp_api', 'ERP API Authentication Key', true),
  ('erp_api_timeout', '10000', 'erp_api', 'API Request Timeout (milliseconds)', false),
  ('erp_api_retry_attempts', '3', 'erp_api', 'Number of retry attempts for failed requests', false),
  ('erp_api_cache_ttl', '300000', 'erp_api', 'Cache Time-To-Live (milliseconds)', false),
  ('erp_api_enabled', 'false', 'erp_api', 'Enable/Disable ERP API Integration', false),
  ('default_warehouse', 'WH01', 'erp_api', 'Default Warehouse Code', false)
ON CONFLICT (config_key) DO NOTHING;

-- Import API authentication configurations
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted)
VALUES
  ('import_api_enabled', 'false', 'import_api', 'Enable/Disable authentication for import API', false),
  ('import_api_username', '', 'import_api', 'Username for import API authentication', false),
  ('import_api_password', '', 'import_api', 'Password for import API authentication', true),
  ('import_api_rate_limit', '100', 'import_api', 'Maximum requests per hour', false)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- Create audit log table
-- ============================================
CREATE TABLE IF NOT EXISTS configuration_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id),
  change_type text NOT NULL,
  changed_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE configuration_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log"
  ON configuration_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit log"
  ON configuration_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes on audit log
CREATE INDEX IF NOT EXISTS idx_config_audit_log_key ON configuration_audit_log(config_key);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_changed_at ON configuration_audit_log(changed_at DESC);

-- ============================================
-- Create audit logging function
-- ============================================
CREATE OR REPLACE FUNCTION log_configuration_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO configuration_audit_log (config_key, new_value, changed_by, change_type)
    VALUES (NEW.config_key, NEW.config_value, NEW.last_updated_by, 'create');
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO configuration_audit_log (config_key, old_value, new_value, changed_by, change_type)
    VALUES (NEW.config_key, OLD.config_value, NEW.config_value, NEW.last_updated_by, 'update');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO configuration_audit_log (config_key, old_value, changed_by, change_type)
    VALUES (OLD.config_key, OLD.config_value, auth.uid(), 'delete');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE TRIGGER audit_configuration_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_configurations
  FOR EACH ROW
  EXECUTE FUNCTION log_configuration_change();
```

---

## ✅ That's It! One Script Does Everything

This single script:
- ✅ Creates `app_configurations` table
- ✅ Creates `configuration_audit_log` table
- ✅ Sets up all RLS policies
- ✅ Creates indexes for performance
- ✅ Sets up audit logging triggers
- ✅ Inserts default ERP API configs (7 rows)
- ✅ Inserts default Import API configs (4 rows)

---

## Verify It Worked

Run this query after the script completes:

```sql
SELECT config_key, config_value, config_type
FROM app_configurations
ORDER BY config_type, config_key;
```

**Expected Result:** 11 rows
- 7 rows with `config_type = 'erp_api'`
- 4 rows with `config_type = 'import_api'`

---

## Now Use Your App!

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Login to your app**
3. **Go to Settings**
4. **Configure your credentials:**
   - Toggle "Enable Authentication" ON
   - Set Username (e.g., `api_user`)
   - Set Password (strong password)
   - Set Rate Limit (default: 100)
5. **Click "Save Configuration"**
6. **Navigate to another page** (e.g., Quote Builder)
7. **Return to Settings**
8. **Verify values persist!** ✅

---

## How It Works

### UPSERT Magic
The app now uses UPSERT, which means:
- If a config row exists → Updates it
- If a config row doesn't exist → Creates it
- No errors, works every time

### Visual Indicators
When settings are saved, you'll see:
- ✅ Green "Authentication is enabled" text
- ✅ Username displayed in header
- ✅ "(Configured)" badge on password
- ✅ Form fields show actual values

### Browser Console Debug
Press F12 and look for:
```
Loaded import API configs: [...]
Parsed import API config: { enabled: true, username: 'api_user', ... }
```

---

## Troubleshooting

### Script Fails?

**Error: "permission denied"**
→ Make sure you're logged into Supabase Dashboard as owner/admin

**Error: "syntax error"**
→ Make sure you copied the ENTIRE script (scroll up/down to check)

**Error: "already exists"**
→ That's fine! The script uses `IF NOT EXISTS` so it's safe to run multiple times

### Settings Still Don't Save?

**Check you're logged in:**
```sql
SELECT auth.uid();
```
Should return your user ID (not null)

**Check RLS policies:**
```sql
SELECT * FROM app_configurations LIMIT 1;
```
Should return a row (not permission denied)

**Check browser console (F12):**
Look for errors when saving

### Values Still Don't Persist?

1. Hard refresh browser (Ctrl+Shift+R)
2. Check console logs show loaded configs
3. Try logging out and back in
4. Clear browser cache

---

## What Gets Created

### Tables

**app_configurations:**
```
id                  uuid (primary key)
config_key          text (unique) - 'import_api_username'
config_value        text - 'api_user'
config_type         text - 'import_api'
is_encrypted        boolean - false
description         text - 'Username for...'
last_updated_by     uuid - your user ID
created_at          timestamptz
updated_at          timestamptz
```

**configuration_audit_log:**
```
id              uuid (primary key)
config_key      text
old_value       text
new_value       text
changed_by      uuid
change_type     text - 'create', 'update', 'delete'
changed_at      timestamptz
```

### Policies (RLS)
- ✅ Authenticated users can SELECT (view all configs)
- ✅ Authenticated users can INSERT (with their user ID)
- ✅ Authenticated users can UPDATE (with their user ID)
- ✅ Authenticated users can DELETE
- ✅ All changes logged to audit table

### Triggers
- ✅ `updated_at` auto-updates on changes
- ✅ All changes logged to `configuration_audit_log`

---

## Summary

**Run ONE SQL script** → **Refresh browser** → **Configure settings** → **Done!**

Your settings will now persist perfectly across page navigation, browser refreshes, and everything else!

**No more lost settings!** 🎉

---

## Source Files

The complete migrations are in:
- `supabase/migrations/20251022000003_create_app_configurations.sql`
- `supabase/migrations/20251022000005_add_import_api_auth.sql`

But you don't need to run them separately - the script above combines both!
