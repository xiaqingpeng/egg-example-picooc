'use strict';

/**
 * 生产环境配置
 * 此配置会覆盖 config.default.js 中的配置
 */
module.exports = () => {
  const config = {};

  // 确保生产环境中启用requestLog中间件
  config.middleware = [ 'requestLog' ];

  return {
    ...config,
  };
};
