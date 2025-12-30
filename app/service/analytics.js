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
}

module.exports = AnalyticsService;
