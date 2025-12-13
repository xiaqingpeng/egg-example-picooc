module.exports = {
  apps: [
    {
      name: 'example-picooc',
      script: 'npm',
      args: 'run start -- --host=0.0.0.0',
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      cwd: '/www/wwwroot/egg-example-picooc/',
      env: {
        NODE_ENV: 'production'
      },
      env_dev: {
        NODE_ENV: 'development'
      }
    }
  ]
};
