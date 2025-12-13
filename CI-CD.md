# CI/CD 集成说明 (Gitee 版本)

## 概述

本项目已集成 Gitee Actions 实现 CI/CD 自动化流程，包括代码检查、测试和自动部署功能。

## CI/CD 配置文件

配置文件路径：`.gitee/workflows/cicd.yml`

## 功能特性

1. **代码质量检查**：使用 ESLint 进行代码风格检查
2. **自动化测试**：自动运行单元测试确保功能正常
3. **自动部署**：代码推送到主分支后自动部署到生产服务器
4. **状态反馈**：在 Gitee 仓库页面展示构建和部署状态

## 工作流说明

### 触发条件

- 代码推送到 `main` 或 `master` 分支时自动触发
- 提交 Pull Request 到 `main` 或 `master` 分支时自动触发

### 工作流步骤

#### 1. 构建和测试 (build-test)

1. **检出代码**：从 Gitee 仓库检出最新代码
2. **设置 Node.js 环境**：使用 Node.js 18.x 版本
3. **安装依赖**：使用 npm install 安装项目依赖
4. **代码检查**：运行 npm run lint 检查代码质量
5. **运行测试**：运行 npm run test:local 执行单元测试

#### 2. 部署 (deploy)

- **依赖条件**：只有当 build-test 任务成功完成时才会执行
- **触发条件**：只有在代码推送到主分支时才会执行

1. **检出代码**：从 Gitee 仓库检出最新代码
2. **自动部署**：通过 SSH 连接到服务器并执行部署脚本
   - 进入项目目录
   - 拉取最新代码
   - 安装生产依赖
   - 重启应用服务

## 配置说明

### 服务器连接配置

在 Gitee 仓库中设置以下密钥：

- `SERVER_HOST`: 服务器 IP 地址
- `SERVER_USERNAME`: 服务器用户名
- `SERVER_PASSWORD`: 服务器密码

### 自定义部署脚本

部署脚本位于 `.gitee/workflows/cicd.yml` 文件的 deploy 部分，可以根据需要修改：

```yaml
script: |
  # 进入项目目录
  cd /www/wwwroot/egg-example-picooc
  
  # 拉取最新代码
  git pull origin main
  
  # 安装依赖
  npm install --production
  
  # 重启应用
  pm2 restart ecosystem.config.js
  
  # 显示状态
  pm2 status
```

## 使用方法

### 1. 推送代码触发 CI/CD

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 2. 查看 CI/CD 状态

1. 登录 Gitee，进入项目仓库
2. 点击 `流水线` 标签
3. 查看最新的构建和部署状态
4. 点击流水线名称查看详细日志

## 测试说明

项目已配置单元测试，位于 `test` 目录下。测试框架使用 Egg.js 内置的测试工具。

### 运行测试命令

```bash
# 本地运行测试
npm run test:local

# 运行特定测试文件
npm run test:local -- --grep="notice"
```

## 常见问题

### 构建失败

- **依赖安装失败**：检查网络连接和 package.json 配置
- **代码检查失败**：根据 ESLint 提示修复代码风格问题
- **测试失败**：根据测试报告修复功能问题

### 部署失败

- **服务器连接问题**：检查 SERVER_HOST、SERVER_USERNAME、SERVER_PASSWORD 配置
- **项目目录问题**：确保服务器上存在 /www/wwwroot/egg-example-picooc 目录
- **权限问题**：确保服务器用户有足够权限执行部署命令

## 扩展建议

1. **添加更多测试**：增加集成测试和端到端测试
2. **环境分离**：为开发、测试和生产环境配置不同的部署流程
3. **版本管理**：添加自动版本号生成和发布功能
4. **监控集成**：添加应用性能监控和告警功能

## 总结

Gitee CI/CD 已成功集成到项目中，通过自动化流程提高开发效率和代码质量。

如需修改配置，请编辑 `.gitee/workflows/cicd.yml` 文件。
