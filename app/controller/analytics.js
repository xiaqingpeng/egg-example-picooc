'use strict';

const Controller = require('egg').Controller;

class AnalyticsController extends Controller {
  /**
   * 接收单个埋点事件
   */
  async events() {
    const { ctx } = this;
    const { event, eventType, properties, userId, sessionId, duration, errorMessage } = ctx.request.body;

    // 验证必填字段
    if (!event) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'Event name is required' };
      return;
    }

    try {
      const eventData = {
        event,
        eventType,
        properties,
        userId,
        sessionId,
        duration,
        errorMessage
      };

      const savedEvent = await ctx.service.analytics.saveEvent(eventData);

      ctx.body = {
        success: true,
        message: 'Event recorded successfully',
        eventId: savedEvent.id
      };
    } catch (error) {
      ctx.logger.error('Analytics events error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to record event',
        error: error.message
      };
    }
  }

  /**
   * 批量接收埋点事件
   */
  async batchEvents() {
    const { ctx } = this;
    const { events } = ctx.request.body;

    // 验证必填字段
    if (!events || !Array.isArray(events) || events.length === 0) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'Events array is required' };
      return;
    }

    // 验证每个事件是否包含event字段
    for (const item of events) {
      if (!item.event) {
        ctx.status = 422;
        ctx.body = { success: false, message: 'Each event must have an event name' };
        return;
      }
    }

    try {
      const savedEvents = await ctx.service.analytics.saveBatchEvents(events);

      ctx.body = {
        success: true,
        message: `Successfully recorded ${savedEvents.length} events`,
        count: savedEvents.length
      };
    } catch (error) {
      ctx.logger.error('Analytics batch events error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to record batch events',
        error: error.message
      };
    }
  }

  /**
   * 查询事件统计
   */
  async stats() {
    const { ctx } = this;
    const { eventType, startDate, endDate } = ctx.query;

    try {
      const stats = await ctx.service.analytics.getStats({
        eventType,
        startDate,
        endDate
      });

      ctx.body = {
        success: true,
        data: stats
      };
    } catch (error) {
      ctx.logger.error('Analytics stats error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get stats',
        error: error.message
      };
    }
  }

  /**
   * 查询事件列表
   */
  async getEvents() {
    const { ctx } = this;
    const { eventType, page, pageSize, startDate, endDate } = ctx.query;

    try {
      const result = await ctx.service.analytics.getEvents({
        eventType,
        page,
        pageSize,
        startDate,
        endDate
      });

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      ctx.logger.error('Analytics get events error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get events',
        error: error.message
      };
    }
  }
}

module.exports = AnalyticsController;
