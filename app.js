module.exports = app => {
  app.beforeStart(async () => {
    const cfg = app.config.sequelize || {};
    const isWorker = typeof process.env.EGG_WORKER_ID !== 'undefined';
    if (isWorker && cfg.enableSync) {
      await app.model.sync();
    }
  });
};
