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

      // 转化率统计 - 计算从page_view到其他关键事件的转化率
      const conversionRate = await sequelize.query(`
        WITH page_view_users AS (
          SELECT DISTINCT user_id
          FROM analytics_events
          WHERE DATE(created_at) >= :startDate 
            AND DATE(created_at) <= :endDate
            AND event_name = 'page_view'
            AND user_id IS NOT NULL
        ),
        key_events AS (
          SELECT 
            ae.event_name,
            COUNT(DISTINCT ae.user_id) as user_count
          FROM analytics_events ae
          INNER JOIN page_view_users pvu ON ae.user_id = pvu.user_id
          WHERE DATE(ae.created_at) >= :startDate 
            AND DATE(ae.created_at) <= :endDate
            AND ae.event_name IN ('login_success', 'register_success', 'purchase_success', 'button_click')
            AND ae.user_id IS NOT NULL
          GROUP BY ae.event_name
        ),
        total_users AS (
          SELECT COUNT(*) as total FROM page_view_users
        )
        SELECT 
          ke.event_name,
          ke.user_count,
          tu.total,
          CASE 
            WHEN tu.total = 0 THEN 0
            ELSE (ke.user_count * 100.0 / tu.total)
          END as conversion_rate
        FROM key_events ke
        CROSS JOIN total_users tu
        ORDER BY conversion_rate DESC
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
        })),
        conversionRate: conversionRate.map(item => ({
          eventName: item.event_name,
          userCount: parseInt(item.user_count),
          totalUsers: parseInt(item.total),
          conversionRate: parseFloat(item.conversion_rate).toFixed(2)
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
          properties::jsonb->>'page_name' as page_url,
          COUNT(*) as pv,
          COUNT(DISTINCT user_id) as uv
        FROM analytics_events
        WHERE DATE(created_at) >= :startDate 
          AND DATE(created_at) <= :endDate
          AND event_name = 'page_view'
          AND properties::jsonb->>'page_name' IS NOT NULL
        GROUP BY properties::jsonb->>'page_name'
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
   * 趋势分析API（支持多种指标类型）
   * @param {string} metric - 指标类型：events, dau, page_views, unique_users, retention, performance
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {string} interval - 时间间隔（hour、day、week、month）
   * @returns {Promise<Array>} 趋势分析数据
   */
  async getTrendAnalysis(metric = 'events', startDate, endDate, interval = 'day') {
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
      let query = '';
      let replacements = { startDate, endDate };

      // 根据metric类型构建不同的查询
      switch (metric) {
        case 'events':
          // 事件总数趋势
          query = `
            SELECT 
              ${timeTrunc} as time_bucket,
              COUNT(*) as count,
              COUNT(DISTINCT user_id) as unique_users
            FROM analytics_events
            WHERE DATE(created_at) >= :startDate 
              AND DATE(created_at) <= :endDate
            GROUP BY ${timeTrunc}
            ORDER BY time_bucket
          `;
          break;

        case 'dau':
          // 日活跃用户数趋势
          query = `
            SELECT 
              ${timeTrunc} as time_bucket,
              COUNT(DISTINCT user_id) as dau,
              COUNT(*) as total_events
            FROM analytics_events
            WHERE DATE(created_at) >= :startDate 
              AND DATE(created_at) <= :endDate
              AND user_id IS NOT NULL
            GROUP BY ${timeTrunc}
            ORDER BY time_bucket
          `;
          break;

        case 'page_views':
          // 页面访问量趋势
          query = `
            SELECT 
              ${timeTrunc} as time_bucket,
              COUNT(*) as page_views,
              COUNT(DISTINCT user_id) as unique_visitors,
              COUNT(DISTINCT properties::jsonb->>'page_name') as unique_pages
            FROM analytics_events
            WHERE DATE(created_at) >= :startDate 
              AND DATE(created_at) <= :endDate
              AND event_name = 'page_view'
              AND properties::jsonb->>'page_name' IS NOT NULL
            GROUP BY ${timeTrunc}
            ORDER BY time_bucket
          `;
          break;

        case 'unique_users':
          // 唯一用户数趋势
          query = `
            SELECT 
              ${timeTrunc} as time_bucket,
              COUNT(DISTINCT user_id) as unique_users,
              COUNT(*) as total_events
            FROM analytics_events
            WHERE DATE(created_at) >= :startDate 
              AND DATE(created_at) <= :endDate
              AND user_id IS NOT NULL
            GROUP BY ${timeTrunc}
            ORDER BY time_bucket
          `;
          break;

        case 'retention':
          // 留存率趋势（基于首次访问用户的后续访问）
          query = `
            WITH first_visits AS (
              SELECT 
                user_id,
                MIN(DATE(created_at)) as first_visit_date
              FROM analytics_events
              WHERE user_id IS NOT NULL
                AND user_id NOT LIKE 'anonymous_%'
              GROUP BY user_id
            ),
            daily_retention AS (
              SELECT 
                fv.first_visit_date as time_bucket,
                COUNT(DISTINCT fv.user_id) as new_users,
                COUNT(DISTINCT CASE 
                  WHEN DATE(ae.created_at) = fv.first_visit_date + INTERVAL '1 day' THEN fv.user_id 
                END) as day1_retained,
                COUNT(DISTINCT CASE 
                  WHEN DATE(ae.created_at) = fv.first_visit_date + INTERVAL '7 days' THEN fv.user_id 
                END) as day7_retained
              FROM first_visits fv
              LEFT JOIN analytics_events ae ON fv.user_id = ae.user_id
              WHERE DATE(fv.first_visit_date) >= :startDate 
                AND DATE(fv.first_visit_date) <= :endDate
              GROUP BY fv.first_visit_date
            )
            SELECT 
              time_bucket,
              new_users,
              day1_retained,
              CASE WHEN new_users > 0 THEN (day1_retained * 100.0 / new_users) ELSE 0 END as day1_retention_rate,
              day7_retained,
              CASE WHEN new_users > 0 THEN (day7_retained * 100.0 / new_users) ELSE 0 END as day7_retention_rate
            FROM daily_retention
            ORDER BY time_bucket
          `;
          break;

        case 'performance':
          // 性能指标趋势（基于duration字段）
          query = `
            SELECT 
              ${timeTrunc} as time_bucket,
              COUNT(*) as total_events,
              COUNT(CASE WHEN duration IS NOT NULL THEN 1 END) as events_with_duration,
              AVG(CASE WHEN duration IS NOT NULL THEN duration END) as avg_duration,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration) as median_duration,
              PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration
            FROM analytics_events
            WHERE DATE(created_at) >= :startDate 
              AND DATE(created_at) <= :endDate
            GROUP BY ${timeTrunc}
            ORDER BY time_bucket
          `;
          break;

        default:
          // 默认返回events趋势
          query = `
            SELECT 
              ${timeTrunc} as time_bucket,
              COUNT(*) as count,
              COUNT(DISTINCT user_id) as unique_users
            FROM analytics_events
            WHERE DATE(created_at) >= :startDate 
              AND DATE(created_at) <= :endDate
            GROUP BY ${timeTrunc}
            ORDER BY time_bucket
          `;
          break;
      }

      const trend = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      // 根据metric类型格式化返回数据
      return trend.map(item => {
        const baseData = {
          timeBucket: item.time_bucket
        };

        switch (metric) {
          case 'events':
            return {
              ...baseData,
              count: parseInt(item.count),
              uniqueUsers: parseInt(item.unique_users)
            };

          case 'dau':
            return {
              ...baseData,
              dau: parseInt(item.dau),
              totalEvents: parseInt(item.total_events)
            };

          case 'page_views':
            return {
              ...baseData,
              pageViews: parseInt(item.page_views),
              uniqueVisitors: parseInt(item.unique_visitors),
              uniquePages: parseInt(item.unique_pages)
            };

          case 'unique_users':
            return {
              ...baseData,
              uniqueUsers: parseInt(item.unique_users),
              totalEvents: parseInt(item.total_events)
            };

          case 'retention':
            return {
              ...baseData,
              newUsers: parseInt(item.new_users),
              day1Retained: parseInt(item.day1_retained),
              day1RetentionRate: parseFloat(item.day1_retention_rate).toFixed(2),
              day7Retained: parseInt(item.day7_retained),
              day7RetentionRate: parseFloat(item.day7_retention_rate).toFixed(2)
            };

          case 'performance':
            return {
              ...baseData,
              totalEvents: parseInt(item.total_events),
              eventsWithDuration: parseInt(item.events_with_duration),
              avgDuration: parseFloat(item.avg_duration || 0).toFixed(2),
              medianDuration: parseFloat(item.median_duration || 0).toFixed(2),
              p95Duration: parseFloat(item.p95_duration || 0).toFixed(2)
            };

          default:
            return {
              ...baseData,
              count: parseInt(item.count),
              uniqueUsers: parseInt(item.unique_users)
            };
        }
      });
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
