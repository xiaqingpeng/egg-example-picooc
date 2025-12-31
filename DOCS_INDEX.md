# 用户画像项目文档中心

> 本项目是一个基于 Egg.js 的用户画像分析系统，提供完整的用户行为分析、画像生成和统计分析功能。

---

## 📚 文档导航

### 🔍 API测试文档

| 文档 | 说明 | 重要性 |
|------|------|--------|
| [USER_PROFILE_API_TEST.md](./USER_PROFILE_API_TEST.md) | 用户画像API完整测试用例，包含修复记录 | ⭐⭐⭐⭐⭐ |
| [ANALYTICS_API_TEST.md](./ANALYTICS_API_TEST.md) | 分析接口测试用例，功能验证文档 | ⭐⭐⭐⭐ |
| [USER_PROFILES_FIX_GUIDE.md](./USER_PROFILES_FIX_GUIDE.md) | 用户画像API修复指南，问题解决文档 | ⭐⭐⭐ |

### 🛡️ 安全文档

| 文档 | 说明 | 重要性 |
|------|------|--------|
| [SECURITY_INCIDENT_REPORT.md](./SECURITY_INCIDENT_REPORT.md) | 安全事件详细报告，威胁分析和清理步骤 | ⭐⭐⭐⭐ |
| [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) | 安全清理执行计划，完整的操作步骤 | ⭐⭐⭐⭐ |

### 💻 开发文档

| 文档 | 说明 | 重要性 |
|------|------|--------|
| [EGGJS_BACKEND_TODO.md](./EGGJS_BACKEND_TODO.md) | 后端开发待办事项，开发指南 | ⭐⭐⭐ |
| [EGGJS_ANALYTICS_BACKEND.md](./EGGJS_ANALYTICS_BACKEND.md) | Egg.js埋点事件后端实现文档 | ⭐⭐⭐ |
| [CI-CD.md](./CI-CD.md) | CI/CD集成说明，部署文档 | ⭐⭐⭐ |

### ⚙️ 配置文档

| 文档 | 说明 | 重要性 |
|------|------|--------|
| [GIT-REMOTE-SETUP-GUIDE.md](./GIT-REMOTE-SETUP-GUIDE.md) | Git远程仓库设置，配置文档 | ⭐⭐ |
| [PM2-README.md](./PM2-README.md) | PM2自动管理配置指南 | ⭐⭐ |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 14.x
- PostgreSQL >= 12
- Redis >= 5.0

### 安装依赖

```bash
npm install
```

### 配置数据库

```bash
# 创建数据库
createdb egg_example

# 执行迁移
npm run migrate
```

### 启动开发服务器

```bash
npm run dev
```

### 运行测试

```bash
npm run test:local
```

---

## 📊 核心功能

### 1. 用户画像API

- **获取用户完整画像**: `/api/analytics/user/profile?userId={userId}`
- **获取用户标签**: `/api/analytics/user/tags?userId={userId}`
- **获取用户行为特征**: `/api/analytics/user/behavior?userId={userId}`
- **获取用户兴趣画像**: `/api/analytics/user/interest?userId={userId}`
- **获取用户价值评估**: `/api/analytics/user/value?userId={userId}`
- **获取用户列表**: `/api/analytics/user/list?page={page}&pageSize={pageSize}`

### 2. 分析统计API

- **事件统计**: `/api/analytics/event-stats?startDate={startDate}&endDate={endDate}`
- **页面浏览统计**: `/api/analytics/page-views?startDate={startDate}&endDate={endDate}`
- **趋势分析**: `/api/analytics/trends?startDate={startDate}&endDate={endDate}&interval={interval}`
- **用户活跃度**: `/api/analytics/activity?startDate={startDate}&endDate={endDate}`
- **留存率统计**: `/api/analytics/retention`
- **事件列表**: `/api/analytics/events?startDate={startDate}&endDate={endDate}`

### 3. 用户画像管理

- **更新所有用户画像**: `POST /api/user-profile/update-all`
- **更新单个用户画像**: `POST /api/user-profile/update/{userId}`

---

## 📁 项目结构

```
egg-example-picooc/
├── app/                      # 应用主目录
│   ├── controller/           # 控制器
│   ├── service/              # 服务层
│   ├── model/                # 数据模型
│   ├── schedule/             # 定时任务
│   └── router.js             # 路由配置
├── config/                   # 配置文件
├── database/                  # 数据库相关
│   └── migrations/           # 数据库迁移
├── test/                     # 测试文件
├── .gitee/                   # Gitee CI/CD配置
└── *.md                      # 文档文件
```

---

## 🔐 安全注意事项

本项目曾遭遇安全事件（2025年12月31日），已完全清理并加固系统。详细信息请参考：
- [安全事件报告](./SECURITY_INCIDENT_REPORT.md)
- [执行计划](./EXECUTION_PLAN.md)

### 安全加固措施

- ✅ 修改所有用户密码
- ✅ 配置防火墙（ufw）
- ✅ 安装fail2ban防止暴力破解
- ✅ 修复PostgreSQL配置
- ✅ 加固SSH配置
- ✅ 部署安全监控脚本

---

## 📝 更新日志

### 2025-12-31

- ✅ 修复用户列表API返回空对象问题
- ✅ 改进WHERE条件构建逻辑
- ✅ 添加转化率统计功能
- ✅ 完成安全事件清理和系统加固
- ✅ 整合项目文档，删除冗余文件

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证。

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至项目维护者

---

**最后更新**: 2025-12-31  
**文档版本**: v1.0.0
