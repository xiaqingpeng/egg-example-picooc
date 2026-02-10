# Egg.js 埋点事件后端实现文档

## 📋 目录

- [项目概述](#项目概述)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [API 接口文档](#api-接口文档)
- [完整路由配置](#完整路由配置)
- [数据库设计](#数据库设计)
- [配置说明](#配置说明)
- [部署指南](#部署指南)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 项目概述

本项目是基于 Egg.js 框架开发的综合性后端系统，包含埋点事件收集和分析、用户管理、系统监控、文件上传等功能。

### 主要特性

✅ **高性能** - 基于 Egg.js 企业级框架，支持高并发请求
✅ **易扩展** - 模块化设计，易于添加新功能
✅ **数据持久化** - 支持 PostgreSQL 数据库存储
✅ **批量处理** - 支持单个和批量事件上报
✅ **统计分析** - 提供事件统计、趋势分析、用户画像
✅ **用户管理** - 完整的用户注册、登录、信息管理功能
✅ **文件上传** - 支持图片和文件上传到OSS
✅ **系统监控** - 实时系统信息、日志统计
✅ **完整日志** - 详细的请求日志和错误追踪
✅ **CORS 支持** - 支持跨域请求
✅ **安全可靠** - 完善的错误处理和数据验证

### 技术栈

- **框架**: Egg.js 3.x
- **数据库**: PostgreSQL 12+
- **ORM**: egg-sequelize
- **跨域**: egg-cors
- **文件存储**: 阿里云OSS
- **Node.js**: 16.0+

---

## 项目结构

```
egg-analytics/
├── app/
│   ├── controller/
│   │   ├── analytics.js          # 埋点事件控制器
│   │   ├── home.js               # 首页控制器
│   │   ├── user.js               # 用户管理控制器
│   │   ├── userProfile.js        # 用户画像控制器
│   │   ├── oss2.js               # 文件上传控制器
│   │   └── system/               # 系统相关控制器
│   │       ├── notice.js         # 通知控制器
│   │       ├── noticeDb.js       # 数据库通知控制器
│   │       └── logs.js           # 日志控制器
│   ├── service/
│   │   ├── analytics.js          # 埋点业务逻辑服务
│   │   ├── user.js               # 用户业务逻辑服务
│   │   ├── userProfile.js        # 用户画像业务逻辑服务
│   │   ├── oss2.js               # 文件上传业务逻辑服务
│   │   ├── notice.js             # 通知业务逻辑服务
│   │   └── noticeDb.js           # 数据库通知业务逻辑服务
│   ├── model/
│   │   ├── analytics_event.js    # 埋点事件模型
│   │   ├── user.js               # 用户模型
│   │   ├── user_profile.js       # 用户画像模型
│   │   ├── api_log.js            # API日志模型
│   │   └── notice.js             # 通知模型
│   ├── middleware/
│   │   └── requestLog.js         # 请求日志中间件
│   ├── schedule/
│   │   └── updateUserProfile.js  # 用户画像更新定时任务
│   └── router.js                 # 路由配置
├── config/
│   ├── config.default.js         # 默认配置
│   ├── config.prod.js            # 生产环境配置
│   ├── config.dotenv.js          # 环境变量配置
│   └── plugin.js                 # 插件配置
├── database/
│   └── migrations/
│       ├── README.md             # 数据库迁移说明
│       ├── init_database.sql     # 数据库初始化脚本
│       └── optimize_database.sql  # 数据库优化脚本
├── docs/
│   └── analytics-trends-api.md   # 趋势分析API文档
├── logs/                         # 日志目录
├── test/
│   └── app/
│       └── controller/           # 测试目录
├── .github/
│   └── workflows/
│       └── cicd.yml              # GitHub Actions CI/CD配置
├── .gitee/
│   └── workflows/
│       └── cicd.yml              # Gitee CI/CD配置
├── .gitignore
├── .eslintrc
├── .eslintignore
├── app.js                        # 应用入口
├── package.json                  # 项目依赖
├── ecosystem.config.js           # PM2配置
└── README.md
```

---

## 环境要求

### 必需环境

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **PostgreSQL**: >= 12.0
- **操作系统**: Linux / macOS / Windows

### 可选环境

- **Redis**: >= 5.0 (用于缓存和队列)
- **Docker**: >= 20.0 (用于容器化部署)

### 安装 Node.js

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16

# 验证安装
node --version
npm --version
```

---

## 快速开始

### 1. 创建项目

```bash
# 使用 egg-init 脚手架创建项目
npm install -g egg-init
egg-init egg-analytics --type=simple
cd egg-analytics
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

```bash
# 创建数据库
mysql -u root -p
```

```sql
CREATE DATABASE analytics_db 
  WITH ENCODING='UTF8'
  LC_COLLATE='en_US.UTF-8'
  LC_CTYPE='en_US.UTF-8'
  TEMPLATE=template0;
```

### 4. 执行数据库迁移

```bash
mysql -u root -p analytics_db < database/migrations/init.sql
```

### 5. 配置应用

编辑 `config/config.default.js`，修改数据库配置：

```javascript
config.sequelize = {
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'your_password',
  database: 'analytics_db',
  timezone: '+08:00',
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  }
};
```

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:7001` 启动。

---

## 核心功能

### 1. 事件接收

- 支持单个事件上报
- 支持批量事件上报
- 自动添加元数据（IP、User-Agent、时间戳）
- 数据验证和错误处理

### 2. 数据存储

- MySQL 数据库持久化存储
- JSON 格式存储事件属性
- 文件备份（备用方案）
- 数据库索引优化

### 3. 统计分析

- 按事件类型统计
- 时间范围统计
- 趋势分析
- 分页查询

### 4. 日志记录

- 请求日志
- 错误日志
- 事件日志
- 性能日志

---

## API 接口文档

### 基础信息

- **Base URL**: `http://120.48.95.51:7001`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`

### 1. 接收单个事件

**接口地址**: `POST /api/analytics/events`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| event | string | 是 | 事件名称 |
| eventType | string | 否 | 事件类型，默认 'custom' |
| properties | object | 否 | 事件属性 |
| userId | string | 否 | 用户ID |
| sessionId | string | 否 | 会话ID |
| duration | number | 否 | 持续时间（毫秒） |
| errorMessage | string | 否 | 错误信息 |

**请求示例**:

```bash
curl -X POST http://120.48.95.51:7001/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "event": "login_success",
    "eventType": "custom",
    "properties": {
      "email": "user@example.com",
      "login_time": 1234
    },
    "userId": "user123",
    "sessionId": "session456"
  }'
```

**响应示例**:

```json
{
  "success": true,
  "message": "Event recorded successfully",
  "eventId": "request-id-12345"
}
```

### 2. 批量接收事件

**接口地址**: `POST /api/analytics/events/batch`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| events | array | 是 | 事件数组 |

**请求示例**:

```bash
curl -X POST http://120.48.95.51:7001/api/analytics/events/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "event": "page_view",
        "properties": {"page": "login"}
      },
      {
        "event": "button_click",
        "properties": {"button": "submit"}
      }
    ]
  }'
```

**响应示例**:

```json
{
  "success": true,
  "message": "Successfully recorded 2 events",
  "count": 2
}
```

### 3. 查询事件统计

**接口地址**: `GET /api/analytics/stats`

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventType | string | 否 | 事件类型 |
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |

**请求示例**:

```bash
curl "http://120.48.95.51:7001/api/analytics/stats?eventType=login_success&startDate=2024-01-01&endDate=2024-12-31"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "total": 1000,
    "byEventType": [
      {
        "event_name": "login_success",
        "count": 500
      },
      {
        "event_name": "page_view",
        "count": 300
      }
    ],
    "recentTrend": [
      {
        "hour": "2024-01-01 10:00:00",
        "count": 50
      }
    ]
  }
}
```

### 4. 查询事件列表

**接口地址**: `GET /api/analytics/events`

**查询参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| eventType | string | 否 | - | 事件类型 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 50 | 每页数量 |
| startDate | string | 否 | - | 开始日期 |
| endDate | string | 否 | - | 结束日期 |

**请求示例**:

```bash
curl "http://120.48.95.51:7001/api/analytics/events?page=1&pageSize=20&eventType=login_success"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "event_name": "login_success",
        "event_type": "custom",
        "properties": {
          "email": "user@example.com",
          "login_time": 1234
        },
        "user_id": "user123",
        "duration": null,
        "error_message": null,
        "created_at": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## 完整路由配置

以下为系统中所有可用的API接口，按功能模块分类：

### 基础接口

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| GET | `/` | 首页 | controller.home.index |
| GET | `/health` | 健康检查，不依赖数据库 | controller.home.health |
| GET | `/test-cicd` | 测试路由，用于验证CI/CD自动部署功能 | controller.home.testCicd |
| GET | `/system/info` | 获取系统信息 | controller.home.getSystemInfo |

### 系统通知接口

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| GET | `/system/notice/list` | 获取通知列表 | controller.system.notice.list |
| GET | `/system/notice/db/list` | 获取数据库通知列表 | controller.system.noticeDb.list |
| GET | `/system/notice/:id` | 获取通知详情 | controller.system.noticeDb.detail |
| POST | `/system/notice` | 创建通知 | controller.system.noticeDb.create |
| PUT | `/system/notice/:id` | 更新通知 | controller.system.noticeDb.update |
| DELETE | `/system/notice/:id` | 删除通知 | controller.system.noticeDb.destroy |

### 系统日志接口

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| GET | `/system/logs/stats` | 获取日志统计 | controller.system.logs.stats |
| POST | `/system/logs/report` | 上报日志 | controller.system.logs.report |

### 用户认证接口

| 方法 | 路径 | 说明 | 控制器 | 需要认证 |
|------|------|------|--------|----------|
| POST | `/register` | 用户注册 | controller.user.register | 否 |
| POST | `/login` | 用户登录 | controller.user.login | 否 |

### 用户管理接口

| 方法 | 路径 | 说明 | 控制器 | 需要认证 |
|------|------|------|--------|----------|
| GET | `/user/info` | 获取当前登录用户信息 | controller.user.getUserInfo | 是 |
| GET | `/user` | 根据用户ID查询用户信息（无需登录验证） | controller.user.getUserById | 否 |
| POST | `/user/change-password` | 修改密码 | controller.user.changePassword | 是 |
| POST | `/user/avatar` | 上传头像 | controller.user.uploadAvatar | 是 |
| PUT | `/user/info` | 更新用户信息（支持任意字段组合） | controller.user.updateUserInfo | 是 |

**更新用户信息接口说明**：

- **接口地址**: `PUT /user/info`
- **需要认证**: 是
- **请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 否 | 要更新的用户ID，不传则更新当前登录用户 |
| username | string | 否 | 用户名（1-64字符） |
| email | string | 否 | 邮箱地址（需符合邮箱格式，1-128字符） |
| password | string | 否 | 密码（6-128字符） |
| avatar | string | 否 | 头像URL（最多512字符） |

- **请求示例**:

```bash
# 更新用户名
curl -X PUT http://120.48.95.51:7001/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": "newusername"
  }'

# 更新邮箱和密码
curl -X PUT http://120.48.95.51:7001/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "newemail@example.com",
    "password": "newpassword123"
  }'

# 更新指定用户的所有信息
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

- **响应示例**:

```json
{
  "code": 0,
  "msg": "User info updated successfully",
  "data": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "avatar": "http://example.com/avatar.jpg",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

### 文件上传接口

| 方法 | 路径 | 说明 | 控制器 | 需要认证 |
|------|------|------|--------|----------|
| POST | `/api/upload/image` | 上传图片 | controller.oss2.upLoadImage | 是 |
| POST | `/api/upload/file` | 上传文件 | controller.oss2.upLoadFile | 是 |

### 埋点事件接口

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| POST | `/api/analytics/events` | 接收单个事件 | controller.analytics.events |
| POST | `/api/analytics/events/batch` | 批量接收事件 | controller.analytics.batchEvents |
| GET | `/api/analytics/stats` | 查询事件统计 | controller.analytics.stats |
| GET | `/api/analytics/events` | 查询事件列表 | controller.analytics.getEvents |

### 统计分析API

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| GET | `/api/analytics/activity` | 用户活跃度统计（DAU/MAU） | controller.analytics.getActivityStats |
| GET | `/api/analytics/retention` | 留存率统计 | controller.analytics.getRetentionStats |
| GET | `/api/analytics/page-views` | 页面访问统计 | controller.analytics.getPageViewStats |
| GET | `/api/analytics/event-stats` | 事件统计 | controller.analytics.getEventStats |
| GET | `/api/analytics/trends` | 趋势分析 | controller.analytics.getTrendAnalysis |

### 用户画像API - 原有路径

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| GET | `/api/user-profile` | 获取用户完整画像 | controller.userProfile.getUserProfile |
| GET | `/api/user-profile/tags` | 获取用户标签 | controller.userProfile.getUserTags |
| GET | `/api/user-profile/behavior` | 获取用户行为特征 | controller.userProfile.getUserBehaviorFeatures |
| GET | `/api/user-profile/interest` | 获取用户兴趣画像 | controller.userProfile.getUserInterestProfile |
| GET | `/api/user-profile/value` | 获取用户价值评估 | controller.userProfile.getUserValueAssessment |
| GET | `/api/user-profile/list` | 获取用户列表 | controller.userProfile.getUserList |
| GET | `/api/analytics/users` | 获取用户列表（兼容路径） | controller.userProfile.getUserList |
| PUT | `/api/user-profile/:userId` | 更新单个用户画像 | controller.userProfile.updateUserProfile |
| POST | `/api/user-profile/update-all` | 批量更新用户画像 | controller.userProfile.updateAllUserProfiles |

### 用户画像API - 兼容前端路径

| 方法 | 路径 | 说明 | 控制器 |
|------|------|------|--------|
| GET | `/api/analytics/user/profile` | 获取用户完整画像（兼容） | controller.userProfile.getUserProfile |
| GET | `/api/analytics/user/tags` | 获取用户标签（兼容） | controller.userProfile.getUserTags |
| GET | `/api/analytics/user/behavior` | 获取用户行为特征（兼容） | controller.userProfile.getUserBehaviorFeatures |
| GET | `/api/analytics/user/interest` | 获取用户兴趣画像（兼容） | controller.userProfile.getUserInterestProfile |
| GET | `/api/analytics/user/value` | 获取用户价值评估（兼容） | controller.userProfile.getUserValueAssessment |
| GET | `/api/analytics/user/list` | 获取用户列表（兼容） | controller.userProfile.getUserList |

---

## 数据库设计

### 表结构

#### analytics_events（埋点事件表）

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| id | BIGINT UNSIGNED | 主键，自增 | PRIMARY |
| event_name | VARCHAR(255) | 事件名称 | INDEX |
| event_type | VARCHAR(50) | 事件类型 | INDEX |
| properties | JSON | 事件属性 | - |
| user_id | VARCHAR(255) | 用户ID | INDEX |
| session_id | VARCHAR(255) | 会话ID | - |
| duration | INT | 持续时间（毫秒） | - |
| error_message | TEXT | 错误信息 | - |
| ip | VARCHAR(45) | IP地址 | - |
| user_agent | VARCHAR(500) | 用户代理 | - |
| request_id | VARCHAR(100) | 请求ID | - |
| created_at | DATETIME | 创建时间 | INDEX |

### 建表 SQL

```sql
-- 创建数据库
CREATE DATABASE analytics_db 
  WITH ENCODING='UTF8'
  LC_COLLATE='en_US.UTF-8'
  LC_CTYPE='en_US.UTF-8'
  TEMPLATE=template0;

\c analytics_db;

-- 创建埋点事件表
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) DEFAULT 'custom',
  properties JSONB,
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
CREATE INDEX idx_event_name ON analytics_events(event_name);
CREATE INDEX idx_user_id ON analytics_events(user_id);
CREATE INDEX idx_created_at ON analytics_events(created_at);
CREATE INDEX idx_event_type ON analytics_events(event_type);
CREATE INDEX idx_user_created ON analytics_events(user_id, created_at);

-- 创建 GIN 索引用于 JSONB 查询优化
CREATE INDEX idx_properties ON analytics_events USING GIN(properties);

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
COMMENT ON COLUMN analytics_events.properties IS '事件属性（JSONB格式）';
COMMENT ON COLUMN analytics_events.user_id IS '用户ID';
COMMENT ON COLUMN analytics_events.session_id IS '会话ID';
COMMENT ON COLUMN analytics_events.duration IS '持续时间（毫秒）';
COMMENT ON COLUMN analytics_events.error_message IS '错误信息';
COMMENT ON COLUMN analytics_events.ip IS 'IP地址';
COMMENT ON COLUMN analytics_events.user_agent IS '用户代理';
COMMENT ON COLUMN analytics_events.request_id IS '请求ID';
COMMENT ON COLUMN analytics_events.created_at IS '创建时间';
```

---

## 配置说明

### config.default.js（默认配置）

```javascript
'use strict';

module.exports = appInfo => {
  const config = exports = {};
  
  // 使用中间件
  config.middleware = ['requestLogger'];
  
  // 安全配置
  config.security = {
    csrf: {
      enable: false,
      ignore: ctx => ctx.path.startsWith('/api/analytics')
    },
    domainWhiteList: ['*']
  };
  
  // CORS 配置
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true
  };
  
  // PostgreSQL 配置
  config.sequelize = {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'your_password',
    database: 'analytics_db',
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true
    }
  };
  
  // 日志配置
  config.logger = {
    level: 'INFO',
    dir: 'logs',
    outputJSON: true,
    encoding: 'utf8'
  };
  
  // 请求超时配置
  config.httpclient = {
    request: {
      timeout: 30000
    }
  };
  
  // 文件上传配置
  config.multipart = {
    mode: 'file',
    fileSize: '50mb'
  };
  
  return config;
};
```

### config.prod.js（生产环境配置）

```javascript
'use strict';

