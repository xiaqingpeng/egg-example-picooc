module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
  const Notice = app.model.define('notice', {
    noticeId: { type: INTEGER, primaryKey: true, autoIncrement: true, field: 'noticeid' },
    noticeTitle: { type: STRING(255), allowNull: false, defaultValue: '', field: 'noticetitle' },
    noticeType: { type: STRING(20), allowNull: false, defaultValue: '', field: 'noticetype' },
    noticeContent: { type: TEXT, allowNull: false, defaultValue: '', field: 'noticecontent' },
    status: { type: STRING(10), allowNull: false, defaultValue: '0', field: 'status' },
    remark: { type: STRING(255), allowNull: false, defaultValue: '', field: 'remark' },
    createBy: { type: STRING(100), allowNull: false, defaultValue: '', field: 'createby' },
    updateBy: { type: STRING(100), allowNull: false, defaultValue: '', field: 'updateby' },
    createTime: { type: DATE, allowNull: true, field: 'createtime' },
    updateTime: { type: DATE, allowNull: true, field: 'updatetime' },
  }, {
    tableName: 'system_notice',
    timestamps: false,
  });
  return Notice;
};
