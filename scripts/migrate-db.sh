#!/bin/bash

# Quote Management Tool - Database Migration Script
# This script manages database migrations for self-hosted deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/quote-app"
MIGRATIONS_DIR="$APP_DIR/supabase/migrations"
BACKUP_DIR="$APP_DIR/backups/migrations"

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

# Show usage
show_usage() {
    cat <<EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
  apply           Apply all pending migrations
  rollback        Rollback the last migration
  status          Show migration status
  backup          Create database backup before migration
  restore         Restore database from backup

Options:
  -h, --help      Show this help message
  -y, --yes       Skip confirmation prompts
  -v, --verbose   Show detailed output

Examples:
  $0 apply                  # Apply all pending migrations
  $0 apply -y               # Apply migrations without confirmation
  $0 rollback               # Rollback last migration
  $0 status                 # Show current migration status
  $0 backup                 # Create database backup

EOF
}

# Check if PostgreSQL container is running
check_postgres() {
    if ! docker ps | grep -q "supabase-postgres"; then
        log_error "PostgreSQL container is not running"
        log_info "Start the services first: docker-compose -f $APP_DIR/docker-compose.yml up -d"
        exit 1
    fi
}

# Execute SQL query
execute_sql() {
    local query="$1"
    docker exec -i supabase-postgres psql -U postgres -d postgres -t -c "$query" 2>/dev/null
}

# Execute SQL file
execute_sql_file() {
    local file="$1"
    docker exec -i supabase-postgres psql -U postgres -d postgres < "$file"
}

# Create migrations tracking table
create_migrations_table() {
    log_info "Creating migrations tracking table..."

    execute_sql "
    CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
    );
    " > /dev/null

    log_info "Migrations table ready"
}

# Get applied migrations
get_applied_migrations() {
    execute_sql "SELECT name FROM _migrations ORDER BY id;" | tr -d ' '
}

