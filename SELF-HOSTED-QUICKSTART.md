# Self-Hosted Supabase Quick Start Guide

This guide provides a streamlined process to deploy the Quote Management Tool with self-hosted Supabase on your internal Docker server.

## Prerequisites

Before starting, ensure you have:

- Linux server (Ubuntu 20.04+ or similar)
- Docker 20.10+ installed
- Docker Compose 1.29+ installed
- Minimum 4GB RAM, 2 CPU cores
- 20GB free disk space
- Root or sudo access

## Quick Start (5 Minutes)

### 1. Clone or Copy Project

```bash
# Copy project to server
scp -r ./quote-app user@your-server:/tmp/

# Or clone from repository
git clone <your-repo-url> /tmp/quote-app
```

### 2. Run Automated Setup

```bash
# Navigate to scripts directory
cd /tmp/quote-app/scripts

# Make scripts executable
chmod +x *.sh

# Run automated setup (requires sudo)
sudo ./setup-selfhosted.sh
```

The setup script will:
- Check all prerequisites
- Generate secure JWT secrets and API keys
- Create directory structure at `/opt/quote-app`
- Generate environment configuration
- Create SSL certificates
- Start all Supabase services (11 containers)
- Initialize database with schema
- Apply all migrations
- Start the application
- Run health checks

### 3. Access the Application

After setup completes (2-5 minutes), access:

- **Application**: http://localhost:8080
- **Supabase Studio**: http://localhost:3000
- **API Documentation**: http://localhost:8000
- **Mail UI (Testing)**: http://localhost:9000

### 4. Create First User

1. Navigate to http://localhost:8080
2. Click "Sign Up" or register via API
3. Use the application immediately (email confirmation disabled by default)

## Manual Setup (If Preferred)

### Step 1: Install Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt-get install docker-compose

# Install OpenSSL
sudo apt-get install openssl
```

### Step 2: Prepare Environment

```bash
# Create application directory
sudo mkdir -p /opt/quote-app
cd /opt/quote-app

# Copy project files
sudo rsync -av /tmp/quote-app/ .

# Create required directories
sudo mkdir -p logs ssl supabase/config backups
```

### Step 3: Generate Secrets

```bash
# Generate PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Generate JWT secret (requires Node.js for proper JWT generation)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "\n")

# For production, use proper JWT signing to generate ANON_KEY and SERVICE_ROLE_KEY
# See documentation for details
```

### Step 4: Create Environment File

```bash
sudo nano /opt/quote-app/.env
```

Copy from `.env.selfhosted.example` and update with your generated secrets.

### Step 5: Start Services

```bash
cd /opt/quote-app

# Pull images
sudo docker-compose pull

# Start Supabase infrastructure
sudo docker-compose up -d postgres kong auth rest realtime storage meta mail studio

# Wait for services to start
sleep 10

# Initialize database
sudo docker exec -i supabase-postgres psql -U postgres -d postgres < ./supabase/config/init.sql

# Apply migrations
sudo ./scripts/migrate-db.sh apply -y

# Start application
sudo docker-compose up -d quote-app nginx-proxy
```

## Verification

### Check Service Status

```bash
# Run comprehensive health check
sudo /opt/quote-app/scripts/docker-health.sh

# Check individual services
docker-compose -f /opt/quote-app/docker-compose.yml ps

# View logs
docker-compose -f /opt/quote-app/docker-compose.yml logs -f
```

### Test Connectivity

```bash
# Test application
curl http://localhost:8080

# Test Supabase API
curl http://localhost:8000/rest/v1/

# Test PostgreSQL
docker exec supabase-postgres pg_isready -U postgres
```

## Common Tasks

### View Logs

```bash
# All services
docker-compose -f /opt/quote-app/docker-compose.yml logs -f

# Specific service
docker-compose -f /opt/quote-app/docker-compose.yml logs -f quote-app
docker-compose -f /opt/quote-app/docker-compose.yml logs -f postgres
docker-compose -f /opt/quote-app/docker-compose.yml logs -f auth
```

### Restart Services

```bash
# Restart all services
docker-compose -f /opt/quote-app/docker-compose.yml restart

# Restart specific service
docker-compose -f /opt/quote-app/docker-compose.yml restart quote-app
```

### Stop/Start Services

```bash
# Stop all services
docker-compose -f /opt/quote-app/docker-compose.yml down

# Start all services
docker-compose -f /opt/quote-app/docker-compose.yml up -d
```

### Database Management

```bash
# Check migration status
/opt/quote-app/scripts/migrate-db.sh status

# Apply new migrations
/opt/quote-app/scripts/migrate-db.sh apply

# Create database backup
/opt/quote-app/scripts/migrate-db.sh backup

# Restore from backup
/opt/quote-app/scripts/migrate-db.sh restore
```

### Access Database Directly

```bash
# Using psql
docker exec -it supabase-postgres psql -U postgres -d postgres

# Or via Supabase Studio
# Navigate to http://localhost:3000
# Use SERVICE_ROLE_KEY from .env file
```

## Configuration

### Environment Variables

Key environment variables in `/opt/quote-app/.env`:

```bash
# PostgreSQL
POSTGRES_PASSWORD=<your-secure-password>

# JWT Configuration
JWT_SECRET=<your-jwt-secret>
ANON_KEY=<generated-anon-jwt>
SERVICE_ROLE_KEY=<generated-service-jwt>

