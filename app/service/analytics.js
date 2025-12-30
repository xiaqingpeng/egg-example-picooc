'use strict';

const Service = require('egg').Service;

class AnalyticsService extends Service {
  /**
   * 保存单个埋点事件
   * @param {Object} eventData - 事件数据
   * @returns {Promise<Object>} 保存的事件对象
   */
  async saveEvent(eventData) {
    const { ctx } = this;

    // 生成请求ID
    const requestId = ctx.requestId || this.generateRequestId();

    // 构建保存数据
    const data = {
      eventName: eventData.event,
      eventType: eventData.eventType || 'custom',
      properties: eventData.properties ? JSON.stringify(eventData.properties) : null,
      userId: eventData.userId || null,
      sessionId: eventData.sessionId || null,
      duration: eventData.duration || null,
      errorMessage: eventData.errorMessage || null,
      ip: ctx.ip || ctx.request.ip,
      userAgent: ctx.get('user-agent') || '',
      requestId,
      createdAt: new Date()
    };

    try {
      const event = await ctx.model.AnalyticsEvent.create(data);
      ctx.logger.info(`Analytics event saved: ${event.eventName}, requestId: ${requestId}`);
      return event;
    } catch (error) {
      ctx.logger.error('Failed to save analytics event:', error);
      throw new Error('Failed to save event');
    }
  }

  /**
   * 批量保存埋点事件
   * @param {Array} events - 事件数组
   * @returns {Promise<Object>} 保存结果
   */
  async saveBatchEvents(events) {
    const { ctx } = this;
    const requestId = ctx.requestId || this.generateRequestId();

    // 构建批量数据
    const batchData = events.map(event => ({
      eventName: event.event,
      eventType: event.eventType || 'custom',
      properties: event.properties ? JSON.stringify(event.properties) : null,
      userId: event.userId || null,
      sessionId: event.sessionId || null,
      duration: event.duration || null,
      errorMessage: event.errorMessage || null,
      ip: ctx.ip || ctx.request.ip,
      userAgent: ctx.get('user-agent') || '',
      requestId,
      createdAt: new Date()
    }));

    try {
      const savedEvents = await ctx.model.AnalyticsEvent.bulkCreate(batchData);
      ctx.logger.info(`Batch analytics events saved: ${savedEvents.length} events, requestId: ${requestId}`);
      return savedEvents;
    } catch (error) {
      ctx.logger.error('Failed to save batch analytics events:', error);
      throw new Error('Failed to save batch events');
    }
  }

  /**
   * 查询事件统计
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 统计结果
   */
  async getStats(query = {}) {
    const { ctx } = this;
    const { eventType, startDate, endDate } = query;

    // 构建查询条件
    const where = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[ctx.app.Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[ctx.app.Sequelize.Op.lte] = new Date(endDate);
      }
    }

