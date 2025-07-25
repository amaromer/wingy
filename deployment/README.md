# Winjy ERP Deployment Guide

This directory contains deployment scripts and configuration files for the Winjy ERP system.

## 📁 Files Overview

### Core Deployment Scripts
- **`deploy.sh`** - Main deployment script with comprehensive features
- **`monitoring.sh`** - System monitoring and health checks
- **`ubuntu-setup.sh`** - Initial server setup for Ubuntu

### Configuration Files
- **`pm2-ecosystem.config.js`** - PM2 process management configuration
- **`nginx.conf`** - Nginx reverse proxy configuration
- **`nginx-http.conf`** - HTTP to HTTPS redirect configuration

## 🚀 Deployment Commands

### Full Deployment
```bash
# Deploy the application
./deploy.sh deploy

# Deploy with custom domain
DOMAIN=your-domain.com ./deploy.sh deploy
```

### Rollback
```bash
# Rollback to previous version
./deploy.sh rollback
```

### Backup Only
```bash
# Create backup without deploying
./deploy.sh backup
```

### Validation
```bash
# Validate current deployment
./deploy.sh validate
```

## 🔍 Monitoring Commands

### Full Monitoring
```bash
# Comprehensive system monitoring
./monitoring.sh monitor
```

### Quick Health Check
```bash
# Quick system health check
./monitoring.sh quick
```

### Generate Report
```bash
# Generate monitoring report
./monitoring.sh report
```

## 🆕 New Features in This Version

### HR Module Support
- ✅ **Employee Management** - Complete employee CRUD operations
- ✅ **Payroll System** - Salary calculation with overtime and deductions
- ✅ **Petty Cash Management** - Employee petty cash tracking
- ✅ **Expense-Credit Difference** - Real-time expense vs credit analysis
- ✅ **Overtime Management** - Overtime tracking and calculation

### Enhanced Deployment Features
- ✅ **Prerequisites Check** - Validates all required tools and files
- ✅ **HR Module Migrations** - Automatic database setup for HR features
- ✅ **Performance Monitoring** - Response time checks for all API endpoints
- ✅ **Enhanced Error Handling** - Better error reporting and recovery
- ✅ **Environment Variables** - Configurable domain and environment settings

### Improved Monitoring
- ✅ **HR Module Statistics** - Employee, payroll, and petty cash counts
- ✅ **API Endpoint Monitoring** - All HR and core API endpoints
- ✅ **Performance Metrics** - Response time analysis
- ✅ **File Upload Monitoring** - Upload directory size and file count
- ✅ **SSL Certificate Monitoring** - Certificate expiry tracking

## 📊 Deployment Process

### 1. Prerequisites Check
- Validates required commands (git, npm, node, pm2, nginx, curl)
- Checks project directory and environment file existence
- Ensures proper permissions and access

### 2. Backup Creation
- Creates timestamped backup of current deployment
- Stores backups in `/var/backups/winjy-erp/`
- Maintains last 5 backups automatically

### 3. Code Update
- Fetches latest code from repository
- Shows commit information and branch details
- Handles both main and master branches

### 4. Dependency Installation
- Installs root, backend, and frontend dependencies
- Uses `npm ci` for consistent installations
- Handles production vs development dependencies

### 5. Frontend Build
- Cleans previous build artifacts
- Builds Angular application for production
- Verifies build output and size

### 6. Database Migrations
- **Main Categories Migration** - Adds supplier_optional field
- **HR Module Migration** - Creates indexes and validates models
- **Statistics Reporting** - Shows migration results

### 7. Environment Configuration
- Validates required environment variables
- Sets default values for optional variables
- Ensures proper configuration

### 8. Service Restart
- Restarts PM2 application with error handling
- Reloads Nginx configuration
- Saves PM2 configuration

### 9. Health Checks
- Backend API health validation
- Frontend accessibility checks
- API endpoint response verification

### 10. Feature Validation
- **Core Features** - Main categories and supplier validation
- **HR Module** - Employees, payroll, petty cash, overtime APIs
- **Performance** - Response time analysis for all endpoints

## 🔧 Configuration

### Environment Variables
```bash
# Domain configuration
DOMAIN=your-domain.com

# Node environment
NODE_ENV=production

# Custom paths (optional)
PROJECT_PATH=/var/www/winjy-erp
BACKUP_PATH=/var/backups/winjy-erp
```

### Required Environment Variables (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/wingy

# Security
JWT_SECRET=your-secret-key

# Optional (auto-configured)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
PORT=3000
NODE_ENV=production
```

## 📈 Monitoring Features

### System Resources
- CPU usage monitoring
- Memory usage tracking
- Disk space analysis
- Available space reporting

### Service Health
- MongoDB connection and size
- Nginx status and error logs
- PM2 process monitoring
- SSL certificate expiry

### Application Health
- Backend API responsiveness
- Frontend accessibility
- API endpoint performance
- Error log analysis

### HR Module Statistics
- Employee count
- Payroll records
- Petty cash transactions
- Overtime records
- Balance summaries

### File Management
- Upload directory size
- File count monitoring
- Large file detection
- Backup status tracking

## 🛠️ Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check prerequisites
./deploy.sh validate

# Check logs
tail -f /var/log/deployment.log

# Manual health check
./monitoring.sh quick
```

#### Service Issues
```bash
# Check PM2 status
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check MongoDB
sudo systemctl status mongod
```

#### Performance Issues
```bash
# Full monitoring
./monitoring.sh monitor

# Check specific endpoints
curl -w "@-" -o /dev/null -s "http://localhost:3000/api/health"
```

### Rollback Process
```bash
# Automatic rollback
./deploy.sh rollback

# Manual rollback
cd /var/www/winjy-erp
git reset --hard HEAD~1
pm2 reload winjy-erp-backend
```

## 📋 Pre-deployment Checklist

- [ ] Server has required tools (git, npm, node, pm2, nginx)
- [ ] MongoDB is installed and running
- [ ] SSL certificate is configured
- [ ] Environment file (.env) is properly configured
- [ ] Domain DNS is pointing to server
- [ ] Firewall allows ports 80, 443, 3000
- [ ] Sufficient disk space available
- [ ] Backup strategy is in place

## 🎯 Post-deployment Verification

### Quick Verification
```bash
# Run quick health check
./monitoring.sh quick

# Check HR module
curl -s http://localhost:3000/api/employees | jq '.employees | length'
curl -s http://localhost:3000/api/petty-cash/balances | jq 'length'
```

### Full Verification
```bash
# Comprehensive monitoring
./monitoring.sh monitor

# Generate report
./monitoring.sh report
```

## 📞 Support

For deployment issues:
1. Check the deployment log: `/var/log/deployment.log`
2. Run monitoring: `./monitoring.sh monitor`
3. Validate deployment: `./deploy.sh validate`
4. Check system resources and service status

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Added HR module support
- ✅ Enhanced monitoring capabilities
- ✅ Improved error handling
- ✅ Added performance metrics
- ✅ Better backup management

### v1.0.0 (Previous)
- Basic deployment functionality
- Core application monitoring
- Simple backup system 