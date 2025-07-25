#!/bin/bash

# Winjy ERP Monitoring Script
# This script monitors the health of the Winjy ERP system

# Configuration
PROJECT_NAME="winjy-erp"
PROJECT_PATH="/var/www/$PROJECT_NAME"
LOG_FILE="/var/www/winjy-erp/monitoring.log"
ALERT_EMAIL="admin@your-domain.com"
DOMAIN=${DOMAIN:-"winjyerp.com"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" | tee -a $LOG_FILE
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
    
    # Check available disk space
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    AVAILABLE_SPACE_GB=$(echo "scale=2; $AVAILABLE_SPACE/1024/1024" | bc -l 2>/dev/null || echo "0")
    info "Available disk space: ${AVAILABLE_SPACE_GB}GB"
}

# Check MongoDB status
check_mongodb() {
    log "Checking MongoDB status..."
    
    if systemctl is-active --quiet mongod; then
        info "MongoDB is running"
        
        # Check MongoDB connection using mongosh
        if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            success "MongoDB connection is healthy"
            
            # Check database size
            DB_SIZE=$(mongosh --eval "db.stats().dataSize" --quiet 2>/dev/null || echo "0")
            DB_SIZE_MB=$(echo "scale=2; $DB_SIZE/1024/1024" | bc -l 2>/dev/null || echo "0")
            info "Database size: ${DB_SIZE_MB}MB"
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
            success "Nginx configuration is valid"
        else
            error "Nginx configuration is invalid"
        fi
        
        # Check Nginx error logs
        NGINX_ERRORS=$(sudo tail -n 10 /var/log/nginx/error.log | grep -c "error" 2>/dev/null || echo "0")
        if [ "$NGINX_ERRORS" -gt 0 ]; then
            warning "Nginx has $NGINX_ERRORS recent errors"
        else
            info "Nginx error log is clean"
        fi
    else
        error "Nginx is not running"
    fi
}

# Check PM2 status
check_pm2() {
    log "Checking PM2 status..."
    
    if command -v pm2 &> /dev/null; then
        PM2_STATUS=$(pm2 status --no-daemon 2>/dev/null)
        
        if echo "$PM2_STATUS" | grep -q "winjy-erp-backend.*online"; then
            success "PM2 application is running"
            
            # Check PM2 logs for errors
            PM2_ERRORS=$(pm2 logs winjy-erp-backend --lines 50 --nostream 2>/dev/null | grep -c "ERROR" || echo "0")
            if [ "$PM2_ERRORS" -gt 0 ]; then
                warning "PM2 has $PM2_ERRORS recent errors"
            else
                info "PM2 error log is clean"
            fi
            
            # Check memory usage of PM2 process
            PM2_MEMORY=$(pm2 show winjy-erp-backend --no-daemon 2>/dev/null | grep "memory" | awk '{print $4}' || echo "0")
            info "PM2 memory usage: ${PM2_MEMORY}MB"
        else
            error "PM2 application is not running"
        fi
    else
        error "PM2 is not installed"
    fi
}

# Check application health
check_application_health() {
    log "Checking application health..."
    
    # Check backend health
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend accessibility
    if curl -f -s "https://$DOMAIN" > /dev/null 2>/dev/null; then
        success "Frontend health check passed (HTTPS)"
    elif curl -f -s "http://$DOMAIN" > /dev/null 2>/dev/null; then
        success "Frontend health check passed (HTTP)"
    else
        error "Frontend health check failed"
    fi
}

# Check API endpoints
check_api_endpoints() {
    log "Checking API endpoints..."
    
    local endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/employees"
        "http://localhost:3000/api/petty-cash/balances"
        "http://localhost:3000/api/payroll"
        "http://localhost:3000/api/overtime"
        "http://localhost:3000/api/main-categories"
        "http://localhost:3000/api/expenses"
        "http://localhost:3000/api/projects"
    )
    
    local failed_endpoints=0
    
    for endpoint in "${endpoints[@]}"; do
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$endpoint" 2>/dev/null || echo "FAILED")
        
        if [[ "$response_time" != "FAILED" ]]; then
            if (( $(echo "$response_time < 1.0" | bc -l 2>/dev/null || echo "0") )); then
                info "✅ $endpoint: ${response_time}s"
            else
                warning "⚠️  $endpoint: ${response_time}s (slow)"
            fi
        else
            error "❌ $endpoint: FAILED"
            ((failed_endpoints++))
        fi
    done
    
    if [ "$failed_endpoints" -eq 0 ]; then
        success "All API endpoints are responding"
    else
        warning "$failed_endpoints API endpoints failed"
    fi
}