module.exports = () => {
  const config = {};
  
  // 生产环境日志级别
  config.logger = {
    level: 'WARN'
  };
  
  // 生产环境数据库连接池
  config.sequelize = {
    dialect: 'postgres',
    host: process.env.PG_HOST,
    port: process.env.PG_PORT || 5432,
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  };
  
  // 生产环境 CORS 限制
  config.cors = {
    origin: ['https://yourdomain.com'],
    credentials: true
  };
  
  return config;
};
```

### plugin.js（插件配置）

```javascript
'use strict';

// Sequelize 插件（PostgreSQL）
exports.sequelize = {
  enable: true,
  package: 'egg-sequelize'
};

// pg 插件
exports.pg = {
  enable: true,
  package: 'egg-pg'
};

// CORS 插件
exports.cors = {
  enable: true,
  package: 'egg-cors'
};

// Redis 插件（可选）
exports.redis = {
  enable: false,
  package: 'egg-redis'
};
```

---

## 部署指南

### 本地部署

#### 1. 开发环境

```bash
# 克隆项目
git clone <repository-url>
cd egg-analytics

# 安装依赖
npm install

# 配置数据库
vim config/config.default.js

# 执行数据库迁移
mysql -u root -p analytics_db < database/migrations/init.sql

# 启动开发服务器
npm run dev
```

#### 2. 生产环境

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 启动服务
pm2 start app.js --name analytics-server

# 查看日志
pm2 logs analytics-server

# 重启服务
pm2 restart analytics-server

# 停止服务
pm2 stop analytics-server
```

### Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 7001

# 启动应用
CMD ["npm", "start"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: rootpassword
      POSTGRES_DB: analytics_db
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/migrations/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  analytics:
    build: .
    ports:
      - "7001:7001"
    depends_on:
      - mysql
    environment:
      PG_HOST: postgres
      PG_PORT: 5432
      PG_USER: postgres
      PG_PASSWORD: rootpassword
      PG_DATABASE: analytics_db
    restart: always

volumes:
  postgres-data:
```

#### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f analytics

# 停止服务
docker-compose down
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name analytics.yourdomain.com;

    location /api/analytics {
        proxy_pass http://localhost:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

---

## 使用示例

### Qt 前端集成示例

```cpp
// 在 Qt 应用中发送埋点事件
#include "analytics.h"

// 初始化 Analytics SDK
Analytics::Config config;
config.serverUrl = "http://120.48.95.51:7001/api/analytics/events";
config.appId = "your-app-id";
Analytics::SDK::instance()->initialize(config);

// 设置用户ID
Analytics::SDK::instance()->setUserId("user123");

// 追踪页面浏览
Analytics::SDK::instance()->trackView("login_page", {
    {"page_title", "登录页面"}
});

// 追踪点击事件
Analytics::SDK::instance()->trackClick("login_button", {
    {"page", "login"},
    {"button_text", "登录"}
});

// 追踪性能
Analytics::SDK::instance()->trackPerformance("login_request_time", 1234, {
    {"page", "login"},
    {"status", "success"}
});

// 追踪错误
Analytics::SDK::instance()->trackError("network_error", "Connection timeout", {
    {"page", "login"}
});
```

### JavaScript 前端集成示例

```javascript
// 使用 fetch API 发送埋点事件
async function trackEvent(eventName, properties = {}) {
  const eventData = {
    event: eventName,
    eventType: 'custom',
    properties: properties,
    userId: getUserId(),
    sessionId: getSessionId()
  };
  
  try {
    const response = await fetch('http://120.48.95.51:7001/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    const result = await response.json();
    console.log('Event tracked:', result);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// 使用示例
trackEvent('page_view', { page: 'home' });
trackEvent('button_click', { button: 'submit' });
```

### Python 集成示例

```python
import requests
import json

class AnalyticsClient:
    def __init__(self, server_url):
        self.server_url = server_url
    
    def track_event(self, event_name, properties=None, user_id=None):
        """发送单个事件"""
        event_data = {
            'event': event_name,
            'eventType': 'custom',
            'properties': properties or {},
            'userId': user_id
        }
        
        try:
            response = requests.post(
                f'{self.server_url}/api/analytics/events',
                json=event_data,
                headers={'Content-Type': 'application/json'}
            )
            return response.json()
        except Exception as e:
            print(f'Failed to track event: {e}')
            return None
    
    def track_batch_events(self, events):
        """批量发送事件"""
        try:
            response = requests.post(
                f'{self.server_url}/api/analytics/events/batch',
                json={'events': events},
                headers={'Content-Type': 'application/json'}
            )
            return response.json()
        except Exception as e:
            print(f'Failed to track batch events: {e}')
            return None

# 使用示例
client = AnalyticsClient('http://120.48.95.51:7001')
client.track_event('page_view', {'page': 'home'}, 'user123')

# 批量发送
batch_events = [
    {'event': 'click', 'properties': {'button': 'submit'}},
    {'event': 'view', 'properties': {'page': 'profile'}}
]
client.track_batch_events(batch_events)
```

---

## 最佳实践

### 1. 事件命名规范

- 使用小写字母和下划线：`login_success`
- 使用动词+名词格式：`button_click`、`page_view`
- 保持一致性：同一类事件使用相同前缀

```javascript
// 好的命名
'login_success'
'login_failed'
'page_view'
'button_click'

// 不好的命名
'LoginSuccess'
'login-success'
'loginSuccess'
```

### 2. 属性设计

- 使用有意义的属性名
- 属性值类型保持一致
- 避免嵌套过深

```javascript
// 好的属性设计
{
  "page": "login",
  "button_text": "登录",
  "login_time": 1234
}

// 不好的属性设计
{
  "p": "login",
  "bt": "登录",
  "t": 1234
}
```

### 3. 性能优化

#### 批量上报

```javascript
// 收集多个事件后批量发送
const eventQueue = [];

function flushEvents() {
  if (eventQueue.length > 0) {
    fetch('/api/analytics/events/batch', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({events: eventQueue})
    });
    eventQueue.length = 0;
  }
}

// 每30秒批量上报一次
setInterval(flushEvents, 30000);
```

#### 异步发送

```javascript
// 不阻塞主线程
function trackEventAsync(eventData) {
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/events',
      JSON.stringify(eventData)
    );
  } else {
    fetch('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
      keepalive: true
    });
  }
}
```

### 4. 错误处理

```javascript
// 前端错误处理
function trackEventSafely(eventName, properties) {
  try {
    trackEvent(eventName, properties);
  } catch (error) {
    console.error('Analytics error:', error);
    // 可以存储到本地，稍后重试
    localStorage.setItem('failed_events', JSON.stringify([...failedEvents, eventName]));
  }
}

