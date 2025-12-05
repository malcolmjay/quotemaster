# Local Docker Hosting Guide

Complete guide for hosting the Quote Management application locally using Docker.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Overview

This application uses Docker Compose to run a complete stack including:

- **Frontend Application**: React app served via Nginx
- **Supabase Infrastructure** (self-hosted):
  - PostgreSQL Database
  - GoTrue (Authentication)
  - PostgREST (REST API)
  - Realtime Server
  - Storage API
  - Kong API Gateway
  - Supabase Studio (Database UI)
  - Inbucket (Email testing)

**Total Containers**: 11 services running in an isolated Docker network

---

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **RAM**: Minimum 4GB, recommended 8GB
- **CPU**: 2+ cores
- **Disk Space**: 20GB free
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

### Install Docker

#### Ubuntu/Debian
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
```

#### macOS
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or use Homebrew:
brew install --cask docker
```

#### Windows
```bash
# Install Docker Desktop with WSL2 backend
# Download from https://www.docker.com/products/docker-desktop
```

### Verify Installation
```bash
docker --version
docker-compose --version
```

---

## Quick Start

### Option 1: Automated Setup (Recommended)

1. **Navigate to project directory**
   ```bash
   cd /path/to/quote-app
   ```

2. **Run automated setup script**
   ```bash
   chmod +x scripts/setup-selfhosted.sh
   sudo ./scripts/setup-selfhosted.sh
   ```

   This script will:
   - Check prerequisites
   - Generate secure secrets
   - Create configuration files
   - Start all services
   - Initialize database
   - Apply migrations

3. **Wait for completion** (2-5 minutes)

4. **Access the application**
   - Application: http://localhost:8080
   - Supabase Studio: http://localhost:3000
   - Mail UI: http://localhost:9000

### Option 2: Quick Manual Start

```bash
# 1. Copy environment file
cp .env.selfhosted.example .env

# 2. Generate secure passwords
export POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
export JWT_SECRET=$(openssl rand -base64 64 | tr -d "\n")

# 3. Update .env file with generated passwords
# Edit .env and replace POSTGRES_PASSWORD and JWT_SECRET

# 4. Start all services
docker-compose up -d

# 5. Wait for services to be ready
docker-compose ps

# 6. Initialize database
docker exec -i supabase-postgres psql -U postgres -d postgres < supabase/config/init.sql

# 7. Apply migrations
./scripts/migrate-db.sh apply -y

# 8. Access application at http://localhost:8080
```

---

## Manual Setup

### Step 1: Prepare Environment

```bash
# Create project directory
mkdir -p ~/quote-app
cd ~/quote-app

# Copy project files here
```

### Step 2: Generate Secure Secrets

```bash
# Generate PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "PostgreSQL Password: $POSTGRES_PASSWORD"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "\n")
echo "JWT Secret: $JWT_SECRET"

# Save these - you'll need them for the .env file
```

### Step 3: Generate JWT Keys

You need to generate ANON_KEY and SERVICE_ROLE_KEY using your JWT_SECRET:

```bash
# Option 1: Use Supabase JWT generator (requires Node.js)
npm install -g @supabase/cli
supabase gen jwt --secret "$JWT_SECRET" --role anon --exp 1799535600
supabase gen jwt --secret "$JWT_SECRET" --role service_role --exp 1799535600

# Option 2: Use online tool
# Visit https://supabase.com/docs/guides/hosting/overview#api-keys
# Enter your JWT_SECRET and generate both keys
```

### Step 4: Create Environment File

```bash
# Copy example file
cp .env.selfhosted.example .env

# Edit the file
nano .env
```

Update these critical values:
```bash
POSTGRES_PASSWORD=your-generated-password-here
JWT_SECRET=your-generated-jwt-secret-here
ANON_KEY=your-generated-anon-key-here
SERVICE_ROLE_KEY=your-generated-service-key-here
```

### Step 5: Create SSL Certificates (for HTTPS)

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/CN=localhost"

# For production, use your company's SSL certificates:
# cp /path/to/your-cert.pem ssl/cert.pem
# cp /path/to/your-key.pem ssl/key.pem
```

### Step 6: Start Services

```bash
# Pull all Docker images
docker-compose pull

# Start infrastructure services first
docker-compose up -d postgres kong auth rest realtime storage meta mail studio

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
sleep 15

# Check PostgreSQL is ready
docker exec supabase-postgres pg_isready -U postgres

# Initialize database schema
docker exec -i supabase-postgres psql -U postgres -d postgres < supabase/config/init.sql

# Apply all migrations
chmod +x scripts/migrate-db.sh
./scripts/migrate-db.sh apply -y

# Start application and proxy
docker-compose up -d quote-app nginx-proxy
```

### Step 7: Verify Installation

```bash
# Check all services are running
docker-compose ps

