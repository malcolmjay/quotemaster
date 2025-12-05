#!/bin/bash

# Quote Management Tool - Docker Health Check Script
# This script monitors the health of all Docker services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/quote-app"

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

# Check if service is running
check_service() {
    local service_name=$1
    local container_name=$2

    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${GREEN}✓${NC} $service_name"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name"
        return 1
    fi
}

# Check service health
check_health() {
    local container_name=$1
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)

    case "$health" in
        "healthy")
            echo -e "${GREEN}healthy${NC}"
            return 0
            ;;
        "unhealthy")
            echo -e "${RED}unhealthy${NC}"
            return 1
            ;;
        "starting")
            echo -e "${YELLOW}starting${NC}"
            return 2
            ;;
        *)
            echo -e "${BLUE}no health check${NC}"
            return 3
            ;;
    esac
}

# Get container resource usage
get_resources() {
    local container_name=$1
    docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" "$container_name" 2>/dev/null | tail -1
}

# Main health check
main() {
    echo ""
    echo "============================================================================"
    log_info "Docker Services Health Check"
    echo "============================================================================"
    echo ""

    local total_services=0
    local running_services=0
    local failed_services=0

    # Check Supabase services
    echo "Supabase Infrastructure:"
    echo ""

    services=(
        "PostgreSQL:supabase-postgres"
        "Kong Gateway:supabase-kong"
        "Auth (GoTrue):supabase-auth"
        "REST (PostgREST):supabase-rest"
        "Realtime:supabase-realtime"
        "Storage:supabase-storage"
        "Meta API:supabase-meta"
        "Studio UI:supabase-studio"
        "Mail Server:supabase-mail"
    )

    for service in "${services[@]}"; do
        IFS=':' read -r name container <<< "$service"
        total_services=$((total_services + 1))

        printf "  %-20s " "$name:"
        if check_service "$name" "$container"; then
            running_services=$((running_services + 1))
            printf " [%s]" "$(check_health "$container")"
            printf "\n"
        else
            failed_services=$((failed_services + 1))
            printf "\n"
        fi
    done

    echo ""
    echo "Application Services:"
    echo ""

    app_services=(
        "Quote App:quote-app"
        "Nginx Proxy:quote-nginx-proxy"
    )

    for service in "${app_services[@]}"; do
        IFS=':' read -r name container <<< "$service"
        total_services=$((total_services + 1))

        printf "  %-20s " "$name:"
        if check_service "$name" "$container"; then
            running_services=$((running_services + 1))
            printf " [%s]" "$(check_health "$container")"
            printf "\n"
        else
            failed_services=$((failed_services + 1))
            printf "\n"
        fi
    done

    echo ""
    echo "============================================================================"
    echo ""

    # Summary
    log_info "Summary: $running_services/$total_services services running"

    if [ $failed_services -gt 0 ]; then
        log_warn "$failed_services service(s) not running"
    fi

    echo ""

    # Resource usage
    echo "Resource Usage:"
    echo ""
    printf "  %-25s %-15s %s\n" "Service" "CPU" "Memory"
    printf "  %-25s %-15s %s\n" "-------" "---" "------"

    for service in "${services[@]}" "${app_services[@]}"; do
        IFS=':' read -r name container <<< "$service"
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            resources=$(get_resources "$container")
            printf "  %-25s %s\n" "$name" "$resources"
        fi
    done

    echo ""

    # Network check
    echo "Network Connectivity:"
    echo ""

    # Check application endpoint
    if curl -sf http://localhost:8080 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Application (http://localhost:8080)"
    else
        echo -e "  ${RED}✗${NC} Application (http://localhost:8080)"
    fi

    # Check Supabase API
    if curl -sf http://localhost:8000/rest/v1/ > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Supabase REST API (http://localhost:8000)"
    else
        echo -e "  ${RED}✗${NC} Supabase REST API (http://localhost:8000)"
    fi

    # Check Supabase Studio
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Supabase Studio (http://localhost:3000)"
    else
        echo -e "  ${RED}✗${NC} Supabase Studio (http://localhost:3000)"
    fi

    # Check PostgreSQL
    if docker exec supabase-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL (localhost:5432)"
    else
        echo -e "  ${RED}✗${NC} PostgreSQL (localhost:5432)"
    fi

    echo ""

    # Logs check
    echo "Recent Errors (last 10 lines):"
    echo ""

    local errors_found=false

    for service in "${services[@]}" "${app_services[@]}"; do
        IFS=':' read -r name container <<< "$service"
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            local error_lines=$(docker logs "$container" --tail 10 2>&1 | grep -i "error" | wc -l)
            if [ $error_lines -gt 0 ]; then
                echo "  $name: $error_lines error(s)"
                errors_found=true
            fi
        fi
    done

    if [ "$errors_found" = false ]; then
        echo "  No recent errors found"
    fi

    echo ""
    echo "============================================================================"
    echo ""

    # Exit status
    if [ $failed_services -gt 0 ]; then
        log_error "Some services are not running properly"
        log_info "Check logs: docker-compose -f $APP_DIR/docker-compose.yml logs <service>"
        exit 1
    else
        log_info "All services are running properly"
        exit 0
    fi
}

# Run main function
main "$@"
