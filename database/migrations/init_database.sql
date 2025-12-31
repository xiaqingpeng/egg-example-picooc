-- ============================================================================
-- 数据库初始化脚本
-- 版本: 1.0.0
-- 说明: 创建所有业务表结构
-- 使用方法: psql -U username -d database_name -f init_database.sql
-- ============================================================================

-- ============================================================================
-- 第一部分：系统基础表
-- ============================================================================

-- 创建用户表
CREATE TABLE IF NOT EXISTS "system_user" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(64) NOT NULL,
  "email" VARCHAR(128) NOT NULL UNIQUE,
  "password" VARCHAR(128) NOT NULL,
  "avatar" VARCHAR(512),
  "createtime" TIMESTAMP,
  "updatetime" TIMESTAMP
);

COMMENT ON TABLE "system_user" IS '系统用户表';
COMMENT ON COLUMN "system_user".id IS '主键ID';
COMMENT ON COLUMN "system_user".username IS '用户名';
COMMENT ON COLUMN "system_user".email IS '邮箱（唯一）';
COMMENT ON COLUMN "system_user".password IS '密码（加密）';
COMMENT ON COLUMN "system_user".avatar IS '头像URL';
COMMENT ON COLUMN "system_user".createtime IS '创建时间';
COMMENT ON COLUMN "system_user".updatetime IS '更新时间';

-- 创建通知表
CREATE TABLE IF NOT EXISTS "system_notice" (
  "noticeid" SERIAL PRIMARY KEY,
  "noticetitle" VARCHAR(255) NOT NULL DEFAULT '',
  "noticetype" VARCHAR(20) NOT NULL DEFAULT '',
  "noticecontent" TEXT NOT NULL DEFAULT '',
  "status" VARCHAR(10) NOT NULL DEFAULT '0',
  "remark" VARCHAR(255) NOT NULL DEFAULT '',
  "createby" VARCHAR(100) NOT NULL DEFAULT '',
  "updateby" VARCHAR(100) NOT NULL DEFAULT '',
  "createtime" TIMESTAMP,
  "updatetime" TIMESTAMP
);

COMMENT ON TABLE "system_notice" IS '系统通知表';
COMMENT ON COLUMN "system_notice".noticeid IS '通知ID';
COMMENT ON COLUMN "system_notice".noticetitle IS '通知标题';
COMMENT ON COLUMN "system_notice".noticetype IS '通知类型';
COMMENT ON COLUMN "system_notice".noticecontent IS '通知内容';
COMMENT ON COLUMN "system_notice".status IS '状态（0-草稿，1-已发布）';
COMMENT ON COLUMN "system_notice".remark IS '备注';
COMMENT ON COLUMN "system_notice".createby IS '创建人';
COMMENT ON COLUMN "system_notice".updateby IS '更新人';
COMMENT ON COLUMN "system_notice".createtime IS '创建时间';
COMMENT ON COLUMN "system_notice".updatetime IS '更新时间';

-- 创建API日志表
CREATE TABLE IF NOT EXISTS "system_api_log" (
  "id" SERIAL PRIMARY KEY,
  "path" VARCHAR(255) NOT NULL DEFAULT '',
  "method" VARCHAR(16) NOT NULL DEFAULT '',
  "ip" VARCHAR(64) NOT NULL DEFAULT '',
  "request_time" TIMESTAMP NOT NULL,
  "duration_ms" INTEGER NOT NULL DEFAULT 0,
  "platform" VARCHAR(64) NOT NULL DEFAULT ''
);

COMMENT ON TABLE "system_api_log" IS 'API访问日志表';
COMMENT ON COLUMN "system_api_log".id IS '日志ID';
COMMENT ON COLUMN "system_api_log".path IS '请求路径';
COMMENT ON COLUMN "system_api_log".method IS '请求方法（GET/POST/PUT/DELETE）';
COMMENT ON COLUMN "system_api_log".ip IS '客户端IP';
COMMENT ON COLUMN "system_api_log".request_time IS '请求时间';
COMMENT ON COLUMN "system_api_log".duration_ms IS '请求耗时（毫秒）';
COMMENT ON COLUMN "system_api_log".platform IS '客户端平台';

-- ============================================================================
-- 第二部分：埋点分析表
-- ============================================================================

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

COMMENT ON TABLE analytics_events IS '埋点事件表';
COMMENT ON COLUMN analytics_events.id IS '主键ID';
COMMENT ON COLUMN analytics_events.event_name IS '事件名称';
COMMENT ON COLUMN analytics_events.event_type IS '事件类型（custom/pageview/click等）';
COMMENT ON COLUMN analytics_events.properties IS '事件属性（JSON格式）';
COMMENT ON COLUMN analytics_events.user_id IS '用户ID';
COMMENT ON COLUMN analytics_events.session_id IS '会话ID';
COMMENT ON COLUMN analytics_events.duration IS '持续时间（毫秒）';
COMMENT ON COLUMN analytics_events.error_message IS '错误信息';
COMMENT ON COLUMN analytics_events.ip IS 'IP地址';
COMMENT ON COLUMN analytics_events.user_agent IS '用户代理';
COMMENT ON COLUMN analytics_events.request_id IS '请求ID';
COMMENT ON COLUMN analytics_events.created_at IS '创建时间';

-- ============================================================================
-- 第三部分：用户画像表
-- ============================================================================

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

COMMENT ON TABLE user_profiles IS '用户画像表';
COMMENT ON COLUMN user_profiles.id IS '主键ID';
COMMENT ON COLUMN user_profiles.user_id IS '用户ID（唯一）';
COMMENT ON COLUMN user_profiles.register_time IS '注册时间';
COMMENT ON COLUMN user_profiles.last_active_time IS '最后活跃时间';
COMMENT ON COLUMN user_profiles.total_events IS '总事件数';
COMMENT ON COLUMN user_profiles.active_days IS '活跃天数';
COMMENT ON COLUMN user_profiles.tags IS '用户标签（JSON格式）';
COMMENT ON COLUMN user_profiles.behavior_features IS '行为特征（JSON格式）';
COMMENT ON COLUMN user_profiles.value_assessment IS '价值评估（JSON格式）';
COMMENT ON COLUMN user_profiles.interest_profile IS '兴趣画像（JSON格式）';
COMMENT ON COLUMN user_profiles.activity_level IS '活跃度等级（high/medium/low）';
COMMENT ON COLUMN user_profiles.value_level IS '价值等级（high/medium/low）';
COMMENT ON COLUMN user_profiles.created_at IS '创建时间';
COMMENT ON COLUMN user_profiles.updated_at IS '更新时间';

-- ============================================================================
-- 第四部分：初始化数据
-- ============================================================================

-- 插入测试用户（密码：test123）
INSERT INTO "system_user" ("username", "email", "password", "avatar", "createtime", "updatetime")
VALUES ('test', 'test@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- ============================================================================
-- 执行完成提示
-- ============================================================================
SELECT '数据库表结构创建完成！' AS status;
SELECT '请运行 optimize_database.sql 创建索引、视图和触发器' AS next_step;
