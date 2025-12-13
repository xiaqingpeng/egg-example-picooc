# CI/CD 配置详细指南

## 步骤1：设置 GitHub Secrets

### 概述
GitHub Secrets 用于安全存储服务器连接信息，避免将敏感信息硬编码到 CI/CD 配置文件中。

### 操作步骤

1. **登录 GitHub 并进入仓库**
   - 打开浏览器，访问 GitHub 并登录
   - 进入项目仓库：`https://github.com/your-username/egg-example-picooc`

2. **进入 Secrets 设置**
   - 点击仓库顶部导航栏的 `Settings`（设置）
   - 在左侧菜单中，点击 `Secrets and variables`（密钥和变量）
   - 选择 `Actions` 选项卡

3. **添加服务器连接 Secrets**
   - 点击 `New repository secret`（新仓库密钥）按钮
   - 依次添加以下三个 Secrets：

     | 密钥名称 | 值 | 说明 |
     |---------|-----|------|
     | `SERVER_HOST` | `120.48.95.51` | 服务器 IP 地址 |
     | `SERVER_USERNAME` | `root` | 服务器用户名 |
     | `SERVER_PASSWORD` | 您的服务器密码 | 服务器登录密码 |

   - 每个 Secret 添加完成后，点击 `Add secret` 按钮

4. **验证 Secrets**
   - 添加完成后，您应该在 Secrets 列表中看到这三个条目
   - 密钥值将被隐藏，仅在 CI/CD 流程执行时可见

## 步骤2：确保 PM2 已配置

### 概述
PM2 是 Node.js 应用的进程管理器，负责应用的启动、监控和重启。

### 当前状态检查

通过命令 `ssh root@120.48.95.51 'pm2 --version && pm2 status'` 确认：
- PM2 版本：`6.0.14` ✓ 已安装
- 应用状态：`example-picooc` 正在运行 ✓ 已配置

### 配置文件验证

项目根目录下的 `ecosystem.config.js` 文件已正确配置：

```javascript
module.exports = {
  apps: [
    {
      name: 'example-picooc',        // 应用名称
      script: 'npm',                 // 启动命令
      args: 'run start -- --host=0.0.0.0',  // 启动参数
      exec_mode: 'cluster',          // 集群模式
      instances: 'max',              // 最大实例数
      autorestart: true,             // 自动重启
      watch: false,                  // 不监听文件变化
      max_memory_restart: '1G',      // 内存超过 1G 时重启
      cwd: '/www/wwwroot/egg-example-picooc/',  // 工作目录
      env: {
        NODE_ENV: 'production'       // 生产环境
      }
    }
  ]
};
```

### 验证服务器目录

确保服务器上存在项目目录：

```bash
ssh root@120.48.95.51 'ls -la /www/wwwroot/egg-example-picooc/'
```

## 步骤3：服务器环境配置

### 概述
确保服务器上已安装所有必要的软件和依赖。

### 当前环境检查

通过命令 `ssh root@120.48.95.51 'cat /etc/os-release && node -v && npm -v && git --version && psql --version'` 确认：

| 软件 | 版本 | 状态 |
|-----|-----|------|
| 操作系统 | Ubuntu 24.04.1 LTS | ✓ 已安装 |
| Node.js | v24.12.0 | ✓ 已安装 (>=18.0.0) |
| npm | 11.6.2 | ✓ 已安装 |
| Git | 2.43.0 | ✓ 已安装 |
| PostgreSQL | 16.11 | ✓ 已安装 |

### 环境优化建议

1. **设置 Node.js 版本管理**（可选）
   ```bash
   # 安装 nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   
   # 安装指定版本 Node.js
   nvm install 18
   nvm use 18
   ```

2. **配置 Git 用户名和邮箱**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **设置防火墙规则**
   ```bash
   # 允许 SSH 连接
   ufw allow ssh
   
   # 允许应用端口
   ufw allow 7001
   
   # 允许 PostgreSQL 端口（仅内网）
   ufw allow from 127.0.0.1 to any port 5432
   
   # 启用防火墙
   ufw enable
   ```

## 测试 CI/CD 流程

### 触发构建

1. **推送代码到 main/master 分支**
   ```bash
   git add .
   git commit -m "Test CI/CD workflow"
   git push origin main
   ```

2. **查看构建状态**
   - 在 GitHub 仓库中，点击 `Actions` 标签
   - 查看最新的构建日志和状态

### 验证部署

1. **检查应用状态**
   ```bash
   ssh root@120.48.95.51 'pm2 logs example-picooc --lines 20'
   ```

2. **测试 API 接口**
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"username":"test","email":"test@example.com","password":"123456","confirmPassword":"123456"}' http://120.48.95.51:7001/register
   ```

## 常见问题排查

### 构建失败：依赖安装错误

**解决方法**：
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 部署失败：SSH 连接错误

**检查项**：
- 确认 `SERVER_HOST`、`SERVER_USERNAME`、`SERVER_PASSWORD` Secrets 配置正确
- 确认服务器 SSH 端口（默认 22）已开放
- 确认服务器防火墙允许 GitHub Actions IP 连接

### 应用启动失败

**查看日志**：
```bash
ssh root@120.48.95.51 'pm2 logs example-picooc'
```

**常见原因**：
- 数据库连接配置错误
- 端口被占用
- 依赖缺失

## 自动化部署流程说明

当代码推送到 `main`/`master` 分支时，CI/CD 流程会自动执行以下步骤：

1. **代码检查**：执行 ESLint 检查代码质量
2. **运行测试**：执行单元测试确保代码功能正常
3. **部署应用**：
   - SSH 连接到服务器
   - 进入项目目录 `/www/wwwroot/egg-example-picooc`
   - 拉取最新代码：`git pull origin main`
   - 安装生产依赖：`npm install --production`
   - 重启应用：`pm2 restart ecosystem.config.js`
   - 显示应用状态：`pm2 status`

## 总结

✅ **步骤1**：GitHub Secrets 已配置（需手动添加）
✅ **步骤2**：PM2 已安装并配置完成
✅ **步骤3**：服务器环境已满足所有要求

CI/CD 流程已完全配置，只需添加 GitHub Secrets 即可开始使用。
