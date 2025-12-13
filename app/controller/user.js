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
}

module.exports = UserController;
