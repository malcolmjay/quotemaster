# Complete Deployment Guide - Quote and Bid Management Tool

## Deployment on Internal Docker Server

This guide provides complete instructions for deploying the Quote and Bid Management Tool on an internally hosted Docker server.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Supabase Setup](#supabase-setup)
4. [Docker Setup](#docker-setup)
5. [Application Configuration](#application-configuration)
6. [Database Migration](#database-migration)
7. [Edge Functions Deployment](#edge-functions-deployment)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Backup and Monitoring](#backup-and-monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Internal Network                          │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Nginx      │──────│   Frontend   │                    │
│  │ Reverse Proxy│      │  (React App) │                    │
│  │   Container  │      │   Container  │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                                                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────┐              │
│  │         Supabase Cloud                    │              │
│  │  ┌──────────┐  ┌──────────┐             │              │
│  │  │PostgreSQL│  │   Auth   │             │              │
│  │  │ Database │  │ Service  │             │              │
│  │  └──────────┘  └──────────┘             │              │
│  │  ┌──────────────────────────┐           │              │
│  │  │   Edge Functions         │           │              │
│  │  │  (Import APIs)           │           │              │
│  │  └──────────────────────────┘           │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

1. **Docker** (version 20.10+)
2. **Docker Compose** (version 2.0+)
3. **Git**
4. **Node.js** (version 18+ for local builds)
5. **Supabase CLI** (optional, for edge functions)

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum
- **Network**: Outbound HTTPS access to Supabase cloud

### Install Docker & Docker Compose

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## Supabase Setup

### Option 1: Use Supabase Cloud (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create account and new project
   - Note your project URL and anon key
   - Wait for project initialization (2-3 minutes)

2. **Get Your Credentials**
   ```
   Project URL: https://[your-project-ref].supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Configure Project Settings**
   - Go to Settings > API
   - Copy `URL`, `anon public` key, and `service_role` key
   - Go to Settings > Auth
   - Enable Email provider
   - Disable email confirmation (Settings > Auth > Email Auth > Confirm email: OFF)

### Option 2: Self-Hosted Supabase (Advanced)

If you need to self-host Supabase on your internal network:

```bash
# Clone Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy environment file
cp .env.example .env

# Edit .env and set your values
nano .env

# Start Supabase
docker-compose up -d

# Access at http://localhost:8000
```

**Note**: Self-hosted Supabase requires additional configuration. We recommend using Supabase Cloud for simplicity.

---

## Docker Setup

### 1. Create Project Directory Structure

```bash
# Create project directory
mkdir -p /opt/quote-app
cd /opt/quote-app

# Clone or copy your application
git clone <your-repo-url> .
# OR copy files from your development machine
```

### 2. Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Create nginx.conf

Create `nginx.conf` in project root:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 4. Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  quote-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: quote-app
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    networks:
      - quote-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Optional: Nginx reverse proxy with SSL
  nginx-proxy:
    image: nginx:alpine
    container_name: quote-nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    depends_on:
      - quote-app
    networks:
      - quote-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  quote-network:
    driver: bridge
```

### 5. Create Environment File

Create `.env.production`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Application Configuration
NODE_ENV=production

# Optional: ERP Integration (if using)
VITE_ERP_API_URL=http://your-erp-api.internal
VITE_ERP_API_KEY=your_erp_api_key
VITE_ERP_API_TIMEOUT=10000
VITE_ERP_API_RETRY_ATTEMPTS=3
```

**IMPORTANT**: Never commit `.env.production` to version control. Add it to `.gitignore`.

### 6. Create .dockerignore

Create `.dockerignore` in project root:

```
node_modules
dist
.git
.env
.env.local
.env.development
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.md
!README.md
.vscode
.idea
```

---

## Application Configuration

### 1. Update vite.config.ts for Production

Ensure `vite.config.ts` is configured correctly:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
})
```

### 2. Create nginx-proxy.conf (for SSL/reverse proxy)

Create `nginx-proxy.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=app_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;

    upstream quote_app {
        server quote-app:80;
    }

    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name quote-app.internal.company.com;

        # Allow health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
        }

        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name quote-app.internal.company.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Rate limiting
        limit_req zone=app_limit burst=20 nodelay;

        # Proxy settings
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_buffering off;

        # Proxy to application
        location / {
            proxy_pass http://quote_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://quote_app/health;
        }
    }
}
```

---

## Database Migration

### 1. Install Supabase CLI (Optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Or use npx
npx supabase --help
```

### 2. Apply Migrations via Supabase Dashboard

**Recommended Method**:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Apply migrations in order:

```bash
# List all migrations
ls supabase/migrations/*.sql

# Output:
# 20250911210238_autumn_bridge.sql
# 20250912131544_muddy_block.sql
# ... (all other migrations)
# optimize_pending_approvals_query.sql
```

4. Copy content of each migration file
5. Paste into SQL Editor
6. Click "Run"
7. Verify success

### 3. Automated Migration Script

Create `scripts/migrate.sh`:

```bash
#!/bin/bash

# Load environment variables
source .env.production

# Supabase credentials
SUPABASE_URL=$VITE_SUPABASE_URL
SUPABASE_KEY=$VITE_SUPABASE_ANON_KEY

echo "Starting database migrations..."

# Array of migration files in order
MIGRATIONS=(
  "supabase/migrations/20250911210238_autumn_bridge.sql"
  "supabase/migrations/20250912131544_muddy_block.sql"
  "supabase/migrations/20250912171028_small_gate.sql"
  "supabase/migrations/20250918172933_raspy_spring.sql"
  "supabase/migrations/20250918172956_warm_pine.sql"
  "supabase/migrations/20250918184302_plain_sun.sql"
  "supabase/migrations/20250918190725_floating_term.sql"
  "supabase/migrations/20250918191138_copper_tower.sql"
  "supabase/migrations/20250918191334_soft_night.sql"
  "supabase/migrations/20250919153122_shiny_ocean.sql"
  "supabase/migrations/20250919153547_lingering_dew.sql"
  "supabase/migrations/20250919153854_green_firefly.sql"
  "supabase/migrations/20250919154228_wandering_mud.sql"
  "supabase/migrations/20251003115002_create_price_requests_table.sql"
  "supabase/migrations/20251003115142_add_price_request_reference_to_line_items.sql"
  "supabase/migrations/20251003134253_create_sales_orders.sql"
  "supabase/migrations/20251003143946_add_order_line_fields.sql"
  "supabase/migrations/20251004010731_enhance_sales_orders_with_ebs_fields.sql"
  "supabase/migrations/20251022000003_create_app_configurations.sql"
  "supabase/migrations/20251022000005_add_import_api_auth.sql"
  "supabase/migrations/20251106134814_add_product_fields.sql"
  "supabase/migrations/20251106143830_add_cross_references_fields.sql"
  "supabase/migrations/20251106144734_make_customer_part_number_optional.sql"
  "supabase/migrations/20251106145156_link_internal_part_number_to_product_sku.sql"
  "supabase/migrations/20251106151000_create_item_relationships.sql"
  "supabase/migrations/20251106155814_add_price_request_fields.sql"
  "supabase/migrations/20251106161011_add_supplier_email_to_products.sql"
  "supabase/migrations/20251106162207_remove_sales_order_references.sql"
  "supabase/migrations/20251106162224_drop_sales_orders_tables.sql"
  "supabase/migrations/20251106165659_fix_approval_trigger_upsert.sql"
  "supabase/migrations/20251106172625_update_quotes_rls_view_all.sql"
  "supabase/migrations/20251106172646_update_quote_line_items_rls_view_all.sql"
  "supabase/migrations/20251106181141_create_user_roles_management_v2.sql"
  "supabase/migrations/20251106181703_add_admin_role_to_enum.sql"
  "supabase/migrations/20251106182724_add_cross_ref_import_api_config.sql"
  "supabase/migrations/20251106183543_create_customer_addresses_table.sql"
  "supabase/migrations/20251106183610_remove_address_fields_from_customers.sql"
  "supabase/migrations/20251106184016_add_sales_fields_to_customers.sql"
  "supabase/migrations/20251106195551_create_customer_contacts_table.sql"
  "supabase/migrations/20251106195620_migrate_primary_contact_data.sql"
  "supabase/migrations/20251106195649_remove_primary_contact_from_customers.sql"
  "supabase/migrations/20251106201212_add_customer_addresses_foreign_key.sql"
  "supabase/migrations/20251106205715_add_warehouse_fields_to_customer_addresses.sql"
  "supabase/migrations/20251106212814_add_inventory_item_id_to_products.sql"
  "supabase/migrations/20251106213244_add_ordered_item_id_to_cross_references.sql"
  "supabase/migrations/20251106213735_add_erp_ids_to_quote_line_items.sql"
  "supabase/migrations/20251106221712_add_customer_import_api_config.sql"
  "supabase/migrations/20251108235526_create_role_approval_limits.sql"
  "supabase/migrations/20251109010305_add_cost_effective_dates_to_quote_line_items.sql"
  "supabase/migrations/20251109012803_fix_price_requests_update_policy.sql"
  "supabase/migrations/20251109012851_fix_quote_line_items_update_policy.sql"
  "supabase/migrations/20251115181749_add_email_to_user_roles.sql"
  "supabase/migrations/20251115210504_add_user_metadata_table.sql"
  "supabase/migrations/20251115215103_fix_overly_permissive_rls_policies.sql"
  "supabase/migrations/20251115215442_fix_user_profiles_view_security.sql"
  "supabase/migrations/20251115222727_fix_user_profiles_with_security_definer_function.sql"
  "supabase/migrations/20251116032917_optimize_pending_approvals_query.sql"
  "supabase/migrations/optimize_pending_approvals_query.sql"
)

# Execute each migration
for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo "Applying migration: $migration"
    # Note: This requires PostgreSQL client or REST API call
    # For production, use Supabase Dashboard instead
    echo "Please apply this migration manually via Supabase Dashboard"
  else
    echo "Warning: Migration file not found: $migration"
  fi
done

echo "Migration script completed. Please verify in Supabase Dashboard."
```

Make executable:
```bash
chmod +x scripts/migrate.sh
```

---

## Edge Functions Deployment

### Method 1: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all edge functions
supabase functions deploy import-products
supabase functions deploy import-customers
supabase functions deploy import-cross-references

# Verify deployment
supabase functions list
```

### Method 2: Via Supabase Dashboard

1. Go to Edge Functions in Supabase Dashboard
2. Click "New Function"
3. Name: `import-products`
4. Copy content from `supabase/functions/import-products/index.ts`
5. Include shared files:
   - `_shared/auth-middleware.ts`
   - `_shared/rate-limiter.ts`
6. Click "Deploy"
7. Repeat for other functions

### Configure Edge Function Secrets

```bash
# Set secrets for edge functions
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Verify secrets
supabase secrets list
```

---

## SSL/TLS Configuration

### Generate Self-Signed Certificate (for testing)

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Company/CN=quote-app.internal.company.com"
```

### Use Company CA Certificate (recommended for production)

```bash
# Copy your company-issued certificates
cp /path/to/company/cert.pem ssl/cert.pem
cp /path/to/company/key.pem ssl/key.pem

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
```

---

## Build and Deploy

### 1. Build the Application

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Verify build
ls -la dist/
```

### 2. Build Docker Image

```bash
# Build the image
docker-compose build

# Or build manually
docker build -t quote-app:latest .
```

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f quote-app

# Check health
curl http://localhost:8080/health
```

### 4. Verify Deployment

```bash
# Check if application is running
docker ps | grep quote-app

# Test the application
curl -I http://localhost:8080

# Test with SSL (if configured)
curl -k -I https://localhost:443
```

---

## Post-Deployment Configuration

### 1. Create Initial Admin User

```sql
-- Run in Supabase SQL Editor
-- First, sign up a user via the application UI
-- Then promote them to Admin

-- Find the user
SELECT id, email FROM auth.users WHERE email = 'admin@company.com';

-- Add Admin role
INSERT INTO user_roles (user_id, email, role, is_active)
VALUES (
  'user-id-from-above',
  'admin@company.com',
  'Admin',
  true
);
```

### 2. Configure Import API Authentication

```sql
-- Set import API credentials
INSERT INTO app_configurations (config_key, config_value, description)
VALUES
  ('import_api_enabled', 'true', 'Enable import API authentication'),
  ('import_api_username', 'api_user', 'Import API username'),
  ('import_api_password', 'your-secure-password', 'Import API password'),
  ('customer_import_api_enabled', 'true', 'Enable customer import API authentication'),
  ('customer_import_api_username', 'api_user', 'Customer import API username'),
  ('customer_import_api_password', 'your-secure-password', 'Customer import API password');
```

### 3. Configure Approval Limits

```sql
-- Set approval limits by role
INSERT INTO role_approval_limits (role, min_amount, max_amount)
VALUES
  ('CSR', 0, 25000),
  ('Manager', 25000, 50000),
  ('Director', 50000, 200000),
  ('VP', 200000, 300000),
  ('President', 300000, 999999999);
```

---

## Backup and Monitoring

### 1. Database Backups

Supabase Cloud automatically backs up your database. To create manual backups:

```bash
# Using pg_dump (requires PostgreSQL client)
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" > backup.sql

# Restore from backup
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" < backup.sql
```

### 2. Application Logs

```bash
# View application logs
docker-compose logs -f quote-app

# Save logs to file
docker-compose logs quote-app > logs/app-$(date +%Y%m%d).log

# View nginx logs
docker-compose exec nginx-proxy tail -f /var/log/nginx/access.log
docker-compose exec nginx-proxy tail -f /var/log/nginx/error.log
```

### 3. Health Monitoring Script

Create `scripts/monitor.sh`:

```bash
#!/bin/bash

# Health check URL
HEALTH_URL="http://localhost:8080/health"

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
  echo "[$(date)] Application is healthy"
else
  echo "[$(date)] Application is unhealthy - Status: $response"
  # Send alert (configure your alerting system)
  # docker-compose restart quote-app
fi

# Check disk space
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
  echo "[$(date)] Warning: Disk usage is at ${disk_usage}%"
fi

# Check docker containers
if ! docker ps | grep -q quote-app; then
  echo "[$(date)] Error: quote-app container is not running"
  docker-compose up -d quote-app
fi
```

Add to crontab:
```bash
# Run health check every 5 minutes
*/5 * * * * /opt/quote-app/scripts/monitor.sh >> /var/log/quote-app-monitor.log 2>&1
```

### 4. Log Rotation

Create `/etc/logrotate.d/quote-app`:

```
/opt/quote-app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker-compose -f /opt/quote-app/docker-compose.yml restart nginx-proxy > /dev/null 2>&1 || true
    endscript
}
```

---

## Updating the Application

### 1. Pull Latest Changes

```bash
cd /opt/quote-app
git pull origin main
```

### 2. Rebuild and Deploy

```bash
# Stop current containers
docker-compose down

# Rebuild image
docker-compose build

# Start updated application
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f quote-app
```

### 3. Zero-Downtime Update (Blue-Green)

```bash
# Build new version
docker build -t quote-app:v2 .

# Start new container on different port
docker run -d -p 8081:80 --name quote-app-v2 quote-app:v2

# Test new version
curl http://localhost:8081/health

# Update nginx to point to new version
# Update docker-compose.yml to use v2

# Switch traffic
docker-compose up -d

# Remove old container
docker stop quote-app-v1
docker rm quote-app-v1
```

---

## Troubleshooting

### Issue: Container won't start

```bash
# Check container logs
docker-compose logs quote-app

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Can't connect to Supabase

```bash
# Test Supabase connection
curl https://your-project-ref.supabase.co/rest/v1/

# Check environment variables
docker-compose exec quote-app env | grep SUPABASE

# Verify .env.production
cat .env.production
```

### Issue: 502 Bad Gateway

```bash
# Check if app container is running
docker ps | grep quote-app

# Check nginx proxy logs
docker-compose logs nginx-proxy

# Test direct connection to app
curl http://localhost:8080/health

# Restart services
docker-compose restart
```

### Issue: Database migrations failed

```bash
# Check Supabase logs in dashboard
# Re-run failed migration manually

# Verify schema
# Go to Supabase Dashboard > Database > Tables
```

### Issue: High memory usage

```bash
# Check container resource usage
docker stats

# Limit container resources in docker-compose.yml
services:
  quote-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## Security Best Practices

### 1. Change Default Passwords

```bash
# Update all default passwords in app_configurations
# Change import API passwords
# Rotate Supabase service role key periodically
```

### 2. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Block direct access to application port
sudo ufw deny 8080/tcp
```

### 3. Regular Updates

```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Update OS packages
sudo apt update && sudo apt upgrade -y
```

### 4. Audit Logs

```bash
# Enable audit logging in Supabase
# Monitor user access patterns
# Review logs regularly
```

---

## Production Checklist

- [ ] Supabase project created and configured
- [ ] All migrations applied successfully
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Docker containers running
- [ ] Health checks passing
- [ ] Initial admin user created
- [ ] Import API configured
- [ ] Approval limits set
- [ ] Backup system configured
- [ ] Monitoring setup complete
- [ ] Firewall rules configured
- [ ] Documentation reviewed
- [ ] Team trained on system

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check health status
- Review error rates

**Weekly:**
- Review database performance
- Check disk space
- Update Docker images

**Monthly:**
- Review and rotate logs
- Database backup verification
- Security audit
- Performance review

### Getting Help

- Check application logs: `docker-compose logs -f`
- Review Supabase logs in dashboard
- Check database performance in Supabase dashboard
- Review this deployment guide

---

## Appendix

### A. Complete File Structure

```
/opt/quote-app/
├── src/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   ├── import-products/
│   │   ├── import-customers/
│   │   └── import-cross-references/
│   └── migrations/
├── public/
├── dist/ (generated)
├── ssl/
│   ├── cert.pem
│   └── key.pem
├── logs/
├── scripts/
│   ├── migrate.sh
│   └── monitor.sh
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── nginx-proxy.conf
├── .env.production
├── .dockerignore
├── package.json
└── DEPLOYMENT-GUIDE.md
```

### B. Useful Commands Reference

```bash
# Docker
docker-compose up -d                 # Start services
docker-compose down                  # Stop services
docker-compose ps                    # List containers
docker-compose logs -f [service]     # View logs
docker-compose restart [service]     # Restart service
docker-compose build --no-cache      # Rebuild image

# Health checks
curl http://localhost:8080/health    # Check app health
docker stats                         # Resource usage
docker inspect quote-app             # Container details

# Database
supabase db push                     # Push migrations
supabase db pull                     # Pull schema
supabase db reset                    # Reset database

# Edge Functions
supabase functions deploy [name]     # Deploy function
supabase functions list              # List functions
supabase functions logs [name]       # View function logs
```

---

**End of Deployment Guide**

For questions or issues, refer to the troubleshooting section or check application logs.
