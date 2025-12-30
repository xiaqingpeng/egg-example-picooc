# Egg.js后端需要做的事情

---

## 阶段一：统计分析API开发

### 📊 用户活跃度统计

```javascript
// app/service/analytics.js 扩展
class AnalyticsService extends Service {
    // 获取DAU/MAU统计
    async getActivityStats(startDate, endDate) {
        const { app } = this;
        const { sequelize } = app;
        
        // DAU统计
        const dauStats = await sequelize.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT user_id) as dau
            FROM analytics_events
            WHERE created_at >= :startDate 
                AND created_at <= :endDate
            GROUP BY DATE(created_at)
            ORDER BY date
        `, { 
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT 
        });
        
        // MAU统计
        const mauStats = await sequelize.query(`
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(DISTINCT user_id) as mau
            FROM analytics_events
            WHERE created_at >= :startDate 
                AND created_at <= :endDate
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        `, { 
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT 
        });
        
        return { dauStats, mauStats };
    }
    
    // 获取留存率统计
    async getRetentionStats(days = 7) {
        const { app } = this;
        const { sequelize } = app;
        
        // 次日留存
        const day1Retention = await sequelize.query(`
            WITH user_first_login AS (
                SELECT 
                    user_id,
                    MIN(DATE(created_at)) as first_date
                FROM analytics_events
                WHERE event_name = 'login_success'
                GROUP BY user_id
            ),
            user_login_count AS (
                SELECT 
                    ufl.user_id,
                    ufl.first_date,
                    COUNT(DISTINCT DATE(ae.created_at)) as login_days
                FROM user_first_login ufl
                LEFT JOIN analytics_events ae 
                    ON ufl.user_id = ae.user_id 
                    AND ae.event_name = 'login_success'
                    AND DATE(ae.created_at) >= ufl.first_date
                    AND DATE(ae.created_at) <= ufl.first_date + INTERVAL '1 day'
                GROUP BY ufl.user_id, ufl.first_date
            )
            SELECT 
                COUNT(CASE WHEN login_days >= 2 THEN 1 END) * 100.0 / COUNT(*) as day1_retention
            FROM user_login_count
        `, { type: sequelize.QueryTypes.SELECT });
        
        // 7日留存、30日留存类似实现
        return { day1Retention, day7Retention, day30Retention };
    }
    
    // 获取页面访问统计
    async getPageViewStats(startDate, endDate) {
        const { app } = this;
        const { sequelize } = app;
        
        const stats = await sequelize.query(`
            SELECT 
                properties->>'page' as page_name,
                COUNT(*) as pv,
                COUNT(DISTINCT user_id) as uv,
                AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at)))) as avg_stay_time
            FROM analytics_events
            WHERE event_name = 'page_view'
                AND created_at >= :startDate 
                AND created_at <= :endDate
            GROUP BY properties->>'page'
            ORDER BY pv DESC
        `, { 
            replacements: { startDate, endDate },
            type: sequelize.QueryTypes.SELECT 
        });
        
        return stats;
    }
    
    // 获取事件统计
    async getEventStats(eventType, startDate, endDate) {
        const { app } = this;
        const { sequelize } = app;
        
        const stats = await sequelize.query(`
            SELECT 
                event_name,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users,
                AVG(duration) as avg_duration
            FROM analytics_events
            WHERE (:eventType IS NULL OR event_type = :eventType)
                AND created_at >= :startDate 
                AND created_at <= :endDate
            GROUP BY event_name
            ORDER BY count DESC
        `, { 
            replacements: { eventType, startDate, endDate },
            type: sequelize.QueryTypes.SELECT 
        });
        
        return stats;
    }
}

### 📈 趋势分析API

```javascript
// 时间序列趋势分析
async getTrendAnalysis(metric, startDate, endDate, interval = 'day') {
    const { app } = this;
    const { sequelize } = app;
    
    const intervalMap = {
        'hour': "DATE_TRUNC('hour', created_at)",
        'day': "DATE_TRUNC('day', created_at)",
        'week': "DATE_TRUNC('week', created_at)",
        'month': "DATE_TRUNC('month', created_at)"
    };
    
    const timeTrunc = intervalMap[interval] || intervalMap['day'];
    
    const trend = await sequelize.query(`
        SELECT 
            ${timeTrunc} as time_bucket,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE created_at >= :startDate 
            AND created_at <= :endDate
        GROUP BY ${timeTrunc}
        ORDER BY time_bucket
    `, { 
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT 
    });
    
    return trend;
}
```

