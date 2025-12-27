'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async register() {
    const { ctx } = this;
    const { username, email, password, confirmPassword } = ctx.request.body;

    if (!username || !email || !password || !confirmPassword) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'Missing required fields' };
      return;
    }

    if (password !== confirmPassword) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'Passwords do not match' };
      return;
    }

    try {
      const user = await ctx.service.user.create({ username, email, password });
      ctx.body = { code: 0, msg: 'Register success', data: user };
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { code: ctx.status, msg: err.message };
    }
  }

  async login() {
    const { ctx } = this;
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'Missing email or password' };
      return;
    }

    const user = await ctx.service.user.verifyUser(email, password);

    if (user) {
      ctx.session.user = user;
      console.log({ code: 0, msg: 'Login success', data: user });
      ctx.body = { code: 0, msg: 'Login success', data: user };
    } else {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Invalid email or password' };
    }
  }

  async getUserInfo() {
    const { ctx } = this;
    // 检查用户是否已登录
    if (ctx.session.user) {
      ctx.body = { code: 0, msg: 'Success', data: ctx.session.user };
    } else {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Not logged in' };
    }
  }

  async getUserById() {
    const { ctx } = this;
    const { id } = ctx.query;

    if (!id) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'Missing user id' };
      return;
    }

    try {
      const user = await ctx.service.user.getUserById(id);

      if (user) {
        ctx.body = { code: 0, msg: 'Success', data: user };
      } else {
        ctx.status = 404;
        ctx.body = { code: 404, msg: 'User not found' };
      }
    } catch (error) {
      // 数据库连接失败时的优雅处理
      if (error.name === 'SequelizeConnectionRefusedError') {
        ctx.status = 503;
        ctx.body = { code: 503, msg: 'Database connection error', error: 'Service unavailable' };
      } else {
        ctx.status = 500;
        ctx.body = { code: 500, msg: 'Internal server error', error: error.message };
      }
      // 记录详细错误日志便于排查
      ctx.logger.error('Error in getUserById:', error);
    }
  }

  async changePassword() {
    const { ctx } = this;
    const { oldPassword, newPassword, confirmPassword } = ctx.request.body;

    // 检查用户是否已登录
    if (!ctx.session.user) {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Not logged in' };
      return;
    }

    // 验证必填字段
    if (!oldPassword || !newPassword || !confirmPassword) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'Missing required fields' };
      return;
    }

    // 验证新密码和确认密码是否匹配
    if (newPassword !== confirmPassword) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'New passwords do not match' };
      return;
    }

    // 验证旧密码和新密码不能相同
    if (oldPassword === newPassword) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'New password must be different from old password' };
      return;
    }

    try {
      const user = await ctx.service.user.changePassword(
        ctx.session.user.id,
        oldPassword,
        newPassword
      );
      ctx.body = { code: 0, msg: 'Password changed successfully', data: user };
    } catch (error) {
      ctx.status = error.status || 500;
      ctx.body = { code: ctx.status, msg: error.message };
    }
  }
}

module.exports = UserController;
