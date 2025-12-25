/* eslint valid-jsdoc: "off" */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1764404498717_5666';

  // add your middleware config here
  config.middleware = [ 'requestLog' ];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  // 新增：配置监听所有网卡，允许外网访问
  config.cluster = {
    listen: {
      port: 7001,
      hostname: '0.0.0.0', // 关键：监听所有网卡，而非仅本地回环
    },
  };

  config.sequelize = {
    dialect: 'postgres',
    host: process.env.PG_HOST || '120.48.95.51',
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE || 'egg_example',
    username: process.env.PG_USERNAME || 'egg_example',
    password: process.env.PG_PASSWORD || '1994514Xia@',
    timezone: '+08:00',
    quoteIdentifiers: true,
    logging: false, // 关闭详细日志，提高性能
    define: {
      freezeTableName: true,
      underscored: false,
      quoteIdentifiers: true,
    },
    pool: {
      max: 3, // 减少连接池大小，避免资源耗尽
      min: 0,
      acquire: 5000, // 缩短连接获取超时时间
      idle: 10000,
    },
    enableSync: false, // 关闭自动同步，避免启动时数据库操作
    disableAuthenticate: true, // 关键：禁用启动时的数据库验证，避免应用阻塞
    dialectOptions: {
      connectTimeout: 5000, // 数据库连接超时时间
      statement_timeout: 5000, // SQL语句执行超时时间
    },
  };

  config.security = {
    csrf: {
      enable: true,
      ignoreJSON: false, // 关闭不安全配置，消除警告
      ignore: [ '/system/logs/report', '/register', '/login', '/user/register' ], // 保留业务白名单
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
