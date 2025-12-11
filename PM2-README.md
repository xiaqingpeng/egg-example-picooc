# PM2自动管理配置指南

## 已完成的配置

1. **安装PM2**：已全局安装PM2
2. **创建配置文件**：创建了`ecosystem.config.js`配置文件
3. **启动应用**：应用已通过PM2成功启动
4. **验证运行**：API接口正常响应

## PM2配置说明

配置文件：`ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'example-picooc',           // 应用名称
      script: 'npm',                    // 启动脚本
      args: 'run start',               // 脚本参数
      exec_mode: 'cluster',            // 集群模式
      instances: 'max',                // 实例数量（根据CPU核心数自动调整）
      autorestart: true,               // 自动重启失败的实例
      watch: false,                    // 不启用文件监控
      max_memory_restart: '1G',        // 内存超过1G时重启
      env: {
        NODE_ENV: 'production'         // 生产环境变量
      },
      env_dev: {
        NODE_ENV: 'development'        // 开发环境变量
      }
    }
  ]
};
```

## PM2常用命令

### 启动应用
```bash
# 开发环境启动
pm run dev

# 通过PM2启动（开发环境）
pm2 start ecosystem.config.js --env dev

# 通过PM2启动（生产环境）
pm2 start ecosystem.config.js --env production
```

### 查看状态
```bash
pm2 status
```

### 查看日志
```bash
# 查看所有应用日志
pm2 logs

# 查看特定应用日志
pm2 logs example-picooc

# 实时监控日志
pm2 logs --follow
```

### 重启应用
```bash
# 重启所有应用
pm2 restart all

# 重启特定应用
pm2 restart example-picooc
```

### 停止应用
```bash
# 停止所有应用
pm2 stop all

# 停止特定应用
pm2 stop example-picooc
```

### 删除应用
```bash
# 删除所有应用
pm2 delete all

# 删除特定应用
pm2 delete example-picooc
```

### 自动重启配置

PM2已经配置了自动重启功能：
- 应用崩溃时自动重启
- 内存使用超过1G时自动重启
- 可以通过`autorestart`参数控制（当前已设置为`true`）

### 设置开机自启动

在生产环境中，建议设置PM2开机自启动：

```bash
# 设置开机自启动
pm2 startup

# 保存当前应用列表
pm2 save
```

## 注意事项

1. **端口冲突**：如果端口被占用，需要修改Egg.js配置文件中的端口设置
2. **环境变量**：可以在`ecosystem.config.js`中配置不同环境的变量
3. **监控**：PM2提供了监控面板，可以通过`pm2 monit`查看
4. **日志管理**：PM2会自动管理日志文件，默认保存在`~/.pm2/logs/`目录

## 项目启动方式对比

| 方式 | 命令 | 特点 |
|------|------|------|
| 开发模式 | `npm run dev` | 开发热重载，单实例 |
| Egg脚本 | `npm start` | 生产环境，后台运行，单实例 |
| PM2 | `pm2 start ecosystem.config.js` | 生产环境，集群模式，多实例，自动管理 |

## 建议

1. 在开发环境使用`npm run dev`
2. 在生产环境使用PM2管理应用
3. 定期查看日志和监控应用状态
4. 根据服务器资源调整`instances`和`max_memory_restart`参数