---

## 阶段二：用户画像API开发

### 👤 用户基础画像

```javascript
// app/service/userProfile.js 新建
class UserProfileService extends Service {
    // 获取用户基础信息
    async getUserBasicInfo(userId) {
        const { app } = this;
        const { sequelize } = app;
        
        const userInfo = await sequelize.query(`
            SELECT 
                user_id,
                MIN(created_at) as register_time,
                MAX(created_at) as last_active_time,
                COUNT(*) as total_events,
                COUNT(DISTINCT DATE(created_at)) as active_days
            FROM analytics_events
            WHERE user_id = :userId
            GROUP BY user_id
        `, { 
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT 
        });
        
        return userInfo[0];
    }
    
    // 获取用户标签
    async getUserTags(userId) {
        const basicInfo = await this.getUserBasicInfo(userId);
        const tags = [];
        
        // 活跃度标签
        const activeDays = basicInfo.active_days;
        if (activeDays >= 20) tags.push({ name: '高活跃', type: 'activity' });
        else if (activeDays >= 10) tags.push({ name: '中活跃', type: 'activity' });
        else tags.push({ name: '低活跃', type: 'activity' });
        
        // 忠诚度标签
        const registerTime = new Date(basicInfo.register_time);
        const daysSinceRegister = Math.floor((new Date() - registerTime) / (1000 * 60 * 60 * 24));
        if (daysSinceRegister > 30 && activeDays > 15) tags.push({ name: '忠诚用户', type: 'loyalty' });
        else if (daysSinceRegister > 7) tags.push({ name: '普通用户', type: 'loyalty' });
        else tags.push({ name: '新用户', type: 'loyalty' });
        
        // 价值标签
        const totalEvents = basicInfo.total_events;
        if (totalEvents > 1000) tags.push({ name: '高价值', type: 'value' });
        else if (totalEvents > 500) tags.push({ name: '中价值', type: 'value' });
        else tags.push({ name: '低价值', type: 'value' });
        
        return tags;
    }
    
    // 获取用户行为特征
    async getUserBehaviorFeatures(userId) {
        const { app } = this;
        const { sequelize } = app;
        
        // 访问频率
        const visitFrequency = await sequelize.query(`
            SELECT 
                COUNT(*) as total_visits,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                COUNT(*) * 1.0 / COUNT(DISTINCT DATE(created_at)) as avg_daily_visits
            FROM analytics_events
            WHERE user_id = :userId
        `, { 
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT 
        });
        
        // 页面偏好
        const pagePreference = await sequelize.query(`
            SELECT 
                properties->>'page' as page_name,
                COUNT(*) as visit_count,
                COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
            FROM analytics_events
            WHERE user_id = :userId
                AND event_name = 'page_view'
            GROUP BY properties->>'page'
            ORDER BY visit_count DESC
            LIMIT 10
        `, { 
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT 
        });
        
        // 功能使用
        const featureUsage = await sequelize.query(`
            SELECT 
                event_name,
                COUNT(*) as usage_count,
                COUNT(DISTINCT DATE(created_at)) as usage_days
            FROM analytics_events
            WHERE user_id = :userId
            GROUP BY event_name
            ORDER BY usage_count DESC
            LIMIT 10
        `, { 
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT 
        });
        
        return {
            visitFrequency: visitFrequency[0],
            pagePreference,
            featureUsage
        };
    }
    
    // 获取用户兴趣画像
    async getUserInterestProfile(userId) {
        const behaviorFeatures = await this.getUserBehaviorFeatures(userId);
        
        // 基于页面访问生成兴趣标签
        const interests = behaviorFeatures.pagePreference.map(page => ({
            name: page.page_name,
            score: page.percentage,
            type: 'page'
        }));
        
        // 基于功能使用生成兴趣标签
        behaviorFeatures.featureUsage.forEach(feature => {
            const existing = interests.find(i => i.name === feature.event_name);
            if (!existing) {
                interests.push({
                    name: feature.event_name,
                    score: feature.usage_count * 0.1,
                    type: 'feature'
                });
            }
        });
        
        // 按分数排序
        interests.sort((a, b) => b.score - a.score);
        
        return interests.slice(0, 10);
    }
    
    // 获取用户价值评估
    async getUserValueAssessment(userId) {
        const basicInfo = await this.getUserBasicInfo(userId);
        const behaviorFeatures = await this.getUserBehaviorFeatures(userId);
        
        // 活跃度评分（0-100）
        const activityScore = Math.min(100, basicInfo.active_days * 5);
        
        // 忠诚度评分（0-100）
        const registerTime = new Date(basicInfo.register_time);
        const daysSinceRegister = Math.floor((new Date() - registerTime) / (1000 * 60 * 60 * 24));
        const loyaltyScore = Math.min(100, daysSinceRegister * 0.5 + basicInfo.active_days * 2);
        
        // 行为深度评分（0-100）
        const behaviorScore = Math.min(100, behaviorFeatures.featureUsage.length * 10);
        
        // 时间价值评分（0-100）
        const timeScore = Math.min(100, basicInfo.total_events * 0.1);
        
        // 综合价值评分
        const totalScore = (activityScore + loyaltyScore + behaviorScore + timeScore) / 4;
        
        return {
            activityScore: Math.round(activityScore),
            loyaltyScore: Math.round(loyaltyScore),
            behaviorScore: Math.round(behaviorScore),
            timeScore: Math.round(timeScore),
            totalScore: Math.round(totalScore),
            level: this.getUserLevel(totalScore)
        };
    }
    
    getUserLevel(score) {
        if (score >= 80) return '核心用户';
        if (score >= 60) return '重要用户';
        if (score >= 40) return '普通用户';
        if (score >= 20) return '潜在用户';
        return '流失用户';
    }
}
```

