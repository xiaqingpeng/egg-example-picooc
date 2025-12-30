// 中间件函数，无需使用options和app参数
module.exports = () => {
  return async (ctx, next) => {
    // 添加健康检查接口到跳过列表，确保它能快速响应
    const skipPaths = new Set([ '/system/logs/stats', '/system/logs/report', '/health', '/test-cicd', '/' ]);
    
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
      '/user/change-password',
      '/user/avatar',
      '/test-cicd',
      '/health',
      '/api/upload/image',
      '/api/upload/file',
      // 埋点事件接口
      '/api/analytics/events',
      '/api/analytics/events/batch',
      '/api/analytics/stats',
      // 统计分析API
      '/api/analytics/activity',
      '/api/analytics/retention',
      '/api/analytics/page-views',
      '/api/analytics/event-stats',
      '/api/analytics/trends',
      // 用户画像API
      '/api/user-profile',
      '/api/user-profile/tags',
      '/api/user-profile/behavior',
      '/api/user-profile/interest',
      '/api/user-profile/value',
      '/api/user-profile/list',
      '/api/user-profile/update-all',
    ]);
    
    // 检查路径是否在白名单中（支持动态路由，如 /system/notice/:id）
    const isAllowedRoute = (path) => {
      if (allowedRoutes.has(path)) return true;
      // 支持动态路由模式
      if (path.startsWith('/system/notice/')) return true;
      // 支持用户画像动态路由：/api/user-profile/:userId
      if (path.startsWith('/api/user-profile/') && path !== '/api/user-profile/tags' && 
          path !== '/api/user-profile/behavior' && path !== '/api/user-profile/interest' &&
          path !== '/api/user-profile/value' && path !== '/api/user-profile/list' &&
          path !== '/api/user-profile/update-all') return true;
      return false;
    };
    
    const start = Date.now();
    let platform = ctx.get('x-platform') || '';
    if (!platform) {
      const ua = ctx.get('user-agent') || '';
      if (/iPhone|iPad|iPod|iOS/i.test(ua)) platform = 'iOS';
      else if (/Android/i.test(ua)) platform = 'Android';
      else if (/Macintosh|Mac OS/i.test(ua)) platform = 'Mac';
      else if (/Windows/i.test(ua)) platform = 'Windows';
      else platform = 'Web';
    }
    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      // 对于非跳过的路径且在白名单中的路径，异步保存日志，不阻塞请求响应
      if (!skipPaths.has(ctx.path) && isAllowedRoute(ctx.path)) {
        const data = {
          path: ctx.path,
          method: ctx.method,
          ip: ctx.ip,
          requestTime: new Date(start),
          durationMs: duration,
          platform,
        };
        // 使用setTimeout确保日志保存不会阻塞请求响应
        setTimeout(async () => {
          try {
            await ctx.model.ApiLog.create(data);
          } catch (e) {
            // 记录日志错误但不影响主请求
            // 更详细的错误处理，区分数据库连接错误和其他错误
            if (e.name === 'SequelizeConnectionRefusedError') {
              console.error('保存日志失败：数据库连接被拒绝，请检查数据库服务器是否运行以及连接参数是否正确:', e.message);
            } else {
              console.error('保存日志失败:', e.message);
            }
          }
        }, 0);
      }
    }
  };
};