// 后端错误处理
async events() {
  try {
    await this.service.analytics.saveEvent(eventData);
    ctx.body = {success: true};
  } catch (error) {
    this.app.logger.error('Analytics error:', error);
    ctx.status = 500;
    ctx.body = {success: false, error: error.message};
  }
}
```

### 5. 数据隐私

- 避免收集敏感信息（密码、信用卡号等）
- 提供用户退出追踪的选项
- 遵守 GDPR 等隐私法规

```javascript
// 检查用户是否同意追踪
function canTrack() {
  return localStorage.getItem('analytics_consent') === 'true';
}

function trackEventIfConsented(eventName, properties) {
  if (canTrack()) {
    trackEvent(eventName, properties);
  }
}
```

### 6. 监控和告警

```javascript
// 监控事件上报成功率
const eventStats = {
  total: 0,
  success: 0,
  failed: 0
};

function trackEventWithStats(eventName, properties) {
  eventStats.total++;
  
  return trackEvent(eventName, properties)
    .then(() => {
      eventStats.success++;
    })
    .catch(() => {
      eventStats.failed++;
      
      // 失败率超过10%时告警
      if (eventStats.failed / eventStats.total > 0.1) {
        console.warn('Analytics failure rate too high!');
      }
    });
}
```

---

## 常见问题

### Q1: 如何处理大量并发请求？

**A**: 可以使用以下策略：

1. 使用 Redis 作为消息队列，异步处理事件
2. 增加数据库连接池大小
3. 使用负载均衡器分发请求
4. 实现事件批量处理

```javascript
// 使用 Redis 队列
config.redis = {
  client: {
    port: 6379,
    host: '127.0.0.1',
    password: '',
    db: 0
  }
};
```

### Q2: 如何保证数据不丢失？

**A**: 实现多重保障：

1. 前端本地存储失败事件
2. 使用重试机制
3. 实现文件备份
4. 数据库主从复制

```javascript
// 前端重试机制
function trackEventWithRetry(eventName, properties, maxRetries = 3) {
  let retries = 0;
  
  function attempt() {
    return trackEvent(eventName, properties)
      .catch(error => {
        if (retries < maxRetries) {
          retries++;
          setTimeout(attempt, 1000 * retries);
        } else {
          // 存储到本地
          saveToLocalStorage(eventName, properties);
        }
      });
  }
  
  return attempt();
}
```

### Q3: 如何优化查询性能？

**A**: 优化建议：

1. 合理使用数据库索引
2. 实现数据分区（按时间）
3. 使用缓存（Redis）
4. 定期归档历史数据

```sql
-- 创建分区表
ALTER TABLE analytics_events 
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

