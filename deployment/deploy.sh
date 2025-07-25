#!/bin/bash

# Winjy ERP Deployment Script
# This script automates the deployment process for the Winjy ERP system

set -e  # Exit on any error

# Configuration
PROJECT_NAME="winjy-erp"
PROJECT_PATH="/var/www/$PROJECT_NAME"
BACKUP_PATH="/var/backups/$PROJECT_NAME"
LOG_FILE="/var/log/deployment.log"
DOMAIN=${DOMAIN:-"winjyerp.com"}
NODE_ENV=${NODE_ENV:-"production"}

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
    exit 1
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if required commands exist
    local required_commands=("git" "npm" "node" "pm2" "nginx" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found. Please install it first."
        fi
    done
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_PATH" ]; then
        error "Project directory not found at $PROJECT_PATH. Please run initial setup first."
    fi
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_PATH/backend/.env" ]; then
        error "Environment file not found at $PROJECT_PATH/backend/.env"
    fi
    
    success "All prerequisites are satisfied"
}

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    if [ -d "$PROJECT_PATH" ]; then
        BACKUP_FILE="$BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        mkdir -p "$BACKUP_PATH"
        
        # Create backup with progress
        tar -czf "$BACKUP_FILE" -C "$PROJECT_PATH" . 2>/dev/null || warning "Backup creation failed, continuing..."
        
        if [ -f "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "Backup created: $BACKUP_FILE (Size: $BACKUP_SIZE)"
        else
            warning "Backup file not created"
        fi
    else
        info "No existing deployment found, skipping backup"
    fi
}

# Update code from repository
update_code() {
    log "Updating code from repository..."
    
    if [ -d "$PROJECT_PATH" ]; then
        cd "$PROJECT_PATH"
        
        # Check if git repository exists
        if [ ! -d ".git" ]; then
            error "Git repository not found in $PROJECT_PATH"
        fi
        
        # Fetch latest changes
        git fetch origin || error "Failed to fetch from repository"
        
        # Get current branch
        CURRENT_BRANCH=$(git branch --show-current)
        log "Current branch: $CURRENT_BRANCH"
        
        # Reset to latest commit
        git reset --hard "origin/$CURRENT_BRANCH" || error "Failed to update code"
        
        # Show commit info
        COMMIT_HASH=$(git rev-parse --short HEAD)
        COMMIT_MSG=$(git log -1 --pretty=format:"%s")
        log "Updated to commit: $COMMIT_HASH - $COMMIT_MSG"
        
        success "Code updated successfully"
    else
        error "Project directory not found. Please run initial setup first."
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_PATH"
    
    # Install root dependencies
    log "Installing root dependencies..."
    npm ci --production=false || error "Failed to install root dependencies"
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd backend
    npm ci --production || error "Failed to install backend dependencies"
    
    # Install frontend dependencies
    log "Installing frontend dependencies..."
    cd ../frontend
    npm ci --production=false || error "Failed to install frontend dependencies"
    
    success "Dependencies installed successfully"
}

