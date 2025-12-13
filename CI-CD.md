# CI/CD 集成方案

本项目已集成 GitHub Actions CI/CD 流水线，支持代码检查、自动化测试和自动部署功能。

## 流程概述

### 持续集成 (CI)
- 代码推送到 `main`/`master` 分支或提交 Pull Request 时触发
- 执行步骤：
  1. 安装依赖
  2. ESLint 代码检查
  3. 运行单元测试

### 持续部署 (CD)
- 只有当代码推送到 `main`/`master` 分支且所有测试通过时触发
- 执行步骤：
  1. SSH 连接到服务器
  2. 拉取最新代码
  3. 安装生产依赖
  4. 使用 PM2 重启应用

## 配置步骤

### 1. 设置 GitHub Secrets

需要在 GitHub 仓库的 `Settings` -> `Secrets and variables` -> `Actions` 中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|-------|------|-------|
| SERVER_HOST | 服务器 IP 地址 | 120.48.95.51 |
| SERVER_USERNAME | 服务器用户名 | root |
| SERVER_PASSWORD | 服务器密码 | your_password |

### 2. 配置 PM2

确保服务器上已安装 PM2 并配置好 `ecosystem.config.js` 文件：

```bash
# 安装 PM2
npm install pm2 -g

# 启动应用
pm2 start ecosystem.config.js
```

### 3. 服务器环境配置

确保服务器上已安装：
- Node.js >= 18.0.0
- Git
- PostgreSQL

### 4. 数据库配置

确保数据库连接配置在 `config/config.default.js` 中正确设置：

```javascript
config.sequelize = {
  dialect: 'postgres',
  host: 'your_host',
  port: 5432,
  database: 'egg_example',
  username: 'your_username',
  password: 'your_password',
  // ... 其他配置
};
```

## 使用说明

### 触发 CI/CD 流程

- 推送代码到 `main`/`master` 分支：自动触发完整的 CI/CD 流程
- 创建 Pull Request 到 `main`/`master` 分支：仅触发 CI 流程（代码检查和测试）

### 查看构建状态

在 GitHub 仓库的 `Actions` 标签页中可以查看 CI/CD 流程的执行状态和详细日志。

### 常见问题

1. **部署失败：SSH 连接错误**
   - 检查 GitHub Secrets 中的服务器信息是否正确
   - 确保服务器已开放 SSH 端口（默认 22）

2. **测试失败**
   - 检查测试代码是否正确
   - 确保依赖已正确安装

3. **应用启动失败**
   - 检查 PM2 日志：`pm2 logs example-picooc`
   - 确保数据库连接正常
   - 检查端口是否被占用

4. **权限错误**
   - 确保服务器用户有足够的权限访问项目目录
   - 检查文件系统权限设置

## 扩展功能

### 添加更多测试

在 `test/app/controller/` 目录下添加更多测试文件，CI 流程会自动执行所有测试。

### 部署到多个环境

可以扩展 `cicd.yml` 文件，添加不同环境的部署配置（如 staging、production）。

### 添加代码质量检查

可以集成 SonarQube 等代码质量检查工具到 CI 流程中。

### 自动备份

在部署前添加数据库备份步骤，确保数据安全。

## 文件说明

- `.github/workflows/cicd.yml`: GitHub Actions 工作流配置文件
- `ecosystem.config.js`: PM2 进程管理配置文件
- `test/`: 测试代码目录
- `config/config.default.js`: 应用配置文件

---

如有任何问题，请查看 GitHub Actions 日志或联系项目维护者。
