# 安全清理执行计划

## 📋 执行概览

**目标**: 清理服务器 120.48.95.51 上的恶意软件并加固系统安全  
**预计时间**: 30-45分钟  
**风险等级**: 中等（需要谨慎操作）  
**所需权限**: root权限

## ⚠️ 执行前准备

### 1. 备份重要数据
```bash
# 创建备份目录
mkdir -p /root/security_backup_$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/security_backup_$(date +%Y%m%d_%H%M%S)"

# 备份重要配置文件
cp /home/postgres/.profile $BACKUP_DIR/
cp /home/postgres/.profile.bak $BACKUP_DIR/
cp /home/postgres/.ssh/authorized_keys $BACKUP_DIR/ 2>/dev/null || true
cp /etc/postgresql/16/main/pg_hba.conf $BACKUP_DIR/ 2>/dev/null || true
cp /etc/ssh/sshd_config $BACKUP_DIR/
cp /etc/fail2ban/jail.local $BACKUP_DIR/ 2>/dev/null || true

echo "备份完成，备份目录: $BACKUP_DIR"
```

### 2. 通知相关人员
- [ ] 通知系统管理员
- [ ] 通知数据库管理员
- [ ] 通知应用开发团队
- [ ] 通知安全团队

### 3. 准备回滚方案
- 记录当前系统状态
- 准备紧急联系人
- 准备系统快照（如果支持）

## 🚀 执行步骤

### 阶段1: 紧急清理（5-10分钟）

#### 步骤1.1: 停止恶意进程
```bash
# 查看当前恶意进程
echo "=== 检查恶意进程 ==="
ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep

# 停止恶意进程
echo "=== 停止恶意进程 ==="
pkill -f '.netd' 2>/dev/null
pkill -f 'bioset' 2>/dev/null
pkill -f '/tmp/init' 2>/dev/null
pkill -f 'minerd' 2>/dev/null
pkill -f 'xmrig' 2>/dev/null

# 等待2秒
sleep 2

# 强制杀死残留进程
pkill -9 -f '.netd' 2>/dev/null
pkill -9 -f 'bioset' 2>/dev/null
pkill -9 -f '/tmp/init' 2>/dev/null

# 验证进程已停止
echo "=== 验证进程状态 ==="
ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep || echo "✓ 所有恶意进程已停止"
```

#### 步骤1.2: 删除恶意文件
```bash
# 查看恶意文件
echo "=== 检查恶意文件 ==="
ls -la /var/tmp/.sys/ 2>/dev/null || echo "目录不存在"
ls -la /tmp/init 2>/dev/null || echo "文件不存在"

# 删除恶意文件
echo "=== 删除恶意文件 ==="
rm -rf /var/tmp/.sys/
rm -f /tmp/init
rm -f /var/tmp/.netd
rm -f /var/tmp/.bioset

# 验证文件已删除
echo "=== 验证文件状态 ==="
ls -la /var/tmp/.sys/ 2>/dev/null && echo "✗ 目录仍存在" || echo "✓ 恶意目录已删除"
ls -la /tmp/init 2>/dev/null && echo "✗ 文件仍存在" || echo "✓ 恶意文件已删除"
```

#### 步骤1.3: 清理启动配置
```bash
# 备份当前配置
echo "=== 备份当前配置 ==="
cp /home/postgres/.profile /home/postgres/.profile.malicious

# 恢复干净的配置
echo "=== 恢复干净配置 ==="
if [ -f "/home/postgres/.profile.bak" ]; then
    cp /home/postgres/.profile.bak /home/postgres/.profile
    echo "✓ 已恢复 .profile.bak"
else
    echo "✗ .profile.bak 不存在，手动清理"
    # 手动删除恶意启动命令
    sed -i '/nohup \/var\/tmp\/\.sys\/\.netd/d' /home/postgres/.profile
    sed -i '/nohup \/var\/tmp\/\.sys\/\.bioset/d' /home/postgres/.profile
fi

# 设置正确的权限
chown postgres:postgres /home/postgres/.profile
chmod 644 /home/postgres/.profile

# 验证配置
echo "=== 验证配置 ==="
cat /home/postgres/.profile | grep -E 'bioset|netd' && echo "✗ 配置未清理" || echo "✓ 配置已清理"
```

### 阶段2: 安全加固（10-15分钟）

#### 步骤2.1: 修改用户密码
```bash
# 修改postgres用户密码
echo "=== 修改postgres用户密码 ==="
passwd postgres
# 输入强密码（至少12位，包含大小写字母、数字和特殊字符）

# 修改root用户密码
echo "=== 修改root用户密码 ==="
passwd root
# 输入强密码

echo "✓ 密码修改完成"
```

