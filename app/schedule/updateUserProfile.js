'use strict';

const Subscription = require('egg').Subscription;

class UpdateUserProfile extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '1h', // 每小时执行一次
      type: 'worker', // 指定所有的 worker 都需要执行
      immediate: false, // 应用启动时不立即执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { ctx, app } = this;
    
    try {
      ctx.logger.info('Starting scheduled user profile update task');
      
      // 调用服务层批量更新用户画像
      const result = await ctx.service.userProfile.updateAllUserProfiles();
      
      ctx.logger.info('Scheduled user profile update completed:', {
        totalUsers: result.totalUsers,
        updatedUsers: result.updatedUsers,
        failedUsers: result.failedUsers,
        executionTime: result.executionTime
      });
    } catch (error) {
      ctx.logger.error('Scheduled user profile update failed:', error);
    }
  }
}

module.exports = UpdateUserProfile;
