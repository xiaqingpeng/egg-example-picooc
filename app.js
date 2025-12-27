module.exports = app => {
  app.beforeStart(async () => {
    const cfg = app.config.sequelize || {};
    console.log('\n=== 应用启动前执行 ===');
    console.log('app.type:', app.type);
    console.log('app.config.cluster:', JSON.stringify(app.config.cluster, null, 2));
    const isWorker = app.type === 'application';
    console.log('是否为Worker进程:', isWorker);
    
    if (isWorker && cfg.enableSync && app.model) {
      console.log('开始数据库表同步...');
      try {
        await app.model.sync();
        app.logger.info('数据库模型同步成功');
      } catch (error) {
        app.logger.error('数据库模型同步失败，但应用仍将继续启动:', error.message);
      }
    }
  });
  
  // 监听应用启动成功事件
  app.on('server', server => {
    const address = server.address();
    console.log('\n=== HTTP服务器已启动 ===');
    console.log('监听地址:', address);
    if (address) {
      console.log('可以通过 http://' + address.address + ':' + address.port + '/ 访问应用');
    }
  });
  
  // 监听应用就绪事件
  app.on('ready', () => {
    console.log('\n=== 应用已准备就绪 ===');
    console.log('所有插件已加载完成，可以接收请求');
  });
};
