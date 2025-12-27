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
      
      // 时间查询示例（基于实际数据范围 2025-12-13 至 2025-12-27）：
      // 1. 查询指定时间段的数据：
      //    GET /system/logs/stats?startTime=2025-12-20T00:00:00Z&endTime=2025-12-25T23:59:59Z
      // 2. 查询最近的数据：
      //    GET /system/logs/stats?startTime=2025-12-25T00:00:00Z
      // 3. 查询某个时间之前的数据：
      //    GET /system/logs/stats?endTime=2025-12-20T12:00:00Z
      // 4. 组合查询（平台+时间）：
      //    GET /system/logs/stats?platform=Web&startTime=2025-12-20T00:00:00Z&endTime=2025-12-25T23:59:59Z
      // 5. 完整查询示例（method=GET/POST, platform=Android/iOS/Mac/Web/Windows）：
      //    GET /system/logs/stats?platform=Web&method=GET&startTime=2025-12-20T00:00:00Z&endTime=2025-12-25T23:59:59Z&pageNum=1&pageSize=20
      //    GET /system/logs/stats?platform=Android&method=POST&startTime=2025-12-13T00:00:00Z&endTime=2025-12-16T23:59:59Z
      // 注意：实际数据时间范围为 2025-12-13 至 2025-12-27，请在此范围内查询
      //       可用的 method: GET, POST
      //       可用的 platform: Android, iOS, Mac, Web, Windows
      
      if (path) where.path = String(path);
      if (pathLike) where.path = { [Op.like]: `%${String(pathLike)}%` };
      if (method) where.method = String(method).toUpperCase();
      if (platform) where.platform = { [Op.iLike]: String(platform) };
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
      
      // 定义允许记录的路由白名单（基于 router.js 中定义的路由）
      const allowedRoutes = new Set([
        '/',
        '/system/notice/list',
        '/system/notice/db/list',
        '/system/notice',
        '/system/logs/stats',
        '/system/logs/report',
        '/register',
        '/login',
        '/user/info',
        '/user',
        '/test-cicd',
        '/health',
      ]);
      
      // 检查路径是否在白名单中（支持动态路由，如 /system/notice/:id）
      const isAllowedRoute = (path) => {
        if (allowedRoutes.has(path)) return true;
        // 支持动态路由模式
        if (path.startsWith('/system/notice/')) return true;
        return false;
      };
      
      const requestPath = String(body.path || ctx.path);
      
      // 验证路径是否在白名单中
      if (!isAllowedRoute(requestPath)) {
        ctx.body = { code: 400, msg: '不允许记录该路径的日志' };
        return;
      }
      
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
        path: requestPath,
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
