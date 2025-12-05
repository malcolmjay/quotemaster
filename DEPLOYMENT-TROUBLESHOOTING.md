# Deployment Troubleshooting Guide

Common issues and solutions when deploying to Vercel + Supabase Cloud.

---

## Build & Deployment Issues

### Error: "Build failed - Module not found"

**Symptoms:**
```
Error: Cannot find module '@supabase/supabase-js'
Module not found: Can't resolve 'react'
```

**Causes:**
- Missing dependencies in `package.json`
- Corrupted `node_modules`
- Incorrect import statements

**Solutions:**

```bash
# 1. Verify all dependencies are installed
npm install

# 2. Check package.json includes all required packages
cat package.json | grep -A 20 '"dependencies"'

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Test build locally
npm run build

# 5. Commit and push if successful
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

---

### Error: "Build succeeded but page shows blank"

**Symptoms:**
- Vercel build completes successfully
- Accessing URL shows blank white page
- Browser console shows errors

**Check these:**

1. **Open browser console (F12)**
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify environment variables:**
   ```bash
   # In Vercel dashboard:
   Settings → Environment Variables

   # Must have:
   VITE_SUPABASE_URL (no trailing slash)
   VITE_SUPABASE_ANON_KEY (starts with eyJ...)
   ```

3. **Redeploy after adding variables:**
   - Vercel → Deployments → "..." → Redeploy

4. **Check for CORS issues:**
   - Network tab shows "CORS policy" errors
   - Fix: Update Supabase URL configuration

---

### Error: "Unable to resolve path to module"

**Symptoms:**
```
Error: Unable to resolve path to module './components/xyz'
```

**Solution:**
```bash
# Check file exists and path is correct
ls -la src/components/

# Fix import statements (case-sensitive!)
# Wrong: import { Component } from './Components/file'
# Right: import { Component } from './components/file'