#### 步骤2.2: 处理SSH密钥
```bash
# 查看当前SSH密钥
echo "=== 查看SSH密钥 ==="
cat /home/postgres/.ssh/authorized_keys

# 检查可疑密钥
echo "=== 检查可疑密钥 ==="
if grep -q "pg2026-deployer" /home/postgres/.ssh/authorized_keys; then
    echo "发现可疑密钥: pg2026-deployer"
    read -p "是否删除此密钥? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 备份并删除
        cp /home/postgres/.ssh/authorized_keys /root/security_backup/authorized_keys.suspicious
        rm -f /home/postgres/.ssh/authorized_keys
        echo "✓ 可疑密钥已删除"
    fi
else
    echo "✓ 未发现可疑密钥"
fi

# 重新生成密钥对（可选）
read -p "是否重新生成SSH密钥对? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    su - postgres -c "ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ''"
    echo "✓ SSH密钥已重新生成"
fi
```

#### 步骤2.3: 配置防火墙
```bash
# 安装ufw
echo "=== 安装防火墙 ==="
apt-get update -qq
apt-get install -y ufw

# 配置防火墙规则
echo "=== 配置防火墙规则 ==="
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# 允许SSH（建议限制IP）
ufw allow ssh

# 允许PostgreSQL（建议限制IP）
ufw allow 5432/tcp

# 如果知道您的IP地址，可以限制访问
# ufw allow from YOUR_IP to any port 22
# ufw allow from YOUR_IP to any port 5432

# 查看防火墙状态
echo "=== 防火墙状态 ==="
ufw status numbered

echo "✓ 防火墙配置完成"
```

#### 步骤2.4: 安装并配置fail2ban
```bash
# 安装fail2ban
echo "=== 安装fail2ban ==="
apt-get install -y fail2ban

# 创建配置文件
echo "=== 配置fail2ban ==="
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = root@localhost
sendername = Fail2Ban

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[postgres]
enabled = true
port = 5432
filter = postgres
logpath = /var/log/postgresql/postgresql-16-main.log
maxretry = 5
bantime = 1800
EOF

# 启动fail2ban
echo "=== 启动fail2ban ==="
systemctl enable fail2ban
systemctl start fail2ban

# 查看状态
echo "=== fail2ban状态 ==="
fail2ban-client status

echo "✓ fail2ban配置完成"
```

#### 步骤2.5: 修复PostgreSQL配置
```bash
# 备份配置
echo "=== 备份PostgreSQL配置 ==="
cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.bak

# 检查当前配置
echo "=== 检查当前配置 ==="
cat /etc/postgresql/16/main/pg_hba.conf | grep -v '^#' | grep -v '^$'

# 修复配置（将trust改为md5）
echo "=== 修复配置 ==="
sed -i 's/trust/md5/g' /etc/postgresql/16/main/pg_hba.conf

# 重启PostgreSQL
echo "=== 重启PostgreSQL ==="
systemctl restart postgresql

# 验证配置
echo "=== 验证配置 ==="
cat /etc/postgresql/16/main/pg_hba.conf | grep trust && echo "✗ 仍存在trust配置" || echo "✓ 配置已修复"

echo "✓ PostgreSQL配置修复完成"
```

#### 步骤2.6: 加固SSH配置
```bash
# 备份配置
echo "=== 备份SSH配置 ==="
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 编辑配置
echo "=== 修改SSH配置 ==="
cat >> /etc/ssh/sshd_config << 'EOF'

# 安全加固配置
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# 测试配置
echo "=== 测试SSH配置 ==="
sshd -t

# 重启SSH
echo "=== 重启SSH服务 ==="
systemctl restart sshd

echo "✓ SSH配置加固完成"
echo "⚠️ 警告: 已禁用密码认证，请确保已配置SSH密钥"
```

### 阶段3: 验证和监控（5-10分钟）

#### 步骤3.1: 验证清理结果
```bash
echo "=== 验证清理结果 ==="

# 检查恶意进程
echo "1. 检查恶意进程:"
ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep && echo "✗ 仍存在恶意进程" || echo "✓ 无恶意进程"

# 检查恶意文件
echo "2. 检查恶意文件:"
ls -la /var/tmp/.sys/ 2>/dev/null && echo "✗ 恶意目录仍存在" || echo "✓ 恶意目录已删除"
ls -la /tmp/init 2>/dev/null && echo "✗ 恶意文件仍存在" || echo "✓ 恶意文件已删除"

# 检查配置文件
echo "3. 检查配置文件:"
cat /home/postgres/.profile | grep -E 'bioset|netd' && echo "✗ 配置未清理" || echo "✓ 配置已清理"

# 检查网络连接
echo "4. 检查网络连接:"
netstat -tunp | grep -E '141.95.110.188|5.255.115.190' && echo "✗ 仍存在恶意连接" || echo "✓ 无恶意连接"

# 检查系统负载
echo "5. 检查系统负载:"
uptime
```

