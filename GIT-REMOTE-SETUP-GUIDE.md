# Git 远程仓库设置指南 (Gitee 版本)

## 问题分析

从终端错误信息可以看出：
```
% git push origin main                                                                        
fatal: 'origin' does not appear to be a git repository                                              
fatal: Could not read from remote repository.
```

这表明当前项目没有配置远程仓库地址，需要创建 Gitee 远程仓库并与本地仓库关联。

## 步骤1：在 Gitee 上创建远程仓库

### 操作步骤

1. **登录 Gitee**
   - 打开浏览器，访问 `https://gitee.com` 并登录

2. **创建新仓库**
   - 点击右上角的 `+` 按钮，选择 `新建仓库`
   - 填写仓库信息：
     - **仓库名称**：`egg-example-picooc`
     - **仓库路径**：`your-username/egg-example-picooc`（自动生成）
     - **仓库介绍**（可选）：`Egg.js 示例项目，集成了 CI/CD`
     - **是否开源**：选择 `公开` 或 `私有`
     - **初始化 README 文件**：不要勾选
     - **添加 .gitignore**：不要勾选（本地已有 .gitignore）
     - **选择许可证**：根据需要选择
   - 点击 `创建仓库` 按钮

3. **获取远程仓库地址**
   - 创建成功后，页面会显示仓库的 Git URL
   - 复制 `HTTPS` 或 `SSH` 格式的地址，例如：
     - HTTPS：`https://gitee.com/your-username/egg-example-picooc.git`
     - SSH：`git@gitee.com:your-username/egg-example-picooc.git`

## 步骤2：关联本地仓库与远程仓库

### 操作步骤

1. **打开终端并进入项目目录**
   ```bash
   cd /Applications/qingpengxia/develop/front-end/node/egg-example-picooc
   ```

2. **添加远程仓库地址**
   ```bash
   # 使用 HTTPS 格式
   git remote add origin https://gitee.com/your-username/egg-example-picooc.git
   
   # 或使用 SSH 格式
   git remote add origin git@gitee.com:your-username/egg-example-picooc.git
   ```

3. **验证远程仓库关联**
   ```bash
   git remote -v
   ```
   
   预期输出：
   ```
   origin  https://gitee.com/your-username/egg-example-picooc.git (fetch)
   origin  https://gitee.com/your-username/egg-example-picooc.git (push)
   ```

## 步骤3：推送本地代码到远程仓库

### 操作步骤

1. **推送代码到 main 分支**
   ```bash
   git push -u origin main
   ```

2. **输入 Gitee 凭证**
   - 如果使用 HTTPS 格式，会提示输入 Gitee 用户名和密码
   - 建议使用 **私人令牌**（Personal Access Token）作为密码

3. **验证推送结果**
   - 刷新 Gitee 仓库页面
   - 确认本地代码已成功推送到远程仓库

## 步骤4：配置 Gitee CI/CD 所需的密钥

按照以下步骤添加 Gitee CI/CD 密钥：

1. **进入仓库设置**
   - 在 Gitee 仓库页面，点击 `管理` 按钮
   - 选择 `流水线` → `密钥管理`

2. **添加密钥**
   - 点击 `添加密钥` 按钮
   - 依次添加以下密钥：

     | 密钥名称 | 值 | 说明 |
     |---------|-----|------|
     | `SERVER_HOST` | `120.48.95.51` | 服务器 IP 地址 |
     | `SERVER_USERNAME` | `root` | 服务器用户名 |
     | `SERVER_PASSWORD` | 您的服务器密码 | 服务器登录密码 |

   - 每个密钥添加完成后，点击 `保存` 按钮

## 步骤5：启用 Gitee Actions

1. **进入流水线设置**
   - 在 Gitee 仓库页面，点击 `流水线` 标签
   - 点击 `启用流水线` 按钮

2. **验证流水线**
   - 代码推送后，流水线会自动触发
   - 点击流水线名称查看构建和部署状态

## 常见问题排查

### 问题：SSH 连接失败

**解决方法**：
1. 检查 SSH 密钥是否已添加到 Gitee
2. 重新生成 SSH 密钥对：
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```
3. 将公钥添加到 Gitee：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   复制输出内容到 Gitee 的 SSH Keys 设置中

### 问题：推送时权限错误

**解决方法**：
1. 确认 Gitee 账户有仓库的写入权限
2. 检查私人令牌的权限设置（需要 `projects` 权限）
3. 重新生成私人令牌

### 问题：分支名称不匹配

**解决方法**：
```bash
# 检查本地分支名称
git branch

# 如果本地分支是 master，重命名为 main
git branch -M main
```

## 总结

✅ **步骤1**：在 Gitee 上创建远程仓库
✅ **步骤2**：关联本地仓库与远程仓库
✅ **步骤3**：推送本地代码到远程仓库
✅ **步骤4**：配置 Gitee CI/CD 密钥
✅ **步骤5**：启用 Gitee Actions

完成以上步骤后，Gitee CI/CD 流程将自动触发，开始构建和部署应用。
