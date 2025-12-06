const { Controller } = require('egg');

class NoticeDbController extends Controller {
  async list() {
    const { ctx } = this;
    ctx.body = await ctx.service.noticeDb.list(ctx.query);
  }
  async create() {
    const { ctx } = this;
    ctx.body = await ctx.service.noticeDb.create(ctx.request.body || {});
  }
  async update() {
    const { ctx } = this;
    const id = ctx.params.id;
    ctx.body = await ctx.service.noticeDb.update(id, ctx.request.body || {});
  }
  async destroy() {
    const { ctx } = this;
    const id = ctx.params.id;
    ctx.body = await ctx.service.noticeDb.destroy(id);
  }
  async detail() {
    const { ctx } = this;
    const id = ctx.params.id;
    ctx.body = await ctx.service.noticeDb.detail(id);
  }
}

module.exports = NoticeDbController;
