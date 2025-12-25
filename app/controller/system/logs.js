const { Controller } = require('egg');

class LogsController extends Controller {
  async stats() {
    const { ctx } = this;
    try {
      const pageNum = parseInt(ctx.query.pageNum || '1', 10);
      const pageSize = parseInt(ctx.query.pageSize || '50', 10);
      const offset = (pageNum - 1) * pageSize;
      const where = {};
      const Op = ctx.app.Sequelize.Op;
      const { path, pathLike, method, platform, startTime, endTime } = ctx.query;
      if (path) where.path = String(path);
      if (pathLike) where.path = { [Op.like]: `%${String(pathLike)}%` };
      if (method) where.method = String(method).toUpperCase();
      if (platform) where.platform = String(platform);
      if (startTime || endTime) {
        where.requestTime = {};
        if (startTime) where.requestTime[Op.gte] = new Date(String(startTime));
        if (endTime) where.requestTime[Op.lte] = new Date(String(endTime));
      }
      const { rows, count } = await ctx.model.ApiLog.findAndCountAll({ where, offset, limit: pageSize, order: ctx.app.Sequelize.literal('id DESC') });
      const avgDurationMs = Number(await ctx.model.ApiLog.aggregate('durationMs', 'avg', { where })) || 0;
      ctx.body = { code: 0, msg: '', rows, total: count, avgDurationMs };
    } catch (e) {
      ctx.logger.error('Logs stats error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        ctx.body = { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      } else {
        ctx.body = { code: 500, msg: '服务器内部错误' };
      }
    }
  }

  async report() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      let platform = body.platform || ctx.get('x-platform') || '';
      if (!platform) {
        const ua = ctx.get('user-agent') || '';
        if (/iPhone|iPad|iPod|iOS/i.test(ua)) platform = 'iOS';
        else if (/Android/i.test(ua)) platform = 'Android';
        else if (/Macintosh|Mac OS/i.test(ua)) platform = 'Mac';
        else if (/Windows/i.test(ua)) platform = 'Windows';
        else platform = 'Web';
      }
      const data = {
        path: String(body.path || ctx.path),
        method: String(body.method || ctx.method).toUpperCase(),
        ip: String(body.ip || ctx.ip),
        requestTime: body.requestTime ? new Date(String(body.requestTime)) : new Date(),
        durationMs: Math.max(0, Math.round(Number(body.durationMs || 0))),
        platform,
      };
      const created = await ctx.model.ApiLog.create(data);
      ctx.body = { code: 0, msg: '', data: created };
    } catch (e) {
      ctx.logger.error('Logs report error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        ctx.body = { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      } else {
        ctx.body = { code: 500, msg: '服务器内部错误' };
      }
    }
  }
}

module.exports = LogsController;