    try {
      // 总数统计
      const total = await ctx.model.AnalyticsEvent.count({ where });

      // 按事件类型分组统计
      const byEventType = await ctx.model.AnalyticsEvent.findAll({
        attributes: [
          'eventName',
          [ctx.model.AnalyticsEvent.sequelize.fn('COUNT', ctx.model.AnalyticsEvent.sequelize.col('id')), 'count']
        ],
        where,
        group: ['eventName'],
        order: [[ctx.model.AnalyticsEvent.sequelize.fn('COUNT', ctx.model.AnalyticsEvent.sequelize.col('id')), 'DESC']],
        raw: true
      });

      // 最近趋势（按小时统计）
      const recentTrend = await ctx.model.AnalyticsEvent.findAll({
        attributes: [
          [ctx.model.AnalyticsEvent.sequelize.fn('DATE_TRUNC', 'hour', ctx.model.AnalyticsEvent.sequelize.col('created_at')), 'hour'],
          [ctx.model.AnalyticsEvent.sequelize.fn('COUNT', ctx.model.AnalyticsEvent.sequelize.col('id')), 'count']
        ],
        where: {
          ...where,
          createdAt: {
            [ctx.app.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
          }
        },
        group: [ctx.model.AnalyticsEvent.sequelize.fn('DATE_TRUNC', 'hour', ctx.model.AnalyticsEvent.sequelize.col('created_at'))],
        order: [[ctx.model.AnalyticsEvent.sequelize.fn('DATE_TRUNC', 'hour', ctx.model.AnalyticsEvent.sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      return {
        total,
        byEventType: byEventType.map(item => ({
          event_name: item.eventName,
          count: parseInt(item.count)
        })),
        recentTrend: recentTrend.map(item => ({
          hour: item.hour,
          count: parseInt(item.count)
        }))
      };
    } catch (error) {
      ctx.logger.error('Failed to get analytics stats:', error);
      throw new Error('Failed to get stats');
    }
  }

  /**
   * 查询事件列表
   * @param {Object} query - 查询参数
   * @returns {Promise<Object>} 事件列表
   */
  async getEvents(query = {}) {
    const { ctx } = this;
    const { eventType, page = 1, pageSize = 50, startDate, endDate } = query;

    // 构建查询条件
    const where = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[ctx.app.Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[ctx.app.Sequelize.Op.lte] = new Date(endDate);
      }
    }

    try {
      // 查询总数
      const total = await ctx.model.AnalyticsEvent.count({ where });

      // 查询分页数据
      const events = await ctx.model.AnalyticsEvent.findAll({
        where,
        offset: (page - 1) * pageSize,
        limit: parseInt(pageSize),
        order: [['createdAt', 'DESC']],
        raw: true
      });

      // 解析properties JSON
      const eventsWithParsedProperties = events.map(event => ({
        ...event,
        properties: event.properties ? JSON.parse(event.properties) : null
      }));

      return {
        events: eventsWithParsedProperties,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      ctx.logger.error('Failed to get analytics events:', error);
      throw new Error('Failed to get events');
    }
  }

  /**
   * 生成请求ID
   * @returns {string} 请求ID
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取DAU/MAU统计
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} DAU/MAU统计数据
   */
  async getActivityStats(startDate, endDate) {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      // DAU统计
      const dauStats = await sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as dau
        FROM analytics_events
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
          AND user_id IS NOT NULL
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
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
          AND user_id IS NOT NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        dauStats: dauStats.map(item => ({
          date: item.date,
          dau: parseInt(item.dau)
        })),
        mauStats: mauStats.map(item => ({
          month: item.month,
          mau: parseInt(item.mau)
        }))
      };
    } catch (error) {
      ctx.logger.error('Failed to get activity stats:', error);
      throw new Error('Failed to get activity stats');
    }
  }

  /**
   * 获取留存率统计
   * @param {number} days - 留存天数（1、7、30）
   * @returns {Promise<Object>} 留存率数据
   */
  async getRetentionStats(days = 7) {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      // 次日留存
      const day1Retention = await sequelize.query(`
        WITH user_first_login AS (
          SELECT 
            user_id,
            MIN(DATE(created_at)) as first_date
          FROM analytics_events
          WHERE event_name = 'login_success'
            AND user_id IS NOT NULL
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

      // 7日留存
      const day7Retention = await sequelize.query(`
        WITH user_first_login AS (
          SELECT 
            user_id,
            MIN(DATE(created_at)) as first_date
          FROM analytics_events
          WHERE event_name = 'login_success'
            AND user_id IS NOT NULL
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
            AND DATE(ae.created_at) <= ufl.first_date + INTERVAL '7 days'
          GROUP BY ufl.user_id, ufl.first_date
        )
        SELECT 
          COUNT(CASE WHEN login_days >= 2 THEN 1 END) * 100.0 / COUNT(*) as day7_retention
        FROM user_login_count
      `, { type: sequelize.QueryTypes.SELECT });

      // 30日留存
      const day30Retention = await sequelize.query(`
        WITH user_first_login AS (
          SELECT 
            user_id,
            MIN(DATE(created_at)) as first_date
          FROM analytics_events
          WHERE event_name = 'login_success'
            AND user_id IS NOT NULL
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
            AND DATE(ae.created_at) <= ufl.first_date + INTERVAL '30 days'
          GROUP BY ufl.user_id, ufl.first_date
        )
        SELECT 
          COUNT(CASE WHEN login_days >= 2 THEN 1 END) * 100.0 / COUNT(*) as day30_retention
        FROM user_login_count
      `, { type: sequelize.QueryTypes.SELECT });

      return {
        day1Retention: parseFloat(day1Retention[0]?.day1_retention || 0).toFixed(2),
        day7Retention: parseFloat(day7Retention[0]?.day7_retention || 0).toFixed(2),
        day30Retention: parseFloat(day30Retention[0]?.day30_retention || 0).toFixed(2)
      };
    } catch (error) {
      ctx.logger.error('Failed to get retention stats:', error);
      throw new Error('Failed to get retention stats');
    }
  }

  /**
   * 获取页面访问统计
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} 页面访问统计数据
   */
  async getPageViewStats(startDate, endDate) {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      const stats = await sequelize.query(`
        SELECT 
          page_url,
          COUNT(*) as pv,
          COUNT(DISTINCT user_id) as uv
        FROM analytics_events
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
          AND event_name = 'page_view'
          AND page_url IS NOT NULL
        GROUP BY page_url
        ORDER BY pv DESC
        LIMIT 20
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return stats.map(item => ({
        pageUrl: item.page_url,
        pv: parseInt(item.pv),
        uv: parseInt(item.uv)
      }));
    } catch (error) {
      ctx.logger.error('Failed to get page view stats:', error);
      throw new Error('Failed to get page view stats');
    }
  }

  /**
   * 获取事件统计
   * @param {string} eventType - 事件类型（可选）
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} 事件统计数据
   */
  async getEventStats(startDate, endDate, limit = 10) {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      const stats = await sequelize.query(`
        SELECT 
          event_name,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
        GROUP BY event_name
        ORDER BY count DESC
        LIMIT :limit
      `, {
        replacements: { startDate, endDate, limit },
        type: sequelize.QueryTypes.SELECT
      });

      return stats.map(item => ({
        eventName: item.event_name,
        count: parseInt(item.count),
        uniqueUsers: parseInt(item.unique_users)
      }));
    } catch (error) {
      ctx.logger.error('Failed to get event stats:', error);
      throw new Error('Failed to get event stats');
    }
  }

  /**
   * 趋势分析API
   * @param {string} metric - 指标类型
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} interval - 时间间隔（hour、day、week、month）
   * @returns {Promise<Array>} 趋势分析数据
   */
  async getTrendAnalysis(metric, startDate, endDate, interval = 'day') {
    const { ctx } = this;
    const sequelize = ctx.model;

    const intervalMap = {
      'hour': "DATE_TRUNC('hour', created_at)",
      'day': "DATE_TRUNC('day', created_at)",
      'week': "DATE_TRUNC('week', created_at)",
      'month': "DATE_TRUNC('month', created_at)"
    };

    const timeTrunc = intervalMap[interval] || intervalMap['day'];

    try {
      const trend = await sequelize.query(`
        SELECT 
          ${timeTrunc} as time_bucket,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
        GROUP BY ${timeTrunc}
        ORDER BY time_bucket
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return trend.map(item => ({
        timeBucket: item.time_bucket,
        count: parseInt(item.count),
        uniqueUsers: parseInt(item.unique_users)
      }));
    } catch (error) {
      ctx.logger.error('Failed to get trend analysis:', error);
      throw new Error('Failed to get trend analysis');
    }
  }
  async getTrendStats(startDate, endDate, interval = 'day') {
    const { ctx } = this;
    const sequelize = ctx.model;

    try {
      let dateFormat;
      switch (interval) {
        case 'hour':
          dateFormat = 'YYYY-MM-DD HH24:00:00';
          break;
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'IYYY-"W"IW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const trend = await sequelize.query(`
        SELECT 
          TO_CHAR(created_at, '${dateFormat}') as time_period,
          COUNT(*) as event_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
        GROUP BY TO_CHAR(created_at, '${dateFormat}')
        ORDER BY time_period
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return trend.map(item => ({
        timePeriod: item.time_period,
        eventCount: parseInt(item.event_count),
        uniqueUsers: parseInt(item.unique_users)
      }));
    } catch (error) {
      ctx.logger.error('Failed to get trend stats:', error);
      throw new Error('Failed to get trend stats');
    }
  }
}

module.exports = AnalyticsService;