# Verify in code
grep -r "from './Components" src/
```

---

## Authentication Issues

### Error: "Invalid API key" or "Invalid JWT"

**Symptoms:**
- Login fails immediately
- Console shows: `Invalid API key`
- All API requests return 401

**Solutions:**

1. **Verify Supabase credentials:**
   ```bash
   # In Supabase dashboard:
   Settings → API → Project URL and anon key

   # Compare with Vercel environment variables
   # They must match EXACTLY (no spaces, no extra characters)
   ```

2. **Check for trailing spaces:**
   ```bash
   # In Vercel, delete and re-add the variable
   # Copy-paste directly from Supabase dashboard
   ```

3. **Verify you're using anon key (not service role):**
   ```bash
   # Anon key: safe to expose in frontend
   # Service role key: NEVER use in frontend code

   # Check in Vercel:
   VITE_SUPABASE_ANON_KEY should be the public anon key
   ```

4. **Test Supabase connection:**
   ```bash
   curl "https://YOUR-PROJECT-REF.supabase.co/rest/v1/" \
     -H "apikey: YOUR-ANON-KEY" \
     -H "Authorization: Bearer YOUR-ANON-KEY"

   # Should return: {"message":"..."}
   ```

---

### Error: "User creation fails" or "Failed to sign up"

**Symptoms:**
- Sign up form doesn't work
- Error: "Email rate limit exceeded"
- No user created in Supabase

**Solutions:**

1. **Disable email confirmation:**
   ```bash
   # Supabase dashboard:
   Authentication → Providers → Email
   Toggle OFF: "Confirm email"
   Click "Save"
   ```

2. **Check email rate limits:**
   ```bash
   # Supabase free tier: 4 emails per hour
   # Wait or upgrade plan
   ```

3. **Verify Auth is enabled:**
   ```bash
   # Supabase dashboard:
   Authentication → Providers
   Email provider should be "Enabled"
   ```

4. **Check password requirements:**
   ```bash
   # Minimum 6 characters (default)
   # Supabase dashboard:
   Authentication → Providers → Email
   Check password requirements
   ```

---

### Error: "Session expired" or "User not authenticated"

**Symptoms:**
- User logged out unexpectedly
- Have to login frequently
- Session not persisting

**Solutions:**

1. **Check localStorage is enabled:**
   ```javascript
   // Browser console:
   localStorage.setItem('test', 'test')
   localStorage.getItem('test')
   // Should return 'test'
   ```

2. **Verify session configuration:**
   ```typescript
   // In src/lib/supabase.ts
   const supabase = createClient(url, key, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true,
     },
   });
   ```

3. **Clear browser cache:**
   ```bash
   # Browser:
   F12 → Application → Clear storage
   # Then try logging in again
   ```

---

## Database & RLS Issues

### Error: "permission denied for table" or "new row violates row-level security policy"

**Symptoms:**
- Can't insert/update/delete data
- Console shows: `permission denied`
- Lists appear empty

**Solutions:**

1. **Verify RLS policies exist:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

2. **Check user is authenticated:**
   ```javascript
   // Browser console:
   const { data: { user } } = await supabase.auth.getUser()
   console.log(user)
   // Should show user object, not null
   ```

3. **Test with permissive policy (temporarily):**
   ```sql
   -- Add temporary policy to test
   CREATE POLICY "temp_allow_all"
   ON customers
   FOR ALL
   TO authenticated
   USING (true)
   WITH CHECK (true);

   -- If this works, your RLS policies are too restrictive
   -- Remove temp policy after testing:
   DROP POLICY "temp_allow_all" ON customers;
   ```

4. **Review specific policies:**
   ```sql
   -- Check policies for a table
   SELECT * FROM pg_policies WHERE tablename = 'customers';
   ```

---

### Error: "Failed to run migrations"

**Symptoms:**
- SQL editor shows errors
- Tables not created
- Foreign key violations

**Solutions:**

1. **Run migrations in order:**
   ```bash
   # Must run in chronological order:
   ls -1 supabase/migrations/*.sql | sort

   # Run one at a time in SQL Editor
   ```

2. **Check for existing objects:**
   ```sql
   -- If table already exists:
   DROP TABLE IF EXISTS table_name CASCADE;

   -- Then re-run migration
   ```

3. **Fix foreign key issues:**
   ```sql
   -- Error: "foreign key violation"
   -- Ensure parent tables exist first

   -- Check table exists:
   SELECT * FROM information_schema.tables
   WHERE table_name = 'parent_table';
   ```

4. **Use CLI for clean migration:**
   ```bash
   supabase db reset  # WARNING: Deletes all data!
   supabase db push   # Runs all migrations in order
   ```

---

## Edge Functions Issues

### Error: "Edge function not found" or 404

**Symptoms:**
- Calling edge function returns 404
- Function doesn't appear in Supabase dashboard
- Import APIs don't work

**Solutions:**

1. **Verify deployment:**
   ```bash
   # List deployed functions
   supabase functions list

   # Should show your functions
   # If not, deploy again:
   supabase functions deploy function-name
   ```

2. **Check function URL:**
   ```bash
   # Correct format:
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/function-name

   # Not:
   https://YOUR-PROJECT-REF.supabase.co/function-name
   ```

3. **Verify in Supabase dashboard:**
   ```bash
   Edge Functions → Should see all 4 functions
   - create-user
   - import-customers
   - import-products
   - import-cross-references
   ```

---

### Error: "CORS error" when calling edge function

**Symptoms:**
- Browser console: `CORS policy` error
- Fetch request fails
- Network tab shows blocked request

**Solutions:**

1. **Verify CORS headers in edge function:**
   ```typescript
   // Each function must have:
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
   };

   // Handle OPTIONS:
   if (req.method === 'OPTIONS') {
     return new Response(null, { status: 200, headers: corsHeaders });
   }

   // Include in all responses:
   return new Response(JSON.stringify(data), {
     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
   });
   ```

2. **Redeploy function:**
   ```bash
   supabase functions deploy function-name
   ```

---

### Error: "Invalid API key" when calling edge function

**Symptoms:**
- Function returns 401 or 403
- Authorized requests fail

**Solutions:**

1. **Check Authorization header:**
   ```javascript
   // Frontend code should include:
   const response = await fetch(functionUrl, {
     headers: {
       'Authorization': `Bearer ${supabaseAnonKey}`,
       'Content-Type': 'application/json',
     }
   });
   ```

2. **For service role operations:**
   ```bash
   # Use service role key for admin operations
   curl -X POST "https://YOUR-PROJECT-REF.supabase.co/functions/v1/create-user" \
     -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY" \
     -H "Content-Type: application/json"
   ```

---

## URL Configuration Issues

### Error: "Email confirmation link doesn't work"

**Symptoms:**
- Click confirmation email link
- Redirects to wrong URL
- Shows error page

**Solutions:**

1. **Update Supabase URL configuration:**
   ```bash
   # Supabase dashboard:
   Authentication → URL Configuration

   Site URL: https://your-app.vercel.app
   Redirect URLs: https://your-app.vercel.app/**
   ```

2. **Match your Vercel domain exactly:**
   ```bash
   # Use the actual Vercel URL
   # Not localhost or development URLs
   ```

---

## Performance Issues

### Issue: Slow page loads

**Symptoms:**
- Pages take 5+ seconds to load
- Database queries are slow
- Users complain about performance

**Solutions:**

1. **Check database indexes:**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
   CREATE INDEX IF NOT EXISTS idx_line_items_quote_id ON quote_line_items(quote_id);
   CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
   ```

2. **Review slow queries:**
   ```bash
   # Supabase dashboard:
   Database → Query Performance
   # Look for slow queries and optimize
   ```

3. **Enable query optimization:**
   ```sql
   -- Check query plan:
   EXPLAIN ANALYZE
   SELECT * FROM quotes WHERE customer_id = 'xxx';
   ```

4. **Use Vercel Analytics:**
   ```bash
   # Vercel dashboard:
   Project → Analytics
   # Check page load times and bottlenecks
   ```

---

## Data Issues

### Issue: Data not showing up

**Symptoms:**
- Lists appear empty
- Created items don't appear
- Dashboard shows no data

**Solutions:**

1. **Check RLS policies (most common):**
   ```sql
   -- Verify user can read data:
   SELECT * FROM customers;
   -- If empty but you know data exists, RLS is blocking it
   ```

2. **Verify data exists:**
   ```bash
   # Supabase dashboard:
   Table Editor → Select table
   # Should see rows
   ```

3. **Check frontend query:**
   ```javascript
   // Open browser console
   // Look for error messages in Network tab
   // Verify API calls are succeeding
   ```

4. **Test direct API call:**
   ```bash
   curl "https://YOUR-PROJECT-REF.supabase.co/rest/v1/customers?select=*" \
     -H "apikey: YOUR-ANON-KEY" \
     -H "Authorization: Bearer YOUR-ANON-KEY"
   ```

---

## Environment-Specific Issues

### Issue: Works locally but not on Vercel

**Symptoms:**
- `npm run dev` works fine locally
- Deployed version has issues
- Different behavior in production

**Solutions:**

1. **Check environment variables:**
   ```bash
   # Ensure Vercel has the same variables as local .env
   # Vercel: Settings → Environment Variables
   ```

2. **Check for hardcoded localhost:**
   ```bash
   # Search for localhost references:
   grep -r "localhost" src/

   # Should use environment variables instead
   ```

3. **Verify build output:**
   ```bash
   # Run production build locally:
   npm run build
   npm run preview

   # Test at http://localhost:4173
   # Should match Vercel behavior
   ```

4. **Check Vercel build logs:**
   ```bash
   # Vercel dashboard:
   Deployments → Click on deployment → View build logs
   # Look for warnings or errors
   ```

---

## Getting Help

If issues persist:

1. **Check Vercel logs:**
   - Deployments → Functions → View logs

2. **Check Supabase logs:**
   - Logs → API logs

3. **Enable verbose logging:**
   ```typescript
   // In src/lib/supabase.ts
   const supabase = createClient(url, key, {
     auth: { debug: true }
   });
   ```

4. **Test API directly:**
   - Use Postman or curl to isolate frontend vs backend issues

5. **Review documentation:**
   - `VERCEL-SUPABASE-DEPLOYMENT.md` - Full deployment guide
   - `SECURITY-AUDIT-REPORT.md` - Security considerations
   - Vercel docs: https://vercel.com/docs
   - Supabase docs: https://supabase.com/docs

---

## Prevention Checklist

Prevent issues before deployment:

- [ ] Test build locally: `npm run build && npm run preview`
- [ ] Verify .env.example is up to date
- [ ] Check .gitignore includes .env
- [ ] Run all migrations in order
- [ ] Test RLS policies with different users
- [ ] Deploy edge functions before frontend
- [ ] Set environment variables before first deploy
- [ ] Update Supabase URL config with Vercel domain
- [ ] Test authentication flow end-to-end
- [ ] Verify security headers are configured
- [ ] Check CORS is properly configured in edge functions
- [ ] Test with real data, not just test data
- [ ] Review browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Test on mobile and different browsers

---

## Quick Fixes Reference

| Error | Quick Fix |
|-------|-----------|
| Build fails | `rm -rf node_modules && npm install && npm run build` |
| Blank page | Check browser console, verify environment variables |
| Auth fails | Verify anon key in Vercel matches Supabase |
| 404 on function | Redeploy function: `supabase functions deploy name` |
| CORS error | Check CORS headers in edge function |
| RLS blocks data | Review policies, temporarily use `USING (true)` to test |
| Slow queries | Add database indexes |
| Session expires | Clear localStorage, check session config |

---

## Emergency Rollback

If deployment breaks production:

1. **Instant rollback in Vercel:**
   ```bash
   Deployments → Previous deployment → "..." → Promote to Production
   ```

2. **Database rollback:**
   ```bash
   # Supabase dashboard:
   Database → Backups → Restore to point in time
   ```

3. **Edge function rollback:**
   ```bash
   # Redeploy previous version:
   git checkout previous-commit
   supabase functions deploy function-name
   git checkout main
   ```

This guide should resolve most common deployment issues!
