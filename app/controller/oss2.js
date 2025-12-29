// app/controller/image.js
const Controller = require('egg').Controller;

class ImageController extends Controller {
  async upLoadImage() {
    const { ctx, service } = this;


    try {
      // 获取上传的图片文件
      const file = ctx.request.files[0];


      // 调用 OssService 进行图片上传
      const url = await service.oss2.upLoadImage(file);

      // 返回图片的访问 URL
      ctx.body = {
        url,
      };
    } catch (err) {
      ctx.logger.error('Failed to upload image:', err);
      ctx.status = 500;
      ctx.body = 'Failed to upload image';
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
