/* eslint valid-jsdoc: "off" */

// 加载环境变量（必须在配置文件之前加载）
require('dotenv').config();

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
      evict: 30000, // 30秒后检查空闲连接
    },
    enableSync: true, // 启用自动同步，自动创建缺失的表
    disableAuthenticate: true, // 关键：禁用启动时的数据库验证，避免应用阻塞
    dialectOptions: {
      connectTimeout: 5000, // 数据库连接超时时间
      statement_timeout: 5000, // SQL语句执行超时时间
      // 增加连接重试和健康检查配置
      keepAlive: true, // 保持连接活跃
      keepAliveInitialDelay: 10000, // 初始延迟10秒
    },
    // 增加重试配置
    retry: {
      max: 3, // 最大重试次数
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
    },
    // 增加健康检查配置
    healthCheck: {
      interval: 60000, // 每60秒检查一次
      maxRetries: 3, // 最大重试次数
      timeout: 5000, // 超时时间
    },
  };

  config.security = {
    csrf: {
      enable: false, // 临时禁用CSRF保护，用于测试文件上传功能
    },
  };

  // 配置multipart文件上传
  config.multipart = {
    mode: 'file',
    fileSize: '5mb', // 最大文件大小5MB
    whitelist: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
    ],
    tmpdir: '/tmp', // 临时文件目录
    cleanSchedule: {
      cron: '0 30 3 * * *', // 每天凌晨3:30清理临时文件
    },
  };

  // 配置文件上传URL（用于本地存储模式）
  config.fileUpload = {
    baseUrl: process.env.FILE_UPLOAD_BASE_URL || 'http://120.48.95.51:7001', // 基础URL（默认使用线上服务器地址）
    avatarPath: '/public/avatars/', // 头像访问路径
  };

  // 配置阿里云OSS
  config.oss = {
    region: process.env.OSS_REGION || 'oss-cn-shenzhen', // OSS区域
    accessKeyId: process.env.OSS_ACCESS_KEY_ID, // AccessKey ID（从环境变量读取）
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET, // AccessKey Secret（从环境变量读取）
    bucket: process.env.OSS_BUCKET || 'qingpengxia', // 存储桶名称
    // 可选：自定义域名
    customDomain: process.env.OSS_CUSTOM_DOMAIN || '', // 自定义域名，例如：https://cdn.example.com
    // 可选：上传目录
    uploadDir: 'avatars', // 默认上传目录
  };

  return {
    ...config,
    ...userConfig,
  };
};