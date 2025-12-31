-- ============================================================================
-- 数据库优化脚本
-- 版本: 1.0.0
-- 说明: 创建索引、视图、触发器以提升数据库性能
-- 使用方法: psql -U username -d database_name -f optimize_database.sql
-- 注意: 必须先运行 init_database.sql 创建表结构
-- ============================================================================

-- ============================================================================
-- 第一部分：索引优化
-- ============================================================================

-- 1. analytics_events 表的索引优化

-- 复合索引：用户ID + 创建时间（用于查询用户事件历史）
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created 
ON analytics_events(user_id, created_at DESC);

-- 复合索引：事件名称 + 创建时间（用于按事件类型查询趋势）
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created 
ON analytics_events(event_name, created_at DESC);

-- 复合索引：事件类型 + 创建时间（用于按事件类型统计）
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created 
ON analytics_events(event_type, created_at DESC);

-- 单列索引：IP地址（用于按IP统计）
CREATE INDEX IF NOT EXISTS idx_analytics_events_ip 
ON analytics_events(ip);

-- 单列索引：User-Agent（用于按客户端类型统计）
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_agent 
ON analytics_events(user_agent);

-- 2. user_profiles 表的索引优化

-- 唯一索引：用户ID（主键索引）
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

-- 单列索引：注册时间（用于按注册时间查询）
CREATE INDEX IF NOT EXISTS idx_user_profiles_register_time 
ON user_profiles(register_time DESC);

-- 单列索引：最后活跃时间（用于查询活跃用户）
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active 
ON user_profiles(last_active_time DESC);

-- 单列索引：活跃度等级（用于按活跃度筛选用户）
CREATE INDEX IF NOT EXISTS idx_user_profiles_activity_level 
ON user_profiles(activity_level);

-- 单列索引：价值等级（用于按价值筛选用户）
CREATE INDEX IF NOT EXISTS idx_user_profiles_value_level 
ON user_profiles(value_level);

-- 单列索引：活跃天数（用于按活跃天数排序）
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_days 
ON user_profiles(active_days DESC);

-- 3. PostgreSQL GIN索引（用于JSON字段查询优化）
-- 注意：如果使用MySQL，这些索引需要改为其他方式

-- 为analytics_events的properties字段创建GIN索引（PostgreSQL）
-- CREATE INDEX IF NOT EXISTS idx_analytics_events_properties_gin 
-- ON analytics_events USING GIN (properties);

-- 为user_profiles的tags字段创建GIN索引（PostgreSQL）
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_tags_gin 
-- ON user_profiles USING GIN (tags);

-- ============================================================================
-- 第二部分：视图创建
-- ============================================================================

-- 创建性能分析视图：事件统计
CREATE OR REPLACE VIEW v_event_stats AS
SELECT
  event_name,
  event_type,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(duration) as avg_duration,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM analytics_events
GROUP BY event_name, event_type;

COMMENT ON VIEW v_event_stats IS '埋点事件统计视图';

-- 创建用户活跃度视图
CREATE OR REPLACE VIEW v_user_activity AS
SELECT
  user_id,
  COUNT(*) as event_count,
  COUNT(DISTINCT DATE(created_at)) as active_days,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event,
  AVG(duration) as avg_duration
FROM analytics_events
WHERE user_id IS NOT NULL
GROUP BY user_id;

COMMENT ON VIEW v_user_activity IS '用户活跃度统计视图';

-- 创建API性能统计视图
CREATE OR REPLACE VIEW v_api_performance AS
SELECT
  path,
  method,
  COUNT(*) as request_count,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  MIN(duration_ms) as min_duration,
  COUNT(DISTINCT ip) as unique_ips
FROM "system_api_log"
GROUP BY path, method
ORDER BY request_count DESC;

COMMENT ON VIEW v_api_performance IS 'API性能统计视图';

-- ============================================================================
-- 第三部分：触发器创建
-- ============================================================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为user_profiles表创建更新时间触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS '自动更新updated_at字段的触发器函数';

-- ============================================================================
-- 第四部分：性能优化
-- ============================================================================

-- 分析表以更新统计信息（优化查询计划）
ANALYZE analytics_events;
ANALYZE user_profiles;
ANALYZE "system_user";
ANALYZE "system_notice";
ANALYZE "system_api_log";

-- ============================================================================
-- 第五部分：维护建议（注释掉的清理脚本）
-- ============================================================================

-- 定期清理过期数据（根据实际需求启用）
-- 清理90天前的埋点事件数据
-- DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';

-- 清理180天前的非活跃用户画像
-- DELETE FROM user_profiles WHERE last_active_time < NOW() - INTERVAL '180 days';

-- 清理30天前的API日志
-- DELETE FROM "system_api_log" WHERE request_time < NOW() - INTERVAL '30 days';

-- ============================================================================
-- 第六部分：性能监控查询（注释掉的监控脚本）
-- ============================================================================

-- 查看索引使用情况
-- SELECT 
--   schemaname, 
--   tablename, 
--   indexname, 
--   idx_scan, 
--   idx_tup_read, 
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('analytics_events', 'user_profiles', 'system_api_log')
-- ORDER BY idx_scan DESC;

-- 查看表大小
-- SELECT 
--   schemaname, 
--   tablename, 
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE tablename IN ('analytics_events', 'user_profiles', 'system_api_log')
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看慢查询（需要启用pg_stat_statements扩展）
-- SELECT 
--   query, 
--   calls, 
--   total_time, 
--   mean_time, 
--   max_time
-- FROM pg_stat_statements
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- ============================================================================
-- 执行完成提示
-- ============================================================================
SELECT '数据库优化完成！' AS status;
SELECT '已创建 ' || COUNT(*) || ' 个索引' AS index_count 
FROM pg_indexes 
WHERE tablename IN ('analytics_events', 'user_profiles', 'system_api_log');
