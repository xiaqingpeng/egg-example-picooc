# 用户画像API修复总结

## 问题描述

USER_PROFILE_API_TEST.md 文件中第517-523行的三个curl命令无法访问：

1. `GET /api/analytics/user/list?page=1&pageSize=20` - 获取用户列表
2. `GET /api/analytics/user/list?activityLevel=high` - 获取高活跃用户
3. `GET /api/analytics/user/list?valueLevel=core` - 获取核心用户

## 问题根本原因

### 1. 数据库表缺失
- `user_profiles` 表虽然存在，但没有数据
- 需要从 `analytics_events` 表中计算用户画像数据

### 2. 参数值不匹配
- 测试文档使用英文参数值：`activityLevel=high`、`valueLevel=core`
- 代码实际返回中文值：`高活跃`、`核心用户`、`流失用户`等

### 3. URL编码问题
- curl命令直接使用中文字符会导致400错误
- 需要使用 `--data-urlencode` 参数或手动URL编码

### 4. 应用未重启
- 路由配置已更新，但应用未重启导致新路由未生效

## 修复步骤

### 步骤1：创建SQL脚本
创建了 `database/migrations/create_user_profiles.sql` 文件，包含：
- 创建 `user_profiles` 表
- 创建必要的索引
- 创建更新时间触发器

### 步骤2：填充用户画像数据
执行批量更新命令：
```bash
curl -X POST "http://120.48.95.51:7001/api/user-profile/update-all"
```

结果：成功更新28个用户的画像数据

### 步骤3：更新测试文档
修改 `USER_PROFILE_API_TEST.md` 文件，将参数值从英文改为中文：
- `activityLevel=high` → `activityLevel=高活跃`
- `valueLevel=core` → `valueLevel=核心用户`

### 步骤4：添加URL编码处理
在测试文档中添加了两种curl命令格式：

**方式1：使用 --data-urlencode**
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list" --get --data-urlencode "activityLevel=高活跃"
```

**方式2：使用URL编码后的参数**
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?activityLevel=%E9%AB%98%E6%B4%BB%E8%B7%83"
```

### 步骤5：重启应用
```bash
ssh root@120.48.95.51 "cd /www/wwwroot/egg-example-picooc && pm2 restart example-picooc"
```

## 验证结果

### API 1：获取用户列表
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?page=1&pageSize=20"
```
**结果：** ✅ 成功
```json
{
  "success": true,
  "data": {
    "users": [{}, {}, ...],
    "total": 28,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

### API 2：获取高活跃用户
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list" --get --data-urlencode "activityLevel=高活跃"
```
**结果：** ✅ 成功
```json
{
  "success": true,
  "data": {
    "users": [],
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 0
  }
}
```
（当前数据中没有高活跃用户，返回空列表是正常的）

### API 3：获取核心用户
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list" --get --data-urlencode "valueLevel=核心用户"
```
**结果：** ✅ 成功
```json
{
  "success": true,
  "data": {
    "users": [],
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 0
  }
}
```
（当前数据中没有核心用户，返回空列表是正常的）

## 数据统计

- **总用户数：** 28个
- **总事件数：** 151条
- **活跃度分布：** 全部为"低活跃"
- **价值等级分布：** 全部为"流失用户"

## 相关文件

### 修改的文件
1. `USER_PROFILE_API_TEST.md` - 更新了API测试命令
2. `app/router.js` - 已包含正确的路由配置

### 新建的文件
1. `database/migrations/create_user_profiles.sql` - 用户画像表创建脚本
2. `USER_PROFILES_FIX_GUIDE.md` - 详细的修复指南

### 相关代码文件
1. `app/controller/userProfile.js` - 用户画像控制器
2. `app/service/userProfile.js` - 用户画像服务
3. `app/model/user_profile.js` - 用户画像模型
4. `app/schedule/updateUserProfile.js` - 定时更新任务

## 使用建议

### 1. URL编码处理
在curl命令中使用中文参数时，推荐使用 `--data-urlencode` 参数：

```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list" \
  --get \
  --data-urlencode "activityLevel=高活跃" \
  --data-urlencode "valueLevel=核心用户"
```

### 2. 前端调用
前端调用时，浏览器会自动处理URL编码，无需手动编码：

```javascript
// 使用fetch API
fetch('http://120.48.95.51:7001/api/analytics/user/list?activityLevel=高活跃&valueLevel=核心用户')
  .then(res => res.json())
  .then(data => console.log(data));

// 使用axios
axios.get('http://120.48.95.51:7001/api/analytics/user/list', {
  params: {
    activityLevel: '高活跃',
    valueLevel: '核心用户'
  }
});
```

### 3. 定时更新用户画像
用户画像数据会通过定时任务自动更新（配置在 `app/schedule/updateUserProfile.js`），也可以手动触发：

```bash
# 更新单个用户
curl -X POST "http://120.48.95.51:7001/api/user-profile/update/{userId}"

# 批量更新所有用户
curl -X POST "http://120.48.95.51:7001/api/user-profile/update-all"
```

## 总结

✅ **所有问题已解决：**
1. ✅ 数据库表已创建并填充数据
2. ✅ 测试文档参数值已更正
3. ✅ URL编码问题已解决
4. ✅ 应用已重启，路由生效
5. ✅ 所有三个API均可正常访问

**当前状态：** 所有API测试用例均可正常运行，返回正确的数据格式。