# Check health status
./scripts/docker-health.sh

# View logs
docker-compose logs -f
```

---

## Configuration

### Environment Variables

Key variables in `.env`:

#### Database
```bash
POSTGRES_PASSWORD=your-secure-password
```

#### JWT & Auth
```bash
JWT_SECRET=your-jwt-secret
ANON_KEY=your-anon-jwt-token
SERVICE_ROLE_KEY=your-service-role-token
JWT_EXPIRY=3600
```

#### URLs
```bash
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:8080
```

#### Email
```bash
ENABLE_EMAIL_AUTOCONFIRM=true  # Set to false in production
SMTP_HOST=mail
SMTP_PORT=2500
```

#### Optional: ERP Integration
```bash
VITE_ERP_API_URL=http://your-erp-system/api
VITE_ERP_API_KEY=your-erp-api-key
```

### Port Configuration

Default ports used:

| Service | Port | Purpose |
|---------|------|---------|
| Application | 8080 | Main web application |
| Nginx Proxy | 80, 443 | HTTP/HTTPS reverse proxy |
| Supabase API | 8000 | REST API & Auth |
| Supabase Studio | 3000 | Database management UI |
| PostgreSQL | 5432 | Database (internal) |
| Mail UI | 9000 | Email testing interface |

To change ports, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 8080 to your desired port
```

### SSL/HTTPS Configuration

#### Development (Self-Signed)
Already configured with generated self-signed certificates.

#### Production (Company Certificates)
```bash
# Copy your certificates
cp /path/to/company-cert.pem ssl/cert.pem
cp /path/to/company-key.pem ssl/key.pem

# Set proper permissions
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem

# Restart proxy
docker-compose restart nginx-proxy
```

---

## Usage

### Starting the Application

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres quote-app

# Start with logs visible
docker-compose up
```

### Stopping the Application

```bash
# Stop all services (preserves data)
docker-compose stop

# Stop and remove containers (preserves data in volumes)
docker-compose down

# Stop and remove everything including data (DANGEROUS)
docker-compose down -v
```

### Accessing Services

#### Main Application
```bash
# Open in browser
open http://localhost:8080

# Or with curl
curl http://localhost:8080
```

#### Supabase Studio (Database UI)
```bash
# Access at http://localhost:3000
# Use SERVICE_ROLE_KEY from .env to login
```

#### PostgreSQL Direct Access
```bash
# Using psql
docker exec -it supabase-postgres psql -U postgres -d postgres

# Run SQL query
docker exec -i supabase-postgres psql -U postgres -d postgres -c "SELECT version();"

# Import SQL file
docker exec -i supabase-postgres psql -U postgres -d postgres < backup.sql
```

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f quote-app
docker-compose logs -f postgres
docker-compose logs -f auth

# Last 100 lines
docker-compose logs --tail=100 quote-app
```

### Creating First User

#### Option 1: Via Application UI
1. Navigate to http://localhost:8080
2. Click "Register" or "Sign Up"
3. Fill in email and password
4. User is created immediately (auto-confirm enabled)

#### Option 2: Via Database
```bash
docker exec -i supabase-postgres psql -U postgres -d postgres <<EOF
-- Create user in auth.users table
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@example.com', crypt('your-password', gen_salt('bf')));
EOF
```

### Assigning Roles

```bash
# Access database
docker exec -it supabase-postgres psql -U postgres -d postgres

# Assign admin role
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'Admin', true FROM auth.users WHERE email = 'admin@example.com';
```

---

## Troubleshooting

### Services Won't Start

**Check Docker daemon:**
```bash
sudo systemctl status docker
sudo systemctl start docker
```

**Check disk space:**
```bash
df -h
docker system df
```

**Check memory:**
```bash
free -m
```

**View error logs:**
```bash
docker-compose logs
```

### Database Connection Errors

**Test PostgreSQL:**
```bash
docker exec supabase-postgres pg_isready -U postgres
```

**Check credentials:**
```bash
# Verify POSTGRES_PASSWORD in .env matches docker-compose.yml
grep POSTGRES_PASSWORD .env
```

**Restart PostgreSQL:**
```bash
docker-compose restart postgres
```

### Application Not Accessible

**Check container status:**
```bash
docker-compose ps
```

**Check application logs:**
```bash
docker-compose logs quote-app
```

**Test local connectivity:**
```bash
curl http://localhost:8080
```

**Check firewall:**
```bash
sudo ufw status
sudo ufw allow 8080/tcp
```

### Migration Failures

**Check migration status:**
```bash
./scripts/migrate-db.sh status
```

**View PostgreSQL logs:**
```bash
docker logs supabase-postgres
```

**Reset and reapply migrations:**
```bash
# Backup first!
./scripts/migrate-db.sh backup

# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10

# Reapply migrations
./scripts/migrate-db.sh apply -y
```

