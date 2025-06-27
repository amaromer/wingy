# Construction ERP Deployment Guide

This guide provides step-by-step instructions for deploying the Construction ERP system on a Linux Ubuntu 24 server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Application Deployment](#application-deployment)
4. [SSL Configuration](#ssl-configuration)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 24.04 LTS (recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ available space
- **Network**: Static IP address
- **Domain**: Registered domain name (for SSL)

### Software Requirements

- Node.js 18+ (LTS)
- MongoDB 6+
- Nginx
- PM2 (Process Manager)
- Git
- Certbot (for SSL)

## Server Setup

### 1. Initial Server Configuration

Run the server setup script to install all required software:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/construction-erp/main/deployment/setup-server.sh | sudo bash
```

Or manually execute:

```bash
chmod +x deployment/setup-server.sh
sudo ./deployment/setup-server.sh
```

### 2. Create Application User

```bash
# Create a dedicated user for the application
sudo useradd -m -s /bin/bash construction-erp
sudo usermod -aG sudo construction-erp

# Switch to the new user
sudo su - construction-erp
```

### 3. Clone Repository

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/your-username/construction-erp.git
sudo chown -R construction-erp:construction-erp construction-erp
```

## Application Deployment

### 1. Environment Configuration

Create the environment file for the backend:

```bash
cd /var/www/construction-erp/backend
cp env.example .env
nano .env
```

Configure the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/construction_erp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS (Update with your domain)
FRONTEND_URL=https://your-domain.com
```

### 2. Database Setup

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user (optional)
mongo
use construction_erp
db.createUser({
  user: "erp_user",
  pwd: "your_password",
  roles: ["readWrite"]
})
exit
```

### 3. Build and Deploy

Use the deployment script:

```bash
cd /var/www/construction-erp
chmod +x deployment/deploy.sh
./deployment/deploy.sh deploy
```

Or manually:

```bash
# Install dependencies
npm run install-all

# Build frontend
cd frontend
npm run build

# Start backend with PM2
cd ../backend
pm2 start pm2-ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configure Nginx

Copy the Nginx configuration:

```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/construction-erp
sudo ln -s /etc/nginx/sites-available/construction-erp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
```

Update the configuration with your domain:

```bash
sudo nano /etc/nginx/sites-available/construction-erp
```

Replace `your-domain.com` with your actual domain.

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Configuration

### 1. Obtain SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start Nginx
sudo systemctl start nginx
```

### 2. Configure Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### 1. System Monitoring

Run the monitoring script:

```bash
chmod +x deployment/monitoring.sh
./deployment/monitoring.sh monitor
```

### 2. Log Management

```bash
# View application logs
pm2 logs construction-erp-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u mongod -f
```

### 3. Backup Strategy

```bash
# Create manual backup
./deployment/deploy.sh backup

# Set up automated backups (add to crontab)
0 2 * * * /var/www/construction-erp/deployment/deploy.sh backup
```

### 4. Updates and Maintenance

```bash
# Update application
./deployment/deploy.sh deploy

# Rollback if needed
./deployment/deploy.sh rollback

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 2. Regular Security Updates

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Database Security

```bash
# Secure MongoDB
sudo nano /etc/mongod.conf
# Add authentication and network security settings
```

## Troubleshooting

### Common Issues

#### 1. Application Not Starting

```bash
# Check PM2 status
pm2 list
pm2 logs construction-erp-backend

# Check environment variables
cd /var/www/construction-erp/backend
cat .env
```

#### 2. Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongo --eval "db.adminCommand('ping')"
```

#### 3. Nginx Configuration Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

### Performance Optimization

#### 1. Database Optimization

```bash
# Create indexes for better performance
mongo construction_erp
db.expenses.createIndex({ "projectId": 1 })
db.expenses.createIndex({ "date": -1 })
db.projects.createIndex({ "status": 1 })
```

#### 2. Application Optimization

```bash
# Monitor PM2 processes
pm2 monit

# Scale application
pm2 scale construction-erp-backend 4
```

## Support and Maintenance

### Regular Tasks

- **Daily**: Check application logs and system resources
- **Weekly**: Review backup status and security updates
- **Monthly**: Update dependencies and review performance metrics
- **Quarterly**: Security audit and SSL certificate renewal

### Contact Information

For technical support or questions:
- Email: support@your-domain.com
- Documentation: [GitHub Wiki](https://github.com/your-repo/construction-erp/wiki)
- Issues: [GitHub Issues](https://github.com/your-repo/construction-erp/issues)

## License

This deployment guide is part of the Construction ERP project and is licensed under the MIT License. 