# Check HR module specifically
check_hr_module() {
    log "Checking HR module..."
    
    # Check employees count
    EMPLOYEES_COUNT=$(curl -s http://localhost:3000/api/employees 2>/dev/null | jq '.employees | length' 2>/dev/null || echo "0")
    info "Total employees: $EMPLOYEES_COUNT"
    
    # Check petty cash balances
    if curl -f -s http://localhost:3000/api/petty-cash/balances > /dev/null; then
        BALANCES_COUNT=$(curl -s http://localhost:3000/api/petty-cash/balances 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
        info "Employees with petty cash balances: $BALANCES_COUNT"
    else
        warning "Petty cash balances API not accessible"
    fi
    
    # Check payroll records
    PAYROLL_COUNT=$(curl -s http://localhost:3000/api/payroll 2>/dev/null | jq '.payrolls | length' 2>/dev/null || echo "0")
    info "Total payroll records: $PAYROLL_COUNT"
    
    # Check overtime records
    OVERTIME_COUNT=$(curl -s http://localhost:3000/api/overtime 2>/dev/null | jq '.overtimes | length' 2>/dev/null || echo "0")
    info "Total overtime records: $OVERTIME_COUNT"
    
    success "HR module check completed"
}

# Check file uploads
check_file_uploads() {
    log "Checking file uploads..."
    
    UPLOAD_DIR="$PROJECT_PATH/backend/uploads"
    
    if [ -d "$UPLOAD_DIR" ]; then
        UPLOAD_COUNT=$(find "$UPLOAD_DIR" -type f | wc -l)
        UPLOAD_SIZE=$(du -sh "$UPLOAD_DIR" 2>/dev/null | cut -f1 || echo "0")
        
        info "Upload files count: $UPLOAD_COUNT"
        info "Upload directory size: $UPLOAD_SIZE"
        
        # Check for large files
        LARGE_FILES=$(find "$UPLOAD_DIR" -type f -size +10M 2>/dev/null | wc -l)
        if [ "$LARGE_FILES" -gt 0 ]; then
            warning "Found $LARGE_FILES files larger than 10MB"
        fi
    else
        warning "Upload directory not found"
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    log "Checking SSL certificate..."
    
    if command -v openssl &> /dev/null; then
        CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
        
        if [ -n "$CERT_EXPIRY" ]; then
            CERT_DATE=$(date -d "$CERT_EXPIRY" +%s)
            CURRENT_DATE=$(date +%s)
            DAYS_LEFT=$(( (CERT_DATE - CURRENT_DATE) / 86400 ))
            
            if [ "$DAYS_LEFT" -lt 30 ]; then
                warning "SSL certificate expires in $DAYS_LEFT days"
            else
                info "SSL certificate expires in $DAYS_LEFT days"
            fi
        else
            warning "Could not check SSL certificate expiry"
        fi
    else
        warning "OpenSSL not available for certificate check"
    fi
}

# Check backup status
check_backup_status() {
    log "Checking backup status..."
    
    BACKUP_DIR="/var/backups/$PROJECT_NAME"
    
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -n1)
        
        info "Total backups: $BACKUP_COUNT"
        
        if [ -n "$LATEST_BACKUP" ]; then
            BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 86400 ))
            info "Latest backup age: $BACKUP_AGE days"
            
            if [ "$BACKUP_AGE" -gt 7 ]; then
                warning "Latest backup is older than 7 days"
            fi
        else
            warning "No backups found"
        fi
    else
        warning "Backup directory not found"
    fi
}

# Generate monitoring report
generate_report() {
    log "Generating monitoring report..."
    
    REPORT_FILE="/tmp/monitoring-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "=== Winjy ERP Monitoring Report ==="
        echo "Generated: $(date)"
        echo "Domain: $DOMAIN"
        echo ""
        
        echo "=== System Resources ==="
        echo "CPU Usage: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
        echo "Memory Usage: $(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')%"
        echo "Disk Usage: $(df / | tail -1 | awk '{print $5}')"
        echo ""
        
        echo "=== Services Status ==="
        echo "MongoDB: $(systemctl is-active mongod)"
        echo "Nginx: $(systemctl is-active nginx)"
        echo "PM2: $(pm2 status --no-daemon 2>/dev/null | grep winjy-erp-backend | awk '{print $10}' || echo 'unknown')"
        echo ""
        
        echo "=== Application Health ==="
        echo "Backend: $(curl -f -s http://localhost:3000/api/health > /dev/null && echo 'OK' || echo 'FAILED')"
        echo "Frontend: $(curl -f -s https://$DOMAIN > /dev/null 2>/dev/null && echo 'OK' || echo 'FAILED')"
        echo ""
        
        echo "=== HR Module Statistics ==="
        echo "Employees: $(curl -s http://localhost:3000/api/employees 2>/dev/null | jq '.employees | length' 2>/dev/null || echo '0')"
        echo "Payroll Records: $(curl -s http://localhost:3000/api/payroll 2>/dev/null | jq '.payrolls | length' 2>/dev/null || echo '0')"
        echo "Petty Cash Transactions: $(curl -s http://localhost:3000/api/petty-cash 2>/dev/null | jq '.transactions | length' 2>/dev/null || echo '0')"
        echo ""
        
    } > "$REPORT_FILE"
    
    info "Report generated: $REPORT_FILE"
    success "Monitoring report completed"
}

# Main monitoring function
monitor() {
    log "🔍 Starting comprehensive monitoring..."
    
    check_system_resources
    check_mongodb
    check_nginx
    check_pm2
    check_application_health
    check_api_endpoints
    check_hr_module
    check_file_uploads
    check_ssl_certificate
    check_backup_status
    generate_report
    
    success "✅ Monitoring completed successfully"
}

# Quick health check
quick_check() {
    log "⚡ Performing quick health check..."
    
    # Check essential services
    if systemctl is-active --quiet mongod && systemctl is-active --quiet nginx; then
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            success "✅ All systems operational"
            return 0
        else
            error "❌ Backend health check failed"
            return 1
        fi
    else
        error "❌ Essential services not running"
        return 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 {monitor|quick|report}"
    echo ""
    echo "Commands:"
    echo "  monitor - Full comprehensive monitoring"
    echo "  quick   - Quick health check"
    echo "  report  - Generate monitoring report only"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN - Domain name (default: winjyerp.com)"
    echo ""
}

# Main script logic
case "$1" in
    monitor)
        monitor
        ;;
    quick)
        quick_check
        ;;
    report)
        generate_report
        ;;
    *)
        usage
        exit 1
        ;;
esac 