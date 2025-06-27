#!/bin/bash

# Wingy ERP Monitoring Script
# This script monitors the health of the Wingy ERP system

# Configuration
PROJECT_NAME="wingy-erp"
PROJECT_PATH="/var/www/$PROJECT_NAME"
LOG_FILE="/var/www/wingy-erp/monitoring.log"
ALERT_EMAIL="admin@your-domain.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$CPU_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
        warning "High CPU usage: ${CPU_USAGE}%"
    else
        info "CPU usage: ${CPU_USAGE}%"
    fi
    
    # Memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    if (( $(echo "$MEMORY_USAGE > 85" | bc -l 2>/dev/null || echo "0") )); then
        warning "High memory usage: ${MEMORY_USAGE}%"
    else
        info "Memory usage: ${MEMORY_USAGE}%"
    fi
    
    # Disk usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ "$DISK_USAGE" -gt 85 ]; then
        warning "High disk usage: ${DISK_USAGE}%"
    else
        info "Disk usage: ${DISK_USAGE}%"
    fi
}

# Check MongoDB status
check_mongodb() {
    log "Checking MongoDB status..."
    
    if systemctl is-active --quiet mongod; then
        info "MongoDB is running"
        
        # Check MongoDB connection using mongosh
        if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            info "MongoDB connection is healthy"
        else
            error "MongoDB connection failed"
        fi
    else
        error "MongoDB is not running"
    fi
}

# Check Nginx status
check_nginx() {
    log "Checking Nginx status..."
    
    if systemctl is-active --quiet nginx; then
        info "Nginx is running"
        
        # Check Nginx configuration with sudo
        if sudo nginx -t > /dev/null 2>&1; then
            info "Nginx configuration is valid"
        else
            error "Nginx configuration is invalid"
        fi
    else
        error "Nginx is not running"
    fi
}

# Check PM2 application status
check_pm2() {
    log "Checking PM2 application status..."
    
    if pm2 list | grep -q "wingy-erp-backend"; then
        # Get PM2 status - check if all instances are online
        ONLINE_COUNT=$(pm2 list | grep "wingy-erp-backend" | grep -c "online")
        TOTAL_COUNT=$(pm2 list | grep "wingy-erp-backend" | wc -l)
        
        if [ "$ONLINE_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
            info "PM2 application is online ($ONLINE_COUNT/$TOTAL_COUNT instances)"
        else
            error "PM2 application is not fully online ($ONLINE_COUNT/$TOTAL_COUNT instances)"
        fi
        
        # Check PM2 logs for errors
        ERROR_COUNT=$(pm2 logs wingy-erp-backend --lines 100 2>/dev/null | grep -c "ERROR" || echo "0")
        if [ "$ERROR_COUNT" -gt 0 ]; then
            warning "Found $ERROR_COUNT errors in PM2 logs"
        fi
    else
        error "PM2 application not found"
    fi
}

# Check application endpoints
check_endpoints() {
    log "Checking application endpoints..."
    
    # Check backend health endpoint
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        info "Backend health endpoint is responding"
    else
        error "Backend health endpoint is not responding"
    fi
    
    # Check frontend
    if curl -f -s http://localhost > /dev/null; then
        info "Frontend is accessible"
    else
        error "Frontend is not accessible"
    fi
    
    # Check SSL certificate
    if [ -f "/etc/letsencrypt/live/wingyerp.com/fullchain.pem" ]; then
        CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/wingyerp.com/fullchain.pem | cut -d= -f2)
        DAYS_LEFT=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))
        
        if [ "$DAYS_LEFT" -lt 30 ]; then
            warning "SSL certificate expires in $DAYS_LEFT days"
        else
            info "SSL certificate is valid for $DAYS_LEFT days"
        fi
    else
        warning "SSL certificate not found"
    fi
}

# Check log files
check_logs() {
    log "Checking log files..."
    
    # Check for recent errors in system logs
    RECENT_ERRORS=$(journalctl --since "1 hour ago" -p err | wc -l)
    if [ "$RECENT_ERRORS" -gt 0 ]; then
        warning "Found $RECENT_ERRORS system errors in the last hour"
    fi
    
    # Check Nginx error logs
    if [ -f "/var/log/nginx/error.log" ]; then
        NGINX_ERRORS=$(tail -n 100 /var/log/nginx/error.log | grep -c "error" || echo "0")
        if [ "$NGINX_ERRORS" -gt 0 ]; then
            warning "Found $NGINX_ERRORS errors in Nginx logs"
        fi
    fi
    
    # Check application logs
    if [ -f "/var/log/pm2/wingy-erp-error.log" ]; then
        APP_ERRORS=$(tail -n 100 /var/log/pm2/wingy-erp-error.log | grep -c "ERROR" || echo "0")
        if [ "$APP_ERRORS" -gt 0 ]; then
            warning "Found $APP_ERRORS errors in application logs"
        fi
    fi
}

# Check backup status
check_backups() {
    log "Checking backup status..."
    
    BACKUP_PATH="/var/backups/$PROJECT_NAME"
    
    if [ -d "$BACKUP_PATH" ]; then
        # Check if backup is older than 24 hours
        LATEST_BACKUP=$(ls -t "$BACKUP_PATH"/*.tar.gz 2>/dev/null | head -n1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))
            
            if [ "$BACKUP_AGE" -gt 24 ]; then
                warning "Latest backup is $BACKUP_AGE hours old"
            else
                info "Latest backup is $BACKUP_AGE hours old"
            fi
        else
            warning "No backups found"
        fi
    else
        warning "Backup directory not found"
    fi
}

# Generate report
generate_report() {
    log "Generating monitoring report..."
    
    REPORT_FILE="/tmp/monitoring-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "=== Wingy ERP Monitoring Report ==="
        echo "Generated: $(date)"
        echo ""
        
        echo "=== System Resources ==="
        echo "CPU Usage: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
        echo "Memory Usage: $(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')%"
        echo "Disk Usage: $(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)%"
        echo ""
        
        echo "=== Services Status ==="
        echo "MongoDB: $(systemctl is-active mongod)"
        echo "Nginx: $(systemctl is-active nginx)"
        echo "PM2 App: $(pm2 list | grep wingy-erp-backend | awk '{print $10}' || echo 'not found')"
        echo ""
        
        echo "=== Application Health ==="
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            echo "Backend: OK"
        else
            echo "Backend: FAILED"
        fi
        
        if curl -f -s http://localhost > /dev/null; then
            echo "Frontend: OK"
        else
            echo "Frontend: FAILED"
        fi
        echo ""
        
        echo "=== Recent Errors ==="
        journalctl --since "1 hour ago" -p err | tail -n 10
        
    } > "$REPORT_FILE"
    
    info "Report generated: $REPORT_FILE"
}

# Main monitoring function
monitor() {
    log "Starting system monitoring..."
    
    check_system_resources
    check_mongodb
    check_nginx
    check_pm2
    check_endpoints
    check_logs
    check_backups
    generate_report
    
    log "Monitoring completed"
}

# Show usage
usage() {
    echo "Usage: $0 {monitor|report}"
    echo ""
    echo "Commands:"
    echo "  monitor - Run full system monitoring"
    echo "  report  - Generate monitoring report only"
    echo ""
}

# Main script logic
case "$1" in
    monitor)
        monitor
        ;;
    report)
        generate_report
        ;;
    *)
        usage
        exit 1
        ;;
esac 