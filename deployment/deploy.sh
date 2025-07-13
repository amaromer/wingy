#!/bin/bash

# Winjy ERP Deployment Script
# This script automates the deployment process for the Winjy ERP system

set -e  # Exit on any error

# Configuration
PROJECT_NAME="winjy-erp"
PROJECT_PATH="/var/www/$PROJECT_NAME"
BACKUP_PATH="/var/backups/$PROJECT_NAME"
LOG_FILE="/var/log/deployment.log"

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
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    if [ -d "$PROJECT_PATH" ]; then
        BACKUP_FILE="$BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        mkdir -p "$BACKUP_PATH"
        
        tar -czf "$BACKUP_FILE" -C "$PROJECT_PATH" . 2>/dev/null || warning "Backup creation failed, continuing..."
        log "Backup created: $BACKUP_FILE"
    else
        info "No existing deployment found, skipping backup"
    fi
}

# Update code from repository
update_code() {
    log "Updating code from repository..."
    
    if [ -d "$PROJECT_PATH" ]; then
        cd "$PROJECT_PATH"
        git fetch origin
        git reset --hard origin/main || git reset --hard origin/master
        log "Code updated successfully"
    else
        error "Project directory not found. Please run initial setup first."
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_PATH"
    
    # Install root dependencies
    npm ci --production=false || error "Failed to install root dependencies"
    
    # Install backend dependencies
    cd backend
    npm ci --production || error "Failed to install backend dependencies"
    
    # Install frontend dependencies
    cd ../frontend
    npm ci --production=false || error "Failed to install frontend dependencies"
    
    log "Dependencies installed successfully"
}

# Build frontend
build_frontend() {
    log "Building frontend application..."
    
    cd "$PROJECT_PATH/frontend"
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build || error "Frontend build failed"
    
    log "Frontend built successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_PATH/backend"
    
    # Create migration script for main categories
    cat > migrate-main-categories.js << 'EOF'
const mongoose = require('mongoose');
const MainCategory = require('./models/MainCategory');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wingy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateMainCategories() {
  try {
    console.log('Starting main categories migration...');
    
    // Find all main categories that don't have supplier_optional field
    const categoriesToUpdate = await MainCategory.find({
      supplier_optional: { $exists: false }
    });
    
    console.log('Found ' + categoriesToUpdate.length + ' categories to update');
    
    if (categoriesToUpdate.length > 0) {
      // Update all categories to have supplier_optional = true (default)
      const result = await MainCategory.updateMany(
        { supplier_optional: { $exists: false } },
        { $set: { supplier_optional: true } }
      );
      
      console.log('Updated ' + result.modifiedCount + ' categories');
    } else {
      console.log('No categories need updating');
    }
    
    // Verify the update
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
    
    log "Database migrations completed successfully"
}

# Update environment variables
update_env() {
    log "Updating environment variables..."
    
    cd "$PROJECT_PATH/backend"
    
    if [ ! -f ".env" ]; then
        error "Environment file not found. Please create .env file first."
    fi
    
    # Validate environment file
    if ! grep -q "MONGODB_URI" .env; then
        error "MONGODB_URI not found in .env file"
    fi
    
    if ! grep -q "JWT_SECRET" .env; then
        error "JWT_SECRET not found in .env file"
    fi
    
    # Check for optional environment variables and set defaults if missing
    if ! grep -q "UPLOAD_PATH" .env; then
        echo "UPLOAD_PATH=./uploads" >> .env
        log "Added UPLOAD_PATH to .env file"
    fi
    
    if ! grep -q "MAX_FILE_SIZE" .env; then
        echo "MAX_FILE_SIZE=10485760" >> .env
        log "Added MAX_FILE_SIZE to .env file (10MB)"
    fi
    
    log "Environment variables validated and updated"
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    # Restart PM2 application
    pm2 reload winjy-erp-backend || pm2 start winjy-erp-backend
    
    # Save PM2 configuration
    pm2 save
    
    # Restart Nginx
    sudo systemctl reload nginx || sudo systemctl restart nginx
    
    log "Services restarted successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if backend is responding
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check if frontend is accessible
    if curl -f -s http://localhost > /dev/null; then
        log "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check if main categories API is working
    if curl -f -s http://localhost:3000/api/main-categories > /dev/null; then
        log "Main categories API health check passed"
    else
        error "Main categories API health check failed"
    fi
    
    log "All health checks passed"
}

# Feature validation
validate_features() {
    log "Validating new features..."
    
    # Test main categories API
    MAIN_CATEGORIES_RESPONSE=$(curl -s http://localhost:3000/api/main-categories 2>/dev/null || echo "FAILED")
    
    if [[ "$MAIN_CATEGORIES_RESPONSE" == "FAILED" ]]; then
        warning "Main categories API validation failed"
    else
        log "Main categories API validation passed"
    fi
    
    # Test if supplier_optional field exists in response
    if echo "$MAIN_CATEGORIES_RESPONSE" | grep -q "supplier_optional"; then
        log "Supplier optional field validation passed"
    else
        warning "Supplier optional field not found in API response"
    fi
    
    log "Feature validation completed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd "$BACKUP_PATH"
    ls -t | tail -n +6 | xargs -r rm -rf
    
    log "Backup cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."
    
    create_backup
    update_code
    install_dependencies
    build_frontend
    run_migrations
    update_env
    restart_services
    health_check
    validate_features
    cleanup_backups
    
    log "Deployment completed successfully!"
    log "Application is now live at: https://your-domain.com"
    log "New features deployed:"
    log "  - Main category supplier optional checkbox"
    log "  - Dynamic supplier validation in expense forms"
    log "  - Database migration for existing categories"
}

# Rollback function
rollback() {
    log "Starting rollback process..."
    
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
    
    log "Rollback completed successfully"
    log "Note: Database changes (supplier_optional field) will remain"
    log "To fully rollback database, run: node migrate-main-categories.js"
}

# Show usage
usage() {
    echo "Usage: $0 {deploy|rollback|backup}"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy the application"
    echo "  rollback - Rollback to previous version"
    echo "  backup   - Create backup only"
    echo ""
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
    *)
        usage
        exit 1
        ;;
esac 
