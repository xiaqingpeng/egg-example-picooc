'use strict';

const Service = require('egg').Service;

class UserProfileService extends Service {
  /**
   * 获取用户基础信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户基础信息
   */
  async getUserBasicInfo(userId) {
    const { ctx } = this;
    
    try {
      const sequelize = ctx.model;

      if (!sequelize) {
        ctx.logger.error('[getUserBasicInfo] Sequelize instance is not available');
        throw new Error('Sequelize instance is not available');
      }

      ctx.logger.info(`[getUserBasicInfo] Querying user info for userId: ${userId}`);
      
      let userInfo;
      try {
        userInfo = await sequelize.query(`
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
        
        ctx.logger.info('[getUserBasicInfo] Query executed successfully');
      } catch (queryError) {
        ctx.logger.error('[getUserBasicInfo] Query execution failed:', queryError);
        throw queryError;
      }

      const result = userInfo[0] || null;
      ctx.logger.info('[getUserBasicInfo] Returning result:', JSON.stringify(result));
      
      return result;
    } catch (error) {
      ctx.logger.error('[getUserBasicInfo] Failed to get user basic info:', error.message);
      throw new Error('Failed to get user basic info');
    }
  }

  /**
   * 获取用户标签
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 用户标签数组
   */
  async getUserTags(userId) {
    const basicInfo = await this.getUserBasicInfo(userId);
    if (!basicInfo) {
      return [];
    }

    const tags = [];

    // 活跃度标签
    const activeDays = basicInfo.active_days;
    if (activeDays >= 20) {
      tags.push({ name: '高活跃', type: 'activity' });
    } else if (activeDays >= 10) {
      tags.push({ name: '中活跃', type: 'activity' });
    } else {
      tags.push({ name: '低活跃', type: 'activity' });
    }

    // 忠诚度标签
    const registerTime = new Date(basicInfo.register_time);
    const daysSinceRegister = Math.floor((new Date() - registerTime) / (1000 * 60 * 60 * 24));
    if (daysSinceRegister > 30 && activeDays > 15) {
      tags.push({ name: '忠诚用户', type: 'loyalty' });
    } else if (daysSinceRegister > 7) {
      tags.push({ name: '普通用户', type: 'loyalty' });
    } else {
      tags.push({ name: '新用户', type: 'loyalty' });
    }

    // 价值标签
    const totalEvents = basicInfo.total_events;
    if (totalEvents > 1000) {
      tags.push({ name: '高价值', type: 'value' });
    } else if (totalEvents > 500) {
      tags.push({ name: '中价值', type: 'value' });
    } else {
      tags.push({ name: '低价值', type: 'value' });
    }

    return tags;
  }

  /**
   * 获取用户行为特征
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户行为特征
   */
  async getUserBehaviorFeatures(userId) {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      // 访问频率
      const visitFrequency = await sequelize.query(`
        SELECT 
          COUNT(*) as total_visits,
          COUNT(DISTINCT DATE(created_at)) as active_days,
          CASE 
            WHEN COUNT(DISTINCT DATE(created_at)) = 0 THEN 0
            ELSE COUNT(*) * 1.0 / COUNT(DISTINCT DATE(created_at)) 
          END as avg_daily_visits
        FROM analytics_events
        WHERE user_id = :userId
      `, {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      });

      // 页面偏好 - 修复：使用properties::jsonb来转换TEXT为JSONB
      const pagePreference = await sequelize.query(`
        SELECT 
          properties::jsonb->>'page' as page_name,
          COUNT(*) as visit_count,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM analytics_events
        WHERE user_id = :userId
          AND event_name = 'page_view'
          AND properties::jsonb ? 'page'
        GROUP BY properties::jsonb->>'page'
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
        visitFrequency: {
          totalVisits: parseInt(visitFrequency[0]?.total_visits || 0),
          activeDays: parseInt(visitFrequency[0]?.active_days || 0),
          avgDailyVisits: parseFloat(visitFrequency[0]?.avg_daily_visits || 0).toFixed(2)
        },
        pagePreference: pagePreference.map(item => ({
          pageName: item.page_name,
          visitCount: parseInt(item.visit_count),
          percentage: parseFloat(item.percentage).toFixed(2)
        })),
        featureUsage: featureUsage.map(item => ({
          eventName: item.event_name,
          usageCount: parseInt(item.usage_count),
          usageDays: parseInt(item.usage_days)
        }))
      };
    } catch (error) {
      ctx.logger.error('Failed to get user behavior features:', error);
      throw new Error('Failed to get user behavior features');
    }
  }

  /**
   * 获取用户兴趣画像
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 用户兴趣画像
   */
  async getUserInterestProfile(userId) {
    const behaviorFeatures = await this.getUserBehaviorFeatures(userId);

    // 基于页面访问生成兴趣标签
    const interests = behaviorFeatures.pagePreference.map(page => ({
      name: page.pageName,
      score: parseFloat(page.percentage),
      type: 'page'
    }));

    // 基于功能使用生成兴趣标签
    behaviorFeatures.featureUsage.forEach(feature => {
      const existing = interests.find(i => i.name === feature.eventName);
      if (!existing) {
        interests.push({
          name: feature.eventName,
          score: feature.usageCount * 0.1,
          type: 'feature'
        });
      }
    });

    // 按分数排序
    interests.sort((a, b) => b.score - a.score);

    return interests.slice(0, 10);
  }

  /**
   * 获取用户价值评估
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户价值评估
   */
  async getUserValueAssessment(userId) {
    const basicInfo = await this.getUserBasicInfo(userId);
    const behaviorFeatures = await this.getUserBehaviorFeatures(userId);

    if (!basicInfo) {
      return null;
    }

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

  /**
   * 根据评分获取用户等级
   * @param {number} score - 评分
   * @returns {string} 用户等级
   */
  getUserLevel(score) {
    if (score >= 80) return '核心用户';
    if (score >= 60) return '重要用户';
    if (score >= 40) return '普通用户';
    if (score >= 20) return '潜在用户';
    return '流失用户';
  }

  /**
   * 获取活跃度等级
   * @param {number} activeDays - 活跃天数
   * @returns {string} 活跃度等级
   */
  getActivityLevel(activeDays) {
    if (activeDays >= 20) return '高活跃';
    if (activeDays >= 10) return '中活跃';
    return '低活跃';
  }

  /**
   * 获取用户列表（支持分页和筛选）
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 用户列表
   */
  async getUserList(params = {}) {
    const { ctx } = this;
    const { page = 1, pageSize = 20, activityLevel, valueLevel } = params;

    try {
      const offset = (page - 1) * pageSize;
      const where = {};

      // 添加筛选条件
      if (activityLevel) {
        where.activity_level = activityLevel;
      }

      if (valueLevel) {
        where.value_level = valueLevel;
      }

      // 查询用户列表 - 使用原生SQL查询以避免Sequelize排序语法问题
      const countResult = await ctx.model.query(
        'SELECT COUNT(*) as count FROM user_profiles WHERE (:activityLevel IS NULL OR activity_level = :activityLevel) AND (:valueLevel IS NULL OR value_level = :valueLevel)',
        {
          replacements: { activityLevel, valueLevel },
          type: ctx.model.QueryTypes.SELECT
        }
      );
      const count = parseInt(countResult[0].count);

      const rows = await ctx.model.query(
        'SELECT user_id, register_time, last_active_time, total_events, active_days, activity_level, value_level FROM user_profiles WHERE (:activityLevel IS NULL OR activity_level = :activityLevel) AND (:valueLevel IS NULL OR value_level = :valueLevel) ORDER BY last_active_time DESC LIMIT :limit OFFSET :offset',
        {
          replacements: { activityLevel, valueLevel, limit: parseInt(pageSize), offset },
          type: ctx.model.QueryTypes.SELECT
        }
      );

      // 修复：使用数据库字段名映射，确保数据正确返回
      return {
        users: rows.map(user => ({
          userId: user.user_id,
          registerTime: user.register_time,
          lastActiveTime: user.last_active_time,
          totalEvents: user.total_events,
          activeDays: user.active_days,
          activityLevel: user.activity_level,
          valueLevel: user.value_level
        })),
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      ctx.logger.error('Failed to get user list:', error);
      throw new Error('Failed to get user list');
    }
  }

  /**
   * 更新单个用户画像
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserProfile(userId) {
    const { ctx } = this;

    try {
      const basicInfo = await this.getUserBasicInfo(userId);
      if (!basicInfo) {
        return null;
      }

      const tags = await this.getUserTags(userId);
      const behaviorFeatures = await this.getUserBehaviorFeatures(userId);
      const valueAssessment = await this.getUserValueAssessment(userId);

      // 保存到user_profiles表
      const [profile, created] = await ctx.model.UserProfile.upsert({
        userId: userId,
        registerTime: basicInfo.register_time,
        lastActiveTime: basicInfo.last_active_time,
        totalEvents: basicInfo.total_events,
        activeDays: basicInfo.active_days,
        tags: tags,
        behaviorFeatures: behaviorFeatures,
        valueAssessment: valueAssessment,
        activityLevel: this.getActivityLevel(basicInfo.active_days),
        valueLevel: valueAssessment.level
      });

      return profile;
    } catch (error) {
      ctx.logger.error('Failed to update user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * 批量更新用户画像
   * @returns {Promise<Object>} 更新结果
   */
  async updateAllUserProfiles() {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      // 获取所有用户
      const users = await sequelize.query(`
        SELECT DISTINCT user_id
        FROM analytics_events
        WHERE user_id IS NOT NULL
      `, { type: sequelize.QueryTypes.SELECT });

      ctx.logger.info(`Starting to update ${users.length} user profiles`);

      // 更新每个用户的画像
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          await this.updateUserProfile(user.user_id);
          successCount++;
        } catch (error) {
          ctx.logger.error(`Failed to update profile for user ${user.user_id}:`, error);
          failCount++;
        }
      }

      ctx.logger.info(`User profile update completed: ${successCount} success, ${failCount} failed`);

      return {
        total: users.length,
        success: successCount,
        failed: failCount
      };
    } catch (error) {
      ctx.logger.error('Failed to update all user profiles:', error);
      throw new Error('Failed to update all user profiles');
    }
  }
}

module.exports = UserProfileService;
