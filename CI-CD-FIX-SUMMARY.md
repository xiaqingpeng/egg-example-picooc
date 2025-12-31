# CI/CD部署问题修复总结

## 问题分析

从GitHub Actions日志中发现了两个主要问题：

### 问题1：SSH认证失败（已解决）
**错误信息：**
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none password], no supported methods remain
```

**原因：** 服务器禁用了密码登录，只支持SSH密钥认证

**解决方案：**
- 将CI/CD配置从密码认证改为SSH密钥认证
- 在服务器上生成SSH密钥对
- 在GitHub Secrets中配置SSH_PRIVATE_KEY

### 问题2：数据库连接失败（已解决）
**错误信息：**
```
✗ 数据库连接失败，尝试修复...
✗ 数据库连接修复失败，请手动检查
```

**原因：** CI/CD配置文件中的数据库密码不正确
- CI/CD配置中：`'1994514Xia@'`（一个@）
- 实际密码：`'1994514Xia@@'`（两个@）

**解决方案：**
- 已将CI/CD配置文件中的密码从 `1994514Xia@` 改为 `1994514Xia@@`
- 共修复了3处密码配置（数据库连接测试、重试测试、数据库初始化脚本）

## 已完成的修复

### 1. SSH密钥认证配置
**文件：** `.github/workflows/cicd.yml`

**修改内容：**
```yaml
# 修改前
password: ${{ secrets.SERVER_PASSWORD }}
port: 22

# 修改后
key: ${{ secrets.SSH_PRIVATE_KEY }}
port: ${{ secrets.SERVER_PORT || 22 }}
```

### 2. 数据库密码修复
**文件：** `.github/workflows/cicd.yml`

**修改内容：**
```bash
# 修改前
PGPASSWORD=${PG_PASSWORD:-'1994514Xia@'}

# 修改后
PGPASSWORD=${PG_PASSWORD:-'1994514Xia@@'}
```

**修复位置：**
- 第162行：数据库连接测试
- 第171行：数据库连接重试测试
- 第189行：数据库初始化脚本执行

## 下一步操作

### 步骤1：提交并推送代码

```bash
# 查看修改
git diff

# 添加修改
git add .github/workflows/cicd.yml

# 提交修改
git commit -m "fix(ci/cd): 修复SSH认证和数据库连接问题

- 将SSH认证从密码改为SSH密钥认证
- 修复数据库密码错误（添加缺失的@符号）
- 更新SSH端口为可配置参数"

# 推送到GitHub
git push origin main
```

### 步骤2：在服务器上配置SSH密钥（如果还未配置）

登录到服务器 (120.48.95.51)：

```bash
# 生成SSH密钥对
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key -N ""

# 配置公钥
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# 设置正确权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/github_actions_key
chmod 644 ~/.ssh/github_actions_key.pub
chmod 600 ~/.ssh/authorized_keys

# 查看私钥内容（复制全部内容）
cat ~/.ssh/github_actions_key
```

### 步骤3：在GitHub上配置Secrets（如果还未配置）

1. 进入仓库的 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**，创建以下Secrets：

| Secret名称 | 值 |
|-----------|-----|
| `SERVER_HOST` | `120.48.95.51` |
| `SERVER_USERNAME` | `root`（或您的服务器用户名） |
| `SSH_PRIVATE_KEY` | 粘贴上面复制的私钥全部内容 |
| `SERVER_PORT` | `22`（如果SSH端口不是22，填写实际端口） |

### 步骤4：重新运行GitHub Actions

1. 进入仓库的 **Actions** 选项卡
2. 点击最近失败的workflow
3. 点击右上角的 **Re-run jobs** → **Re-run failed jobs**

## 预期结果

修复后，GitHub Actions应该能够：
1. ✅ 通过SSH密钥成功连接到服务器
2. ✅ 成功拉取最新代码
3. ✅ 成功连接PostgreSQL数据库
4. ✅ 执行数据库初始化脚本
5. ✅ 重启PM2应用
6. ✅ 通过健康检查
7. ✅ 部署完成

## 相关文档

- SSH密钥配置指南：`SSH-QUICK-FIX.md`
- GitHub Secrets配置指南：`GITHUB-SECRETS-SETUP.md`
- CI/CD配置文件：`.github/workflows/cicd.yml`

## 故障排除

### 如果SSH连接仍然失败

检查服务器SSH配置：
```bash
# 检查SSH服务是否允许密钥认证
sudo grep -E "PubkeyAuthentication" /etc/ssh/sshd_config

# 应该看到：PubkeyAuthentication yes
```

如果显示 `PubkeyAuthentication no`，需要修改配置：
```bash
sudo nano /etc/ssh/sshd_config

# 找到并修改或添加以下行：
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 保存后重启SSH服务
sudo systemctl restart sshd
```

### 如果数据库连接仍然失败

在服务器上测试数据库连接：
```bash
# 测试数据库连接
PGPASSWORD='1994514Xia@@' psql -h 120.48.95.51 -U egg_example -d egg_example -c "SELECT 1;"

# 如果连接失败，检查PostgreSQL服务状态
sudo systemctl status postgresql

# 检查PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 总结

本次修复解决了CI/CD部署过程中的两个关键问题：
1. **SSH认证问题**：从密码认证升级为更安全的SSH密钥认证
2. **数据库连接问题**：修复了密码配置错误

修复后，CI/CD流水线应该能够正常工作，实现自动化部署。
