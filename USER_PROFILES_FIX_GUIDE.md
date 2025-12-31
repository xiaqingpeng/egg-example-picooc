# 用户画像API修复指南

## 问题说明
以下三个API请求不通：
- `GET /api/analytics/user/list?page=1&pageSize=20` - 获取用户列表
- `GET /api/analytics/user/list?activityLevel=high` - 获取高活跃用户
- `GET /api/analytics/user/list?valueLevel=core` - 获取核心用户

**根本原因：**
1. 数据库中缺少 `user_profiles` 表
2. 表中没有用户画像数据

## 解决步骤

### 步骤1：创建 user_profiles 表

连接到数据库并执行以下SQL脚本：

```bash
# 方式1：使用psql命令行工具
psql -h 120.48.95.51 -p 5432 -U egg_example -d egg_example -f database/migrations/create_user_profiles.sql

# 方式2：使用Docker（如果数据库在Docker中运行）
docker exec -it <postgres_container_name> psql -U egg_example -d egg_example -f /path/to/create_user_profiles.sql
```

或者手动执行SQL：

```sql
-- 创建用户画像表
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  register_time TIMESTAMP,
  last_active_time TIMESTAMP,
  total_events INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  tags JSONB,
  behavior_features JSONB,
  value_assessment JSONB,
  interest_profile JSONB,
  activity_level VARCHAR(50),
  value_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_level ON user_profiles(activity_level);
CREATE INDEX IF NOT EXISTS idx_value_level ON user_profiles(value_level);
CREATE INDEX IF NOT EXISTS idx_last_active_time ON user_profiles(last_active_time);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 步骤2：填充用户画像数据

有两种方式填充数据：

#### 方式1：手动触发批量更新（推荐）

```bash
# 触发批量更新所有用户画像
curl -X POST "http://120.48.95.51:7001/api/user-profile/update-all"
```

#### 方式2：等待定时任务自动执行

定时任务配置在 `app/schedule/updateUserProfile.js`，会自动更新用户画像。

### 步骤3：验证API

执行以下命令验证API是否正常：

```bash
# 获取第一页用户列表
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?page=1&pageSize=20"

# 获取高活跃用户
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?activityLevel=high"

# 获取核心用户
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?valueLevel=core"
```

### 步骤4：检查数据

连接到数据库查看数据：

```sql
-- 查看用户画像数据
SELECT 
  user_id,
  register_time,
  last_active_time,
  total_events,
  active_days,
  activity_level,
  value_level
FROM user_profiles
ORDER BY last_active_time DESC
LIMIT 10;

-- 查看高活跃用户
SELECT * FROM user_profiles WHERE activity_level = '高活跃';

-- 查看核心用户
SELECT * FROM user_profiles WHERE value_level = '核心用户';
```

## 常见问题

### Q1: API返回空数据怎么办？

**A:** 说明 `analytics_events` 表中没有数据，或者用户画像还没有生成。请先：
1. 检查 `analytics_events` 表是否有数据
2. 触发批量更新：`curl -X POST "http://120.48.95.51:7001/api/user-profile/update-all"`

### Q2: API返回500错误怎么办？

**A:** 检查应用日志，常见原因：
1. `user_profiles` 表不存在
2. 数据库连接失败
3. SQL查询语法错误

### Q3: 如何手动更新单个用户的画像？

**A:** 使用以下API：

```bash
curl -X POST "http://120.48.95.51:7001/api/user-profile/update/{userId}"
```

例如：
```bash
curl -X POST "http://120.48.95.51:7001/api/user-profile/update/user123"
```

## 数据库连接信息

- **主机:** 120.48.95.51
- **端口:** 5432
- **数据库:** egg_example
- **用户名:** egg_example
- **密码:** 1994514Xia@@

## 相关文件

- SQL脚本: `database/migrations/create_user_profiles.sql`
- Service: `app/service/userProfile.js`
- Controller: `app/controller/userProfile.js`
- Model: `app/model/user_profile.js`
- 定时任务: `app/schedule/updateUserProfile.js`
