module.exports = (options, app) => {
  return async (ctx, next) => {
    const skipPaths = new Set([ '/system/logs/stats', '/system/logs/report' ]);
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
      if (!skipPaths.has(ctx.path)) {
        const data = {
          path: ctx.path,
          method: ctx.method,
          ip: ctx.ip,
          requestTime: new Date(start),
          durationMs: duration,
          platform,
        };
        try {
          await ctx.model.ApiLog.create(data);
        } catch (e) { /* no-op */ }
      }
    }
  };
};
