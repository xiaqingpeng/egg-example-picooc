# push-all.sh 使用说明

## 功能概述

`push-all.sh` 脚本用于同时推送代码到 Gitee 和 GitHub，并自动检查 GitHub CI/CD 构建状态。

## 新增功能

### GitHub CI/CD 构建状态检查

脚本会在推送完成后自动检查 GitHub Actions 的最新构建状态，包括：
- 构建状态（运行中、已完成）
- 构建结论（成功、失败、已取消）
- 构建详情链接
- 失败时提供查看日志的命令

## 使用方法

### 基本使用

```bash
./push-all.sh
```

### 配置 GitHub CI/CD 检查

脚本支持两种方式查询 GitHub Actions 构建状态：

#### 方式一：使用 GitHub CLI（推荐）

1. **安装 GitHub CLI**

```bash
# macOS
brew install gh

# Linux
sudo apt install gh
# 或
sudo yum install gh

# Windows
# 从 https://cli.github.com/ 下载安装
```

2. **登录 GitHub**

```bash
gh auth login
```

3. **使用脚本**

```bash
./push-all.sh
```

脚本会自动使用 `gh` 命令查询构建状态，无需额外配置。

#### 方式二：使用 GitHub API Token

1. **创建 GitHub Personal Access Token**

   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token" → "Generate new token (classic)"
   - 选择权限：
     - `repo`（仓库访问权限）
     - `workflow`（工作流权限）
   - 生成并复制 token

2. **设置环境变量**

```bash
# 临时设置（当前终端会话）
export GITHUB_TOKEN="your_token_here"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

3. **使用脚本**

```bash
./push-all.sh
```

## 输出示例

### 成功构建

```
========================================
    检查GitHub CI/CD构建状态
========================================

使用GitHub CLI查询构建状态...

构建信息:
  Run ID: 1234567890
  状态: completed
  结论: ✓ 成功
  详情: https://github.com/xiaqingpeng/egg-example-picooc/actions/runs/1234567890

========================================
✓ 脚本执行完成！
========================================
```

### 构建失败

```
========================================
    检查GitHub CI/CD构建状态
========================================

使用GitHub CLI查询构建状态...

构建信息:
  Run ID: 1234567890
  状态: completed
  结论: ✗ 失败
  详情: https://github.com/xiaqingpeng/egg-example-picooc/actions/runs/1234567890

查看失败日志:
  gh run view 1234567890 --repo xiaqingpeng/egg-example-picooc --log-failed

========================================
✓ 脚本执行完成！
========================================
```

### 构建中

```
========================================
    检查GitHub CI/CD构建状态
========================================

使用GitHub CLI查询构建状态...

构建信息:
  Run ID: 1234567890
  状态: in_progress
  结论: 运行中...
  详情: https://github.com/xiaqingpeng/egg-example-picooc/actions/runs/1234567890

========================================
✓ 脚本执行完成！
========================================
```

### 未配置

```
========================================
    检查GitHub CI/CD构建状态
========================================

⚠️  未配置GITHUB_TOKEN，无法查询构建状态
提示: 设置环境变量 GITHUB_TOKEN 来启用此功能
查看构建状态: https://github.com/xiaqingpeng/egg-example-picooc/actions

========================================
✓ 脚本执行完成！
========================================
```

## 高级功能

### 手动查看构建状态

如果脚本执行后想再次查看构建状态，可以使用：

```bash
# 使用 GitHub CLI
gh run list --repo xiaqingpeng/egg-example-picooc --limit 5

# 查看特定构建的详细信息
gh run view <run_id> --repo xiaqingpeng/egg-example-picooc

# 查看失败日志
gh run view <run_id> --repo xiaqingpeng/egg-example-picooc --log-failed
```

### 实时监控构建

```bash
# 监控最新构建
gh run watch --repo xiaqingpeng/egg-example-picooc

# 监控特定构建
gh run watch <run_id> --repo xiaqingpeng/egg-example-picooc
```

## 故障排除

### 问题：GitHub CLI 未安装

**错误信息：**
```
✗ GitHub CLI查询失败，尝试使用API...
```

**解决方案：**
- 安装 GitHub CLI（见上方安装说明）
- 或配置 GitHub API Token（见上方配置说明）

### 问题：GitHub Token 无效

**错误信息：**
```
✗ GitHub API请求失败
```

**解决方案：**
- 检查 Token 是否正确
- 确认 Token 有足够的权限（repo、workflow）
- 重新生成 Token

### 问题：未找到 workflow 运行记录

**错误信息：**
```
✗ 未找到workflow运行记录
```

**解决方案：**
- 检查 GitHub Actions workflow 文件是否存在
- 确认推送的分支是否触发 workflow（通常是 main 或 master 分支）
- 手动访问 https://github.com/xiaqingpeng/egg-example-picooc/actions 查看历史记录

## 配置文件说明

脚本中的可配置参数：

```bash
# GitHub 仓库配置
GITHUB_REPO="xiaqingpeng/egg-example-picooc"
GITHUB_API_URL="https://api.github.com/repos/${GITHUB_REPO}/actions/runs"
```

如果需要修改仓库名称，请更新 `GITHUB_REPO` 变量。

## 依赖要求

### 必需依赖
- `git` - 版本控制
- `curl` - HTTP 请求（用于 GitHub API）
- `jq` - JSON 处理（用于 GitHub API）

### 可选依赖
- `gh` - GitHub CLI（推荐，提供更好的体验）

### 安装依赖

```bash
# macOS
brew install jq curl

# Ubuntu/Debian
sudo apt install jq curl

# CentOS/RHEL
sudo yum install jq curl
```

## 注意事项

1. **安全性**：不要将 `GITHUB_TOKEN` 提交到版本控制系统
2. **权限**：确保 Token 有足够的权限访问仓库和工作流
3. **网络**：确保能够访问 GitHub API（api.github.com）
4. **分支**：CI/CD 通常只在 main/master 分支触发，其他分支可能不会自动构建

## 相关链接

- GitHub Actions 文档：https://docs.github.com/en/actions
- GitHub CLI 文档：https://cli.github.com/
- GitHub API 文档：https://docs.github.com/en/rest

## 更新日志

### v2.0 (2026-01-01)
- ✨ 新增 GitHub CI/CD 构建状态检查功能
- ✨ 支持 GitHub CLI 和 GitHub API 两种查询方式
- ✨ 自动显示构建状态和结论
- ✨ 构建失败时提供查看日志的命令
- 🎨 优化输出格式，提升用户体验
