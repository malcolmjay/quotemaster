# Complete Vercel + Supabase Cloud Deployment Guide

## Overview

This guide walks you through deploying the Quote and Bid Management Tool using:
- **Vercel** for frontend hosting (React application)
- **Supabase Cloud** for backend (database, authentication, edge functions)

**Estimated Time:** 30-45 minutes

---

## Prerequisites

- [ ] GitHub account (for code repository)
- [ ] Vercel account (free tier available at https://vercel.com)
- [ ] Supabase account (free tier available at https://supabase.com)
- [ ] Git installed locally
- [ ] Node.js 18+ installed locally

---

## Part 1: Prepare Your Code Repository

### Step 1: Create GitHub Repository

```bash
# Navigate to your project directory
cd /path/to/quote-bid-management-tool

# Initialize git if not already done
git init

# Create .gitignore to exclude sensitive files
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment files - CRITICAL: Never commit these!
.env
.env.local
.env.production
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Supabase
.supabase/
EOF

# Add all files
git add .
git commit -m "Initial commit"

# Create repository on GitHub (via web UI)
# Then push your code:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Verify Environment Files

Ensure you have a `.env.example` file for reference:

```bash
# .env.example (safe to commit)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**IMPORTANT:** Never commit your actual `.env` file with real credentials!

---

## Part 2: Set Up Supabase Cloud

### Step 1: Create Supabase Project

1. **Go to https://supabase.com and sign in**
2. **Click "New Project"**
   - Organization: Select or create your organization
   - Name: `quote-bid-management` (or your preferred name)
   - Database Password: Generate a strong password (save it securely!)
   - Region: Choose the closest to your users
   - Pricing Plan: Free tier is sufficient for testing
3. **Click "Create new project"**
4. **Wait 2-3 minutes** for project initialization

### Step 2: Get Your Supabase Credentials

1. **Navigate to Settings → API** in your Supabase dashboard
2. **Copy these values** (you'll need them later):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Configure Authentication

1. **Go to Authentication → Providers**
2. **Enable Email provider** (should be enabled by default)
3. **Go to Authentication → URL Configuration**
   - Add your Vercel domain (you'll get this later): `https://your-app.vercel.app`
4. **Go to Authentication → Email Templates**
   - Customize confirmation email template (optional)
5. **Important: Disable email confirmation for easier testing**
   - Go to Authentication → Providers → Email
   - Toggle OFF "Confirm email"
   - Click Save

### Step 4: Run Database Migrations

You have two options for running migrations:

#### Option A: Using Supabase Dashboard (Easiest)

1. **Go to SQL Editor in your Supabase dashboard**
2. **Create a new query**
3. **Run migrations in order** (one at a time):

```bash
# List migrations in order
ls -1 supabase/migrations/*.sql | sort
```

For each migration file:
- Copy the entire SQL content
- Paste into Supabase SQL Editor
- Click "Run" (or press Cmd/Ctrl + Enter)
- Verify success before moving to next migration

Start with:
```
20250911210238_autumn_bridge.sql
20250912131544_muddy_block.sql
20250912171028_small_gate.sql
... (continue in order)
```

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR-PROJECT-REF

# Push all migrations
supabase db push
```

### Step 5: Verify Database Setup

1. **Go to Table Editor in Supabase dashboard**
2. **Verify these tables exist:**
   - customers
   - customer_addresses
   - customer_contacts
   - products
   - inventory_levels
   - quotes
   - quote_line_items
   - price_requests
   - user_roles
   - user_metadata
   - role_approval_limits
   - app_configurations
   - cross_references
   - item_relationships

3. **Check RLS is enabled:**
   - Click on each table
   - Look for "RLS enabled" badge
   - All tables should have RLS enabled

### Step 6: Deploy Edge Functions

Your application has 4 edge functions that need to be deployed:

1. **create-user** - User creation with role assignment
2. **import-customers** - Bulk customer import API
3. **import-products** - Bulk product import API
4. **import-cross-references** - Cross-reference import API

#### Deploy using Supabase CLI:

```bash
# Ensure you're in the project root
cd /path/to/quote-bid-management-tool

# Deploy each function
supabase functions deploy create-user
supabase functions deploy import-customers
supabase functions deploy import-products
supabase functions deploy import-cross-references

# Set secrets for edge functions (if needed)
supabase secrets set API_SECRET_KEY=your-secret-key-here
```

#### Verify Edge Functions:

1. **Go to Edge Functions in Supabase dashboard**
2. **You should see 4 functions listed**
3. **Click on each function to verify deployment**
4. **Test with a simple curl command:**

```bash
# Test create-user function
curl -X POST \
  'https://xxxxxxxxxxxxx.supabase.co/functions/v1/create-user' \
  -H 'Authorization: Bearer YOUR-ANON-KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "role": "sales_rep"
  }'
```

### Step 7: Create Initial Admin User

You need at least one admin user to access the application:

**Option A: Using Edge Function (Recommended)**

```bash
curl -X POST \
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/create-user' \
  -H 'Authorization: Bearer YOUR-SERVICE-ROLE-KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Option B: Using Supabase Dashboard + SQL**

1. **Go to Authentication → Users**
2. **Click "Add user" → "Create new user"**
3. **Fill in:**
   - Email: admin@yourcompany.com
   - Password: SecurePassword123!
   - Auto Confirm User: Yes
4. **Click "Create user"**
5. **Copy the User ID**
6. **Go to SQL Editor and run:**

```sql
-- Insert admin role for the user
INSERT INTO user_roles (user_id, role, email)
VALUES (
  'PASTE-USER-ID-HERE',
  'admin',
  'admin@yourcompany.com'
);

-- Insert user metadata
INSERT INTO user_metadata (user_id, first_name, last_name, email)
VALUES (
  'PASTE-USER-ID-HERE',
  'Admin',
  'User',
  'admin@yourcompany.com'
);
```

### Step 8: Configure Application Settings (Optional)

You can configure default application settings:

```sql
-- Insert default configuration
INSERT INTO app_configurations (key, value, description, category)
VALUES
  ('company_name', '"Your Company Name"', 'Company name displayed in the application', 'general'),
  ('default_margin_percent', '25', 'Default margin percentage for quotes', 'pricing'),
  ('quote_expiry_days', '30', 'Number of days until quote expires', 'quotes'),
  ('enable_erp_integration', 'false', 'Enable ERP integration features', 'integrations')
ON CONFLICT (key) DO NOTHING;
```

---

## Part 3: Deploy to Vercel

### Step 1: Sign Up / Sign In to Vercel

1. **Go to https://vercel.com**
2. **Click "Sign Up" or "Log In"**
3. **Connect your GitHub account**

### Step 2: Import Your Project

1. **From Vercel Dashboard, click "Add New..." → "Project"**
2. **Import your GitHub repository**
   - Search for your repo: `YOUR-USERNAME/YOUR-REPO-NAME`
   - Click "Import"

### Step 3: Configure Build Settings

Vercel should auto-detect the settings, but verify:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 4: Add Environment Variables

**CRITICAL: Add these before deploying!**

1. **In the "Environment Variables" section, add:**

```
Name: VITE_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
(Use the Project URL from Supabase Settings → API)

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(Use the anon public key from Supabase Settings → API)
```

2. **Select environment:** Production, Preview, and Development (all three)

3. **Click "Add" after each variable**

### Step 5: Deploy

1. **Click "Deploy"**
2. **Wait 2-3 minutes** for build to complete
3. **Vercel will show build logs** - watch for any errors
4. **Once complete, you'll see:** "Your project has been deployed"

### Step 6: Get Your Vercel URL

1. **Copy your deployment URL:**
   ```
   https://your-app-name.vercel.app
   or
   https://your-app-name-xyz123.vercel.app
   ```

2. **Click "Visit" to open your application**

### Step 7: Update Supabase with Vercel URL

1. **Go back to Supabase Dashboard**
2. **Navigate to Authentication → URL Configuration**
3. **Add your Vercel URL to:**
   - Site URL: `https://your-app-name.vercel.app`
   - Redirect URLs: `https://your-app-name.vercel.app/**`
4. **Click "Save"**

### Step 8: Configure Custom Domain (Optional)

1. **In Vercel, go to your project Settings → Domains**
2. **Add your custom domain:** `quotes.yourcompany.com`
3. **Follow Vercel's DNS configuration instructions**
4. **Vercel automatically provisions SSL certificate**
5. **Update Supabase URL configuration** with custom domain

---

## Part 4: Post-Deployment Configuration

### Step 1: Test Your Application

1. **Open your Vercel URL**
2. **You should see the login page**
3. **Log in with your admin credentials:**
   - Email: admin@yourcompany.com
   - Password: SecurePassword123!

4. **Test core functionality:**
   - Create a customer
   - Add a product
   - Create a quote
   - Add line items
   - Submit for approval

### Step 2: Set Up Additional Users

1. **Log in as admin**
2. **Navigate to Settings → User Management**
3. **Create users for your team:**
   - Sales representatives (role: sales_rep)
   - Sales managers (role: sales_manager)
   - Finance team (role: finance)
   - Additional admins (role: admin)

### Step 3: Configure Approval Limits

1. **Navigate to Settings → Approval Limits**
2. **Set approval thresholds for each role:**

```
Sales Rep: $0 - $10,000 (can approve up to $10k)
Sales Manager: $0 - $50,000
Finance: $0 - $100,000
Admin: Unlimited
```

### Step 4: Import Your Data

You have two options for importing data:

#### Option A: Using Import APIs (Edge Functions)

```bash
# Import customers
curl -X POST \
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/import-customers' \
  -H 'Authorization: Bearer YOUR-SERVICE-ROLE-KEY' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: YOUR-API-KEY' \
  -d @customers.json

# Import products
curl -X POST \
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/import-products' \
  -H 'Authorization: Bearer YOUR-SERVICE-ROLE-KEY' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: YOUR-API-KEY' \
  -d @products.json
```

#### Option B: Manual Entry via UI

Use the management interfaces in the application to add:
- Customers (Settings → Customer Management)
- Products (Settings → Product Management)
- Cross References (Settings → Cross Reference Management)

### Step 5: Configure ERP Integration (If Applicable)

If you're integrating with an ERP system:

1. **Navigate to Settings → Configuration**
2. **Configure ERP API settings:**
   - API Endpoint
   - Authentication method
   - Sync frequency
3. **Test connection**

See `ERP-INTEGRATION-GUIDE.md` for detailed instructions.

---

## Part 5: Security Hardening

### Step 1: Rotate API Keys (If Exposed)

If you accidentally committed your `.env` file to Git:

1. **Go to Supabase Settings → API**
2. **Click "Reset API Keys"**
3. **Update environment variables in Vercel:**
   - Go to Vercel Project Settings → Environment Variables
   - Update `VITE_SUPABASE_ANON_KEY` with new value
   - Click "Save"
4. **Redeploy:** Go to Deployments → Click "..." → "Redeploy"

### Step 2: Review RLS Policies

1. **Go to Supabase Dashboard → Authentication → Policies**
2. **Review policies for each table**
3. **Ensure no policies use `USING (true)` (overly permissive)**
4. **Fix any overly permissive policies:**

```sql
-- Example: Fix customers table policy
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON customers;

CREATE POLICY "Users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    -- Add proper access control based on your requirements
    -- For now, authenticated users can view all customers
    -- You can enhance this with organization-based access
    true
  );
```

### Step 3: Enable Vercel Security Headers

1. **Create `vercel.json` in your project root:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

2. **Commit and push:**

```bash
git add vercel.json
git commit -m "Add security headers"
git push
```

3. **Vercel will automatically redeploy**

### Step 4: Set Up Monitoring

1. **Vercel Analytics (Built-in):**
   - Go to your project → Analytics
   - Enable Web Analytics (free)

2. **Supabase Logs:**
   - Go to Logs in Supabase dashboard
   - Monitor API requests, errors, and slow queries

3. **Set up alerts (Optional):**
   - Use Vercel integrations with Slack, Discord, or email
   - Configure Supabase webhooks for critical events

---

## Part 6: Backup and Maintenance

### Automated Backups

**Supabase automatically backs up your database:**
- Free tier: 7 days of point-in-time recovery
- Pro tier: 30 days of point-in-time recovery

**To restore from backup:**
1. Go to Database → Backups in Supabase dashboard
2. Select a restore point
3. Click "Restore"

### Manual Backups

```bash
# Export database using pg_dump
pg_dump -h db.YOUR-PROJECT-REF.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup-$(date +%Y%m%d).dump

# Or use Supabase CLI
supabase db dump -f backup.sql
```

### Vercel Deployments

Vercel keeps a history of all deployments:
1. Go to Deployments tab
2. You can instantly rollback to any previous deployment
3. Click "..." → "Promote to Production" to rollback

---

## Troubleshooting

### Issue: Build fails on Vercel

**Error:** `Module not found` or `Cannot find module`

**Solution:**
```bash
# Ensure all dependencies are in package.json
npm install --save-dev vite @vitejs/plugin-react
npm install --save react react-dom

# Commit and push
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

### Issue: "Invalid API Key" or authentication errors

**Solution:**
1. Verify environment variables in Vercel match Supabase exactly
2. Check for trailing spaces in environment variable values
3. Ensure you're using `anon public` key, not `service_role` key
4. Redeploy after updating environment variables

### Issue: RLS prevents data access

**Symptom:** Empty lists, "permission denied" errors

**Solution:**
```sql
-- Check if RLS is too restrictive
-- Temporarily test with permissive policy
CREATE POLICY "temp_allow_all" ON customers
  FOR SELECT TO authenticated
  USING (true);

-- If this fixes it, refine your RLS policies
```

### Issue: Edge Functions not working

**Solution:**
1. Check Edge Function logs in Supabase dashboard
2. Verify CORS headers in function code
3. Test with curl to isolate frontend vs. backend issues
4. Ensure Authorization header is being sent

### Issue: Vercel deployment URL not working

**Solution:**
1. Check Vercel deployment logs for errors
2. Verify environment variables are set for all environments
3. Ensure `dist` directory is being created during build
4. Try manual deployment: `npm run build` locally to test

---

## Deployment Checklist

Before going live with real users:

### Pre-Launch Checklist

- [ ] All database migrations applied successfully
- [ ] All edge functions deployed and tested
- [ ] Admin user created and tested
- [ ] Environment variables set correctly in Vercel
- [ ] Supabase URL configuration includes Vercel domain
- [ ] RLS policies reviewed and properly restrictive
- [ ] Security headers configured (vercel.json)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Test all core features end-to-end
- [ ] Create test quote and submit for approval
- [ ] Verify approval workflow works
- [ ] Test user creation and role assignment
- [ ] Import sample data successfully
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and analytics enabled
- [ ] Backup strategy confirmed
- [ ] Team trained on how to use the application
- [ ] Documentation shared with users
- [ ] Support process established

### Post-Launch Checklist

- [ ] Monitor error logs daily for first week
- [ ] Review performance metrics
- [ ] Gather user feedback
- [ ] Address any reported issues
- [ ] Schedule regular database backups
- [ ] Plan for scaling if needed (upgrade Supabase/Vercel tiers)

---

## Costs

### Free Tier Limits

**Vercel Free Tier:**
- 100 GB bandwidth per month
- Unlimited deployments
- Automatic SSL
- 100 GB-hours serverless function execution
- Sufficient for small to medium teams

**Supabase Free Tier:**
- 500 MB database storage
- 2 GB bandwidth
- 50,000 monthly active users
- 500,000 edge function invocations
- 7 days of log retention

### When to Upgrade

**Consider upgrading when:**
- Database exceeds 500 MB (Supabase Pro: $25/mo for 8 GB)
- Traffic exceeds free tier limits
- Need longer log retention for compliance
- Require priority support
- Need custom domain on Vercel (Hobby: $20/mo)

---

## Next Steps

1. **Review the Security Audit Report:** `SECURITY-AUDIT-REPORT.md`
2. **Read the ERP Integration Guide:** `ERP-INTEGRATION-GUIDE.md`
3. **Share the User Documentation:** `DOCUMENTATION.md`
4. **Set up regular backups:** Configure automated backup solution
5. **Plan for scaling:** Monitor usage and upgrade tiers as needed

---

## Support and Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Project README:** See `README.md` for application details
- **Technical Architecture:** See `TECHNICAL-ARCHITECTURE.md`

---

## Summary

You've successfully deployed your Quote and Bid Management Tool using:
- **Vercel** for fast, global frontend hosting with automatic SSL
- **Supabase Cloud** for managed PostgreSQL database, authentication, and edge functions

This deployment provides:
- Automatic HTTPS encryption
- Global CDN for fast performance
- Automatic scaling
- Built-in monitoring
- Zero server maintenance
- Professional security out of the box

Your application is now live and ready for production use!
