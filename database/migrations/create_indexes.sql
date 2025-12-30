-- 数据库索引优化脚本
-- 用于优化analytics_events和user_profiles表的查询性能

-- 1. analytics_events表的索引优化

-- 创建复合索引：用户ID + 创建时间（用于查询用户事件历史）
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created 
ON analytics_events(user_id, created_at DESC);

-- 创建复合索引：事件名称 + 创建时间（用于按事件类型查询趋势）
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created 
ON analytics_events(event_name, created_at DESC);

-- 创建复合索引：事件类型 + 创建时间（用于按事件类型统计）
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created 
ON analytics_events(event_type, created_at DESC);

-- 创建索引：IP地址（用于按IP统计）
CREATE INDEX IF NOT EXISTS idx_analytics_events_ip 
ON analytics_events(ip);

-- 创建索引：User-Agent（用于按客户端类型统计）
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_agent 
ON analytics_events(user_agent);

-- 2. user_profiles表的索引优化

-- 创建索引：用户ID（主键索引，如果不存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

-- 创建索引：注册时间（用于按注册时间查询）
CREATE INDEX IF NOT EXISTS idx_user_profiles_register_time 
ON user_profiles(register_time DESC);

-- 创建索引：最后活跃时间（用于查询活跃用户）
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active 
ON user_profiles(last_active_time DESC);

-- 创建索引：活跃度等级（用于按活跃度筛选用户）
CREATE INDEX IF NOT EXISTS idx_user_profiles_activity_level 
ON user_profiles(activity_level);

-- 创建索引：价值等级（用于按价值筛选用户）
CREATE INDEX IF NOT EXISTS idx_user_profiles_value_level 
ON user_profiles(value_level);

-- 创建索引：活跃天数（用于按活跃天数排序）
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_days 
ON user_profiles(active_days DESC);

-- 3. 为JSON字段创建GIN索引（PostgreSQL特有）
-- 注意：如果使用MySQL，这些索引需要改为其他方式

-- 为analytics_events的properties字段创建GIN索引（PostgreSQL）
-- CREATE INDEX IF NOT EXISTS idx_analytics_events_properties_gin 
-- ON analytics_events USING GIN (properties);

-- 为user_profiles的tags字段创建GIN索引（PostgreSQL）
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_tags_gin 
-- ON user_profiles USING GIN (tags);

-- 4. 查询优化建议

-- 定期分析表以更新统计信息
ANALYZE analytics_events;
ANALYZE user_profiles;

-- 定期清理过期数据（可选）
-- DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
-- DELETE FROM user_profiles WHERE last_active_time < NOW() - INTERVAL '180 days';

-- 5. 性能监控查询

-- 查看索引使用情况
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('analytics_events', 'user_profiles')
-- ORDER BY idx_scan DESC;

-- 查看表大小
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE tablename IN ('analytics_events', 'user_profiles');
