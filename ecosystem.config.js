module.exports = {
  apps: [
    {
      name: 'unser-geheimnis-de',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/unser-geheimnis-de',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
