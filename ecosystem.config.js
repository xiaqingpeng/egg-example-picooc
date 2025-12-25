module.exports = {
  apps: [
    {
      name: 'example-picooc',
      script: 'node_modules/egg-scripts/bin/egg-scripts.js',
      args: 'start --title=egg-server-example-picooc --host=0.0.0.0 --workers=1',
      exec_mode: 'fork', // 改用fork模式，减少启动时间
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M', // 减少内存限制，避免资源消耗
      cwd: '/www/wwwroot/egg-example-picooc/',
      env: {
        NODE_ENV: 'production',
        EGG_SERVER_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=256', // 限制Node.js内存使用
      },
      // 简化启动超时设置
      min_uptime: 10000, // 应用至少运行10秒才算启动成功
      listen_timeout: 30000, // 等待应用监听端口的超时时间（30秒）
      kill_timeout: 10000, // 关闭应用的超时时间（10秒）
      restart_delay: 5000, // 重启延迟
    },
  ],
};
