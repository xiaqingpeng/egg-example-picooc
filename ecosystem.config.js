module.exports = {
  apps: [
    {
      name: 'example-picooc',
      script: 'npm',
      args: 'run start',
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      env_dev: {
        NODE_ENV: 'development'
      }
    }
  ]
};
