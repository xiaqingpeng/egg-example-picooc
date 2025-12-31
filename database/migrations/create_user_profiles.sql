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

-- 创建表注释
COMMENT ON TABLE user_profiles IS '用户画像表';
COMMENT ON COLUMN user_profiles.id IS '主键ID';
COMMENT ON COLUMN user_profiles.user_id IS '用户ID';
COMMENT ON COLUMN user_profiles.register_time IS '注册时间';
COMMENT ON COLUMN user_profiles.last_active_time IS '最后活跃时间';
COMMENT ON COLUMN user_profiles.total_events IS '总事件数';
COMMENT ON COLUMN user_profiles.active_days IS '活跃天数';
COMMENT ON COLUMN user_profiles.tags IS '用户标签（JSON格式）';
COMMENT ON COLUMN user_profiles.behavior_features IS '行为特征（JSON格式）';
COMMENT ON COLUMN user_profiles.value_assessment IS '价值评估（JSON格式）';
COMMENT ON COLUMN user_profiles.interest_profile IS '兴趣画像（JSON格式）';
COMMENT ON COLUMN user_profiles.activity_level IS '活跃度等级';
COMMENT ON COLUMN user_profiles.value_level IS '价值等级';
COMMENT ON COLUMN user_profiles.created_at IS '创建时间';
COMMENT ON COLUMN user_profiles.updated_at IS '更新时间';

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
