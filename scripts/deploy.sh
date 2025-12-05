#!/bin/bash

# Quote Management Tool - Deployment Script
# This script handles the complete deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="quote-app"
APP_DIR="/opt/quote-app"
BACKUP_DIR="/opt/quote-app-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root or with sudo"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

# Create directories
setup_directories() {
    log_info "Setting up directories..."

    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$APP_DIR/logs"
    mkdir -p "$APP_DIR/ssl"
    mkdir -p "$APP_DIR/scripts"

    log_info "Directories created"
}

# Backup existing deployment
backup_deployment() {
    if [ -d "$APP_DIR/dist" ]; then
        log_info "Creating backup of existing deployment..."
        tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" -C "$APP_DIR" . 2>/dev/null || true
        log_info "Backup created: $BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
    fi
}

# Check environment file
check_env_file() {
    log_info "Checking environment configuration..."

    if [ ! -f "$APP_DIR/.env.production" ]; then
        log_error ".env.production file not found!"
        log_warn "Please create .env.production file with required variables"
        log_warn "See .env.production.example for reference"
        exit 1
    fi

    # Check if required variables are set
    source "$APP_DIR/.env.production"

    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        log_error "Required environment variables are not set!"
        log_warn "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
        exit 1
    fi

    log_info "Environment configuration is valid"
}

# Generate SSL certificate if not exists
setup_ssl() {
    log_info "Checking SSL certificates..."

    if [ ! -f "$APP_DIR/ssl/cert.pem" ] || [ ! -f "$APP_DIR/ssl/key.pem" ]; then
        log_warn "SSL certificates not found. Generating self-signed certificate..."

        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$APP_DIR/ssl/key.pem" \
            -out "$APP_DIR/ssl/cert.pem" \
            -subj "/C=US/ST=State/L=City/O=Company/CN=quote-app.internal" \
            2>/dev/null

        chmod 600 "$APP_DIR/ssl/key.pem"
        chmod 644 "$APP_DIR/ssl/cert.pem"

        log_warn "Self-signed certificate generated"
        log_warn "For production, replace with company-issued certificate"
    else
        log_info "SSL certificates found"
    fi
}

# Build application
build_application() {
    log_info "Building application..."

    cd "$APP_DIR"

    # Stop existing containers
    docker-compose down 2>/dev/null || true

    # Build new image
    docker-compose build --no-cache

    log_info "Application built successfully"
}

# Start application
start_application() {
    log_info "Starting application..."

    cd "$APP_DIR"
    docker-compose up -d

    # Wait for health check
    log_info "Waiting for application to be healthy..."
    sleep 10

    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
            log_info "Application is healthy!"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 2
    done

    log_error "Application failed to start properly"
    log_warn "Check logs: docker-compose -f $APP_DIR/docker-compose.yml logs"
    exit 1
}

# Run health checks
health_check() {
    log_info "Running health checks..."

    # Check if containers are running
    if ! docker ps | grep -q "$APP_NAME"; then
        log_error "Application container is not running"
        return 1
    fi

    # Check HTTP endpoint
    if ! curl -sf http://localhost:8080/health > /dev/null 2>&1; then
        log_error "Application health check failed"
        return 1
    fi

    # Check HTTPS endpoint (if SSL is configured)
    if [ -f "$APP_DIR/ssl/cert.pem" ]; then
        if ! curl -sk https://localhost/health > /dev/null 2>&1; then
            log_warn "HTTPS health check failed"
        fi
    fi

    log_info "All health checks passed"
    return 0
}

# Display deployment info
show_deployment_info() {
    echo ""
    log_info "=================================="
    log_info "Deployment completed successfully!"
    log_info "=================================="
    echo ""
    log_info "Application URLs:"
    log_info "  HTTP:  http://localhost:8080"
    log_info "  HTTPS: https://localhost"
    echo ""
    log_info "Useful commands:"
    log_info "  View logs:    docker-compose -f $APP_DIR/docker-compose.yml logs -f"
    log_info "  Stop app:     docker-compose -f $APP_DIR/docker-compose.yml down"
    log_info "  Restart app:  docker-compose -f $APP_DIR/docker-compose.yml restart"
    log_info "  Check status: docker-compose -f $APP_DIR/docker-compose.yml ps"
    echo ""
    log_info "Next steps:"
    log_info "  1. Access the application at http://localhost:8080"
    log_info "  2. Create initial admin user via the UI"
    log_info "  3. Configure import API credentials in Supabase"
    log_info "  4. Set up approval limits in database"
    echo ""
}

# Rollback function
rollback() {
    log_error "Deployment failed. Rolling back..."

    latest_backup=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)

    if [ -n "$latest_backup" ]; then
        log_info "Restoring from backup: $latest_backup"

        docker-compose -f "$APP_DIR/docker-compose.yml" down 2>/dev/null || true

        rm -rf "$APP_DIR/dist" 2>/dev/null || true
        tar -xzf "$latest_backup" -C "$APP_DIR"

        docker-compose -f "$APP_DIR/docker-compose.yml" up -d

        log_warn "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Main deployment flow
main() {
    log_info "Starting deployment of $APP_NAME..."
    echo ""

    # Set trap for errors
    trap rollback ERR

    check_root
    check_prerequisites
    setup_directories
    check_env_file
    backup_deployment
    setup_ssl
    build_application
    start_application

    # Remove trap before health check
    trap - ERR

    if health_check; then
        show_deployment_info
    else
        log_error "Deployment completed but health checks failed"
        log_warn "Please check application logs"
        exit 1
    fi
}

# Run main function
main "$@"
