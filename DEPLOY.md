# 部署说明

## 问题说明

远程服务器 `http://120.48.95.51:7001` 上的代码还是旧版本，导致updateUserInfo接口的参数验证没有正确执行。

## 解决方案

### 方案1：手动触发GitHub Actions部署（推荐）

1. 访问GitHub仓库的Actions页面
2. 找到最新的CI/CD工作流
3. 点击"Re-run job"按钮重新运行部署

### 方案2：手动SSH部署

如果GitHub Actions无法自动部署，可以手动SSH到服务器执行部署：

```bash
# SSH连接到服务器
ssh username@120.48.95.51

# 进入项目目录
cd /www/wwwroot/egg-example-picooc

# 拉取最新代码
git pull gitee main

# 安装依赖
npm install --production

# 重启应用
pm2 restart egg-example-picooc

# 查看日志确认启动成功
pm2 logs --lines 20
```

### 方案3：使用部署脚本

我已经创建了 `deploy.sh` 脚本，可以快速部署：

```bash
# 运行部署脚本
./deploy.sh
```

## 验证部署

部署完成后，运行测试脚本验证：

```bash
# 修改测试脚本使用远程服务器
sed -i '' 's|BASE_URL="http://localhost:7001"|BASE_URL="http://120.48.95.51:7001"|' test_update_user_info.sh

# 运行测试
./test_update_user_info.sh
```

## 本地测试结果

本地服务器测试结果：**10/10 (100%)** ✅

所有测试场景都成功通过：

1. ✅ 注册新用户
2. ✅ 登录获取Session
3. ✅ 只更新用户名
4. ✅ 更新邮箱和密码
5. ✅ 更新所有字段
6. ✅ 无效的用户ID - 正确拒绝
7. ✅ 空用户名 - 正确拒绝
8. ✅ 无效邮箱格式 - 正确拒绝
9. ✅ 密码太短 - 正确拒绝
10. ✅ 未登录访问 - 正确拒绝

## 接口功能说明

### PUT /user/info

**需要认证**: 是

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 否 | 要更新的用户ID，不传则更新当前登录用户 |
| username | string | 否 | 用户名（1-64字符） |
| email | string | 否 | 邮箱地址（需符合邮箱格式，1-128字符） |
| password | string | 否 | 密码（6-128字符） |
| avatar | string | 否 | 头像URL（最多512字符） |

**特性**:
- ✅ 支持任意字段组合更新
- ✅ 完整的参数验证
- ✅ 需要登录认证
- ✅ 自动密码加密
- ✅ 更新当前用户时自动更新session

**请求示例**:

```bash
# 只更新用户名
curl -X PUT http://120.48.95.51:7001/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"username": "newusername"}'

# 更新邮箱和密码
curl -X PUT http://120.48.95.51:7001/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email": "newemail@example.com", "password": "newpassword123"}'

# 更新所有字段
curl -X PUT http://120.48.95.51:7001/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "id": 123,
    "username": "username",
    "email": "email@example.com",
    "password": "password123",
    "avatar": "http://example.com/avatar.jpg"
  }'
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "User info updated successfully",
  "data": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "avatar": "http://example.com/avatar.jpg",
    "createTime": "2024-01-01T00:00:00.000Z",
    "updateTime": "2024-01-02T00:00:00.000Z"
  }
}
```

**错误响应**:

```json
{
  "code": 401,
  "msg": "Not logged in"
}
```

```json
{
  "code": 422,
  "msg": "Invalid user ID"
}
```

```json
{
  "code": 422,
  "msg": "Username cannot be empty"
}
```

```json
{
  "code": 422,
  "msg": "Invalid email format"
}
```

```json
{
  "code": 422,
  "msg": "Password must be at least 6 characters"
}
```
