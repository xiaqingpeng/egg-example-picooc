# 数据库迁移指南

## 概述

本指南说明如何使用数据库迁移脚本来初始化和优化项目数据库。

## 文件说明

### 1. init_database.sql
**用途**: 创建所有业务表结构和初始化数据

**包含内容**:
- 系统基础表：`system_user`（用户表）、`system_notice`（通知表）、`system_api_log`（API日志表）
- 埋点分析表：`analytics_events`（埋点事件表）
- 用户画像表：`user_profiles`（用户画像表）
- 初始化数据：测试用户（test@example.com，密码：test123）

**使用方法**:
```bash
psql -U username -d database_name -f init_database.sql
```

### 2. optimize_database.sql
**用途**: 创建索引、视图、触发器以提升数据库性能

**包含内容**:
- **索引优化**:
  - analytics_events表：5个索引（用户ID+时间、事件名称+时间、事件类型+时间、IP、User-Agent）
  - user_profiles表：6个索引（用户ID、注册时间、最后活跃时间、活跃度等级、价值等级、活跃天数）
  - PostgreSQL GIN索引（可选，用于JSON字段查询）
  
- **视图创建**:
  - `v_event_stats`: 埋点事件统计视图
  - `v_user_activity`: 用户活跃度统计视图
  - `v_api_performance`: API性能统计视图
  
- **触发器**:
  - `update_updated_at_column()`: 自动更新user_profiles表的updated_at字段
  
- **性能优化**:
  - ANALYZE命令更新表统计信息
  - 数据清理脚本（注释状态，按需启用）
  - 性能监控查询（注释状态，按需启用）

**使用方法**:
```bash
psql -U username -d database_name -f optimize_database.sql
```

**注意**: 必须先运行 `init_database.sql` 创建表结构

## 使用步骤

### 首次部署

1. **创建数据库**（如果不存在）:
```bash
createdb -U username database_name
```

2. **初始化表结构**:
```bash
cd database/migrations
psql -U username -d database_name -f init_database.sql
```

3. **优化数据库**:
```bash
psql -U username -d database_name -f optimize_database.sql
```

### 验证安装

执行以下SQL验证表和索引是否创建成功：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 查看所有索引
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 查看所有视图
SELECT 
  table_name as view_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY view_name;

-- 查看所有触发器
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## 数据库表结构

### system_user（系统用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键ID |
| username | VARCHAR(64) | 用户名 |
| email | VARCHAR(128) | 邮箱（唯一） |
| password | VARCHAR(128) | 密码（加密） |
| avatar | VARCHAR(512) | 头像URL |
| createtime | TIMESTAMP | 创建时间 |
| updatetime | TIMESTAMP | 更新时间 |

### system_notice（系统通知表）
| 字段 | 类型 | 说明 |
|------|------|------|
| noticeid | SERIAL | 通知ID |
| noticetitle | VARCHAR(255) | 通知标题 |
| noticetype | VARCHAR(20) | 通知类型 |
| noticecontent | TEXT | 通知内容 |
| status | VARCHAR(10) | 状态（0-草稿，1-已发布） |
| remark | VARCHAR(255) | 备注 |
| createby | VARCHAR(100) | 创建人 |
| updateby | VARCHAR(100) | 更新人 |
| createtime | TIMESTAMP | 创建时间 |
| updatetime | TIMESTAMP | 更新时间 |

### system_api_log（API日志表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 日志ID |
| path | VARCHAR(255) | 请求路径 |
| method | VARCHAR(16) | 请求方法 |
| ip | VARCHAR(64) | 客户端IP |
| request_time | TIMESTAMP | 请求时间 |
| duration_ms | INTEGER | 请求耗时（毫秒） |
| platform | VARCHAR(64) | 客户端平台 |

### analytics_events（埋点事件表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键ID |
| event_name | VARCHAR(255) | 事件名称 |
| event_type | VARCHAR(50) | 事件类型 |
| properties | TEXT | 事件属性（JSON格式） |
| user_id | VARCHAR(255) | 用户ID |
| session_id | VARCHAR(255) | 会话ID |
| duration | INTEGER | 持续时间（毫秒） |
| error_message | TEXT | 错误信息 |
| ip | VARCHAR(45) | IP地址 |
| user_agent | VARCHAR(500) | 用户代理 |
| request_id | VARCHAR(100) | 请求ID |
| created_at | TIMESTAMP | 创建时间 |