### Q4: 如何处理时区问题？

**A**: 统一使用 UTC 时间：

```javascript
// 存储时使用 UTC
const eventData = {
  event: eventName,
  timestamp: new Date().toISOString() // UTC 时间
};

// 查询时转换时区
SELECT 
  event_name,
  CONVERT_TZ(created_at, '+00:00', '+08:00') as local_time
FROM analytics_events;
```

### Q5: 如何实现实时数据分析？

**A**: 可以使用以下方案：

1. 使用 WebSocket 推送实时数据
2. 集成 Elasticsearch 进行全文搜索
3. 使用 Grafana + Prometheus 监控
4. 实现流式处理（Kafka + Flink）

### Q6: 如何防止恶意请求？

**A**: 实现安全措施：

1. 实现请求频率限制
2. 添加 API 密钥验证
3. 使用 HTTPS 加密传输
4. 实现 IP 黑名单

```javascript
// 请求频率限制
config.middleware = ['rateLimit'];

config.rateLimit = {
  max: 100, // 每分钟最多100次
  duration: 60000
};
```

---

## 附录

### A. 完整代码示例

#### app/model/analytics_event.js

```javascript
'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT, JSONB, DATE, BIGINT } = app.Sequelize;

  const AnalyticsEvent = app.model.define('analytics_events', {
    id: {
      type: BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    event_name: {
      type: STRING(255),
      allowNull: false,
      comment: '事件名称'
    },
    event_type: {
      type: STRING(50),
      defaultValue: 'custom',
      comment: '事件类型'
    },
    properties: {
      type: JSONB,
      defaultValue: {},
      comment: '事件属性（JSONB格式）'
    },
    user_id: {
      type: STRING(255),
      allowNull: true,
      comment: '用户ID'
    },
    session_id: {
      type: STRING(255),
      allowNull: true,
      comment: '会话ID'
    },
    duration: {
      type: INTEGER,
      allowNull: true,
      comment: '持续时间（毫秒）'
    },
    error_message: {
      type: TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    ip: {
      type: STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    user_agent: {
      type: STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    request_id: {
      type: STRING(100),
      allowNull: true,
      comment: '请求ID'
    },
    created_at: {
      type: DATE,
      allowNull: false,
      defaultValue: app.Sequelize.literal('CURRENT_TIMESTAMP'),
      comment: '创建时间'
    }
  }, {
    tableName: 'analytics_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_event_name',
        fields: ['event_name']
      },
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_event_type',
        fields: ['event_type']
      },
      {
        name: 'idx_user_created',
        fields: ['user_id', 'created_at']
      },
      {
        name: 'idx_properties',
        fields: ['properties'],
        using: 'GIN'
      }
    ]
  });

  return AnalyticsEvent;
};
```

