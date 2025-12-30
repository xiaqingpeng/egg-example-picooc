'use strict';

const Controller = require('egg').Controller;

class UserProfileController extends Controller {
  /**
   * 获取用户完整画像
   */
  async getUserProfile() {
    const { ctx } = this;
    const { userId } = ctx.query;

    if (!userId) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'userId is required' };
      return;
    }

    try {
      const basicInfo = await ctx.service.userProfile.getUserBasicInfo(userId);
      if (!basicInfo) {
        ctx.body = {
          success: true,
          data: null,
          message: 'User not found'
        };
        return;
      }

      const tags = await ctx.service.userProfile.getUserTags(userId);
      const behaviorFeatures = await ctx.service.userProfile.getUserBehaviorFeatures(userId);
      const valueAssessment = await ctx.service.userProfile.getUserValueAssessment(userId);

      ctx.body = {
        success: true,
        data: {
          userId: basicInfo.user_id,
          registerTime: basicInfo.register_time,
          lastActiveTime: basicInfo.last_active_time,
          totalEvents: basicInfo.total_events,
          activeDays: basicInfo.active_days,
          tags,
          behaviorFeatures,
          valueAssessment
        }
      };
    } catch (error) {
      ctx.logger.error('Get user profile error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get user profile',
        error: error.message
      };
    }
  }

  /**
   * 获取用户标签
   */
  async getUserTags() {
    const { ctx } = this;
    const { userId } = ctx.query;

    if (!userId) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'userId is required' };
      return;
    }

    try {
      const tags = await ctx.service.userProfile.getUserTags(userId);
      ctx.body = {
        success: true,
        data: tags
      };
    } catch (error) {
      ctx.logger.error('Get user tags error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get user tags',
        error: error.message
      };
    }
  }

  /**
   * 获取用户行为特征
   */
  async getUserBehaviorFeatures() {
    const { ctx } = this;
    const { userId } = ctx.query;

    if (!userId) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'userId is required' };
      return;
    }

    try {
      const behaviorFeatures = await ctx.service.userProfile.getUserBehaviorFeatures(userId);
      ctx.body = {
        success: true,
        data: behaviorFeatures
      };
    } catch (error) {
      ctx.logger.error('Get user behavior features error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get user behavior features',
        error: error.message
      };
    }
  }

  /**
   * 获取用户兴趣画像
   */
  async getUserInterestProfile() {
    const { ctx } = this;
    const { userId } = ctx.query;

    if (!userId) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'userId is required' };
      return;
    }

    try {
      const interestProfile = await ctx.service.userProfile.getUserInterestProfile(userId);
      ctx.body = {
        success: true,
        data: interestProfile
      };
    } catch (error) {
      ctx.logger.error('Get user interest profile error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get user interest profile',
        error: error.message
      };
    }
  }

  /**
   * 获取用户价值评估
   */
  async getUserValueAssessment() {
    const { ctx } = this;
    const { userId } = ctx.query;

    if (!userId) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'userId is required' };
      return;
    }

    try {
      const valueAssessment = await ctx.service.userProfile.getUserValueAssessment(userId);
      ctx.body = {
        success: true,
        data: valueAssessment
      };
    } catch (error) {
      ctx.logger.error('Get user value assessment error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get user value assessment',
        error: error.message
      };
    }
  }

  /**
   * 获取用户列表
   */
  async getUserList() {
    const { ctx } = this;
    const { page, pageSize, activityLevel, valueLevel } = ctx.query;

    try {
      const result = await ctx.service.userProfile.getUserList({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        activityLevel,
        valueLevel
      });

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      ctx.logger.error('Get user list error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to get user list',
        error: error.message
      };
    }
  }

  /**
   * 手动触发更新用户画像
   */
  async updateUserProfile() {
    const { ctx } = this;
    const { userId } = ctx.params;

    if (!userId) {
      ctx.status = 422;
      ctx.body = { success: false, message: 'userId is required' };
      return;
    }

    try {
      const profile = await ctx.service.userProfile.updateUserProfile(userId);
      if (!profile) {
        ctx.body = {
          success: true,
          data: null,
          message: 'User not found'
        };
        return;
      }

      ctx.body = {
        success: true,
        message: 'User profile updated successfully',
        data: profile
      };
    } catch (error) {
      ctx.logger.error('Update user profile error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to update user profile',
        error: error.message
      };
    }
  }

  /**
   * 手动触发批量更新用户画像
   */
  async updateAllUserProfiles() {
    const { ctx } = this;

    try {
      const result = await ctx.service.userProfile.updateAllUserProfiles();
      ctx.body = {
        success: true,
        message: 'All user profiles updated successfully',
        data: result
      };
    } catch (error) {
      ctx.logger.error('Update all user profiles error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Failed to update all user profiles',
        error: error.message
      };
    }
  }
}

module.exports = UserProfileController;