#### 步骤3.2: 检查系统服务
```bash
echo "=== 检查系统服务 ==="

# 检查PostgreSQL
echo "1. PostgreSQL服务:"
systemctl status postgresql | grep -E 'Active|Loaded'

# 检查SSH
echo "2. SSH服务:"
systemctl status sshd | grep -E 'Active|Loaded'

# 检查防火墙
echo "3. 防火墙服务:"
ufw status | head -5

# 检查fail2ban
echo "4. fail2ban服务:"
systemctl status fail2ban | grep -E 'Active|Loaded'
```

#### 步骤3.3: 生成安全报告
```bash
# 创建报告文件
REPORT_FILE="/root/security_report_$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
==========================================
        安全清理执行报告
==========================================

执行时间: $(date)
执行人: $(whoami)
服务器: $(hostname)
IP地址: $(hostname -I | awk '{print $1}')

==========================================
清理操作摘要
==========================================

1. 恶意进程清理
   - 已停止: .netd, bioset, /tmp/init
   - 状态: $(ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep && echo "失败" || echo "成功")

2. 恶意文件删除
   - 已删除: /var/tmp/.sys/, /tmp/init
   - 状态: $(ls -la /var/tmp/.sys/ 2>/dev/null && echo "失败" || echo "成功")

3. 配置文件清理
   - 已清理: /home/postgres/.profile
   - 状态: $(cat /home/postgres/.profile | grep -E 'bioset|netd' && echo "失败" || echo "成功")

4. 密码修改
   - postgres: 已修改
   - root: 已修改

5. SSH密钥处理
   - 已备份: /root/security_backup/authorized_keys.suspicious
   - 状态: 已检查并处理可疑密钥

6. 防火墙配置
   - 状态: $(ufw status | head -1)

7. fail2ban配置
   - 状态: $(systemctl is-active fail2ban)

8. PostgreSQL配置
   - 状态: $(systemctl is-active postgresql)

==========================================
系统状态
==========================================

系统负载: $(uptime | awk -F'load average:' '{print $2}')
内存使用: $(free -h | grep Mem | awk '{print $3 "/" $2}')
磁盘使用: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')

运行中的服务:
$(systemctl list-units --type=service --state=running | grep -E "ssh|postgres|fail2ban" | awk '{print "  - " $1 ": " $3}')

==========================================
后续建议
==========================================

1. 立即执行:
   ✓ 验证所有服务正常运行
   ✓ 测试SSH登录（使用密钥认证）
   ✓ 测试数据库连接
   ✓ 检查应用功能

2. 24小时内:
   - 监控系统日志
   - 检查异常进程
   - 审查用户账户
   - 更新系统补丁

3. 1周内:
   - 全面安全扫描
   - 制定安全策略
   - 培训相关人员
   - 建立监控体系

==========================================
验证清单
==========================================

- [ ] 恶意进程已完全停止
- [ ] 恶意文件已完全删除
- [ ] 配置文件已清理
- [ ] 用户密码已修改
- [ ] SSH密钥已处理
- [ ] 防火墙已启用
- [ ] fail2ban已配置
- [ ] PostgreSQL已加固
- [ ] SSH已加固
- [ ] 所有服务正常运行

==========================================
联系信息
==========================================

系统管理员: [填写联系方式]
安全团队: [填写联系方式]
数据库管理员: [填写联系方式]

==========================================
报告结束
==========================================

生成时间: $(date)
EOF

echo "✓ 安全报告已生成: $REPORT_FILE"
cat "$REPORT_FILE"
```

### 阶段4: 后续监控（持续）

