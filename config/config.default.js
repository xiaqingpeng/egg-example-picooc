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

  config.sequelize = {
    dialect: 'postgres',
    host: process.env.PG_HOST || '120.48.95.51',
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE || 'egg_example',
    username: process.env.PG_USERNAME || process.env.USER || 'xiaqingpeng',
    password: process.env.PG_PASSWORD || '1994514Xia@',
    timezone: '+08:00',
    quoteIdentifiers: false,
    define: {
      freezeTableName: true,
      underscored: false,
      quoteIdentifiers: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    enableSync: true,
  };

  config.security = {
    csrf: {
      enable: true,
      ignoreJSON: true,
      ignore: [ '/system/logs/report', '/register', '/login' ],
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
