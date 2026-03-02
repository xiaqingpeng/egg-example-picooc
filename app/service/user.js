'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');

class UserService extends Service {
  async create(payload) {
    const { ctx } = this;
    const { username, email, password } = payload;

    // Check if user exists
    const existingUser = await ctx.model.User.findOne({ where: { email } });
    const hashedPassword = this.hashPassword(password);
    let user;

    if (existingUser) {
      // Email exists, update the user
      await existingUser.update({
        username,
        password: hashedPassword,
      });
      user = existingUser;
    } else {
      // Email doesn't exist, create new user
      user = await ctx.model.User.create({
        username,
        email,
        password: hashedPassword,
      });
    }

    // 从用户数据中排除password字段
    const userInfo = { ...user.toJSON() };
    delete userInfo.password;
    return userInfo;
  }

  async verifyUser(email, password) {
    const { ctx } = this;
    const user = await ctx.model.User.findOne({ where: { email } });
    if (!user) return null;

    const hashedPassword = this.hashPassword(password);
    if (user.password === hashedPassword) {
      // 从用户数据中排除password字段
      const userInfo = { ...user.toJSON() };
      delete userInfo.password;
      return userInfo;
    }
    return null;
  }

  hashPassword(password) {
    // Using app.config.keys as secret for HMAC
    const secret = this.config.keys;
    return crypto.createHmac('sha256', secret)
      .update(password)
      .digest('hex');
  }

  async getUserById(id) {
    const { ctx } = this;
    const user = await ctx.model.User.findByPk(id);
    if (!user) return null;

    // 从用户数据中排除password字段
    const userInfo = { ...user.toJSON() };
    delete userInfo.password;
    return userInfo;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const { ctx } = this;
    
    // 查找用户
    const user = await ctx.model.User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // 验证旧密码
    const hashedOldPassword = this.hashPassword(oldPassword);
    if (user.password !== hashedOldPassword) {
      const error = new Error('Old password is incorrect');
      error.status = 401;
      throw error;
    }

    // 更新密码
    const hashedNewPassword = this.hashPassword(newPassword);
    await user.update({ password: hashedNewPassword });

    // 从用户数据中排除password字段
    const userInfo = { ...user.toJSON() };
    delete userInfo.password;
    return userInfo;
  }

  async updateUser(userId, updates) {
    const { ctx } = this;
    
    // 查找用户
    const user = await ctx.model.User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // 允许更新的字段
    const allowedFields = ['username', 'email', 'password', 'avatar'];
    const updateData = {};

    // 过滤并构建更新数据
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // 直接更新邮箱，允许覆盖已存在的邮箱
        if (field === 'email') {
          // 移除邮箱重复检查，允许覆盖
        }
        // 如果更新 password，需要加密
        if (field === 'password') {
          updateData[field] = this.hashPassword(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    // 如果没有需要更新的字段，直接返回用户信息
    if (Object.keys(updateData).length === 0) {
      const userInfo = { ...user.toJSON() };
      delete userInfo.password;
      return userInfo;
    }

    // 更新用户信息
    await user.update(updateData);

    // 从用户数据中排除password字段
    const userInfo = { ...user.toJSON() };
    delete userInfo.password;
    return userInfo;
  }
}

module.exports = UserService;