#### 步骤4.1: 设置每日监控
```bash
# 创建每日检查脚本
cat > /root/daily_security_check.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "每日安全检查 - $(date)"
echo "=========================================="

# 1. 检查恶意进程
echo ""
echo "1. 检查恶意进程:"
MALICIOUS_PROCS=$(ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep)
if [ -n "$MALICIOUS_PROCS" ]; then
    echo "✗ 发现恶意进程:"
    echo "$MALICIOUS_PROCS"
    # 发送告警（可以配置邮件或钉钉通知）
else
    echo "✓ 未发现恶意进程"
fi

# 2. 检查恶意文件
echo ""
echo "2. 检查恶意文件:"
if [ -d "/var/tmp/.sys" ] || [ -f "/tmp/init" ]; then
    echo "✗ 发现恶意文件"
    ls -la /var/tmp/.sys/ 2>/dev/null
    ls -la /tmp/init 2>/dev/null
else
    echo "✓ 未发现恶意文件"
fi

# 3. 检查网络连接
echo ""
echo "3. 检查恶意网络连接:"
MALICIOUS_CONNS=$(netstat -tunp 2>/dev/null | grep -E '141.95.110.188|5.255.115.190')
if [ -n "$MALICIOUS_CONNS" ]; then
    echo "✗ 发现恶意连接:"
    echo "$MALICIOUS_CONNS"
else
    echo "✓ 未发现恶意连接"
fi

# 4. 检查登录失败
echo ""
echo "4. 检查登录失败:"
FAILED_LOGINS=$(tail -100 /var/log/auth.log | grep "Failed password" | tail -10)
if [ -n "$FAILED_LOGINS" ]; then
    echo "✗ 发现登录失败:"
    echo "$FAILED_LOGINS"
else
    echo "✓ 无登录失败记录"
fi

# 5. 检查系统负载
echo ""
echo "5. 系统状态:"
echo "负载: $(uptime | awk -F'load average:' '{print $2}')"
echo "内存: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "磁盘: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"

# 6. 检查服务状态
echo ""
echo "6. 服务状态:"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "SSH: $(systemctl is-active sshd)"
echo "fail2ban: $(systemctl is-active fail2ban)"

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
EOF

chmod +x /root/daily_security_check.sh

# 添加到crontab
(crontab -l 2>/dev/null; echo "0 8 * * * /root/daily_security_check.sh >> /var/log/daily_security_check.log 2>&1") | crontab -

echo "✓ 每日安全检查已配置"
```

#### 步骤4.2: 设置告警通知
```bash
# 创建告警脚本
cat > /root/security_alert.sh << 'EOF'
#!/bin/bash

# 检查恶意进程
MALICIOUS_PROCS=$(ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep)

if [ -n "$MALICIOUS_PROCS" ]; then
    ALERT_MSG="安全告警: 发现恶意进程
时间: $(date)
服务器: $(hostname)
进程:
$MALICIOUS_PROCS"

    echo "$ALERT_MSG" >> /var/log/security_alerts.log
    
    # 可以在这里添加邮件或钉钉通知
    # echo "$ALERT_MSG" | mail -s "安全告警" admin@example.com
    
    echo "✓ 已发送安全告警"
fi
EOF

chmod +x /root/security_alert.sh

# 每10分钟检查一次
(crontab -l 2>/dev/null; echo "*/10 * * * * /root/security_alert.sh") | crontab -

echo "✓ 安全告警已配置"
```

## ✅ 执行后验证

### 立即验证（清理后）
```bash
# 1. 检查恶意进程
ps aux | grep -E 'bioset|netd|minerd|xmrig|/tmp/init' | grep -v grep || echo "✓ 无恶意进程"

# 2. 检查恶意文件
ls -la /var/tmp/.sys/ 2>/dev/null || echo "✓ 无恶意目录"
ls -la /tmp/init 2>/dev/null || echo "✓ 无恶意文件"

# 3. 检查配置
cat /home/postgres/.profile | grep -E 'bioset|netd' || echo "✓ 配置已清理"

# 4. 检查服务
systemctl status postgresql | grep "active"
systemctl status sshd | grep "active"
systemctl status fail2ban | grep "active"

# 5. 测试SSH登录
# 从另一台机器测试SSH登录（使用密钥认证）
```

### 24小时后验证
```bash
# 检查系统日志
tail -100 /var/log/auth.log | grep -i "error\|warning\|failed"

# 检查系统负载
uptime

# 检查磁盘使用
df -h

# 检查网络连接
netstat -tunp | grep ESTABLISHED | head -20
```

### 1周后验证
```bash
# 全面安全扫描
rkhunter --check

# 检查用户账户
cat /etc/passwd

# 检查SUID文件
find / -perm -4000 -type f 2>/dev/null

# 检查开放端口
nmap -sV localhost
```

## 📞 应急联系

### 执行过程中遇到问题
1. **系统无法启动**: 联系系统管理员
2. **服务无法启动**: 查看服务日志 `journalctl -u service_name`
3. **无法SSH登录**: 使用控制台登录
4. **数据丢失**: 从备份恢复

### 回滚方案
如果清理后出现问题，可以：
1. 从备份目录恢复配置文件
2. 恢复系统快照（如果支持）
3. 联系技术支持

## 📝 执行记录

### 执行人: ___________
### 执行时间: ___________
### 完成状态: ___________

### 验证清单
- [ ] 恶意进程已停止
- [ ] 恶意文件已删除
- [ ] 配置文件已清理
- [ ] 密码已修改
- [ ] SSH密钥已处理
- [ ] 防火墙已启用
- [ ] fail2ban已配置
- [ ] PostgreSQL已加固
- [ ] SSH已加固
- [ ] 监控已设置

### 备注
_____________________________________________
_____________________________________________
_____________________________________________

---

**文档版本**: 1.0  
**最后更新**: 2025年12月31日  
**维护者**: 系统安全团队
