'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');

class UserService extends Service {
  async create(payload) {
    const { ctx } = this;
    const { username, email, password } = payload;

    // Check if user exists
    const existingUser = await ctx.model.User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already exists');
      error.status = 400;
      throw error;
    }

    const hashedPassword = this.hashPassword(password);
    const user = await ctx.model.User.create({
      username,
      email,
      password: hashedPassword,
    });

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
}

module.exports = UserService;
