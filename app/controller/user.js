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
    if (!ctx.session.user) {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Not logged in' };
      return;
    }

    // 从数据库重新查询用户信息，确保获取最新数据
    const user = await ctx.service.user.getUserById(ctx.session.user.id);
    if (user) {
      ctx.body = { code: 0, msg: 'Success', data: user };
    } else {
      ctx.status = 404;
      ctx.body = { code: 404, msg: 'User not found' };
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

  async uploadAvatar() {
    const { ctx } = this;

    // 检查用户是否已登录
    if (!ctx.session.user) {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Not logged in' };
      return;
    }

    // 获取上传的文件
    const file = ctx.request.files[0];
    if (!file) {
      ctx.status = 422;
      ctx.body = { code: 422, msg: 'No file uploaded' };
      return;
    }

    try {
      // 验证文件类型（只允许图片）
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mime)) {
        ctx.status = 422;
        ctx.body = { code: 422, msg: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' };
        return;
      }

      // 验证文件大小（最大5MB）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        ctx.status = 422;
        ctx.body = { code: 422, msg: 'File size exceeds 5MB limit' };
        return;
      }

      let avatarUrl;

      // 检查是否配置了OSS
      const ossConfig = this.app.config.oss;
      if (ossConfig.client && ossConfig.client.accessKeyId && ossConfig.client.accessKeySecret && ossConfig.client.bucket) {
        // 使用OSS上传
        avatarUrl = await ctx.service.oss2.upLoadImage(file);
        ctx.logger.info('头像上传到OSS成功:', avatarUrl);
      } else {
        // 使用本地存储
        const fs = require('fs');
        const path = require('path');
        
        // 生成文件名：用户ID_时间戳.扩展名
        const ext = file.filename.split('.').pop();
        const timestamp = Date.now();
        const newFilename = `avatar_${ctx.session.user.id}_${timestamp}.${ext}`;

        // 读取文件内容
        const fileContent = fs.readFileSync(file.filepath);

        // 创建上传目录（如果不存在）
        const uploadDir = path.join(this.app.baseDir, 'app/public/avatars');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 保存文件
        const targetPath = path.join(uploadDir, newFilename);
        fs.writeFileSync(targetPath, fileContent);

        // 生成完整的网络访问URL
        const baseUrl = this.app.config.fileUpload.baseUrl;
        const avatarPath = this.app.config.fileUpload.avatarPath;
        avatarUrl = `${baseUrl}${avatarPath}${newFilename}`;
        
        ctx.logger.info('头像上传到本地成功:', avatarUrl);
      }

      // 更新用户头像
      const user = await ctx.service.user.updateUser(ctx.session.user.id, { avatar: avatarUrl });

      // 更新session中的用户信息
      ctx.session.user = user;

      ctx.body = { code: 0, msg: 'Avatar uploaded successfully', data: { avatar: avatarUrl } };
    } catch (error) {
      ctx.status = error.status || 500;
      ctx.body = { code: ctx.status, msg: error.message || 'Failed to upload avatar' };
      ctx.logger.error('Error in uploadAvatar:', error);
    } finally {
      // 清理临时文件
      if (file && file.filepath) {
        const fs = require('fs');
        try {
          fs.unlinkSync(file.filepath);
        } catch (err) {
          ctx.logger.error('Failed to delete temp file:', err);
        }
      }
    }
  }

  async updateUserInfo() {
    const { ctx } = this;
    const { username } = ctx.request.body;

    // 检查用户是否已登录
    if (!ctx.session.user) {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Not logged in' };
      return;
    }

    // 验证用户名
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        ctx.status = 422;
        ctx.body = { code: 422, msg: 'Username cannot be empty' };
        return;
      }
      if (username.length > 64) {
        ctx.status = 422;
        ctx.body = { code: 422, msg: 'Username cannot exceed 64 characters' };
        return;
      }
    }

    try {
      // 更新用户信息
      const user = await ctx.service.user.updateUser(ctx.session.user.id, { username });

      // 更新session中的用户信息
      ctx.session.user = user;

      ctx.body = { code: 0, msg: 'User info updated successfully', data: user };
    } catch (error) {
      ctx.status = error.status || 500;
      ctx.body = { code: ctx.status, msg: error.message };
      ctx.logger.error('Error in updateUserInfo:', error);
    }
  }
}

module.exports = UserController;
