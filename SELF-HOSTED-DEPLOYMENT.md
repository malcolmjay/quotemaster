# Self-Hosted Deployment Guide
## Complete Docker Stack with Local Supabase

This guide provides complete instructions for deploying the Quote and Bid Management Tool with a self-hosted Supabase instance, all running on your internal Docker server.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Configuration](#configuration)
6. [Database Migration](#database-migration)
7. [Accessing Services](#accessing-services)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)
10. [Production Considerations](#production-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  Docker Server (Internal)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                 Nginx Reverse Proxy                     │    │
│  │              (Port 80/443 - SSL/TLS)                   │    │
│  └────────────┬───────────────────────┬───────────────────┘    │
│               │                       │                          │
│               ▼                       ▼                          │
│  ┌────────────────────┐   ┌────────────────────┐               │
│  │   Quote App        │   │   Kong Gateway     │               │
│  │   (React/Nginx)    │   │   (Port 8000)      │               │
│  │   Port 8080        │   │                    │               │
│  └────────────────────┘   └─────────┬──────────┘               │
│                                      │                           │
│              ┌───────────────────────┼───────────────────┐      │
│              │                       │                   │      │
│              ▼                       ▼                   ▼      │
│  ┌──────────────┐      ┌──────────────┐    ┌──────────────┐   │
│  │ Supabase     │      │  Supabase    │    │  Supabase    │   │
│  │ Auth         │      │  REST API    │    │  Realtime    │   │
│  │ (GoTrue)     │      │  (PostgREST) │    │              │   │
│  └──────┬───────┘      └──────┬───────┘    └──────┬───────┘   │
│         │                     │                    │            │
│         └─────────────────────┼────────────────────┘            │
│                               ▼                                 │
│                  ┌────────────────────────┐                     │
│                  │   PostgreSQL Database  │                     │
│                  │   (Supabase Postgres)  │                     │
│                  │   Port 5432            │                     │
│                  └────────────────────────┘                     │
│                                                                  │
│  ┌────────────────────┐   ┌────────────────────┐               │
│  │ Supabase Storage   │   │  Supabase Studio   │               │
│  │ (File Storage)     │   │  (Web UI)          │               │
│  │                    │   │  Port 3000         │               │
│  └────────────────────┘   └────────────────────┘               │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │   Mail Server      │                                         │
│  │   (Inbucket)       │                                         │
│  │   Port 9000        │                                         │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Total Containers: 11**
- 1x Nginx Reverse Proxy
- 1x Quote Application
- 1x PostgreSQL
- 1x Kong API Gateway
- 1x Supabase Auth
- 1x Supabase REST
- 1x Supabase Realtime
- 1x Supabase Storage
- 1x Supabase Meta
- 1x Supabase Studio
- 1x Mail Server

---

## Prerequisites

### Hardware Requirements

**Minimum:**
- 4 CPU cores
- 8GB RAM
- 50GB storage
- Docker 20.10+
- Docker Compose 2.0+

**Recommended:**
- 8 CPU cores
- 16GB RAM
- 100GB SSD storage
- Gigabit network

### Software Requirements

```bash
# Check Docker version
docker --version  # Should be 20.10+

# Check Docker Compose version
docker-compose --version  # Should be 2.0+

# Check available resources
docker system info | grep -E "CPUs|Total Memory"
```

---

## Quick Start (15 minutes)

### 1. Clone/Copy Application

```bash
cd /opt
sudo mkdir quote-app
cd quote-app

# Copy your application files here
```

### 2. Generate Secrets

```bash
# Generate PostgreSQL password
export POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Generate JWT secret
export JWT_SECRET=$(openssl rand -base64 32)

echo "Save these securely:"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "JWT_SECRET=$JWT_SECRET"
```

### 3. Create Environment File

```bash
# Copy example file
cp .env.selfhosted.example .env

# Edit with your secrets
nano .env
```

Update these values:
```bash
POSTGRES_PASSWORD=<generated-password>
JWT_SECRET=<generated-jwt-secret>
```

**Note:** The default ANON_KEY and SERVICE_ROLE_KEY in the example file will work for testing, but should be regenerated for production using your JWT_SECRET.

### 4. Start Services

```bash
# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### 5. Wait for Initialization

```bash
# Check service health (wait 2-3 minutes)
docker-compose ps

# All services should show "healthy" or "running"
```

### 6. Access Services

- **Application**: http://localhost:8080
- **Supabase Studio**: http://localhost:3000
- **Kong API**: http://localhost:8000
- **Mail UI**: http://localhost:9000

---

## Detailed Setup

### Step 1: Prepare Environment

```bash
# Create directory structure
sudo mkdir -p /opt/quote-app
cd /opt/quote-app

# Create required directories
mkdir -p supabase/config
mkdir -p supabase/migrations
mkdir -p ssl
mkdir -p logs
mkdir -p scripts
```

### Step 2: Generate Secure Keys

#### A. Generate JWT Secret

```bash
# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
```

#### B. Generate ANON_KEY (Optional - for production)

The example `.env` file includes default keys that work for development. For production, generate custom keys:

```bash
# Using online tool
# Visit: https://supabase.com/docs/guides/hosting/overview#api-keys
# Enter your JWT_SECRET and generate keys

# Or use Docker
docker run --rm supabase/gotrue generate anon $JWT_SECRET
docker run --rm supabase/gotrue generate service_role $JWT_SECRET
```

#### C. Generate PostgreSQL Password

```bash
# Generate strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
```

### Step 3: Configure Environment

Create `.env` file:

```bash
cp .env.selfhosted.example .env
```

Edit `.env` with your values:

```bash
# Database
POSTGRES_PASSWORD=your-generated-password-here

# JWT Configuration
JWT_SECRET=your-generated-jwt-secret-here

# API Keys (use generated ones or defaults)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URLs
API_EXTERNAL_URL=http://your-server-ip:8000
SITE_URL=http://your-server-ip:8080
```

### Step 4: Update Configuration Files

#### A. Update Kong Configuration

The `supabase/config/kong.yml` file references environment variables. Ensure your `.env` file is properly set.

#### B. Update Postgres Initialization

Edit `supabase/config/init.sql` and replace all instances of `your-super-secret-password` with your actual password:

```bash
sed -i "s/your-super-secret-password/$POSTGRES_PASSWORD/g" supabase/config/init.sql
```

### Step 5: Start Services

```bash
# Pull all images (first time only)
docker-compose pull

# Start services
docker-compose up -d

# Monitor startup
docker-compose logs -f postgres
# Wait for "database system is ready to accept connections"

docker-compose logs -f kong
# Wait for "Kong started"
```

### Step 6: Verify Services

```bash
# Check all containers
docker-compose ps

# Should show all services as "Up" or "healthy"

# Test Kong API
curl http://localhost:8000

# Test Studio
curl http://localhost:3000

# Test Application
curl http://localhost:8080/health
```

---

## Configuration

### Environment Variables Reference

```bash
# ============================================================================
# Required Variables
# ============================================================================

# PostgreSQL password (must match across all services)
POSTGRES_PASSWORD=your-strong-password

# JWT secret for token signing
JWT_SECRET=your-jwt-secret

# API keys
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

# ============================================================================
# Optional Variables
# ============================================================================

# External URLs
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:8080

# Email Configuration
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
DISABLE_SIGNUP=false

# SMTP (for production email)
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Nginx Proxy | 80/443 | HTTPS access to application |
| Quote App | 8080 | Direct application access |
| Kong API | 8000/8443 | Supabase API gateway |
| Studio | 3000 | Database management UI |
| PostgreSQL | 5432 | Database direct access |
| Mail UI | 9000 | Email testing interface |

---

## Database Migration

### Automatic Migration on First Start

Migrations in `supabase/migrations/` are automatically applied when PostgreSQL starts for the first time.

### Manual Migration

If you need to apply migrations manually:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres

# Apply a specific migration
\i /docker-entrypoint-initdb.d/migration_name.sql

# Exit
\q
```

### Using Supabase Studio

1. Open http://localhost:3000
2. Navigate to SQL Editor
3. Copy/paste migration content
4. Click "Run"

### Verify Migrations

```bash
# Check tables
docker-compose exec postgres psql -U postgres -c "\dt"

# Check specific table
docker-compose exec postgres psql -U postgres -c "SELECT * FROM information_schema.tables WHERE table_schema='public';"
```

---

## Accessing Services

### 1. Quote Application

**URL**: http://localhost:8080

```bash
# Create first user via UI
# Go to http://localhost:8080
# Click "Sign Up"
# Enter details

# Then promote to admin in database
docker-compose exec postgres psql -U postgres -d postgres <<EOF
INSERT INTO user_roles (user_id, email, role, is_active)
VALUES ('user-id-here', 'admin@example.com', 'Admin', true);
EOF
```

### 2. Supabase Studio (Database UI)

**URL**: http://localhost:3000

Features:
- Table editor
- SQL editor
- Auth user management
- Storage management
- API documentation

### 3. Mail Interface (Inbucket)

**URL**: http://localhost:9000

View all emails sent by the application (useful for testing signup, password reset, etc.)

### 4. Database Direct Access

```bash
# Connect via psql
docker-compose exec postgres psql -U postgres

# Or from host machine
psql postgresql://postgres:your-password@localhost:5432/postgres
```

---

## Troubleshooting

### Issue: Services won't start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs postgres
docker-compose logs kong
docker-compose logs auth

# Restart services
docker-compose down
docker-compose up -d
```

### Issue: Kong health check failing

```bash
# Check Kong config
cat supabase/config/kong.yml

# Verify environment variables
docker-compose exec kong env | grep KEY

# Restart Kong
docker-compose restart kong
```

### Issue: PostgreSQL not accepting connections

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify password
docker-compose exec postgres psql -U postgres

# Reset database (WARNING: destroys data)
docker-compose down -v
docker volume rm supabase-postgres-data
docker-compose up -d
```

### Issue: Application can't connect to Supabase

```bash
# Check Kong is accessible from app container
docker-compose exec quote-app curl http://kong:8000

# Check environment variables
docker-compose exec quote-app env | grep VITE_SUPABASE

# Rebuild application
docker-compose up -d --build quote-app
```

### Issue: Auth not working

```bash
# Check auth service logs
docker-compose logs auth

# Verify JWT secret matches across services
docker-compose exec auth env | grep JWT
docker-compose exec rest env | grep JWT

# Test auth endpoint
curl http://localhost:8000/auth/v1/health
```

---

## Maintenance

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Or with compression
docker-compose exec postgres pg_dump -U postgres postgres | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
cat backup.sql | docker-compose exec -T postgres psql -U postgres postgres

# From compressed file
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U postgres postgres
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Clean up old images
docker image prune -a
```

### Monitor Resources

```bash
# View resource usage
docker stats

# View logs
docker-compose logs -f --tail=100

# Check disk usage
docker system df
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: destroys data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

---

## Production Considerations

### 1. Security Hardening

```bash
# Change all default passwords
# Generate new JWT secrets
# Use strong POSTGRES_PASSWORD

# Disable unnecessary services
# Comment out 'mail' service if using real SMTP

# Enable firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp  # Don't expose PostgreSQL
sudo ufw deny 8000/tcp  # Don't expose Kong directly
```

### 2. SSL/TLS Configuration

```bash
# Generate certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem

# Or use company certificates
cp /path/to/company/cert.pem ssl/
cp /path/to/company/key.pem ssl/
```

### 3. Resource Limits

Add to docker-compose.yml for each service:

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### 4. Monitoring Setup

```bash
# Install monitoring tools
docker run -d \
  --name=prometheus \
  -p 9090:9090 \
  prom/prometheus

# Setup alerts
# Configure Grafana dashboards
# Enable Docker metrics
```

### 5. Backup Strategy

```bash
# Automate backups with cron
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/quote-app && docker-compose exec postgres pg_dump -U postgres postgres | gzip > /backups/quote-app-$(date +\%Y\%m\%d).sql.gz

# Retention policy (keep 30 days)
0 3 * * * find /backups -name "quote-app-*.sql.gz" -mtime +30 -delete
```

---

## Performance Tuning

### PostgreSQL

Edit postgres service in docker-compose.yml:

```yaml
postgres:
  command:
    - postgres
    - -c
    - max_connections=200
    - -c
    - shared_buffers=2GB
    - -c
    - effective_cache_size=6GB
    - -c
    - maintenance_work_mem=512MB
    - -c
    - wal_level=logical
```

### Application

```yaml
quote-app:
  deploy:
    replicas: 2  # Run multiple instances
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

---

## Useful Commands Reference

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres

# Rebuild and restart
docker-compose up -d --build

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec postgres psql -U postgres

# View resource usage
docker stats

# Clean up everything (WARNING)
docker-compose down -v --rmi all
```

---

## Migration from Cloud Supabase

If you're migrating from Supabase Cloud:

### 1. Export Data

```bash
# From Supabase Cloud
pg_dump "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" > export.sql
```

### 2. Import to Self-Hosted

```bash
# Copy file to server
scp export.sql your-server:/opt/quote-app/

# Import
cat export.sql | docker-compose exec -T postgres psql -U postgres postgres
```

### 3. Update Application

```bash
# Update .env
VITE_SUPABASE_URL=http://your-server-ip:8000
VITE_SUPABASE_ANON_KEY=your-new-anon-key

# Rebuild
docker-compose up -d --build quote-app
```

---

## Getting Help

### Check Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgres
docker-compose logs auth
docker-compose logs kong
docker-compose logs quote-app
```

### Verify Configuration

```bash
# Check environment
cat .env

# Verify services
docker-compose config

# Check network
docker network ls
docker network inspect quote-network
```

### Common Log Locations

```
- Application: docker-compose logs quote-app
- Database: docker-compose logs postgres
- Auth: docker-compose logs auth
- API: docker-compose logs rest
- Kong: docker-compose logs kong
- Nginx: ./logs/nginx/
```

---

## Success Checklist

- [ ] All 11 containers running
- [ ] PostgreSQL accepts connections
- [ ] Kong health check passes
- [ ] Studio accessible at :3000
- [ ] Application accessible at :8080
- [ ] Can create user account
- [ ] Can log in to application
- [ ] Database migrations applied
- [ ] All features working
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Documentation reviewed

---

**Version**: 1.0.0
**Last Updated**: 2025-11-16
**Status**: Production Ready for Self-Hosted Deployment ✅
