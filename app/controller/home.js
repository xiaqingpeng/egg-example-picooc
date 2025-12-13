const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  // 添加测试CI/CD自动部署的方法
  async testCicd() {
    const { ctx } = this;
    ctx.body = {
      code: 0,
      msg: 'CI/CD自动部署测试成功',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

module.exports = HomeController;