### 📋 用户列表API

```javascript
// 获取用户列表（支持分页和筛选）
async getUserList(page = 1, pageSize = 20, filter = {}) {
    const { app } = this;
    const { sequelize } = app;
    
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const replacements = { offset, pageSize };
    
    // 添加筛选条件
    if (filter.activityLevel) {
        whereClause += ` AND activity_level = :activityLevel`;
        replacements.activityLevel = filter.activityLevel;
    }
    
    if (filter.valueLevel) {
        whereClause += ` AND value_level = :valueLevel`;
        replacements.valueLevel = filter.valueLevel;
    }
    
    // 查询用户列表
    const users = await sequelize.query(`
        SELECT 
            user_id,
            register_time,
            last_active_time,
            total_events,
            active_days,
            activity_level,
            value_level
        FROM user_profiles
        ${whereClause}
        ORDER BY last_active_time DESC
        LIMIT :pageSize OFFSET :offset
    `, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });
    
    // 查询总数
    const countResult = await sequelize.query(`
        SELECT COUNT(*) as total
        FROM user_profiles
        ${whereClause}
    `, { 
        replacements: { ...replacements, offset: undefined, pageSize: undefined },
        type: sequelize.QueryTypes.SELECT 
    });
    
    return {
        users,
        total: countResult[0].total,
        page,
        pageSize,
        totalPages: Math.ceil(countResult[0].total / pageSize)
    };
}
```

---

## 阶段三：数据聚合和预处理

### 🔄 定时任务

```javascript
// app/schedule/userProfileTask.js
module.exports = {
    schedule: {
        interval: '1h', // 每小时执行一次
        type: 'worker', // 指定所有的 worker 都执行
        immediate: true, // 启动时立即执行一次
    },
    async task(ctx) {
        const { service } = ctx;
        
        // 更新用户画像
        await service.userProfile.updateAllUserProfiles();
        
        // 更新用户标签
        await service.userProfile.updateAllUserTags();
        
        // 更新用户价值评估
        await service.userProfile.updateAllUserValueAssessments();
    },
};

// 批量更新用户画像
async updateAllUserProfiles() {
    const { app } = this;
    const { sequelize } = app;
    
    // 获取所有用户
    const users = await sequelize.query(`
        SELECT DISTINCT user_id
        FROM analytics_events
        WHERE user_id IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });
    
    // 更新每个用户的画像
    for (const user of users) {
        await this.updateUserProfile(user.user_id);
    }
}

