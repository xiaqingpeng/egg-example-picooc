# GitHub Secrets 配置指南

## 问题说明
GitHub Actions CI/CD流水线在部署阶段出现了以下错误：
```
Error: missing server host
```

这是因为GitHub Actions需要从GitHub Secrets中获取服务器的主机信息（`SERVER_HOST`），但这个Secret尚未配置。

## 所需配置的Secrets

GitHub Actions配置文件（`.github/workflows/cicd.yml`）中使用了以下Secrets：

| Secret名称 | 描述 |
|----------|------|
| `SERVER_HOST` | 服务器主机地址（IP或域名） |
| `SERVER_USERNAME` | 服务器登录用户名 |
| `SERVER_PASSWORD` | 服务器登录密码 |

## 配置步骤

1. **登录GitHub**，进入你的仓库页面
2. 点击仓库顶部的`Settings`（设置）选项卡
3. 在左侧菜单中，点击`Secrets and variables`（Secrets和变量），然后选择`Actions`
4. 点击右上角的`New repository secret`（新建仓库secret）按钮
5. 依次创建以下三个Secrets：

   - **Name**：`SERVER_HOST`
     **Secret**：输入你的服务器主机地址（例如：`192.168.1.100`或`example.com`）
     点击`Add secret`保存

   - **Name**：`SERVER_USERNAME`
     **Secret**：输入你的服务器登录用户名（例如：`root`或其他用户）
     点击`Add secret`保存

   - **Name**：`SERVER_PASSWORD`
     **Secret**：输入你的服务器登录密码
     点击`Add secret`保存

## 验证配置

配置完成后，你可以重新运行GitHub Actions流水线：
1. 进入仓库的`Actions`选项卡
2. 点击最近失败的流水线
3. 点击右上角的`Re-run jobs`按钮，选择`Re-run failed jobs`

流水线现在应该能够成功连接到服务器并完成部署。

## 注意事项

- 确保你输入的服务器信息是正确的，并且服务器允许从GitHub Actions的IP地址进行SSH连接
- 密码和其他敏感信息会被GitHub加密存储，不会在日志中显示
- 如果你需要更改服务器信息，可以随时在Secrets设置中更新这些值