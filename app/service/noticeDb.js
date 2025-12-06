const { Service } = require('egg');

class NoticeDbService extends Service {
  async list(query) {
    const pageNum = parseInt(query.pageNum || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const where = {};
    if (query.noticeTitle) where.noticeTitle = { [this.app.Sequelize.Op.like]: `%${query.noticeTitle}%` };
    if (query.noticeType) where.noticeType = String(query.noticeType);
    if (query.status) where.status = String(query.status);
    const { rows, count } = await this.ctx.model.Notice.findAndCountAll({
      where,
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      order: this.app.Sequelize.literal('"noticeid" DESC'),
    });
    return { code: 0, msg: '', rows, total: count };
  }

  async create(payload) {
    const data = await this.ctx.model.Notice.create(payload);
    return { code: 0, msg: '', data };
  }

  async update(id, payload) {
    const model = await this.ctx.model.Notice.findByPk(id);
    if (!model) return { code: 404, msg: 'not found' };
    await model.update(payload);
    return { code: 0, msg: '', data: model };
  }

  async destroy(id) {
    const count = await this.ctx.model.Notice.destroy({ where: { noticeId: id } });
    return { code: 0, msg: '', affected: count };
  }

  async detail(id) {
    const data = await this.ctx.model.Notice.findByPk(id);
    return { code: 0, msg: '', data };
  }
}

module.exports = NoticeDbService;
