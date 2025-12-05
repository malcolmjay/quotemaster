# Check Import API Authentication Setup

## ✅ FIXED: Settings Now Use UPSERT

**Issue Resolved!** The save functionality now uses UPSERT instead of UPDATE.

**What This Means:**
- ✅ Settings are saved even if database rows don't exist yet
- ✅ No need to manually run migration - app creates missing rows automatically
- ✅ Values persist correctly when navigating away and returning
- ✅ Works whether migration was run or not

**Just save your settings and they'll persist!**

---

## Previous Issue: Settings Not Displaying Saved Values

This has been fixed! But if you still have issues, follow these steps:

---

## Step 1: Verify Migration Has Been Run

The migration file **MUST** be executed in your Supabase database:

**File:** `supabase/migrations/20251022000005_add_import_api_auth.sql`

### Check if migration exists in database:

Run this query in Supabase SQL Editor:

```sql
SELECT * FROM app_configurations
WHERE config_key IN (
  'import_api_enabled',
  'import_api_username',
  'import_api_password',
  'import_api_rate_limit'
)
ORDER BY config_key;
```

**Expected Result:** Should show 4 rows with these config keys.

**If NO rows are returned:**
→ The migration hasn't been run yet!

---

## Step 2: Run the Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251022000005_add_import_api_auth.sql`
4. Paste and run:

```sql
INSERT INTO app_configurations (config_key, config_value, config_type, description, is_encrypted)
VALUES
  ('import_api_enabled', 'false', 'import_api', 'Enable/Disable authentication for import API', false),
  ('import_api_username', '', 'import_api', 'Username for import API authentication', false),
  ('import_api_password', '', 'import_api', 'Password for import API authentication', true),
  ('import_api_rate_limit', '100', 'import_api', 'Maximum requests per hour', false)
ON CONFLICT (config_key) DO NOTHING;
```

### Option B: Via Supabase CLI

If you have Supabase CLI:

```bash
supabase db push
```

---

## Step 3: Configure Your Credentials

After running the migration:

1. **Refresh** the Settings page
2. Navigate to **Settings → Import API Authentication**
3. Toggle **Enable Authentication** ON
4. Set **Username** (e.g., `api_user`)
5. Set **Password** (strong password)
6. Click **Save Configuration**

---

## Step 4: Verify Settings Are Saved

Check the database again:

```sql
SELECT config_key, config_value, config_type
FROM app_configurations
WHERE config_type = 'import_api'
ORDER BY config_key;
```

**Expected Result:**
```
config_key            | config_value  | config_type
----------------------|---------------|-------------
import_api_enabled    | true          | import_api
import_api_username   | api_user      | import_api
import_api_password   | your_password | import_api
import_api_rate_limit | 100           | import_api
```

---

## Step 5: Refresh Settings Page

After saving:

1. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console (F12) for debug logs:
   - Look for: `"Loaded import API configs:"`
   - Should show array with 4 config objects

3. Settings should now display:
   - ✅ "Authentication is enabled" (green text)
   - ✅ "Username: api_user" displayed
   - ✅ "Password (Configured)" label shown
   - ✅ Rate limit shows 100

---

## Troubleshooting

### Settings Still Show Empty

**Cause:** Migration not run or data not saved.

**Solution:**
1. Run the migration SQL (Step 2)
2. Refresh page
3. Configure and save settings

### Console Shows Empty Array

**Check:**
```sql
-- Verify config_type is correct
SELECT config_key, config_type
FROM app_configurations
WHERE config_key LIKE 'import_api%';
```

Should show `config_type = 'import_api'` (NOT `'erp_api'`)

### Can't Save Settings

**Error:** "You must be logged in"

**Solution:**
- Make sure you're logged into the application
- Check authentication status in top-right corner

### Values Don't Persist

**Check RLS policies:**
```sql
-- Check if you can read configs
SELECT * FROM app_configurations LIMIT 1;
```

If error, RLS policies may need adjustment.

---

## Visual Indicators Added

The Settings page now shows:

### Header Section:
- **"Authentication is enabled"** (green) or **"Authentication is disabled"** (gray)
- **"• Username: [username]"** - Shows configured username

### Password Field:
- Label shows **"(Configured)"** in green when password is set
- Placeholder shows **"••••••••"** instead of empty when password exists

### Username Field:
- Displays actual username value
- Shows placeholder "api_user" only when empty

---

## Debug Mode

Open browser console (F12) and check for these logs when loading Settings:

```javascript
Loaded import API configs: [
  { config_key: 'import_api_enabled', config_value: 'true', ... },
  { config_key: 'import_api_username', config_value: 'api_user', ... },
  ...
]

Parsed import API config: {
  enabled: true,
  username: 'api_user',
  password: 'your_password',
  rateLimit: 100
}
```

If you see empty array `[]`:
→ Migration not run or config_type is wrong

---

## Quick Verification Checklist

- [ ] Migration file exists: `supabase/migrations/20251022000005_add_import_api_auth.sql`
- [ ] Migration SQL executed in database
- [ ] 4 rows exist in `app_configurations` with `config_type = 'import_api'`
- [ ] Settings page refreshed (hard refresh)
- [ ] Values configured and saved via Settings UI
- [ ] Console logs show loaded configs (check F12)
- [ ] Visual indicators appear (green text, username displayed)
- [ ] Form shows actual values (not just placeholders)

---

## Expected UI After Setup

```
╔══════════════════════════════════════════════════════════════╗
║ Import API Authentication                  [✓] Enable Auth  ║
║ Authentication is enabled • Username: api_user              ║
╠══════════════════════════════════════════════════════════════╣
║ Username:                                                    ║
║ [api_user________________________]                          ║
║ Username for Basic Authentication                           ║
║                                                              ║
║ Password: (Configured)                                       ║
║ [••••••••_____________________] 👁                          ║
║ Password for Basic Authentication (stored securely)         ║
║                                                              ║
║ Rate Limit (requests/hour)                                   ║
║ [100]                                                        ║
║ Maximum API requests allowed per hour                       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Still Having Issues?

1. Check browser console for errors
2. Verify you're logged in
3. Check database directly with SQL queries above
4. Try clearing browser cache
5. Ensure migration was run successfully

The form now properly displays stored values with visual indicators!
