module.exports = app => {
  app.beforeStart(async () => {
    const cfg = app.config.sequelize || {};
    const isWorker = typeof process.env.EGG_WORKER_ID !== 'undefined';
    if (isWorker && cfg.enableSync) {
      try {
        // 尝试同步数据库模型，但如果失败不会阻塞应用启动
        await app.model.sync();
        app.logger.info('数据库模型同步成功');
      } catch (error) {
        app.logger.error('数据库模型同步失败，但应用仍将继续启动:', error.message);
      }
    }
  });
};
