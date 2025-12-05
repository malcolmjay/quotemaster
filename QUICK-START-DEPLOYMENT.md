# Quick Start Deployment Guide

This is a condensed version of the full deployment guide for quick setup.

## Prerequisites

- Docker and Docker Compose installed
- Supabase project created
- Root/sudo access to server

## 1. Setup Supabase (5 minutes)

1. Go to https://supabase.com and create a project
2. Wait for initialization (~2-3 minutes)
3. Go to Settings > API and copy:
   - `Project URL`
   - `anon public key`
   - `service_role key`
4. Go to Settings > Auth:
   - Enable Email provider
   - Disable "Confirm email" (toggle OFF)

## 2. Prepare Server (2 minutes)

```bash
# Create project directory
sudo mkdir -p /opt/quote-app
cd /opt/quote-app

# Copy your application files here
# (git clone or scp from your dev machine)

# Create environment file
sudo nano .env.production
```

Add to `.env.production`:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
```

## 3. Deploy Database (10 minutes)

### Via Supabase Dashboard (Recommended):

1. Go to SQL Editor in Supabase Dashboard
2. Run each migration file in order from `supabase/migrations/` folder
3. Copy/paste contents and click "Run"
4. Start with earliest timestamp, end with latest

**Important migrations to run:**
- All numbered migrations (20250911... through 20251116...)
- `optimize_pending_approvals_query.sql`

### Quick verification:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## 4. Deploy Application (5 minutes)

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
sudo ./scripts/deploy.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Setup directories
- ✅ Generate SSL certificate (self-signed)
- ✅ Build Docker image
- ✅ Start containers
- ✅ Run health checks

## 5. Verify Deployment (2 minutes)

```bash
# Check containers are running
docker ps

# Check application health
curl http://localhost:8080/health

# View logs
docker-compose logs -f quote-app
```

## 6. Access Application

- **HTTP**: http://localhost:8080 or http://your-server-ip:8080
- **HTTPS**: https://localhost or https://your-server-ip (self-signed warning expected)

## 7. Initial Configuration (5 minutes)

### Create Admin User:

1. Open application in browser
2. Click "Sign Up"
3. Create account with your email
4. Go to Supabase Dashboard > SQL Editor
5. Run:

```sql
-- Get user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Add Admin role (replace USER_ID)
INSERT INTO user_roles (user_id, email, role, is_active)
VALUES ('USER_ID_FROM_ABOVE', 'your@email.com', 'Admin', true);
```

### Configure Import API (Optional):

```sql
INSERT INTO app_configurations (config_key, config_value, description)
VALUES
  ('import_api_enabled', 'true', 'Enable import API'),
  ('import_api_username', 'api_user', 'Import API username'),
  ('import_api_password', 'ChangeMe123!', 'Import API password'),
  ('customer_import_api_enabled', 'true', 'Enable customer import API'),
  ('customer_import_api_username', 'api_user', 'Customer import username'),
  ('customer_import_api_password', 'ChangeMe123!', 'Customer import password');
```

### Set Approval Limits:

```sql
INSERT INTO role_approval_limits (role, min_amount, max_amount)
VALUES
  ('CSR', 0, 25000),
  ('Manager', 25000, 50000),
  ('Director', 50000, 200000),
  ('VP', 200000, 300000),
  ('President', 300000, 999999999);
```

## 8. Deploy Edge Functions (5 minutes)

### Via Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy import-products
supabase functions deploy import-customers
supabase functions deploy import-cross-references
```

### Or Via Dashboard:

1. Go to Edge Functions in Supabase
2. Create new function for each:
   - `import-products`
   - `import-customers`
   - `import-cross-references`
3. Copy code from `supabase/functions/[function-name]/index.ts`
4. Include shared files (`_shared/auth-middleware.ts`, `_shared/rate-limiter.ts`)

## Troubleshooting

### Container won't start:
```bash
docker-compose logs quote-app
docker-compose down && docker-compose up -d --build
```

### Can't connect to Supabase:
```bash
# Test connection
curl https://your-project-ref.supabase.co/rest/v1/

# Check environment
docker-compose exec quote-app env | grep SUPABASE
```

### Database migrations failed:
- Check Supabase Dashboard > Database > Logs
- Verify migrations ran in correct order
- Re-run failed migration manually

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Stop application
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check health
curl http://localhost:8080/health

# Monitor resources
docker stats
```

## Setup Monitoring (Optional)

```bash
# Make monitor script executable
chmod +x scripts/monitor.sh

# Test monitoring
sudo ./scripts/monitor.sh

# Add to crontab for automatic monitoring
sudo crontab -e

# Add this line:
*/5 * * * * /opt/quote-app/scripts/monitor.sh
```

## Next Steps

1. ✅ Log in with admin account
2. ✅ Test creating a quote
3. ✅ Configure approval limits
4. ✅ Set up import API credentials
5. ✅ Train users on the system

## Getting Help

- **Full documentation**: See `DEPLOYMENT-GUIDE.md`
- **Application logs**: `docker-compose logs -f`
- **Database issues**: Check Supabase Dashboard
- **Container issues**: `docker ps` and `docker logs quote-app`

---

**Total Setup Time**: ~30 minutes

For detailed configuration, troubleshooting, and advanced topics, see the complete `DEPLOYMENT-GUIDE.md`.
