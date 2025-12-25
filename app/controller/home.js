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
      version: '1.0.0',
    };
  }

  // 添加健康检查方法，不依赖数据库
  async health() {
    const { ctx } = this;
    ctx.body = {
      code: 0,
      msg: '应用运行正常',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }
}

module.exports = HomeController;
