'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const User = app.model.define('user', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: STRING(64), allowNull: false },
    email: { type: STRING(128), allowNull: false, unique: true },
    password: { type: STRING(128), allowNull: false },
    createTime: { type: DATE, field: 'createtime' },
    updateTime: { type: DATE, field: 'updatetime' },
  }, {
    tableName: 'system_user',
    timestamps: true,
    createdAt: 'createTime',
    updatedAt: 'updateTime',
  });

  return User;
};
