# 快速参考指南 - 安全事件处理

## 🚨 紧急命令（立即执行）

### 1. 停止恶意进程
```bash
# SSH登录到服务器
ssh root@120.48.95.51

# 停止所有恶意进程
pkill -f '.netd'
pkill -f 'bioset'
pkill -f '/tmp/init'
pkill -f 'minerd'
pkill -f 'xmrig'

# 强制杀死
pkill -9 -f '.netd'
pkill -9 -f 'bioset'

# 验证进程已停止
ps aux | grep -E 'bioset|netd|minerd|xmrig' | grep -v grep
```

### 2. 删除恶意文件
```bash
# 删除恶意程序目录
rm -rf /var/tmp/.sys/

# 删除临时文件
rm -f /tmp/init
rm -f /var/tmp/.netd
rm -f /var/tmp/.bioset

# 验证文件已删除
ls -la /var/tmp/.sys/ 2>/dev/null || echo "恶意目录已删除"
```

### 3. 清理启动配置
```bash
# 备份当前配置
cp /home/postgres/.profile /home/postgres/.profile.malicious

# 恢复干净的配置
cp /home/postgres/.profile.bak /home/postgres/.profile

# 设置正确的权限
chown postgres:postgres /home/postgres/.profile
chmod 644 /home/postgres/.profile

# 验证配置
cat /home/postgres/.profile | grep -E 'bioset|netd' || echo "配置已清理"
```

### 4. 修改密码
```bash
# 修改postgres用户密码（使用强密码）
passwd postgres

# 修改root用户密码
passwd root
```

## 🔍 检查命令

### 检查恶意进程
```bash
# 查看所有可疑进程
ps aux | grep -E 'bioset|netd|minerd|xmrig|init' | grep -v grep

# 查看postgres用户的进程
ps aux | grep postgres | grep -v grep

# 查看CPU使用率高的进程
ps aux --sort=-%cpu | head -20
```

### 检查网络连接
```bash
# 查看所有网络连接
netstat -tunp

# 查看已建立的连接
netstat -tunp | grep ESTABLISHED

# 查看特定IP的连接
netstat -tunp | grep -E '141.95.110.188|5.255.115.190'

# 使用ss命令
ss -tunp
```

### 检查系统日志
```bash
# 查看认证日志
tail -100 /var/log/auth.log

# 查看失败的登录尝试
grep "Failed password" /var/log/auth.log | tail -20

# 查看PostgreSQL日志
tail -100 /var/log/postgresql/postgresql-16-main.log

# 查看系统日志
journalctl -f
```

### 检查文件系统
```bash
# 查看可疑目录
ls -la /var/tmp/.sys/ 2>/dev/null

# 查看postgres用户的配置
cat /home/postgres/.profile

# 查看SSH密钥
cat /home/postgres/.ssh/authorized_keys

# 查找SUID文件
find / -perm -4000 -type f 2>/dev/null
```

## 🛡️ 安全加固

### SSH安全配置
```bash
# 编辑SSH配置
vi /etc/ssh/sshd_config

# 修改以下配置项：
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# 重启SSH服务
systemctl restart sshd
```

### 防火墙配置
```bash
# 安装ufw
apt-get install ufw

# 配置防火墙规则
ufw default deny incoming
ufw default allow outgoing
ufw allow from YOUR_IP to any port 22
ufw allow from YOUR_IP to any port 5432
ufw enable

# 查看防火墙状态
ufw status numbered
```

### 安装fail2ban
```bash
# 安装fail2ban
apt-get install fail2ban

# 创建配置文件
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

# 启动fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# 查看状态
fail2ban-client status
```

### PostgreSQL安全配置
```bash
# 备份配置
cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.bak

# 编辑配置
vi /etc/postgresql/16/main/pg_hba.conf

# 将trust改为md5或scram-sha-256
# 例如：
# local   all             postgres                                md5
# local   all             all                                     md5

# 重启PostgreSQL
systemctl restart postgresql

# 验证配置
su - postgres -c "psql -c '\du'"
```

## 📋 检查清单