# Get pending migrations
get_pending_migrations() {
    local applied=$(get_applied_migrations)
    local pending=()

    for migration in "$MIGRATIONS_DIR"/*.sql; do
        [ -e "$migration" ] || continue

        local migration_name=$(basename "$migration")

        if ! echo "$applied" | grep -q "^${migration_name}$"; then
            pending+=("$migration")
        fi
    done

    echo "${pending[@]}"
}

# Calculate file checksum
get_checksum() {
    local file="$1"
    sha256sum "$file" | awk '{print $1}'
}

# Create database backup
create_backup() {
    log_step "Creating database backup..."

    mkdir -p "$BACKUP_DIR"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_${timestamp}.sql"

    log_info "Backing up database to: $backup_file"

    docker exec supabase-postgres pg_dump -U postgres -d postgres > "$backup_file"

    # Compress backup
    gzip "$backup_file"

    log_info "Backup created: ${backup_file}.gz"

    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    echo "$backup_file"
}

# Apply single migration
apply_migration() {
    local migration="$1"
    local migration_name=$(basename "$migration")

    log_info "Applying migration: $migration_name"

    # Show migration description (first comment block)
    local description=$(head -20 "$migration" | grep -E "^--" | head -5)
    if [ -n "$description" ]; then
        echo "$description" | sed 's/^/  /'
        echo ""
    fi

    # Calculate checksum
    local checksum=$(get_checksum "$migration")

    # Apply migration
    if execute_sql_file "$migration"; then
        # Record migration
        execute_sql "
        INSERT INTO _migrations (name, checksum)
        VALUES ('$migration_name', '$checksum');
        " > /dev/null

        log_info "✓ $migration_name applied successfully"
        return 0
    else
        log_error "✗ Failed to apply $migration_name"
        return 1
    fi
}

# Apply all pending migrations
apply_migrations() {
    local skip_confirm=${1:-false}

    log_step "Checking for pending migrations..."

    create_migrations_table

    local pending=($(get_pending_migrations))

    if [ ${#pending[@]} -eq 0 ]; then
        log_info "No pending migrations"
        return 0
    fi

    log_info "Found ${#pending[@]} pending migration(s)"
    echo ""

    # List pending migrations
    for migration in "${pending[@]}"; do
        echo "  - $(basename "$migration")"
    done
    echo ""

    # Confirm
    if [ "$skip_confirm" != "true" ]; then
        read -p "Apply these migrations? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Migration cancelled"
            return 0
        fi
    fi

    # Create backup
    create_backup

    # Apply migrations
    local success_count=0
    local failed_count=0

    for migration in "${pending[@]}"; do
        if apply_migration "$migration"; then
            success_count=$((success_count + 1))
        else
            failed_count=$((failed_count + 1))
            log_error "Migration failed. Stopping here."
            break
        fi
    done

    echo ""
    log_info "Results: $success_count succeeded, $failed_count failed"

    if [ $failed_count -gt 0 ]; then
        log_error "Some migrations failed"
        log_info "A backup was created before migration"
        log_info "You can restore using: $0 restore"
        return 1
    fi

    log_info "All migrations applied successfully"
    return 0
}

# Rollback last migration
rollback_migration() {
    log_step "Rolling back last migration..."

    create_migrations_table

    # Get last applied migration
    local last_migration=$(execute_sql "
    SELECT name FROM _migrations
    ORDER BY id DESC LIMIT 1;
    " | tr -d ' ')

    if [ -z "$last_migration" ]; then
        log_info "No migrations to rollback"
        return 0
    fi

    log_warn "This will rollback: $last_migration"
    log_warn "There is no automatic rollback SQL"
    log_warn "You must manually undo the changes or restore from backup"
    echo ""

    read -p "Remove migration record from tracking table? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        execute_sql "DELETE FROM _migrations WHERE name = '$last_migration';" > /dev/null
        log_info "Migration record removed: $last_migration"
        log_warn "Remember: Database changes were NOT automatically reverted"
    else
        log_info "Rollback cancelled"
    fi
}

# Show migration status
show_status() {
    log_step "Migration Status"
    echo ""

    check_postgres
    create_migrations_table

    # Count migrations
    local total_files=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
    local applied_count=$(execute_sql "SELECT COUNT(*) FROM _migrations;" | tr -d ' ')
    local pending_count=$((total_files - applied_count))

    log_info "Total migrations:   $total_files"
    log_info "Applied:            $applied_count"
    log_info "Pending:            $pending_count"
    echo ""

    # List applied migrations
    if [ $applied_count -gt 0 ]; then
        echo "Applied Migrations:"
        execute_sql "
        SELECT name, to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS')
        FROM _migrations
        ORDER BY id;
        " | while read -r line; do
            echo "  ✓ $line"
        done
        echo ""
    fi

    # List pending migrations
    local pending=($(get_pending_migrations))
    if [ ${#pending[@]} -gt 0 ]; then
        echo "Pending Migrations:"
        for migration in "${pending[@]}"; do
            echo "  - $(basename "$migration")"
        done
        echo ""
    fi
}

# Restore from backup
restore_backup() {
    log_step "Restoring from backup..."

    # List available backups
    local backups=($(ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null))

    if [ ${#backups[@]} -eq 0 ]; then
        log_error "No backups found"
        return 1
    fi

    echo "Available backups:"
    for i in "${!backups[@]}"; do
        local backup_file=$(basename "${backups[$i]}")
        echo "  $((i + 1)). $backup_file"
    done
    echo ""

    read -p "Select backup to restore (1-${#backups[@]}): " backup_num

    if [ "$backup_num" -lt 1 ] || [ "$backup_num" -gt ${#backups[@]} ]; then
        log_error "Invalid selection"
        return 1
    fi

    local selected_backup="${backups[$((backup_num - 1))]}"

    log_warn "This will restore database from: $(basename "$selected_backup")"
    log_warn "ALL CURRENT DATA WILL BE LOST!"
    echo ""

    read -p "Are you sure? Type 'yes' to confirm: " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        return 0
    fi

    log_info "Restoring database..."

    # Decompress and restore
    gunzip -c "$selected_backup" | docker exec -i supabase-postgres psql -U postgres -d postgres

    log_info "Database restored successfully"
}

# Main function
main() {
    local command=${1:-}
    local skip_confirm=false
    local verbose=false

    # Parse options
    shift || true
    while [ $# -gt 0 ]; do
        case "$1" in
            -y|--yes)
                skip_confirm=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Execute command
    case "$command" in
        apply)
            check_postgres
            apply_migrations "$skip_confirm"
            ;;
        rollback)
            check_postgres
            rollback_migration
            ;;
        status)
            show_status
            ;;
        backup)
            check_postgres
            create_backup
            ;;
        restore)
            check_postgres
            restore_backup
            ;;
        "")
            log_error "No command specified"
            show_usage
            exit 1
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