#### app/model/index.js

```javascript
'use strict';

module.exports = app => {
  const { Sequelize } = app;
  
  app.model = app.Sequelize;
  
  // 加载所有模型
  app.loader.loadToApp(app.config.baseDir + '/app/model', 'model', {
    injectClass: app.Model,
    caseStyle: 'lower',
    directory: app.config.baseDir + '/app/model'
  });
  
  // 关联模型
  Object.keys(app.model).forEach(modelName => {
    if (app.model[modelName].associate) {
      app.model[modelName].associate(app.model);
    }
  });
};
```

#### app/controller/analytics.js

```javascript
'use strict';

const Controller = require('egg').Controller;

class AnalyticsController extends Controller {
  async events() {
    const { ctx, app } = this;
    
    try {
      const eventData = ctx.request.body;
      
      if (!eventData || !eventData.event) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: 'Missing required field: event'
        };
        return;
      }
      
      const enrichedEvent = {
        event_name: eventData.event,
        event_type: eventData.eventType || 'custom',
        properties: eventData.properties || {},
        user_id: eventData.userId,
        session_id: eventData.sessionId,
        duration: eventData.duration,
        error_message: eventData.errorMessage,
        ip: ctx.ip,
        user_agent: ctx.get('user-agent'),
        request_id: ctx.id
      };
      
      await ctx.service.analytics.saveEvent(enrichedEvent);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: 'Event recorded successfully',
        eventId: ctx.id
      };
      
      app.logger.info(`[Analytics] Event recorded: ${eventData.event}`);
      
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
      
      app.logger.error('[Analytics] Error recording event:', error);
    }
  }
  
  async batchEvents() {
    const { ctx, app } = this;
    
    try {
      const { events } = ctx.request.body;
      
      if (!Array.isArray(events) || events.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: 'Missing or invalid events array'
        };
        return;
      }
      
      const savedEvents = await ctx.service.analytics.saveBatchEvents(events);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: `Successfully recorded ${savedEvents.length} events`,
        count: savedEvents.length
      };
      
      app.logger.info(`[Analytics] Batch events recorded: ${savedEvents.length}`);
      
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
      
      app.logger.error('[Analytics] Error recording batch events:', error);
    }
  }
  
  async stats() {
    const { ctx } = this;
    
    try {
      const { eventType, startDate, endDate } = ctx.query;
      
      const stats = await ctx.service.analytics.getStats({
        eventType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: stats
      };
      
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
    }
  }
  
  async listEvents() {
    const { ctx } = this;
    
    try {
      const { 
        eventType, 
        page = 1, 
        pageSize = 50,
        startDate,
        endDate 
      } = ctx.query;
      
      const result = await ctx.service.analytics.listEvents({
        eventType,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result
      };
      
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
    }
  }
}

module.exports = AnalyticsController;
```