### 立即执行（现在）
- [ ] 停止所有恶意进程
- [ ] 删除所有恶意文件
- [ ] 清理启动配置文件
- [ ] 修改所有用户密码
- [ ] 备份重要数据

### 短期执行（24小时内）
- [ ] 检查并删除可疑SSH密钥
- [ ] 重新生成SSH密钥对
- [ ] 配置防火墙规则
- [ ] 安装并配置fail2ban
- [ ] 修复PostgreSQL配置
- [ ] 审查所有用户账户
- [ ] 检查系统日志

### 中期执行（1周内）
- [ ] 更新系统补丁
- [ ] 配置日志监控
- [ ] 设置告警通知
- [ ] 全面安全扫描
- [ ] 审查数据库权限
- [ ] 备份系统配置

### 长期执行（1个月内）
- [ ] 建立安全基线
- [ ] 制定应急响应计划
- [ ] 进行安全培训
- [ ] 定期安全审计
- [ ] 实施访问控制
- [ ] 建立监控体系

## 🔧 工具命令

### 系统监控
```bash
# 安装监控工具
apt-get install htop iotop nethogs

# 查看系统资源
htop

# 查看磁盘I/O
iotop

# 查看网络使用
nethogs
```

### 安全扫描
```bash
# 安装安全工具
apt-get install rkhunter chkrootkit

# 运行rootkit检测
rkhunter --check

# 运行chkrootkit
chkrootkit
```

### 日志分析
```bash
# 查看最近的登录
last -n 20

# 查看登录失败
lastb | head -20

# 查看当前登录用户
who

# 查看系统启动日志
dmesg | tail -50
```

## 📞 应急联系

### 内部联系
- 系统管理员: [填写联系方式]
- 安全团队: [填写联系方式]
- 数据库管理员: [填写联系方式]

### 外部资源
- Ubuntu安全公告: https://ubuntu.com/security/notices
- PostgreSQL安全: https://www.postgresql.org/support/security/
- CVE数据库: https://cve.mitre.org/

## 📝 重要提醒

1. **密码安全**
   - 使用强密码（至少12位，包含大小写字母、数字和特殊字符）
   - 不要在多个系统使用相同密码
   - 定期更换密码（建议每90天）

2. **SSH安全**
   - 禁用root远程登录
   - 禁用密码认证，仅使用密钥认证
   - 限制允许登录的IP地址

3. **数据库安全**
   - 不要使用trust认证
   - 限制数据库用户权限
   - 定期备份数据库

4. **监控告警**
   - 设置CPU使用率告警（>80%）
   - 设置磁盘使用率告警（>80%）
   - 设置异常进程告警
   - 设置登录失败告警

5. **备份策略**
   - 每日增量备份
   - 每周全量备份
   - 异地备份存储
   - 定期验证备份

## 🔄 定期维护

### 每日
```bash
# 检查系统负载
uptime

# 检查磁盘空间
df -h

# 检查可疑进程
ps aux | grep -E 'bioset|netd|minerd|xmrig' | grep -v grep

# 检查网络连接
netstat -tunp | grep ESTABLISHED | grep -v "127.0.0.1"

# 检查认证日志
tail -50 /var/log/auth.log | grep -i "failed"
```

### 每周
```bash
# 更新系统
apt-get update && apt-get upgrade -y

# 检查系统日志
journalctl --since "7 days ago" | grep -i "error|warning"

# 检查安全日志
grep "Failed password" /var/log/auth.log | tail -50

# 备份重要配置
tar -czf /root/config_backup_$(date +%Y%m%d).tar.gz /etc/
```

### 每月
```bash
# 全面安全扫描
rkhunter --check
chkrootkit

# 检查用户账户
cat /etc/passwd
cat /etc/shadow

# 检查SUID文件
find / -perm -4000 -type f 2>/dev/null

# 检查开放端口
nmap -sV localhost

# 备份系统
rsync -avz --delete / /backup/system_$(date +%Y%m%d)/
```

---

**最后更新**: 2025年12月31日  
**版本**: 1.0
