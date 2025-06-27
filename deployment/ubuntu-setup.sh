#!/bin/bash

# Ubuntu 24.04 Server Setup Script for Construction ERP
# Run this script as root or with sudo privileges

set -e  # Exit on any error

echo "🚀 Starting Ubuntu 24.04 server setup for Construction ERP..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 20.x (LTS)
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MongoDB 7.0
echo "📦 Installing MongoDB 7.0..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start and enable MongoDB
echo "🔧 Starting MongoDB service..."
systemctl start mongod
systemctl enable mongod

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Install Angular CLI
echo "📦 Installing Angular CLI..."
npm install -g @angular/cli

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/construction-erp
chown -R $SUDO_USER:$SUDO_USER /var/www/construction-erp

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p /var/www/construction-erp/uploads
chmod 755 /var/www/construction-erp/uploads

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# Install SSL certificate tools
echo "📦 Installing SSL certificate tools..."
apt install -y certbot python3-certbot-nginx

# Create systemd service files
echo "🔧 Creating systemd service files..."

# MongoDB service (already created by installation)
echo "✅ MongoDB service configured"

# Create PM2 startup script
echo "🔧 Setting up PM2 startup..."
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo "✅ Ubuntu server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository to /var/www/construction-erp"
echo "2. Configure environment variables"
echo "3. Build the frontend application"
echo "4. Start the backend with PM2"
echo "5. Configure Nginx as reverse proxy"
echo "6. Set up SSL certificates"
echo ""
echo "🔧 Useful commands:"
echo "- Check MongoDB status: sudo systemctl status mongod"
echo "- Check Nginx status: sudo systemctl status nginx"
echo "- View logs: sudo journalctl -u mongod -f"
echo "" 