# URLs
VITE_SUPABASE_URL=http://localhost:8000
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:8080

# Email
ENABLE_EMAIL_AUTOCONFIRM=true  # Set to false for production
```

### SSL Certificates

Replace self-signed certificates with company-issued ones:

```bash
# Copy your certificates
sudo cp your-cert.pem /opt/quote-app/ssl/cert.pem
sudo cp your-key.pem /opt/quote-app/ssl/key.pem

# Set permissions
sudo chmod 644 /opt/quote-app/ssl/cert.pem
sudo chmod 600 /opt/quote-app/ssl/key.pem

# Restart nginx
docker-compose -f /opt/quote-app/docker-compose.yml restart nginx-proxy
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Supabase Studio (optional, restrict to internal network)
sudo ufw allow from 192.168.0.0/16 to any port 3000

# Enable firewall
sudo ufw enable
```

## Maintenance

### Regular Backups

Set up automated database backups:

```bash
# Create backup script
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/quote-app/scripts/migrate-db.sh backup

# Keep last 30 days
0 3 * * * find /opt/quote-app/backups -name "backup_*.sql.gz" -mtime +30 -delete
```

### Update Application

```bash
# Stop services
docker-compose -f /opt/quote-app/docker-compose.yml down

# Backup database
/opt/quote-app/scripts/migrate-db.sh backup

# Pull latest code
cd /opt/quote-app
git pull origin main  # or copy new files

# Rebuild application
docker-compose -f /opt/quote-app/docker-compose.yml build --no-cache

# Apply new migrations
/opt/quote-app/scripts/migrate-db.sh apply

# Start services
docker-compose -f /opt/quote-app/docker-compose.yml up -d
```

### Monitor Resources

```bash
# Check container resources
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker-compose -f /opt/quote-app/docker-compose.yml logs

# Check disk space
df -h

# Check memory
free -m
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker exec supabase-postgres pg_isready -U postgres

# Check PostgreSQL logs
docker logs supabase-postgres

# Test connection
docker exec -it supabase-postgres psql -U postgres -d postgres -c "SELECT version();"
```

### Application Not Accessible

```bash
# Check if containers are running
docker ps

# Check nginx logs
docker logs quote-nginx-proxy

# Check application logs
docker logs quote-app

# Test local connectivity
curl http://localhost:8080
```

### Migration Failures

```bash
# Check migration status
/opt/quote-app/scripts/migrate-db.sh status

# View PostgreSQL logs
docker logs supabase-postgres

# Restore from backup if needed
/opt/quote-app/scripts/migrate-db.sh restore
```

## Security Hardening

### Change Default Passwords

```bash
# Edit .env file
sudo nano /opt/quote-app/.env

# Update POSTGRES_PASSWORD
# Regenerate JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY

# Restart services
docker-compose -f /opt/quote-app/docker-compose.yml restart
```

### Restrict Network Access

```bash
# Bind services to localhost only (edit docker-compose.yml)
# Change port mappings from "8080:80" to "127.0.0.1:8080:80"

# Use reverse proxy for external access
# Configure firewall rules
# Use VPN for administrative access
```

### Regular Security Updates

```bash
# Update Docker images
docker-compose -f /opt/quote-app/docker-compose.yml pull

# Update base system
sudo apt update && sudo apt upgrade

# Restart services with new images
docker-compose -f /opt/quote-app/docker-compose.yml up -d
```

## Production Checklist

Before going to production:

- [ ] Change all default passwords in `.env`
- [ ] Install company-issued SSL certificates
- [ ] Configure firewall rules
- [ ] Set up automated database backups
- [ ] Disable email auto-confirmation (`ENABLE_EMAIL_AUTOCONFIRM=false`)
- [ ] Configure proper SMTP settings for production emails
- [ ] Set up monitoring and alerting
- [ ] Review and customize RLS policies
- [ ] Configure proper log rotation
- [ ] Set up regular security updates
- [ ] Document access procedures
- [ ] Test disaster recovery procedures

## Next Steps

After successful deployment:

1. **Configure Application Settings**
   - Access Supabase Studio: http://localhost:3000
   - Review `app_configurations` table
   - Set up ERP integration credentials

2. **Set Up Users and Roles**
   - Create admin user via application UI
   - Assign roles in `user_roles` table
   - Configure approval limits in `role_approval_limits`

3. **Import Initial Data**
   - Use import APIs to load customers
   - Import product catalog
   - Set up cross-references

4. **Configure Integrations**
   - Set up ERP API endpoints
   - Configure inventory sync schedule
   - Test import/export workflows

## Support and Resources

- **Detailed Documentation**: See `SELF-HOSTED-DEPLOYMENT.md`
- **Database Guide**: See `DATABASE-SETUP-GUIDE.md`
- **API Documentation**: See `CUSTOMER-IMPORT-API-GUIDE.md`
- **Security Audit**: See `SECURITY-AUDIT-REPORT.md`

## Scripts Reference

All scripts are located in `/opt/quote-app/scripts/`:

- `setup-selfhosted.sh` - Complete automated setup
- `migrate-db.sh` - Database migration management
- `docker-health.sh` - Service health monitoring
- `deploy.sh` - Application deployment
- `monitor.sh` - System monitoring

Run any script with `-h` or `--help` for detailed usage information.