### Port Already in Use

```bash
# Find process using port 8080
sudo lsof -i :8080
sudo netstat -tulpn | grep 8080

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### Out of Memory Errors

```bash
# Check Docker memory limit
docker info | grep Memory

# Increase Docker memory (Docker Desktop)
# Settings > Resources > Memory > 8GB

# Check container memory usage
docker stats
```

---

## Maintenance

### Database Backups

#### Manual Backup
```bash
# Using script
./scripts/migrate-db.sh backup

# Manual backup
docker exec supabase-postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker exec supabase-postgres pg_dump -U postgres postgres | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### Automated Backups
```bash
# Create backup script
cat > ~/backup-quote-app.sh <<'EOF'
#!/bin/bash
cd ~/quote-app
./scripts/migrate-db.sh backup
find ./backups -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x ~/backup-quote-app.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * ~/backup-quote-app.sh
```

#### Restore from Backup
```bash
# Using script
./scripts/migrate-db.sh restore /path/to/backup.sql.gz

# Manual restore
gunzip < backup.sql.gz | docker exec -i supabase-postgres psql -U postgres -d postgres
```

### Updating the Application

```bash
# 1. Backup database
./scripts/migrate-db.sh backup

# 2. Stop services
docker-compose down

# 3. Pull latest code
git pull origin main
# Or copy updated files

# 4. Rebuild application
docker-compose build --no-cache quote-app

# 5. Apply new migrations
./scripts/migrate-db.sh apply -y

# 6. Start services
docker-compose up -d

# 7. Verify
./scripts/docker-health.sh
```

### Monitoring

#### Check Service Health
```bash
# Using script
./scripts/docker-health.sh

# Manual checks
docker-compose ps
docker-compose logs --tail=50
```

#### Monitor Resources
```bash
# Real-time stats
docker stats

# Disk usage
docker system df
docker volume ls
```

#### View Application Logs
```bash
# Live logs
docker-compose logs -f quote-app

# Nginx access logs
docker exec quote-nginx-proxy tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec quote-nginx-proxy tail -f /var/log/nginx/error.log
```

### Cleanup

#### Remove Unused Resources
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes (CAREFUL - this deletes data)
docker volume prune

# Clean everything (DANGEROUS)
docker system prune -a --volumes
```

#### Clean Rebuild
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose rm -f
docker images | grep quote-app | awk '{print $3}' | xargs docker rmi -f

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## Advanced Configuration

### Custom Network Configuration

Edit `docker-compose.yml`:
```yaml
networks:
  quote-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### Resource Limits

Edit `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### External Database

To use external PostgreSQL instead of containerized:

1. Update `.env`:
```bash
POSTGRES_HOST=external-db.example.com
POSTGRES_PORT=5432
```

2. Comment out `postgres` service in `docker-compose.yml`

3. Update connection strings in other services

---

## Security Checklist

- [ ] Change default POSTGRES_PASSWORD
- [ ] Generate unique JWT_SECRET
- [ ] Generate proper ANON_KEY and SERVICE_ROLE_KEY
- [ ] Use company SSL certificates (not self-signed)
- [ ] Set ENABLE_EMAIL_AUTOCONFIRM=false in production
- [ ] Configure proper SMTP for production emails
- [ ] Set up firewall rules
- [ ] Restrict Supabase Studio access (port 3000)
- [ ] Enable automated backups
- [ ] Set up log rotation
- [ ] Review RLS policies
- [ ] Update Docker images regularly

---

## Common Commands Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart single service
docker-compose restart quote-app

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Execute command in container
docker exec -it supabase-postgres bash

# Database access
docker exec -it supabase-postgres psql -U postgres

# Backup database
./scripts/migrate-db.sh backup

# Apply migrations
./scripts/migrate-db.sh apply

# Health check
./scripts/docker-health.sh

# Monitor resources
docker stats

# Clean up
docker system prune
```

---

## Next Steps

After successful setup:

1. Access application at http://localhost:8080
2. Create admin user
3. Assign roles via Supabase Studio
4. Configure ERP integration (if needed)
5. Import initial data
6. Set up automated backups
7. Configure production settings

---

## Support Resources

- Detailed deployment: `SELF-HOSTED-DEPLOYMENT.md`
- Database setup: `DATABASE-SETUP-GUIDE.md`
- API documentation: `CUSTOMER-IMPORT-API-GUIDE.md`
- Security audit: `SECURITY-AUDIT-REPORT.md`
- Quick start: `SELF-HOSTED-QUICKSTART.md`

## Scripts

All helper scripts in `scripts/` directory:
- `setup-selfhosted.sh` - Automated setup
- `migrate-db.sh` - Database migrations
- `docker-health.sh` - Health monitoring
- `deploy.sh` - Deployment automation
- `monitor.sh` - System monitoring
