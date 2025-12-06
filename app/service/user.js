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
    
    const { password: _, ...userInfo } = user.toJSON();
    return userInfo;
  }

  async verifyUser(email, password) {
    const { ctx } = this;
    const user = await ctx.model.User.findOne({ where: { email } });
    if (!user) return null;

    const hashedPassword = this.hashPassword(password);
    if (user.password === hashedPassword) {
      const { password: _, ...userInfo } = user.toJSON();
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
}

module.exports = UserService;