async updateUserProfile(userId) {
    const basicInfo = await this.getUserBasicInfo(userId);
    const tags = await this.getUserTags(userId);
    const behaviorFeatures = await this.getUserBehaviorFeatures(userId);
    const valueAssessment = await this.getUserValueAssessment(userId);
    
    // 保存到user_profiles表
    await this.app.model.UserProfile.upsert({
        user_id: userId,
        register_time: basicInfo.register_time,
        last_active_time: basicInfo.last_active_time,
        total_events: basicInfo.total_events,
        active_days: basicInfo.active_days,
        tags: JSON.stringify(tags),
        behavior_features: JSON.stringify(behaviorFeatures),
        value_assessment: JSON.stringify(valueAssessment),
        activity_level: this.getActivityLevel(basicInfo.active_days),
        value_level: valueAssessment.level
    });
}
```

---

## 阶段四：数据库优化

### 📊 创建索引

```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_events_user_created ON analytics_events(user_id, created_at);
CREATE INDEX idx_events_event_created ON analytics_events(event_name, created_at);

-- 创建复合索引
CREATE INDEX idx_events_user_event_time ON analytics_events(user_id, event_name, created_at);

-- 创建用户画像表
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    register_time TIMESTAMP,
    last_active_time TIMESTAMP,
    total_events INTEGER DEFAULT 0,
    active_days INTEGER DEFAULT 0,
    tags JSONB,
    behavior_features JSONB,
    value_assessment JSONB,
    activity_level VARCHAR(50),
    value_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_activity_level ON user_profiles(activity_level);
CREATE INDEX idx_user_profiles_value_level ON user_profiles(value_level);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active_time);
```

---

## 阶段五：性能优化

### ⚡ 缓存策略

```javascript
// 使用Redis缓存热点数据
async getActivityStats(startDate, endDate) {
    const cacheKey = `activity_stats:${startDate}:${endDate}`;
    
    // 尝试从缓存获取
    const cached = await this.app.redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // 从数据库查询
    const stats = await this.queryActivityStats(startDate, endDate);
    
    // 缓存结果（1小时）
    await this.app.redis.setex(cacheKey, 3600, JSON.stringify(stats));
    
    return stats;
}
```

### 🚀 查询优化

```javascript
// 使用分页查询避免一次性加载大量数据
async getUserList(page, pageSize) {
    const offset = (page - 1) * pageSize;
    
    const users = await this.app.model.AnalyticsEvent.findAll({
        attributes: ['user_id', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['user_id'],
        order: [['count', 'DESC']],
        limit: pageSize,
        offset: offset
    });
    
    return users;
}
```

---

## 阶段六：API路由配置

### 🛣️ 路由定义

```javascript
// app/router.js
module.exports = app => {
    const { router, controller } = app;
    
    // 统计分析API
    router.get('/api/analytics/stats/activity', controller.analytics.getActivityStats);
    router.get('/api/analytics/stats/retention', controller.analytics.getRetentionStats);
    router.get('/api/analytics/stats/page-view', controller.analytics.getPageViewStats);
    router.get('/api/analytics/stats/event', controller.analytics.getEventStats);
    router.get('/api/analytics/stats/trend', controller.analytics.getTrendAnalysis);
    
    // 用户画像API
    router.get('/api/analytics/user/profile', controller.userProfile.getUserProfile);
    router.get('/api/analytics/user/tags', controller.userProfile.getUserTags);
    router.get('/api/analytics/user/behavior', controller.userProfile.getUserBehaviorFeatures);
    router.get('/api/analytics/user/interest', controller.userProfile.getUserInterestProfile);
    router.get('/api/analytics/user/value', controller.userProfile.getUserValueAssessment);
    router.get('/api/analytics/users', controller.userProfile.getUserList);
};
```