#### app/service/analytics.js

```javascript
'use strict';

const Service = require('egg').Service;

class AnalyticsService extends Service {
  async saveEvent(eventData) {
    const { app } = this;
    
    const result = await app.model.AnalyticsEvent.create({
      event_name: eventData.event_name,
      event_type: eventData.event_type,
      properties: eventData.properties,
      user_id: eventData.user_id,
      session_id: eventData.session_id,
      duration: eventData.duration,
      error_message: eventData.error_message,
      ip: eventData.ip,
      user_agent: eventData.user_agent,
      request_id: eventData.request_id
    });
    
    return result;
  }
  
  async saveBatchEvents(events) {
    const { app } = this;
    
    const records = events.map(event => ({
      event_name: event.event,
      event_type: event.eventType || 'custom',
      properties: event.properties || {},
      user_id: event.userId,
      session_id: event.sessionId,
      duration: event.duration,
      error_message: event.errorMessage,
      ip: this.ctx.ip,
      user_agent: this.ctx.get('user-agent'),
      request_id: this.ctx.id
    }));
    
    const result = await app.model.AnalyticsEvent.bulkCreate(records);
    return result;
  }
  
  async getStats({ eventType, startDate, endDate }) {
    const { app } = this;
    
    const where = {};
    
    if (eventType) {
      where.event_type = eventType;
    }
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[app.Sequelize.Op.gte] = startDate;
      }
      if (endDate) {
        where.created_at[app.Sequelize.Op.lte] = endDate;
      }
    }
    
    const total = await app.model.AnalyticsEvent.count({ where });
    
    const byEventType = await app.model.AnalyticsEvent.findAll({
      attributes: [
        'event_name',
        [app.Sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: ['event_name'],
      order: [[app.Sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });
    
    const recentTrend = await app.model.AnalyticsEvent.findAll({
      attributes: [
        [app.Sequelize.fn('DATE_TRUNC', 'hour', app.Sequelize.col('created_at')), 'hour'],
        [app.Sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: [app.Sequelize.fn('DATE_TRUNC', 'hour', app.Sequelize.col('created_at'))],
      order: [[app.Sequelize.literal('hour'), 'DESC']],
      limit: 24,
      raw: true
    });
    
    return {
      total,
      byEventType,
      recentTrend
    };
  }
  
  async listEvents({ eventType, page, pageSize, startDate, endDate }) {
    const { app } = this;
    
    const where = {};
    
    if (eventType) {
      where.event_type = eventType;
    }
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[app.Sequelize.Op.gte] = startDate;
      }
      if (endDate) {
        where.created_at[app.Sequelize.Op.lte] = endDate;
      }
    }
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await app.model.AnalyticsEvent.findAndCountAll({
      where,
      attributes: [
        'id',
        'event_name',
        'event_type',
        'properties',
        'user_id',
        'duration',
        'error_message',
        'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });
    
    const totalPages = Math.ceil(count / pageSize);
    
    return {
      events: rows,
      total: count,
      page,
      pageSize,
      totalPages
    };
  }
}

module.exports = AnalyticsService;
```

