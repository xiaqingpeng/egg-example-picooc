module.exports = app => {
  const { INTEGER, STRING, DATE } = app.Sequelize;
  const ApiLog = app.model.define('api_log', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    path: { type: STRING(255), allowNull: false, defaultValue: '' },
    method: { type: STRING(16), allowNull: false, defaultValue: '' },
    ip: { type: STRING(64), allowNull: false, defaultValue: '' },
    requestTime: { type: DATE, allowNull: false },
    durationMs: { type: INTEGER, allowNull: false, defaultValue: 0 },
    platform: { type: STRING(64), allowNull: false, defaultValue: '' },
  }, {
    tableName: 'system_api_log',
    timestamps: false,
    underscored: true,
  });
  return ApiLog;
};
