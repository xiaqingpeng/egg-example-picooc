const { Service } = require('egg');

class NoticeDbService extends Service {
  async list(query) {
    try {
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
    } catch (e) {
      this.ctx.logger.error('Notice list error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        return { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      }
      return { code: 500, msg: '服务器内部错误' };
    }
  }

  async create(payload) {
    try {
      const data = await this.ctx.model.Notice.create(payload);
      return { code: 0, msg: '', data };
    } catch (e) {
      this.ctx.logger.error('Notice create error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        return { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      }
      return { code: 500, msg: '服务器内部错误' };
    }
  }

  async update(id, payload) {
    try {
      const model = await this.ctx.model.Notice.findByPk(id);
      if (!model) return { code: 404, msg: 'not found' };
      await model.update(payload);
      return { code: 0, msg: '', data: model };
    } catch (e) {
      this.ctx.logger.error('Notice update error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        return { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      }
      return { code: 500, msg: '服务器内部错误' };
    }
  }

  async destroy(id) {
    try {
      const count = await this.ctx.model.Notice.destroy({ where: { noticeId: id } });
      return { code: 0, msg: '', affected: count };
    } catch (e) {
      this.ctx.logger.error('Notice destroy error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        return { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      }
      return { code: 500, msg: '服务器内部错误' };
    }
  }

  async detail(id) {
    try {
      const data = await this.ctx.model.Notice.findByPk(id);
      return { code: 0, msg: '', data };
    } catch (e) {
      this.ctx.logger.error('Notice detail error:', e);
      if (e.name === 'SequelizeConnectionRefusedError') {
        return { code: 503, msg: '数据库连接错误，请检查数据库服务器是否运行' };
      }
      return { code: 500, msg: '服务器内部错误' };
    }
  }
}

module.exports = NoticeDbService;
