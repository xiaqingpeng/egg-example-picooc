'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT, DATE, JSONB } = app.Sequelize;

  const UserProfile = app.model.define('user_profiles', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id',
      comment: '主键ID'
    },
    userId: {
      type: STRING(255),
      allowNull: false,
      unique: true,
      field: 'user_id',
      comment: '用户ID'
    },
    registerTime: {
      type: DATE,
      allowNull: true,
      field: 'register_time',
      comment: '注册时间'
    },
    lastActiveTime: {
      type: DATE,
      allowNull: true,
      field: 'last_active_time',
      comment: '最后活跃时间'
    },
    totalEvents: {
      type: INTEGER,
      defaultValue: 0,
      field: 'total_events',
      comment: '总事件数'
    },
    activeDays: {
      type: INTEGER,
      defaultValue: 0,
      field: 'active_days',
      comment: '活跃天数'
    },
    tags: {
      type: JSONB,
      allowNull: true,
      field: 'tags',
      comment: '用户标签（JSON格式）'
    },
    behaviorFeatures: {
      type: JSONB,
      allowNull: true,
      field: 'behavior_features',
      comment: '行为特征（JSON格式）'
    },
    valueAssessment: {
      type: JSONB,
      allowNull: true,
      field: 'value_assessment',
      comment: '价值评估（JSON格式）'
    },
    activityLevel: {
      type: STRING(50),
      allowNull: true,
      field: 'activity_level',
      comment: '活跃度等级'
    },
    valueLevel: {
      type: STRING(50),
      allowNull: true,
      field: 'value_level',
      comment: '价值等级'
    },
    createdAt: {
      type: DATE,
      allowNull: false,
      defaultValue: Date.now,
      field: 'created_at',
      comment: '创建时间'
    },
    updatedAt: {
      type: DATE,
      allowNull: false,
      defaultValue: Date.now,
      field: 'updated_at',
      comment: '更新时间'
    }
  }, {
    tableName: 'user_profiles',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_activity_level',
        fields: ['activity_level']
      },
      {
        name: 'idx_value_level',
        fields: ['value_level']
      },
      {
        name: 'idx_last_active_time',
        fields: ['last_active_time']
      }
    ]
  });

  return UserProfile;
};
