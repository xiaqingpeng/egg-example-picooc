/** @type Egg.EggPlugin */
module.exports = {
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },
  // 移除 multipart 插件配置，Egg.js 3.x 已内置文件上传功能
  dotenv: {
    enable: true,
    package: 'egg-dotenv',
  },
};
