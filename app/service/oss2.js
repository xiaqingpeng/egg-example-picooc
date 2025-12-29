// app/service/oss.js
const Service = require('egg').Service;
const OSS = require('ali-oss');


class OssService extends Service {
  async upLoadImage(file) {
    const { ctx, app } = this;
    const { client } = app.config.oss;

    try {
      // 创建阿里云 OSS 客户端
      const ossClient = new OSS(client);

      // 生成唯一的文件名
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // 上传文件到 OSS
      const result = await ossClient.put(fileName, file.filepath);

      // 返回图片的访问 URL
      return result.url;
    } catch (err) {
      ctx.logger.error('Failed to upload image to OSS:', err);
      throw new Error('Failed to upload image');
    }
  }
  async upLoadFile({ filename, filepath }) {
    const { app } = this;
    const { client } = app.config.oss;
    // 创建阿里云 OSS 客户端
    const ossClient = new OSS(client);
    try {
      const result = await ossClient.put(filename, filepath);
      return result;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  }
}

module.exports = OssService;
