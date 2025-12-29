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

-- 插入测试用户
INSERT INTO "system_user" ("username", "email", "password", "avatar", "createtime", "updatetime")
VALUES ('test', 'test@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;