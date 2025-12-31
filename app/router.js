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

  // 埋点事件接口
  router.post('/api/analytics/events', controller.analytics.events); // 接收单个事件
  router.post('/api/analytics/events/batch', controller.analytics.batchEvents); // 批量接收事件
  router.get('/api/analytics/stats', controller.analytics.stats); // 查询事件统计
  router.get('/api/analytics/events', controller.analytics.getEvents); // 查询事件列表
  
  // 统计分析API
  router.get('/api/analytics/activity', controller.analytics.getActivityStats); // 用户活跃度统计（DAU/MAU）
  router.get('/api/analytics/retention', controller.analytics.getRetentionStats); // 留存率统计
  router.get('/api/analytics/page-views', controller.analytics.getPageViewStats); // 页面访问统计
  router.get('/api/analytics/event-stats', controller.analytics.getEventStats); // 事件统计
  router.get('/api/analytics/trends', controller.analytics.getTrendAnalysis); // 趋势分析
  
  // 用户画像API - 原有路径
  router.get('/api/user-profile', controller.userProfile.getUserProfile); // 获取用户完整画像
  router.get('/api/user-profile/tags', controller.userProfile.getUserTags); // 获取用户标签
  router.get('/api/user-profile/behavior', controller.userProfile.getUserBehaviorFeatures); // 获取用户行为特征
  router.get('/api/user-profile/interest', controller.userProfile.getUserInterestProfile); // 获取用户兴趣画像
  router.get('/api/user-profile/value', controller.userProfile.getUserValueAssessment); // 获取用户价值评估
  router.get('/api/user-profile/list', controller.userProfile.getUserList); // 获取用户列表
  router.get('/api/analytics/users', controller.userProfile.getUserList); // 获取用户列表（兼容路径）
  router.put('/api/user-profile/:userId', controller.userProfile.updateUserProfile); // 更新单个用户画像
  router.post('/api/user-profile/update-all', controller.userProfile.updateAllUserProfiles); // 批量更新用户画像
  
  // 用户画像API - 兼容前端路径 /api/analytics/user/...
  router.get('/api/analytics/user/profile', controller.userProfile.getUserProfile); // 获取用户完整画像（兼容）
  router.get('/api/analytics/user/tags', controller.userProfile.getUserTags); // 获取用户标签（兼容）
  router.get('/api/analytics/user/behavior', controller.userProfile.getUserBehaviorFeatures); // 获取用户行为特征（兼容）
  router.get('/api/analytics/user/interest', controller.userProfile.getUserInterestProfile); // 获取用户兴趣画像（兼容）
  router.get('/api/analytics/user/value', controller.userProfile.getUserValueAssessment); // 获取用户价值评估（兼容）
  router.get('/api/analytics/user/list', controller.userProfile.getUserList); // 获取用户列表（兼容）
};