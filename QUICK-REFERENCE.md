# Quick Reference - Quote and Bid Management Tool

A quick reference guide for common tasks and commands.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Commands](#development-commands)
- [Database Commands](#database-commands)
- [Common Tasks](#common-tasks)
- [Environment Variables](#environment-variables)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Endpoints](#api-endpoints)
- [Troubleshooting Quick Fixes](#troubleshooting-quick-fixes)

---

## Getting Started

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your Supabase credentials
# (Get from https://supabase.com/dashboard)

# 4. Start development server
npm run dev
```

### Daily Development Workflow
```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

---

## Development Commands

### NPM Scripts
```bash
# Start development server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint

# Run linter and auto-fix issues
npm run lint -- --fix
```

### Port Management
```bash
# If port 5173 is in use, kill the process:

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.ts
```

---

## Database Commands

### Supabase CLI
```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project (one time)
supabase init

# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# Reset database (WARNING: deletes all data)
supabase db reset

# Link to remote project
supabase link --project-ref <project-ref>

# Push migrations to remote
supabase db push

# Pull migrations from remote
supabase db pull

# Create new migration
supabase migration new <migration-name>

# Generate TypeScript types from database
supabase gen types typescript --local > src/lib/database.types.ts
```

### Common SQL Queries

#### Check User Roles
```sql
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;
```

#### Create Admin User
```sql
-- First, get the user ID
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Then assign admin role
INSERT INTO user_roles (user_id, role, email)
VALUES ('user-id-here', 'admin', 'user@example.com');
```

#### Check Quote Statistics
```sql
SELECT
  quote_status,
  COUNT(*) as count,
  SUM(total_amount) as total_value
FROM quotes
GROUP BY quote_status
ORDER BY count DESC;
```

#### View Expired Price Requests
```sql
SELECT
  pr.product_number,
  pr.supplier,
  pr.effective_end_date,
  pr.supplier_pricing
FROM price_requests pr
WHERE pr.effective_end_date < CURRENT_DATE
  AND pr.status = 'completed'
ORDER BY pr.effective_end_date DESC;
```

---

## Common Tasks

### Creating a New User
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Enable "Auto Confirm User"
5. Run SQL to assign role:
   ```sql
   INSERT INTO user_roles (user_id, role, email)
   VALUES ('user-id', 'csr', 'user@example.com');
   ```

### Importing Products
1. Navigate to "Product Import" in the app
2. Download CSV template
3. Fill in product data
4. Upload CSV file
5. Review import results

### Running Migrations
```bash
# Option 1: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy migration file contents
# 3. Paste and run

# Option 2: Via CLI
supabase db push

# Option 3: Reset and reapply all
supabase db reset
```

### Clearing Cache
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Then select "Cached images and files"
```

---

## Environment Variables

### Required Variables
```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration (Optional)
VITE_APP_NAME=QuoteMaster Pro
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### Getting Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click Settings (gear icon)
4. Click "API"
5. Copy "Project URL" and "anon public" key

---

## Keyboard Shortcuts

### In Application
- **Shift + S** - Focus product search (in Line Items)
- **Ctrl/Cmd + K** - Quick search (if implemented)
- **Esc** - Close modals
- **Tab** - Navigate between fields

### Development
- **Ctrl/Cmd + C** - Stop dev server
- **R** - Restart dev server (in terminal)
- **H** - Show help (in Vite dev server)
- **U** - Show server URL
- **O** - Open in browser
- **Q** - Quit

### Browser DevTools
- **F12** - Open DevTools
- **Ctrl/Cmd + Shift + C** - Inspect element
- **Ctrl/Cmd + Shift + J** - Open console
- **Ctrl/Cmd + Shift + M** - Toggle device toolbar

---

## API Endpoints

### Supabase Edge Functions
```bash
# Base URL format
https://<project-ref>.supabase.co/functions/v1/

# Create User
POST /create-user
Headers: {
  "Authorization": "Bearer <anon-key>",
  "Content-Type": "application/json"
}
Body: {
  "email": "user@example.com",
  "password": "password123",
  "role": "csr"
}

# Import Products
POST /import-products
Headers: {
  "Authorization": "Bearer <anon-key>",
  "Content-Type": "application/json",
  "x-api-key": "<import-api-key>"
}
Body: {
  "products": [...]
}

# Import Customers
POST /import-customers
Headers: {
  "Authorization": "Bearer <anon-key>",
  "Content-Type": "application/json",
  "x-api-key": "<import-api-key>"
}
Body: {
  "customers": [...]
}

# Import Cross References
POST /import-cross-references
Headers: {
  "Authorization": "Bearer <anon-key>",
  "Content-Type": "application/json",
  "x-api-key": "<import-api-key>"
}
Body: {
  "cross_references": [...]
}
```

### Testing Edge Functions
```bash
# Using curl
curl -X POST https://<project-ref>.supabase.co/functions/v1/import-products \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <api-key>" \
  -d '{"products":[...]}'

# Using Postman
# 1. Create new POST request
# 2. Add headers as shown above
# 3. Add JSON body
# 4. Send request
```

---

## Troubleshooting Quick Fixes

### Cannot Connect to Database
```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify Supabase URL is correct
cat .env | grep SUPABASE_URL

# 3. Test connection
curl https://<your-project>.supabase.co/rest/v1/
```

### Build Fails
```bash
# Clear everything and rebuild
rm -rf node_modules dist .vite package-lock.json
npm install
npm run build
```

### Types Not Found
```bash
# Regenerate types from database
supabase gen types typescript --local > src/lib/database.types.ts

# Or from cloud
supabase gen types typescript --project-id <project-ref> > src/lib/database.types.ts
```

### Port Already in Use
```bash
# Option 1: Use different port
# Edit vite.config.ts:
# server: { port: 3000 }

# Option 2: Kill process
# See "Port Management" section above
```

### Authentication Issues
```sql
-- Confirm user email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';

-- Check user exists
SELECT * FROM auth.users WHERE email = 'user@example.com';

-- Check user has role
SELECT * FROM user_roles WHERE email = 'user@example.com';
```

### Migrations Not Applied
```bash
# Check which migrations have run
supabase migration list

# Apply specific migration
supabase db push

# Reset and reapply all (WARNING: deletes data)
supabase db reset
```

### Help Mode Not Working
1. Click the HelpCircle icon in header
2. Icon should turn blue when enabled
3. Hover over buttons to see tooltips
4. If still not working, clear cache and refresh

---

## Git Workflow

### Daily Workflow
```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Make changes, then stage
git add .

# Commit with message
git commit -m "Add: description of changes"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

### Commit Message Convention
```bash
# Format: Type: Description

# Types:
Add:      # New feature
Fix:      # Bug fix
Update:   # Modify existing feature
Remove:   # Delete feature
Refactor: # Code restructuring
Docs:     # Documentation only
Style:    # Formatting, no code change
Test:     # Add or update tests

# Examples:
git commit -m "Add: Help Mode tooltips to all buttons"
git commit -m "Fix: Quote Builder customer selection"
git commit -m "Update: Product import validation logic"
```

---

## Performance Monitoring

### Check Bundle Size
```bash
npm run build

# Output shows file sizes
# dist/assets/index-xxxxx.js: X.XX kB
```

### Lighthouse Audit
```bash
# In Chrome DevTools
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Click "Generate report"
```

### Monitor Network Requests
```bash
# In browser DevTools
# 1. Open Network tab (F12)
# 2. Reload page
# 3. Check request count and size
# 4. Filter by type (XHR, JS, CSS, etc.)
```

---

## Useful Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Documentation
- `README.md` - Project overview
- `LOCAL-DEPLOYMENT-GUIDE.md` - Local setup guide
- `DOCUMENTATION.md` - Feature documentation
- `TECHNICAL-ARCHITECTURE.md` - Architecture details
- `DATABASE-SETUP-GUIDE.md` - Database schema

### Community
- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase

---

## Quick SQL Snippets

### Reset Test Data
```sql
-- WARNING: This deletes data!
TRUNCATE quotes, quote_line_items, price_requests CASCADE;
```

### Check Database Size
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Users
```sql
SELECT
  COUNT(*) as active_users
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '7 days';
```

---

**Keep this reference handy for quick lookups during development!** 📚
