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

Gitee CI/CD 密钥是流水线部署阶段的关键配置，用于安全连接和操作远程服务器。以下是详细的配置步骤：

### 4.1 进入密钥管理界面

**当前 Gitee 界面（2024年12月更新）的操作步骤：**

1. **打开 Gitee 仓库主页**
   - 访问您创建的 Gitee 仓库：`https://gitee.com/your-username/egg-example-picooc`

2. **进入仓库设置**
   - 在仓库页面的右侧，点击 `设置` 按钮（齿轮图标）
   - 或者，点击页面顶部的 `管理` 按钮（如果可见）

3. **找到密钥管理入口**
   - 在左侧导航栏中，向下滚动找到 `流水线` 分类
   - 点击 `流水线` 分类展开子菜单
   - 选择 `密钥管理` 选项
   - 您将进入密钥管理页面

**注意：** 如果您在当前 Gitee 界面找不到上述入口，请尝试以下替代路径：
- 仓库主页 → `设置` → `CI/CD` → `密钥管理`
- 仓库主页 → `管理` → `CI/CD` → `密钥管理`
- 仓库主页 → `流水线` 标签页 → 右上角 `设置` 按钮 → `密钥管理`

Gitee 可能会定期更新界面布局，如有差异，请以最新界面为准。

### 4.2 添加 CI/CD 密钥

1. **添加服务器 IP 密钥**
   - 点击页面右上角的 `添加密钥` 按钮
   - 填写密钥信息：
     - **密钥名称**：`SERVER_HOST`（必须与流水线配置文件中的变量名一致）
     - **密钥值**：`120.48.95.51`（这是您的服务器公网 IP 地址）
     - **可见范围**：选择 `所有分支`（如果您的 CI/CD 流程需要在多个分支上运行）
     - **描述**：可选，建议填写 "服务器 IP 地址" 以便日后识别
   - 点击 `保存` 按钮

2. **添加服务器用户名密钥**
   - 再次点击 `添加密钥` 按钮
   - 填写密钥信息：
     - **密钥名称**：`SERVER_USERNAME`
     - **密钥值**：`root`（服务器的登录用户名）
     - **可见范围**：选择 `所有分支`
     - **描述**：可选，建议填写 "服务器登录用户名"
   - 点击 `保存` 按钮

3. **添加服务器密码密钥**
   - 再次点击 `添加密钥` 按钮
   - 填写密钥信息：
     - **密钥名称**：`SERVER_PASSWORD`
     - **密钥值**：输入您的服务器登录密码
     - **可见范围**：选择 `所有分支`
     - **描述**：可选，建议填写 "服务器登录密码"
   - 点击 `保存` 按钮

### 4.3 密钥配置注意事项

1. **密钥名称必须与流水线配置一致**
   - 确保密钥名称（如 `SERVER_HOST`）与 `.gitee/workflows/cicd.yml` 文件中使用的环境变量名称完全一致
   - 大小写敏感，例如 `SERVER_HOST` 和 `server_host` 是两个不同的密钥

2. **密钥值的准确性**
   - 服务器 IP 地址必须是公网可访问的 IP
   - 服务器用户名和密码必须是具有 SSH 登录权限的有效凭据
   - 密码中如果包含特殊字符，无需转义，直接输入即可

3. **密钥的安全性**
   - 这些密钥包含服务器的敏感信息，Gitee 会加密存储
   - 密钥值在保存后将不可再次查看，只能修改或删除
   - 建议定期更新服务器密码并同步更新此密钥
   - 避免在公开场合或代码中泄露这些密钥

4. **可见范围设置**
   - 选择 `所有分支` 允许 CI/CD 在所有分支上运行
   - 如果您只需要在特定分支（如 `main`）上运行 CI/CD，可以选择 `指定分支`

### 4.4 密钥验证方法

添加密钥后，可以通过以下方式验证：

1. **查看密钥列表**
   - 在密钥管理页面，您可以看到已添加的所有密钥
   - 密钥值会被隐藏，只能看到密钥名称和描述

2. **测试流水线运行**
   - 配置完成后，推送代码到 Gitee 仓库
   - 查看流水线运行状态，如果部署阶段成功连接服务器，则说明密钥配置正确

### 4.5 常见密钥配置问题

**问题1：密钥名称拼写错误**
- **症状**：流水线部署阶段报错 "环境变量未定义"
- **解决方法**：检查密钥名称是否与流水线配置文件完全一致

**问题2：服务器 IP 地址错误**
- **症状**：SSH 连接超时或拒绝连接
- **解决方法**：确认服务器公网 IP 地址是否正确，检查服务器防火墙设置

**问题3：服务器密码错误**
- **症状**：SSH 连接提示 "Permission denied (password)"
- **解决方法**：确认服务器密码是否正确，尝试手动 SSH 登录验证

**问题4：密钥可见范围限制**
- **症状**：只有特定分支可以正常运行 CI/CD
- **解决方法**：检查密钥的可见范围设置，确保包含目标分支

**问题5：找不到 Gitee CI/CD 密钥管理入口**
- **症状**：在 Gitee 界面上找不到 "密钥管理" 或 "流水线" 相关选项
- **解决方法**：
  1. 确认您具有仓库的管理员权限
  2. 检查 Gitee 界面是否已更新，尝试不同的导航路径
  3. 参考本指南的 "进入密钥管理界面" 部分的替代路径
  4. 尝试使用 Gitee 最新的界面布局：仓库主页 → `设置` → `CI/CD` → `密钥管理`

## 步骤4.6：解决 Node.js 版本兼容性问题

从您提供的错误日志可以看到 Node.js 版本兼容性问题：
```
npm WARN notsup Not compatible with your version of node/npm: @typescript-eslint/parser@6.21.0
npm WARN notsup Unsupported engine for @typescript-eslint/eslint-plugin@6.21.0: wanted: {"node":"^16.0.0 || >=18.0.0"} (current: {"node":"14.16.0","npm":"6.14.11"})
```

### 问题分析

这表明 CI/CD 流程在服务器上使用了 Node.js 14.16.0，但项目需要 Node.js 16.0.0 或更高版本（推荐 18.0.0+）。

### 解决方案

我已经在 CI/CD 配置中添加了 Node.js 环境变量设置，确保使用正确的版本：

1. **修改后的 CI/CD 配置**：
   ```yaml
   # 设置Node.js环境变量
   export PATH=/www/server/nodejs/v24.12.0/bin:$PATH
   ```

2. **验证方法**：
   - 推送代码到 Gitee 仓库，触发 CI/CD 流程
   - 在流水线日志中查看 "Node.js版本:" 和 "npm版本:" 输出
   - 确认使用的是 Node.js 24.12.0（或其他兼容版本）

3. **手动验证**：
   ```bash
   # 登录服务器
   ssh root@120.48.95.51
   
   # 进入项目目录
   cd /www/wwwroot/egg-example-picooc
   
   # 设置Node.js环境变量
   export PATH=/www/server/nodejs/v24.12.0/bin:$PATH
   
   # 验证版本
   node -v
   npm -v
   ```

**注意**：如果您的服务器上没有 Node.js 24.12.0 版本，请安装兼容的 Node.js 版本（18.0.0+）。

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
