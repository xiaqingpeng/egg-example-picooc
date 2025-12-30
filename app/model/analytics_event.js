'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT, DATE, BIGINT } = app.Sequelize;

  const AnalyticsEvent = app.model.define('analytics_events', {
    id: {
      type: BIGINT,
      primaryKey: true,
      autoIncrement: true,
      field: 'id',
      comment: '主键ID'
    },
    eventName: {
      type: STRING(255),
      allowNull: false,
      field: 'event_name',
      comment: '事件名称'
    },
    eventType: {
      type: STRING(50),
      defaultValue: 'custom',
      field: 'event_type',
      comment: '事件类型'
    },
    properties: {
      type: TEXT,
      allowNull: true,
      field: 'properties',
      comment: '事件属性（JSON格式）'
    },
    userId: {
      type: STRING(255),
      allowNull: true,
      field: 'user_id',
      comment: '用户ID'
    },
    sessionId: {
      type: STRING(255),
      allowNull: true,
      field: 'session_id',
      comment: '会话ID'
    },
    duration: {
      type: INTEGER,
      allowNull: true,
      field: 'duration',
      comment: '持续时间（毫秒）'
    },
    errorMessage: {
      type: TEXT,
      allowNull: true,
      field: 'error_message',
      comment: '错误信息'
    },
    ip: {
      type: STRING(45),
      allowNull: true,
      field: 'ip',
      comment: 'IP地址'
    },
    userAgent: {
      type: STRING(500),
      allowNull: true,
      field: 'user_agent',
      comment: '用户代理'
    },
    requestId: {
      type: STRING(100),
      allowNull: true,
      field: 'request_id',
      comment: '请求ID'
    },
    createdAt: {
      type: DATE,
      allowNull: false,
      field: 'created_at',
      comment: '创建时间'
    }
  }, {
    tableName: 'analytics_events',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_event_name',
        fields: ['event_name']
      },
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_event_type',
        fields: ['event_type']
      },
      {
        name: 'idx_user_created',
        fields: ['user_id', 'created_at']
      }
    ]
  });

  return AnalyticsEvent;
};
