module.exports = {
  apps: [{
    name: 'construction-erp-backend',
    script: 'server.js',
    cwd: '/var/www/construction-erp/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/construction-erp-error.log',
    out_file: '/var/log/pm2/construction-erp-out.log',
    log_file: '/var/log/pm2/construction-erp-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    cron_restart: '0 2 * * *', // Restart daily at 2 AM
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000
  }]
}; 