# Analytics API 文档

## 趋势分析接口

### 接口地址
```
GET /api/analytics/trends
```

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metric | string | 否 | 指标类型，默认为 'events' |
| startDate | string | 是 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 是 | 结束日期，格式：YYYY-MM-DD |
| interval | string | 否 | 时间间隔，默认为 'day' |

### 支持的metric类型

#### 1. events - 事件总数趋势
返回事件总数和独立用户数。

**请求示例：**
```bash
GET /api/analytics/trends?metric=events&startDate=2025-12-31&endDate=2026-01-01&interval=day
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "timeBucket": "2025-12-30T16:00:00.000Z",
      "count": 291,
      "uniqueUsers": 57
    },
    {
      "timeBucket": "2025-12-31T16:00:00.000Z",
      "count": 71,
      "uniqueUsers": 19
    }
  ]
}
```

#### 2. dau - 日活跃用户数趋势
返回每日活跃用户数和总事件数。

**请求示例：**
```bash
GET /api/analytics/trends?metric=dau&startDate=2025-12-31&endDate=2026-01-01&interval=day
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "timeBucket": "2025-12-30T16:00:00.000Z",
      "dau": 57,
      "totalEvents": 291
    },
    {
      "timeBucket": "2025-12-31T16:00:00.000Z",
      "dau": 19,
      "totalEvents": 71
    }
  ]
}
```

#### 3. page_views - 页面访问量趋势
返回页面访问量、独立访客数和独立页面数。

**请求示例：**
```bash
GET /api/analytics/trends?metric=page_views&startDate=2025-12-31&endDate=2026-01-01&interval=day
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "timeBucket": "2025-12-30T16:00:00.000Z",
      "pageViews": 77,
      "uniqueVisitors": 56,
      "uniquePages": 3
    },
    {
      "timeBucket": "2025-12-31T16:00:00.000Z",
      "pageViews": 17,
      "uniqueVisitors": 17,
      "uniquePages": 1
    }
  ]
}
```

#### 4. unique_users - 唯一用户数趋势
返回唯一用户数和总事件数。

**请求示例：**
```bash
GET /api/analytics/trends?metric=unique_users&startDate=2025-12-31&endDate=2026-01-01&interval=day
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "timeBucket": "2025-12-30T16:00:00.000Z",
      "uniqueUsers": 57,
      "totalEvents": 291
    },
    {
      "timeBucket": "2025-12-31T16:00:00.000Z",
      "uniqueUsers": 19,
      "totalEvents": 71
    }
  ]
}
```

#### 5. retention - 留存率趋势
返回新增用户数、次日留存数、次日留存率、7日留存数和7日留存率。

**请求示例：**
```bash
GET /api/analytics/trends?metric=retention&startDate=2025-12-31&endDate=2026-01-01&interval=day
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "timeBucket": "2025-12-30T16:00:00.000Z",
      "newUsers": 57,
      "day1Retained": 0,
      "day1RetentionRate": "0.00",
      "day7Retained": 0,
      "day7RetentionRate": "0.00"
    },
    {
      "timeBucket": "2025-12-31T16:00:00.000Z",
      "newUsers": 19,
      "day1Retained": 2,
      "day1RetentionRate": "10.53",
      "day7Retained": 0,
      "day7RetentionRate": "0.00"
    }
  ]
}
```

#### 6. performance - 性能指标趋势
返回总事件数、包含duration的事件数、平均时长、中位数时长和P95时长。

**请求示例：**
```bash
GET /api/analytics/trends?metric=performance&startDate=2025-12-31&endDate=2026-01-01&interval=day
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "timeBucket": "2025-12-30T16:00:00.000Z",
      "totalEvents": 100,
      "eventsWithDuration": 80,
      "avgDuration": "150.25",
      "medianDuration": "145.00",
      "p95Duration": "300.00"
    }
  ]
}
```

### 支持的时间间隔（interval）

| interval值 | 说明 |
|------------|------|
| hour | 按小时分组 |
| day | 按天分组（默认） |
| week | 按周分组 |
| month | 按月分组 |

### 错误响应

当参数缺失或查询失败时，返回错误信息：

```json
{
  "success": false,
  "message": "startDate and endDate are required"
}
```

或

```json
{
  "success": false,
  "message": "Failed to get trend analysis",
  "error": "具体错误信息"
}
```

### 使用场景

1. **events** - 查看整体事件量的变化趋势
2. **dau** - 监控日活跃用户数的变化
3. **page_views** - 分析页面访问量和访客情况
4. **unique_users** - 追踪独立用户数的变化
5. **retention** - 评估用户留存情况
6. **performance** - 监控系统性能指标

### 注意事项

1. startDate和endDate参数必须同时提供
2. 时间间隔interval会影响数据的粒度，请根据需求选择合适的间隔
3. 不同metric类型返回的字段不同，请根据实际需求选择合适的metric
4. 留存率计算基于首次访问用户的后续访问情况
5. 性能指标需要事件数据中包含duration字段
