const { Controller } = require('egg');

class NoticeController extends Controller {
  async list() {
    const { ctx } = this;
    const data = await ctx.service.notice.list(ctx.query);
    ctx.body = data;
  }
}

module.exports = NoticeController;
