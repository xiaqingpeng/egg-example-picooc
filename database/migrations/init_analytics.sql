-- 创建埋点事件表
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) DEFAULT 'custom',
  properties TEXT,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  duration INTEGER,
  error_message TEXT,
  ip VARCHAR(45),
  user_agent VARCHAR(500),
  request_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_created ON analytics_events(user_id, created_at);

-- 创建性能分析视图
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

-- 创建表注释
COMMENT ON TABLE analytics_events IS '埋点事件表';
COMMENT ON COLUMN analytics_events.id IS '主键ID';
COMMENT ON COLUMN analytics_events.event_name IS '事件名称';
COMMENT ON COLUMN analytics_events.event_type IS '事件类型';
COMMENT ON COLUMN analytics_events.properties IS '事件属性（JSON格式）';
COMMENT ON COLUMN analytics_events.user_id IS '用户ID';
COMMENT ON COLUMN analytics_events.session_id IS '会话ID';
COMMENT ON COLUMN analytics_events.duration IS '持续时间（毫秒）';
COMMENT ON COLUMN analytics_events.error_message IS '错误信息';
COMMENT ON COLUMN analytics_events.ip IS 'IP地址';
COMMENT ON COLUMN analytics_events.user_agent IS '用户代理';
COMMENT ON COLUMN analytics_events.request_id IS '请求ID';
COMMENT ON COLUMN analytics_events.created_at IS '创建时间';
