# Deploy Import Products Function

## Issue

The import-products Edge Function is currently deployed with JWT verification enabled, which prevents Basic Authentication from working.

## Solution

Redeploy the function with `verify_jwt: false` to allow Basic Authentication.

## Option 1: Using the MCP Tool (Recommended)

Use the `mcp__supabase__deploy_edge_function` tool with these parameters:

```json
{
  "name": "import-products",
  "slug": "import-products",
  "verify_jwt": false,
  "entrypoint_path": "index.ts",
  "files": [
    {
      "name": "index.ts",
      "content": "[CONTENT FROM supabase/functions/import-products/index.ts]"
    }
  ]
}
```

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd /tmp/cc-agent/54570349/project

# Deploy with no JWT verification
supabase functions deploy import-products --no-verify-jwt
```

## Option 3: Manual Configuration via Dashboard

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select `import-products` function
4. Update settings:
   - **Verify JWT**: OFF (disable)
5. Redeploy the function

## Why This Is Needed

**Current State:**
- Function deployed with `verify_jwt: true` (default)
- Supabase checks for Bearer token BEFORE function code runs
- Basic Authentication headers are rejected with 401

**After Fix:**
- Function deployed with `verify_jwt: false`
- Function receives all requests
- Function code handles authentication (Basic Auth OR Bearer token)
- Provides flexibility for external integrations

## Security

This is SAFE because:
- ✅ Your function code validates credentials
- ✅ Basic Auth username/password required
- ✅ Enable/disable toggle in settings
- ✅ Rate limiting configured
- ✅ Bearer tokens still work as fallback

## Testing After Deployment

```bash
# Test without credentials (should fail with custom message)
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-products' \
  -H 'Content-Type: application/json' \
  -d '{"products": []}'

# Expected: {"success": false, "message": "Authentication required..."}

# Test with Basic Auth (should work)
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-products' \
  -u 'username:password' \
  -H 'Content-Type: application/json' \
  -d '{"products": [...]}'

# Expected: Success response
```

## Quick Deploy Command

I'll deploy it for you now using the MCP tool...
