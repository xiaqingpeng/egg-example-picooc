// app/controller/image.js
const Controller = require('egg').Controller;

class ImageController extends Controller {
  async upLoadImage() {
    const { ctx, service } = this;

    // 检查用户是否已登录
    if (!ctx.session.user) {
      ctx.status = 401;
      ctx.body = { code: 401, msg: 'Not logged in' };
      return;
    }

    try {
      // 获取上传的图片文件
      const file = ctx.request.files[0];
      
      if (!file) {
        ctx.status = 422;
        ctx.body = { code: 422, msg: 'No file uploaded' };
        return;
      }

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

      // 调用 OssService 进行图片上传
      const url = await service.oss2.upLoadImage(file);
      ctx.logger.info('图片上传到OSS成功:', url);

      // 更新用户头像
      const user = await service.user.updateUser(ctx.session.user.id, { avatar: url });
      ctx.logger.info('用户头像更新成功:', user);

      // 更新session中的用户信息
      ctx.session.user = user;

      // 返回图片的访问 URL
      ctx.body = {
        code: 0,
        msg: 'Image uploaded successfully',
        data: {
          url,
          avatar: url,
        },
      };
    } catch (err) {
      ctx.logger.error('Failed to upload image:', err);
      ctx.status = 500;
      ctx.body = { code: 500, msg: 'Failed to upload image', error: err.message };
    } finally {
      // 清理临时文件
      const file = ctx.request.files[0];
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
  async upLoadFile() {
    const { ctx, service } = this;


    try {


      const file = ctx.request.files[0];

      // 调用 OssService 进行文件上传
      const fileContent = await service.oss2.upLoadFile({
        filename: file.filename,
        filepath: file.filepath,
      });

      // 返回图片的访问 URL
      ctx.body = {
        ...fileContent,
      };
    } catch (err) {
      ctx.logger.error('Failed to upload file:', err);
      ctx.status = 500;
      ctx.body = 'Failed to upload file';
    }
  }

}

module.exports = ImageController;
