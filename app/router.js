/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/system/notice/list', controller.system.notice.list);
  router.get('/system/notice/db/list', controller.system.noticeDb.list);
  router.get('/system/notice/:id', controller.system.noticeDb.detail);
  router.post('/system/notice', controller.system.noticeDb.create);
  router.put('/system/notice/:id', controller.system.noticeDb.update);
  router.delete('/system/notice/:id', controller.system.noticeDb.destroy);
  router.get('/system/logs/stats', controller.system.logs.stats);
  router.post('/system/logs/report', controller.system.logs.report);
  router.post('/register', controller.user.register);
  router.post('/login', controller.user.login);
};
