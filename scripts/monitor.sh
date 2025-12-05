#!/bin/bash

# Quote Management Tool - Monitoring Script
# Run this via cron to monitor application health

# Configuration
HEALTH_URL="http://localhost:8080/health"
LOG_FILE="/var/log/quote-app-monitor.log"
ALERT_EMAIL="admin@company.com"  # Configure your alerting
APP_DIR="/opt/quote-app"

# Thresholds
DISK_THRESHOLD=80
MEMORY_THRESHOLD=80
CPU_THRESHOLD=80

# Log function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check application health
check_app_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)

    if [ "$response" -eq 200 ]; then
        log_message "✓ Application is healthy"
        return 0
    else
        log_message "✗ Application is unhealthy - HTTP Status: $response"
        return 1
    fi
}

# Check Docker containers
check_containers() {
    if ! docker ps | grep -q "quote-app"; then
        log_message "✗ quote-app container is not running"
        return 1
    fi

    if ! docker ps | grep -q "quote-nginx-proxy"; then
        log_message "✗ nginx-proxy container is not running"
        return 1
    fi

    log_message "✓ All containers are running"
    return 0
}

# Check disk space
check_disk_space() {
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        log_message "⚠ Disk usage is at ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
        return 1
    fi

    log_message "✓ Disk usage is ${disk_usage}%"
    return 0
}

# Check memory usage
check_memory() {
    memory_usage=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')

    if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
        log_message "⚠ Memory usage is at ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)"
        return 1
    fi

    log_message "✓ Memory usage is ${memory_usage}%"
    return 0
}

# Check CPU usage
check_cpu() {
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d. -f1)

    if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
        log_message "⚠ CPU usage is at ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
        return 1
    fi

    log_message "✓ CPU usage is ${cpu_usage}%"
    return 0
}

# Check container resource usage
check_container_resources() {
    # Get resource usage for quote-app container
    stats=$(docker stats --no-stream --format "{{.MemPerc}}|{{.CPUPerc}}" quote-app 2>/dev/null)

    if [ -z "$stats" ]; then
        log_message "✗ Unable to get container stats"
        return 1
    fi

    mem_perc=$(echo "$stats" | cut -d'|' -f1 | sed 's/%//')
    cpu_perc=$(echo "$stats" | cut -d'|' -f2 | sed 's/%//')

    log_message "✓ Container Memory: ${mem_perc}%, CPU: ${cpu_perc}%"
    return 0
}

# Check SSL certificate expiration
check_ssl_cert() {
    cert_file="$APP_DIR/ssl/cert.pem"

    if [ ! -f "$cert_file" ]; then
        log_message "⚠ SSL certificate not found"
        return 1
    fi

    expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry_date" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))

    if [ "$days_until_expiry" -lt 30 ]; then
        log_message "⚠ SSL certificate expires in $days_until_expiry days"
        return 1
    fi

    log_message "✓ SSL certificate valid for $days_until_expiry days"
    return 0
}

# Check log file sizes
check_logs() {
    log_dir="$APP_DIR/logs"

    if [ -d "$log_dir" ]; then
        total_size=$(du -sm "$log_dir" 2>/dev/null | cut -f1)

        if [ "$total_size" -gt 1000 ]; then
            log_message "⚠ Log directory size is ${total_size}MB"
            return 1
        fi

        log_message "✓ Log directory size is ${total_size}MB"
    fi

    return 0
}

# Send alert
send_alert() {
    subject="$1"
    message="$2"

    # Log the alert
    log_message "ALERT: $subject - $message"

    # Send email (configure your mail system)
    # echo "$message" | mail -s "$subject" "$ALERT_EMAIL"

    # Or use other alerting systems (Slack, PagerDuty, etc.)
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$subject: $message\"}" \
    #   YOUR_WEBHOOK_URL
}

# Auto-restart if unhealthy
auto_restart() {
    log_message "Attempting automatic restart..."

    cd "$APP_DIR" || return 1
    docker-compose restart

    sleep 15

    if check_app_health; then
        log_message "✓ Automatic restart successful"
        send_alert "Quote App Auto-Restart" "Application was automatically restarted and is now healthy"
        return 0
    else
        log_message "✗ Automatic restart failed"
        send_alert "Quote App Critical" "Application restart failed - manual intervention required"
        return 1
    fi
}

# Main monitoring function
main() {
    log_message "========== Starting Health Check =========="

    failed_checks=0

    # Run all checks
    check_app_health || ((failed_checks++))
    check_containers || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_memory || ((failed_checks++))
    check_cpu || ((failed_checks++))
    check_container_resources || ((failed_checks++))
    check_ssl_cert || ((failed_checks++))
    check_logs || ((failed_checks++))

    # If application is unhealthy, attempt restart
    if ! check_app_health; then
        auto_restart
    fi

    # Summary
    if [ $failed_checks -eq 0 ]; then
        log_message "========== All Checks Passed =========="
    else
        log_message "========== $failed_checks Check(s) Failed =========="

        if [ $failed_checks -gt 3 ]; then
            send_alert "Quote App Warning" "$failed_checks health checks failed"
        fi
    fi

    log_message ""
}

# Run main function
main
