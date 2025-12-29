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
  // 添加获取用户信息的接口
  router.get('/user/info', controller.user.getUserInfo);
  // 添加根据用户ID查询用户信息的接口（无需登录验证）
  router.get('/user', controller.user.getUserById);
  // 添加修改密码的接口（需要登录）
  router.post('/user/change-password', controller.user.changePassword);
  // 添加上传头像的接口（需要登录）
  router.post('/user/avatar', controller.user.uploadAvatar);
  // 添加更新用户信息的接口（需要登录）
  router.put('/user/info', controller.user.updateUserInfo);
  // 添加测试路由，用于验证CI/CD自动部署功能
  router.get('/test-cicd', controller.home.testCicd);
  // 添加健康检查接口，不依赖数据库
  router.get('/health', controller.home.health);

   router.post('/api/upload/image', controller.oss2.upLoadImage); // 上传图片
  router.post('/api/upload/file', controller.oss2.upLoadFile); // 上传图片
};