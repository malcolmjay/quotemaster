#!/bin/bash

# Quote Management Tool - Self-Hosted Supabase Setup Script
# This script sets up the complete self-hosted Supabase environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/quote-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root or with sudo"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing_deps=()

    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi

    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi

    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        log_info "Installation commands:"
        log_info "  Docker:         curl -fsSL https://get.docker.com | sh"
        log_info "  Docker Compose: sudo apt-get install docker-compose"
        log_info "  OpenSSL:        sudo apt-get install openssl"
        exit 1
    fi

    log_info "All prerequisites are installed"
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Generate JWT secret
generate_jwt() {
    openssl rand -base64 64 | tr -d "\n"
}

# Generate Supabase keys
generate_keys() {
    log_step "Generating secure keys..."

    # Generate JWT secret
    JWT_SECRET=$(generate_jwt)

    # Generate anon key (JWT with anon role)
    ANON_KEY=$(node -e "
    const jwt = require('jsonwebtoken');
    const payload = {
      role: 'anon',
      iss: 'supabase',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
    };
    console.log(jwt.sign(payload, '$JWT_SECRET'));
    " 2>/dev/null)

    # Generate service role key (JWT with service_role)
    SERVICE_ROLE_KEY=$(node -e "
    const jwt = require('jsonwebtoken');
    const payload = {
      role: 'service_role',
      iss: 'supabase',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
    };
    console.log(jwt.sign(payload, '$JWT_SECRET'));
    " 2>/dev/null)

    # If Node.js is not available, use fallback method
    if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
        log_warn "Node.js not available, using fallback key generation"
        ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE5NTczNDUyMDB9.placeholder"
        SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTk1NzM0NTIwMH0.placeholder"
        log_warn "You should regenerate these keys with proper JWT signing"
    fi

    log_info "Keys generated successfully"
}

# Create directory structure
setup_directories() {
    log_step "Setting up directory structure..."

    mkdir -p "$APP_DIR"
    mkdir -p "$APP_DIR/logs"
    mkdir -p "$APP_DIR/ssl"
    mkdir -p "$APP_DIR/supabase/config"
    mkdir -p "$APP_DIR/backups"

    log_info "Directory structure created"
}

# Copy project files
copy_project_files() {
    log_step "Copying project files..."

    # Copy application files
    rsync -av --exclude='node_modules' --exclude='.git' \
        "$PROJECT_ROOT/" "$APP_DIR/"

    # Set proper permissions
    chmod +x "$APP_DIR/scripts/"*.sh

    log_info "Project files copied"
}

# Generate environment file
generate_env_file() {
    log_step "Generating environment configuration..."

    local POSTGRES_PASSWORD=$(generate_secret)

    cat > "$APP_DIR/.env" <<EOF
# ============================================================================
# Self-Hosted Supabase Configuration
# Generated on: $(date)
# ============================================================================

# PostgreSQL Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_USER=postgres
POSTGRES_DB=postgres

# Supabase JWT Configuration
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
JWT_EXPIRY=3600

# Supabase API Configuration
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:8080

# Application Configuration
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=$ANON_KEY

# Email Configuration (using Inbucket for testing)
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
DISABLE_SIGNUP=false
SMTP_ADMIN_EMAIL=admin@quote-app.local
SMTP_HOST=mail
SMTP_PORT=2500
SMTP_SENDER_NAME=Quote Management Tool

# Additional Configuration
ADDITIONAL_REDIRECT_URLS=
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify

# ============================================================================
# IMPORTANT: Keep this file secure and do not commit to version control
# ============================================================================
EOF

    chmod 600 "$APP_DIR/.env"

    log_info "Environment file generated: $APP_DIR/.env"
    log_warn "Please review and customize the configuration as needed"
}

# Initialize database
init_database() {
    log_step "Initializing database..."

    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec supabase-postgres pg_isready -U postgres > /dev/null 2>&1; then
            log_info "PostgreSQL is ready"
            break
        fi

        attempt=$((attempt + 1))
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL failed to start"
        exit 1
    fi

    # Run initialization script
    log_info "Running database initialization..."
    docker exec -i supabase-postgres psql -U postgres -d postgres < "$APP_DIR/supabase/config/init.sql"

    log_info "Database initialized successfully"
}

# Apply migrations
apply_migrations() {
    log_step "Applying database migrations..."

    local migration_count=$(ls -1 "$APP_DIR/supabase/migrations/"*.sql 2>/dev/null | wc -l)

    if [ $migration_count -eq 0 ]; then
        log_warn "No migrations found"
        return
    fi

    log_info "Found $migration_count migration(s)"

    for migration in "$APP_DIR/supabase/migrations/"*.sql; do
        local migration_name=$(basename "$migration")
        log_info "Applying migration: $migration_name"

        if docker exec -i supabase-postgres psql -U postgres -d postgres < "$migration"; then
            log_info "✓ $migration_name applied successfully"
        else
            log_error "✗ Failed to apply $migration_name"
            exit 1
        fi
    done

    log_info "All migrations applied successfully"
}

# Setup SSL certificates
setup_ssl() {
    log_step "Setting up SSL certificates..."

    if [ -f "$APP_DIR/ssl/cert.pem" ] && [ -f "$APP_DIR/ssl/key.pem" ]; then
        log_info "SSL certificates already exist"
        return
    fi

    log_info "Generating self-signed SSL certificate..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$APP_DIR/ssl/key.pem" \
        -out "$APP_DIR/ssl/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Company/CN=quote-app.local" \
        2>/dev/null

    chmod 600 "$APP_DIR/ssl/key.pem"
    chmod 644 "$APP_DIR/ssl/cert.pem"

    log_info "SSL certificates generated"
    log_warn "Self-signed certificates are for testing only"
    log_warn "For production, replace with company-issued certificates"
}

# Start services
start_services() {
    log_step "Starting services..."

    cd "$APP_DIR"

    # Pull images
    log_info "Pulling Docker images..."
    docker-compose pull

    # Start Supabase infrastructure first
    log_info "Starting Supabase infrastructure..."
    docker-compose up -d postgres kong auth rest realtime storage meta mail studio

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10

    # Initialize database
    init_database

    # Apply migrations
    apply_migrations

    # Start application
    log_info "Starting application..."
    docker-compose up -d quote-app nginx-proxy

    log_info "All services started successfully"
}

# Health check
health_check() {
    log_step "Running health checks..."

    local checks_passed=0
    local checks_failed=0

    # Check PostgreSQL
    if docker exec supabase-postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_info "✓ PostgreSQL is healthy"
        checks_passed=$((checks_passed + 1))
    else
        log_error "✗ PostgreSQL is not healthy"
        checks_failed=$((checks_failed + 1))
    fi

    # Check Kong
    if docker exec supabase-kong kong health > /dev/null 2>&1; then
        log_info "✓ Kong API Gateway is healthy"
        checks_passed=$((checks_passed + 1))
    else
        log_error "✗ Kong API Gateway is not healthy"
        checks_failed=$((checks_failed + 1))
    fi

    # Check application
    sleep 5
    if curl -sf http://localhost:8080 > /dev/null 2>&1; then
        log_info "✓ Application is healthy"
        checks_passed=$((checks_passed + 1))
    else
        log_error "✗ Application is not healthy"
        checks_failed=$((checks_failed + 1))
    fi

    echo ""
    log_info "Health check results: $checks_passed passed, $checks_failed failed"

    if [ $checks_failed -gt 0 ]; then
        log_warn "Some health checks failed. Check logs for details:"
        log_info "  docker-compose -f $APP_DIR/docker-compose.yml logs"
    fi
}

# Display setup summary
show_summary() {
    echo ""
    echo "============================================================================"
    log_info "Self-Hosted Supabase Setup Complete!"
    echo "============================================================================"
    echo ""
    log_info "Access URLs:"
    log_info "  Application:       http://localhost:8080"
    log_info "  Supabase Studio:   http://localhost:3000"
    log_info "  Supabase API:      http://localhost:8000"
    log_info "  Mail UI (Inbucket): http://localhost:9000"
    echo ""
    log_info "Database Connection:"
    log_info "  Host:     localhost"
    log_info "  Port:     5432"
    log_info "  Database: postgres"
    log_info "  User:     postgres"
    log_info "  Password: (see $APP_DIR/.env)"
    echo ""
    log_info "Useful Commands:"
    log_info "  View logs:          docker-compose -f $APP_DIR/docker-compose.yml logs -f"
    log_info "  Stop services:      docker-compose -f $APP_DIR/docker-compose.yml down"
    log_info "  Restart services:   docker-compose -f $APP_DIR/docker-compose.yml restart"
    log_info "  Check status:       docker-compose -f $APP_DIR/docker-compose.yml ps"
    echo ""
    log_info "Next Steps:"
    log_info "  1. Access Supabase Studio at http://localhost:3000"
    log_info "  2. Connect using the service_role key from .env file"
    log_info "  3. Review database schema and RLS policies"
    log_info "  4. Create your first user via the application UI"
    log_info "  5. Configure import API settings in app_configurations table"
    echo ""
    log_warn "Important Security Notes:"
    log_warn "  - Change default passwords in .env file"
    log_warn "  - Replace self-signed SSL certificate with company cert"
    log_warn "  - Configure firewall rules to restrict access"
    log_warn "  - Set up regular database backups"
    log_warn "  - Review and customize RLS policies"
    echo ""
    echo "============================================================================"
}

# Main setup flow
main() {
    echo ""
    echo "============================================================================"
    log_info "Quote Management Tool - Self-Hosted Setup"
    echo "============================================================================"
    echo ""

    check_root
    check_prerequisites
    generate_keys
    setup_directories
    copy_project_files
    generate_env_file
    setup_ssl
    start_services

    # Wait for services to stabilize
    sleep 10

    health_check
    show_summary
}

# Run main function
main "$@"
