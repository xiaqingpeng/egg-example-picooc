# 用户画像API线上测试用例文档

## 文档信息
- **创建时间**: 2025-12-31
- **API基础地址**: `http://120.48.95.51:7001`
- **测试环境**: 生产环境
- **API版本**: v1.0

---

## 目录
1. [获取用户完整画像](#1-获取用户完整画像)
2. [获取用户标签](#2-获取用户标签)
3. [获取用户行为特征](#3-获取用户行为特征)
4. [获取用户兴趣画像](#4-获取用户兴趣画像)
5. [获取用户价值评估](#5-获取用户价值评估)
6. [获取用户列表](#6-获取用户列表)

---

## 1. 获取用户完整画像

### 接口信息
- **接口路径**: `/api/analytics/user/profile`
- **请求方法**: `GET`
- **功能描述**: 获取指定用户的完整画像信息，包括基础信息、标签、行为特征和价值评估

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| userId | string | 是 | 用户ID | "2" |

### 请求示例
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/profile?userId=2"
```

### 预期响应（成功）
```json
{
  "success": true,
  "data": {
    "userId": "2",
    "registerTime": "2025-12-31T02:21:25.514Z",
    "lastActiveTime": "2025-12-31T06:43:25.578Z",
    "totalEvents": 68,
    "activeDays": 1,
    "tags": [
      { "name": "低活跃", "type": "activity" },
      { "name": "新用户", "type": "loyalty" },
      { "name": "低价值", "type": "value" }
    ],
    "behaviorFeatures": {
      "visitFrequency": {
        "totalVisits": 68,
        "activeDays": 1,
        "avgDailyVisits": "68.00"
      },
      "pagePreference": [],
      "featureUsage": []
    },
    "valueAssessment": {
      "level": "流失用户",
      "score": 10,
      "description": "用户活跃度极低，需要重新激活"
    }
  }
}
```

### 预期响应（用户不存在）
```json
{
  "success": true,
  "data": null,
  "message": "User not found"
}
```

### 预期响应（参数错误）
```json
{
  "success": false,
  "message": "userId is required"
}
```

### 测试用例

#### TC-001: 正常获取用户画像
- **测试目的**: 验证能正常获取存在用户的完整画像
- **前置条件**: 用户ID=2存在且有行为数据
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/profile?userId=2`
  2. 检查响应状态码为200
  3. 验证响应数据包含完整的用户画像信息
- **预期结果**: 返回完整的用户画像数据，包含基础信息、标签、行为特征和价值评估
- **优先级**: P0

#### TC-002: 用户不存在
- **测试目的**: 验证用户不存在时的处理
- **前置条件**: 用户ID=999999不存在
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/profile?userId=999999`
  2. 检查响应状态码为200
  3. 验证data为null，message为"User not found"
- **预期结果**: 返回success=true，data=null，message="User not found"
- **优先级**: P1

#### TC-003: 缺少userId参数
- **测试目的**: 验证缺少必填参数时的处理
- **前置条件**: 无
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/profile`
  2. 检查响应状态码为422
  3. 验证错误信息
- **预期结果**: 返回success=false，message="userId is required"
- **优先级**: P1

#### TC-004: userId为空字符串
- **测试目的**: 验证userId为空字符串时的处理
- **前置条件**: 无
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/profile?userId=`
  2. 检查响应状态码
  3. 验证错误信息
- **预期结果**: 返回适当的错误信息
- **优先级**: P2

#### TC-005: userId为特殊字符
- **测试目的**: 验证userId包含特殊字符时的处理
- **前置条件**: 无
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/profile?userId=<script>alert(1)</script>`
  2. 检查响应状态码
  3. 验证系统安全性
- **预期结果**: 系统应正确处理特殊字符，不执行恶意代码
- **优先级**: P2

---

## 2. 获取用户标签

### 接口信息
- **接口路径**: `/api/analytics/user/tags`
- **请求方法**: `GET`
- **功能描述**: 获取指定用户的标签信息，包括活跃度、忠诚度和价值标签

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| userId | string | 是 | 用户ID | "2" |

### 请求示例
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/tags?userId=2"
```

### 预期响应（成功）
```json
{
  "success": true,
  "data": [
    { "name": "低活跃", "type": "activity" },
    { "name": "新用户", "type": "loyalty" },
    { "name": "低价值", "type": "value" }
  ]
}
```

### 预期响应（用户不存在）
```json
{
  "success": true,
  "data": []
}
```

### 测试用例

#### TC-006: 正常获取用户标签
- **测试目的**: 验证能正常获取存在用户的标签
- **前置条件**: 用户ID=2存在且有行为数据
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/tags?userId=2`
  2. 检查响应状态码为200
  3. 验证返回的标签数组包含三种类型：activity、loyalty、value
- **预期结果**: 返回完整的用户标签数据，包含活跃度、忠诚度和价值标签
- **优先级**: P0

#### TC-007: 高活跃用户标签
- **测试目的**: 验证高活跃用户的标签生成逻辑
- **前置条件**: 存在活跃天数>=20的用户
- **测试步骤**:
  1. 查询活跃天数>=20的用户ID
  2. 发送GET请求获取该用户的标签
  3. 验证activity标签为"高活跃"
- **预期结果**: activity标签为"高活跃"
- **优先级**: P1

#### TC-008: 中活跃用户标签
- **测试目的**: 验证中活跃用户的标签生成逻辑
- **前置条件**: 存在活跃天数在10-19之间的用户
- **测试步骤**:
  1. 查询活跃天数在10-19之间的用户ID
  2. 发送GET请求获取该用户的标签
  3. 验证activity标签为"中活跃"
- **预期结果**: activity标签为"中活跃"
- **优先级**: P1

#### TC-009: 忠诚用户标签
- **测试目的**: 验证忠诚用户的标签生成逻辑
- **前置条件**: 存在注册超过30天且活跃天数>15的用户
- **测试步骤**:
  1. 查询符合条件的用户ID
  2. 发送GET请求获取该用户的标签
  3. 验证loyalty标签为"忠诚用户"
- **预期结果**: loyalty标签为"忠诚用户"
- **优先级**: P1

#### TC-010: 高价值用户标签
- **测试目的**: 验证高价值用户的标签生成逻辑
- **前置条件**: 存在事件总数>1000的用户
- **测试步骤**:
  1. 查询事件总数>1000的用户ID
  2. 发送GET请求获取该用户的标签
  3. 验证value标签为"高价值"
- **预期结果**: value标签为"高价值"
- **优先级**: P1

#### TC-011: 用户不存在返回空数组
- **测试目的**: 验证用户不存在时返回空标签数组
- **前置条件**: 用户ID=999999不存在
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/tags?userId=999999`
  2. 检查响应状态码为200
  3. 验证data为空数组
- **预期结果**: 返回success=true，data=[]
- **优先级**: P1

---

## 3. 获取用户行为特征

### 接口信息
- **接口路径**: `/api/analytics/user/behavior`
- **请求方法**: `GET`
- **功能描述**: 获取用户的行为特征，包括访问频率、页面偏好和功能使用情况

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| userId | string | 是 | 用户ID | "2" |

### 请求示例
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/behavior?userId=2"
```

### 预期响应（成功）
```json
{
  "success": true,
  "data": {
    "visitFrequency": {
      "totalVisits": 68,
      "activeDays": 1,
      "avgDailyVisits": "68.00"
    },
    "pagePreference": [
      {
        "pageName": "home",
        "visitCount": 30,
        "percentage": "44.12"
      },
      {
        "pageName": "profile",
        "visitCount": 20,
        "percentage": "29.41"
      }
    ],
    "featureUsage": [
      {
        "eventName": "page_view",
        "usageCount": 68,
        "usageDays": 1
      }
    ]
  }
}
```

### 测试用例

#### TC-012: 正常获取用户行为特征
- **测试目的**: 验证能正常获取用户的行为特征
- **前置条件**: 用户ID=2存在且有行为数据
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/behavior?userId=2`
  2. 检查响应状态码为200
  3. 验证返回的数据包含visitFrequency、pagePreference、featureUsage三个部分
- **预期结果**: 返回完整的行为特征数据
- **优先级**: P0

#### TC-013: 页面偏好数据验证
- **测试目的**: 验证页面偏好数据的准确性
- **前置条件**: 用户有page_view事件且包含page属性
- **测试步骤**:
  1. 发送GET请求获取用户行为特征
  2. 验证pagePreference数组按visitCount降序排列
  3. 验证percentage总和为100（或接近100）
- **预期结果**: pagePreference数据正确，百分比计算准确
- **优先级**: P1

#### TC-014: 功能使用数据验证
- **测试目的**: 验证功能使用数据的准确性
- **前置条件**: 用户有多种类型的事件
- **测试步骤**:
  1. 发送GET请求获取用户行为特征
  2. 验证featureUsage数组按usageCount降序排列
  3. 验证usageDays不大于activeDays
- **预期结果**: featureUsage数据正确
- **优先级**: P1

#### TC-015: 访问频率计算验证
- **测试目的**: 验证访问频率计算的准确性
- **前置条件**: 用户有行为数据
- **测试步骤**:
  1. 发送GET请求获取用户行为特征
  2. 手动计算：avgDailyVisits = totalVisits / activeDays
  3. 验证返回的avgDailyVisits与计算结果一致
- **预期结果**: avgDailyVisits计算准确
- **优先级**: P1

#### TC-016: 无页面偏好数据
- **测试目的**: 验证用户没有page_view事件时的处理
- **前置条件**: 用户没有page_view事件
- **测试步骤**:
  1. 发送GET请求获取用户行为特征
  2. 验证pagePreference为空数组
- **预期结果**: pagePreference=[]
- **优先级**: P2

---

## 4. 获取用户兴趣画像

### 接口信息
- **接口路径**: `/api/analytics/user/interest`
- **请求方法**: `GET`
- **功能描述**: 获取用户的兴趣画像，基于页面访问和功能使用生成兴趣标签

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| userId | string | 是 | 用户ID | "2" |

### 请求示例
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/interest?userId=2"
```

### 预期响应（成功）
```json
{
  "success": true,
  "data": [
    {
      "name": "home",
      "score": 44.12,
      "type": "page"
    },
    {
      "name": "profile",
      "score": 29.41,
      "type": "page"
    },
    {
      "name": "page_view",
      "score": 100.0,
      "type": "feature"
    }
  ]
}
```

### 测试用例

#### TC-017: 正常获取用户兴趣画像
- **测试目的**: 验证能正常获取用户的兴趣画像
- **前置条件**: 用户ID=2存在且有行为数据
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/interest?userId=2`
  2. 检查响应状态码为200
  3. 验证返回的兴趣数组包含type为"page"和"feature"的标签
- **预期结果**: 返回完整的兴趣画像数据
- **优先级**: P0

#### TC-018: 兴趣分数验证
- **测试目的**: 验证兴趣分数的计算准确性
- **前置条件**: 用户有行为数据
- **测试步骤**:
  1. 发送GET请求获取用户兴趣画像
  2. 对比行为特征中的pagePreference数据
  3. 验证兴趣分数与页面访问百分比一致
- **预期结果**: 兴趣分数计算准确
- **优先级**: P1

#### TC-019: 无兴趣数据
- **测试目的**: 验证用户没有行为数据时的处理
- **前置条件**: 用户没有任何行为事件
- **测试步骤**:
  1. 发送GET请求获取用户兴趣画像
  2. 验证返回的兴趣数组为空
- **预期结果**: 返回空数组
- **优先级**: P2

---

## 5. 获取用户价值评估

### 接口信息
- **接口路径**: `/api/analytics/user/value`
- **请求方法**: `GET`
- **功能描述**: 获取用户的价值评估，包括等级、分数和描述

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| userId | string | 是 | 用户ID | "2" |

### 请求示例
```bash
curl -X GET "http://120.48.95.51:7001/api/analytics/user/value?userId=2"
```

### 预期响应（成功）
```json
{
  "success": true,
  "data": {
    "level": "流失用户",
    "score": 10,
    "description": "用户活跃度极低，需要重新激活"
  }
}
```

### 测试用例

#### TC-020: 正常获取用户价值评估
- **测试目的**: 验证能正常获取用户的价值评估
- **前置条件**: 用户ID=2存在且有行为数据
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/value?userId=2`
  2. 检查响应状态码为200
  3. 验证返回的数据包含level、score、description
- **预期结果**: 返回完整的价值评估数据
- **优先级**: P0

#### TC-021: 流失用户评估
- **测试目的**: 验证流失用户的评估逻辑
- **前置条件**: 用户活跃度极低（如活跃天数<3）
- **测试步骤**:
  1. 发送GET请求获取用户价值评估
  2. 验证level为"流失用户"
  3. 验证score较低（<30）
- **预期结果**: level="流失用户"，score较低
- **优先级**: P1

#### TC-022: 核心用户评估
- **测试目的**: 验证核心用户的评估逻辑
- **前置条件**: 用户活跃度高且价值高
- **测试步骤**:
  1. 发送GET请求获取用户价值评估
  2. 验证level为"核心用户"
  3. 验证score较高（>80）
- **预期结果**: level="核心用户"，score较高
- **优先级**: P1

#### TC-023: 用户不存在
- **测试目的**: 验证用户不存在时的处理
- **前置条件**: 用户ID=999999不存在
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/value?userId=999999`
  2. 检查响应状态码
  3. 验证错误信息
- **预期结果**: 返回适当的错误信息
- **优先级**: P1

---

## 6. 获取用户列表

### 接口信息
- **接口路径**: `/api/analytics/user/list`
- **请求方法**: `GET`
- **功能描述**: 获取用户列表，支持分页和按活跃度、价值等级筛选

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| page | number | 否 | 页码，默认1 | "1" |
| pageSize | number | 否 | 每页数量，默认20 | "20" |
| activityLevel | string | 否 | 活跃度筛选 | "high" |
| valueLevel | string | 否 | 价值等级筛选 | "core" |

### 请求示例
```bash
# 获取第一页用户列表
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?page=1&pageSize=20"

# 获取高活跃用户
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?activityLevel=high"

# 获取核心用户
curl -X GET "http://120.48.95.51:7001/api/analytics/user/list?valueLevel=core"
```

### 预期响应（成功）
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "userId": "2",
        "registerTime": "2025-12-31T02:21:25.514Z",
        "lastActiveTime": "2025-12-31T06:43:25.578Z",
        "totalEvents": 68,
        "activeDays": 1,
        "activityLevel": "low",
        "valueLevel": "流失用户"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 测试用例

#### TC-024: 正常获取用户列表
- **测试目的**: 验证能正常获取用户列表
- **前置条件**: 数据库中有用户数据
- **测试步骤**:
  1. 发送GET请求到 `/api/analytics/user/list?page=1&pageSize=20`
  2. 检查响应状态码为200
  3. 验证返回的数据包含list、total、page、pageSize
- **预期结果**: 返回完整的用户列表数据
- **优先级**: P0

#### TC-025: 分页功能验证
- **测试目的**: 验证分页功能是否正常
- **前置条件**: 数据库中有足够多的用户数据（>20条）
- **测试步骤**:
  1. 获取第一页数据：`/api/analytics/user/list?page=1&pageSize=10`
  2. 获取第二页数据：`/api/analytics/user/list?page=2&pageSize=10`
  3. 验证两页数据不重复
  4. 验证total总数正确
- **预期结果**: 分页功能正常，数据不重复
- **优先级**: P1

#### TC-026: 按活跃度筛选
- **测试目的**: 验证按活跃度筛选功能
- **前置条件**: 数据库中有不同活跃度的用户
- **测试步骤**:
  1. 获取高活跃用户：`/api/analytics/user/list?activityLevel=high`
  2. 验证返回的用户activeDays>=20
  3. 获取低活跃用户：`/api/analytics/user/list?activityLevel=low`
  4. 验证返回的用户activeDays<10
- **预期结果**: 筛选结果正确
- **优先级**: P1

#### TC-027: 按价值等级筛选
- **测试目的**: 验证按价值等级筛选功能
- **前置条件**: 数据库中有不同价值等级的用户
- **测试步骤**:
  1. 获取核心用户：`/api/analytics/user/list?valueLevel=core`
  2. 验证返回的用户valueLevel为"核心用户"
  3. 获取流失用户：`/api/analytics/user/list?valueLevel=流失用户`
  4. 验证返回的用户valueLevel为"流失用户"
- **预期结果**: 筛选结果正确
- **优先级**: P1

#### TC-028: 组合筛选
- **测试目的**: 验证组合筛选功能
- **前置条件**: 数据库中有符合条件的用户
- **测试步骤**:
  1. 发送请求：`/api/analytics/user/list?activityLevel=high&valueLevel=core`
  2. 验证返回的用户同时满足两个筛选条件
- **预期结果**: 组合筛选结果正确
- **优先级**: P2

#### TC-029: 空列表处理
- **测试目的**: 验证没有符合条件的用户时的处理
- **前置条件**: 无
- **测试步骤**:
  1. 发送请求：`/api/analytics/user/list?activityLevel=high&valueLevel=流失用户`
  2. 验证list为空数组
  3. 验证total为0
- **预期结果**: list=[]，total=0
- **优先级**: P2

---

## 性能测试用例

### TC-030: 大量用户数据查询性能
- **测试目的**: 验证查询大量用户数据时的性能
- **前置条件**: 数据库中有大量用户数据（>1000条）
- **测试步骤**:
  1. 发送请求获取用户列表，pageSize=100
  2. 记录响应时间
  3. 验证响应时间<2秒
- **预期结果**: 响应时间<2秒
- **优先级**: P1

### TC-031: 并发请求测试
- **测试目的**: 验证系统在高并发情况下的稳定性
- **前置条件**: 无
- **测试步骤**:
  1. 使用工具（如JMeter）发送100个并发请求
  2. 观察系统响应
  3. 验证错误率<5%
- **预期结果**: 系统稳定，错误率<5%
- **优先级**: P1

---

## 安全测试用例

### TC-032: SQL注入测试
- **测试目的**: 验证系统对SQL注入攻击的防护
- **前置条件**: 无
- **测试步骤**:
  1. 发送请求：`/api/analytics/user/profile?userId=1' OR '1'='1`
  2. 验证系统不会返回所有用户数据
  3. 验证错误信息不包含SQL语句
- **预期结果**: 系统正确处理，不泄露数据库信息
- **优先级**: P0

### TC-033: XSS攻击测试
- **测试目的**: 验证系统对XSS攻击的防护
- **前置条件**: 无
- **测试步骤**:
  1. 发送请求：`/api/analytics/user/profile?userId=<script>alert(1)</script>`
  2. 验证响应中不包含未转义的脚本标签
- **预期结果**: 系统正确转义特殊字符
- **优先级**: P0

### TC-034: 越权访问测试
- **测试目的**: 验证系统对越权访问的防护
- **前置条件**: 无
- **测试步骤**:
  1. 尝试访问其他用户的画像数据
  2. 验证系统有适当的权限控制
- **预期结果**: 系统有权限控制机制
- **优先级**: P1

---

## 测试环境准备

### 数据准备
```sql
-- 插入测试用户数据
INSERT INTO analytics_events (user_id, event_name, properties, created_at) VALUES
('1', 'page_view', '{"page": "home"}', NOW() - INTERVAL '30 days'),
('1', 'page_view', '{"page": "profile"}', NOW() - INTERVAL '29 days'),
-- ... 更多测试数据
('2', 'page_view', '{"page": "home"}', NOW() - INTERVAL '1 days'),
('2', 'page_view', '{"page": "profile"}', NOW() - INTERVAL '1 hours');
```

### 测试工具
- **API测试**: Postman、curl、HTTPie
- **性能测试**: JMeter、Apache Bench
- **自动化测试**: Jest、Mocha + Supertest

---

## 测试执行记录

| 用例编号 | 执行日期 | 执行人 | 结果 | 备注 |
|----------|----------|--------|------|------|
| TC-001 | | | | |
| TC-002 | | | | |
| ... | | | | |

---

## 常见问题

### Q1: 接口返回500错误
**原因**: 
- 数据库连接失败
- SQL查询错误
- 代码逻辑错误

**解决方法**:
1. 检查服务器日志
2. 验证数据库连接配置
3. 检查SQL语句是否正确

### Q2: 用户画像数据不准确
**原因**:
- 用户行为数据不完整
- 标签生成逻辑需要调整
- 数据更新延迟

**解决方法**:
1. 确认用户行为数据完整性
2. 调整标签生成规则
3. 检查定时任务是否正常运行

### Q3: 接口响应慢
**原因**:
- 数据库查询未优化
- 缺少索引
- 数据量过大

**解决方法**:
1. 优化SQL查询
2. 添加必要的数据库索引
3. 考虑分页或缓存

---

## 附录

### A. HTTP状态码说明
- **200**: 请求成功
- **422**: 参数错误
- **500**: 服务器内部错误

### B. 错误码说明
- **userId is required**: 缺少必填参数userId
- **Failed to get user basic info**: 获取用户基础信息失败
- **Failed to get user behavior features**: 获取用户行为特征失败
- **Failed to get user tags**: 获取用户标签失败
- **Failed to get user value assessment**: 获取用户价值评估失败

### C. 标签生成规则
- **活跃度标签**:
  - 高活跃: activeDays >= 20
  - 中活跃: 10 <= activeDays < 20
  - 低活跃: activeDays < 10

- **忠诚度标签**:
  - 忠诚用户: daysSinceRegister > 30 && activeDays > 15
  - 普通用户: daysSinceRegister > 7
  - 新用户: daysSinceRegister <= 7

- **价值标签**:
  - 高价值: totalEvents > 1000
  - 中价值: 500 < totalEvents <= 1000
  - 低价值: totalEvents <= 500

### D. 价值等级说明
- **核心用户**: score > 80
- **重要用户**: 60 < score <= 80
- **普通用户**: 40 < score <= 60
- **低价值用户**: 20 < score <= 40
- **流失用户**: score <= 20

---

## 更新记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2025-12-31 | 初始版本 | AI Assistant |

---

## 联系方式

如有问题或建议，请联系开发团队。