#### app/router.js

```javascript
'use strict';

module.exports = app => {
  const { router, controller } = app;
  
  router.post('/api/analytics/events', controller.analytics.events);
  router.post('/api/analytics/events/batch', controller.analytics.batchEvents);
  router.get('/api/analytics/events', controller.analytics.listEvents);
  router.get('/api/analytics/stats', controller.analytics.stats);
};
```

### B. package.json

```json
{
  "name": "egg-analytics",
  "version": "1.0.0",
  "description": "Egg.js Analytics Backend",
  "private": true,
  "egg": {
    "declarations": true
  },
  "dependencies": {
    "egg": "^3.23.0",
    "egg-cors": "^2.2.3",
    "egg-sequelize": "^6.0.0",
    "sequelize": "^6.35.0",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4"
  },
  "devDependencies": {
    "egg-bin": "^5.4.0",
    "egg-ci": "^2.1.0",
    "egg-mock": "^5.10.0",
    "eslint": "^8.0.0",
    "eslint-config-egg": "^12.1.0"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "scripts": {
    "start": "egg-scripts start --daemon --title=egg-server-egg-analytics",
    "stop": "egg-scripts stop --title=egg-server-egg-analytics",
    "dev": "egg-bin dev",
    "debug": "egg-bin debug",
    "test": "npm run lint -- --fix && npm run test-local",
    "test-local": "egg-bin test",
    "cov": "egg-bin cov",
    "lint": "eslint .",
    "ci": "npm run lint && npm run cov"
  }
}
```

---

## 联系方式

- **文档版本**: 1.0.0
- **最后更新**: 2024-01-01
- **项目地址**: [GitHub Repository](https://github.com/yourusername/egg-analytics)

## 许可证

MIT License

---

**祝您使用愉快！如有问题，欢迎反馈。** 🎉