### user_profiles（用户画像表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键ID |
| user_id | VARCHAR(255) | 用户ID（唯一） |
| register_time | TIMESTAMP | 注册时间 |
| last_active_time | TIMESTAMP | 最后活跃时间 |
| total_events | INTEGER | 总事件数 |
| active_days | INTEGER | 活跃天数 |
| tags | JSONB | 用户标签（JSON格式） |
| behavior_features | JSONB | 行为特征（JSON格式） |
| value_assessment | JSONB | 价值评估（JSON格式） |
| interest_profile | JSONB | 兴趣画像（JSON格式） |
| activity_level | VARCHAR(50) | 活跃度等级 |
| value_level | VARCHAR(50) | 价值等级 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 数据库视图

### v_event_stats（埋点事件统计视图）
提供埋点事件的统计信息，包括：
- 事件名称和类型
- 总事件数
- 唯一用户数
- 平均持续时间
- 首次和最后出现时间

**查询示例**:
```sql
SELECT * FROM v_event_stats 
WHERE event_name = 'page_view' 
ORDER BY total_count DESC;
```

### v_user_activity（用户活跃度统计视图）
提供用户活跃度统计，包括：
- 用户ID
- 事件总数
- 活跃天数
- 首次和最后事件时间
- 平均持续时间

**查询示例**:
```sql
SELECT * FROM v_user_activity 
WHERE active_days >= 7 
ORDER BY event_count DESC 
LIMIT 100;
```

### v_api_performance（API性能统计视图）
提供API性能统计，包括：
- 请求路径和方法
- 请求总数
- 平均/最大/最小耗时
- 唯一IP数

**查询示例**:
```sql
SELECT * FROM v_api_performance 
WHERE avg_duration > 1000 
ORDER BY avg_duration DESC;
```

## 性能优化建议

### 1. 定期清理过期数据

根据业务需求，定期清理历史数据以保持数据库性能：

```sql
-- 清理90天前的埋点事件数据
DELETE FROM analytics_events 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 清理180天前的非活跃用户画像
DELETE FROM user_profiles 
WHERE last_active_time < NOW() - INTERVAL '180 days';

-- 清理30天前的API日志
DELETE FROM "system_api_log" 
WHERE request_time < NOW() - INTERVAL '30 days';
```

### 2. 定期更新统计信息

建议每周运行一次ANALYZE命令：

```sql
ANALYZE analytics_events;
ANALYZE user_profiles;
ANALYZE "system_api_log";
```

### 3. 监控索引使用情况

定期检查索引使用情况，删除未使用的索引：

```sql
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan, 
  idx_tup_read, 
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('analytics_events', 'user_profiles', 'system_api_log')
ORDER BY idx_scan DESC;
```

### 4. 监控表大小

定期检查表大小，及时清理：

```sql
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('analytics_events', 'user_profiles', 'system_api_log')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 备份与恢复

### 备份数据库

```bash
pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
psql -U username -d database_name < backup_20251231.sql
```

## 故障排查

### 问题1：索引创建失败

**症状**: 执行optimize_database.sql时提示索引已存在

**解决方案**: 脚本已使用`IF NOT EXISTS`语法，可以安全重复执行

### 问题2：视图创建失败

**症状**: 提示表不存在

**解决方案**: 确保先执行了init_database.sql

### 问题3：触发器创建失败

**症状**: 提示函数已存在

**解决方案**: 脚本已使用`DROP TRIGGER IF EXISTS`语法，可以安全重复执行

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2025-12-31 | 初始版本，整合4个迁移文件 |

## 相关文档

- [USER_PROFILE_API_TEST.md](../USER_PROFILE_API_TEST.md) - 用户画像API测试文档
- [ANALYTICS_API_TEST.md](../ANALYTICS_API_TEST.md) - 埋点分析API测试文档
- [EGGJS_ANALYTICS_BACKEND.md](../EGGJS_ANALYTICS_BACKEND.md) - Egg.js后端实现文档

## 支持

如有问题，请查看项目README或联系开发团队。