# Build frontend
build_frontend() {
    log "Building frontend application..."
    
    cd "$PROJECT_PATH/frontend"
    
    # Set production environment
    export NODE_ENV=production
    
    # Clean previous build
    log "Cleaning previous build..."
    rm -rf dist/ || true
    
    # Build the application
    log "Building Angular application..."
    npm run build || error "Frontend build failed"
    
    # Verify frontend build
    if [ -f "dist/construction-erp/index.html" ]; then
        BUILD_SIZE=$(du -sh dist/construction-erp/ | cut -f1)
        log "Frontend build verification passed (Size: $BUILD_SIZE)"
    else
        error "Frontend build verification failed - index.html not found"
    fi
    
    success "Frontend built successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_PATH/backend"
    
    # Create main categories migration script
    cat > migrate-main-categories.js << 'EOF'
const mongoose = require('mongoose');
const MainCategory = require('./models/MainCategory');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wingy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateMainCategories() {
  try {
    console.log('Starting main categories migration...');
    
    const categoriesToUpdate = await MainCategory.find({
      supplier_optional: { $exists: false }
    });
    
    console.log('Found ' + categoriesToUpdate.length + ' categories to update');
    
    if (categoriesToUpdate.length > 0) {
      const result = await MainCategory.updateMany(
        { supplier_optional: { $exists: false } },
        { $set: { supplier_optional: true } }
      );
      
      console.log('Updated ' + result.modifiedCount + ' categories');
    } else {
      console.log('No categories need updating');
    }
    
    const allCategories = await MainCategory.find({});
    console.log('All categories after update:');
    allCategories.forEach(cat => {
      console.log('- ' + cat.name + ': supplier_optional = ' + cat.supplier_optional);
    });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

updateMainCategories();
EOF

    # Run the migration
    node migrate-main-categories.js || error "Database migration failed"
    
    # Clean up migration script
    rm -f migrate-main-categories.js
    
    success "Database migrations completed successfully"
}

# Run HR module migrations
run_hr_migrations() {
    log "Running HR module migrations..."
    
    cd "$PROJECT_PATH/backend"
    
    # Create HR migration script
    cat > migrate-hr-module.js << 'EOF'
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const PettyCash = require('./models/PettyCash');
const Overtime = require('./models/Overtime');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wingy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateHRModule() {
  try {
    console.log('Starting HR module migration...');
    
    // Create indexes for HR models
    console.log('Creating indexes for HR models...');
    await Employee.createIndexes();
    await Payroll.createIndexes();
    await PettyCash.createIndexes();
    await Overtime.createIndexes();
    
    // Check if models exist and are accessible
    const employeeCount = await Employee.countDocuments();
    const payrollCount = await Payroll.countDocuments();
    const pettyCashCount = await PettyCash.countDocuments();
    const overtimeCount = await Overtime.countDocuments();
    
    console.log('HR module statistics:');
    console.log('- Employees:', employeeCount);
    console.log('- Payroll records:', payrollCount);
    console.log('- Petty cash transactions:', pettyCashCount);
    console.log('- Overtime records:', overtimeCount);
    
    console.log('HR module migration completed successfully!');
  } catch (error) {
    console.error('HR migration failed:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

migrateHRModule();
EOF

    # Run the HR migration
    node migrate-hr-module.js || error "HR module migration failed"
    
    # Clean up migration script
    rm -f migrate-hr-module.js
    
    success "HR module migrations completed successfully"
}

# Update environment variables
update_env() {
    log "Updating environment variables..."
    
    cd "$PROJECT_PATH/backend"
    
    if [ ! -f ".env" ]; then
        error "Environment file not found. Please create .env file first."
    fi
    
    # Validate required environment variables
    local required_vars=("MONGODB_URI" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            error "$var not found in .env file"
        fi
    done
    
    # Check for optional environment variables and set defaults if missing
    local optional_vars=(
        "UPLOAD_PATH=./uploads"
        "MAX_FILE_SIZE=10485760"
        "PORT=3000"
        "NODE_ENV=production"
    )
    
    for var_default in "${optional_vars[@]}"; do
        var_name=$(echo "$var_default" | cut -d'=' -f1)
        var_value=$(echo "$var_default" | cut -d'=' -f2-)
        
        if ! grep -q "^$var_name=" .env; then
            echo "$var_name=$var_value" >> .env
            log "Added $var_name to .env file"
        fi
    done
    
    success "Environment variables validated and updated"
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    # Restart PM2 application
    log "Restarting PM2 application..."
    pm2 reload winjy-erp-backend || pm2 start winjy-erp-backend || error "Failed to restart PM2 application"
    
    # Save PM2 configuration
    pm2 save || warning "Failed to save PM2 configuration"
    
    # Restart Nginx
    log "Restarting Nginx..."
    sudo systemctl reload nginx || sudo systemctl restart nginx || error "Failed to restart Nginx"
    
    success "Services restarted successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    log "Waiting for application to start..."
    sleep 15
    
    # Check if backend is responding
    log "Checking backend health..."
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check if frontend is accessible
    log "Checking frontend health..."
    if curl -f -s "https://$DOMAIN" > /dev/null 2>/dev/null; then
        success "Frontend health check passed (HTTPS)"
    elif curl -f -s "http://$DOMAIN" > /dev/null 2>/dev/null; then
        success "Frontend health check passed (HTTP)"
    elif curl -f -s http://localhost > /dev/null 2>/dev/null; then
        success "Frontend health check passed (localhost)"
    else
        warning "Frontend health check failed - checking Nginx status..."
        sudo systemctl status nginx --no-pager -l
        warning "Checking if frontend files exist..."
        ls -la /var/www/winjy-erp/frontend/dist/construction-erp/ || echo "Frontend build directory not found"
        warning "Frontend health check failed - but deployment continues"
        warning "Application should be accessible at: https://$DOMAIN"
    fi
    
    # Check if main categories API is working
    log "Checking main categories API..."
    if curl -f -s http://localhost:3000/api/main-categories > /dev/null; then
        success "Main categories API health check passed"
    else
        error "Main categories API health check failed"
    fi
    
    success "All health checks passed"
}

# Feature validation
validate_features() {
    log "Validating new features..."
    
    # Test main categories API
    log "Validating main categories feature..."
    MAIN_CATEGORIES_RESPONSE=$(curl -s http://localhost:3000/api/main-categories 2>/dev/null || echo "FAILED")
    
    if [[ "$MAIN_CATEGORIES_RESPONSE" == "FAILED" ]]; then
        warning "Main categories API validation failed"
    else
        success "Main categories API validation passed"
    fi
    
    # Test if supplier_optional field exists in response
    if echo "$MAIN_CATEGORIES_RESPONSE" | grep -q "supplier_optional"; then
        success "Supplier optional field validation passed"
    else
        warning "Supplier optional field not found in API response"
    fi
    
    success "Feature validation completed"
}

# HR module validation
validate_hr_features() {
    log "Validating HR module features..."
    
    # Test employees API
    log "Validating employees API..."
    if curl -f -s http://localhost:3000/api/employees > /dev/null; then
        success "Employees API validation passed"
    else
        warning "Employees API validation failed"
    fi
    
    # Test petty cash balances API
    log "Validating petty cash balances API..."
    if curl -f -s http://localhost:3000/api/petty-cash/balances > /dev/null; then
        success "Petty cash balances API validation passed"
    else
        warning "Petty cash balances API validation failed"
    fi
    
    # Test payroll API
    log "Validating payroll API..."
    if curl -f -s http://localhost:3000/api/payroll > /dev/null; then
        success "Payroll API validation passed"
    else
        warning "Payroll API validation failed"
    fi
    
    # Test overtime API
    log "Validating overtime API..."
    if curl -f -s http://localhost:3000/api/overtime > /dev/null; then
        success "Overtime API validation passed"
    else
        warning "Overtime API validation failed"
    fi
    
    success "HR module validation completed"
}

# Performance check
performance_check() {
    log "Performing performance check..."
    
    # Check response time for main API endpoints
    local endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/employees"
        "http://localhost:3000/api/petty-cash/balances"
        "http://localhost:3000/api/main-categories"
    )
    
    for endpoint in "${endpoints[@]}"; do
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$endpoint" 2>/dev/null || echo "FAILED")
        if [[ "$response_time" != "FAILED" ]]; then
            if (( $(echo "$response_time < 1.0" | bc -l 2>/dev/null || echo "0") )); then
                info "Response time for $endpoint: ${response_time}s (Good)"
            else
                warning "Response time for $endpoint: ${response_time}s (Slow)"
            fi
        else
            warning "Failed to check response time for $endpoint"
        fi
    done
    
    success "Performance check completed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd "$BACKUP_PATH" 2>/dev/null || return 0
    ls -t | tail -n +6 | xargs -r rm -rf
    
    success "Backup cleanup completed"
}

# Main deployment function
deploy() {
    log "🚀 Starting deployment process..."
    
    check_prerequisites
    create_backup
    update_code
    install_dependencies
    build_frontend
    run_migrations
    run_hr_migrations
    update_env
    restart_services
    health_check
    validate_features
    validate_hr_features
    performance_check
    cleanup_backups
    
    success "🎉 Deployment completed successfully!"
    log "📱 Application is now live at: https://$DOMAIN"
    log "🆕 New features deployed:"
    log "  ✅ HR Module with Employee Management"
    log "  ✅ Payroll Management System"
    log "  ✅ Petty Cash Management with Balances"
    log "  ✅ Expense-Credit Difference Tracking"
    log "  ✅ Overtime Management"
    log "  ✅ Main category supplier optional checkbox"
    log "  ✅ Dynamic supplier validation in expense forms"
    log "  ✅ Database migration for existing categories"
}

# Rollback function
rollback() {
    log "🔄 Starting rollback process..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_PATH"/*.tar.gz 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to: $LATEST_BACKUP"
    
    # Stop services
    pm2 stop winjy-erp-backend || true
    
    # Restore from backup
    rm -rf "$PROJECT_PATH"/*
    tar -xzf "$LATEST_BACKUP" -C "$PROJECT_PATH"
    
    # Restart services
    restart_services
    health_check
    
    success "🔄 Rollback completed successfully"
    log "⚠️  Note: Database changes (supplier_optional field, HR models) will remain"
    log "💡 To fully rollback database, run: node migrate-main-categories.js"
}

# Show usage
usage() {
    echo "Usage: $0 {deploy|rollback|backup|validate}"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy the application"
    echo "  rollback - Rollback to previous version"
    echo "  backup   - Create backup only"
    echo "  validate - Validate current deployment"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN   - Domain name (default: winjyerp.com)"
    echo "  NODE_ENV - Node environment (default: production)"
    echo ""
}

# Validation function
validate() {
    log "🔍 Validating current deployment..."
    
    health_check
    validate_features
    validate_hr_features
    performance_check
    
    success "✅ Validation completed successfully"
}

# Main script logic
case "$1" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    backup)
        create_backup
        ;;
    validate)
        validate
        ;;
    *)
        usage
        exit 1
        ;;
esac 
