// 中间件函数，无需使用options和app参数
module.exports = () => {
  return async (ctx, next) => {
    // 添加健康检查接口到跳过列表，确保它能快速响应
    const skipPaths = new Set([ '/system/logs/stats', '/system/logs/report', '/health', '/test-cicd', '/' ]);
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
      // 对于非跳过的路径，异步保存日志，不阻塞请求响应
      if (!skipPaths.has(ctx.path)) {
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
