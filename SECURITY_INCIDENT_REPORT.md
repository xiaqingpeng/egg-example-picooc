# 安全事件报告 - 恶意软件感染

## 事件概述

**发现时间**: 2025年12月31日  
**事件类型**: 恶意软件感染（加密货币挖矿程序 + 反向代理）  
**受影响服务器**: 120.48.95.51  
**受影响用户**: postgres (UID: 1001)  
**严重等级**: 🔴 高危

## 恶意程序详情

### 1. XMRig 挖矿程序
- **位置**: `/var/tmp/.sys/.bioset` (7,047,392 字节)
- **类型**: 64位ELF静态链接可执行文件
- **配置文件**: `/var/tmp/.sys/.netd.toml`
  - 挖矿服务器: 141.95.110.188:7000
  - 认证令牌: 已配置
  - 代理设置: TCP代理

### 2. 反向代理程序
- **位置**: `/var/tmp/.sys/.netd` (空文件，实际为配置)
- **配置**: `.netd.toml` 包含服务器地址和认证信息

### 3. 持久化机制
- **启动位置**: `/home/postgres/.profile`
- **启动命令**:
  ```bash
  nohup /var/tmp/.sys/.netd > /dev/null 2>&1 &
  nohup /var/tmp/.sys/.bioset > /dev/null 2>&1 &
  ```

## 网络连接分析

### 已发现的恶意连接
1. **挖矿服务器**: 141.95.110.188:7000
2. **C2服务器**: 5.255.115.190:48996 (荷兰)
3. **本地监听端口**: 60125 (init进程)

### 攻击者IP地址
- 46.101.179.170 (多次尝试暴力破解postgres账户)
- 130.12.181.24 (SSH登录尝试)
- 120.211.134.177 (SSH连接尝试)

## 入侵路径分析

### 可能的入侵方式
1. **暴力破解SSH**: 日志显示大量来自46.101.179.170的失败登录尝试
2. **弱密码**: PostgreSQL默认密码可能被泄露
3. **SSH密钥**: 发现可疑的SSH公钥 `pg2026-deployer`

### 系统漏洞
- PostgreSQL配置允许本地无密码连接 (`pg_hba.conf` 设置为 `trust`)
- postgres用户shell为`/bin/sh`，限制了某些安全检查

## 影响评估

### 系统资源占用
- CPU: 挖矿程序可能占用大量CPU资源
- 内存: 7MB的恶意程序 + 网络连接开销
- 网络: 持续的外部连接和数据传输

### 数据安全风险
- postgres账户可能被完全控制
- 数据库权限配置混乱
- 可能存在数据泄露风险

## 立即执行的清理步骤

### 步骤1: 停止恶意进程
```bash
# 以root身份执行
pkill -f '.netd'
pkill -f 'bioset'
pkill -f '/tmp/init'
kill -9 2119225 2119230 2119231  # 杀死可疑的init进程
```

### 步骤2: 删除恶意文件
```bash
# 删除恶意程序目录
rm -rf /var/tmp/.sys/

# 删除临时文件
rm -f /tmp/init
rm -f /var/tmp/.netd
rm -f /var/tmp/.bioset
```

### 步骤3: 清理启动配置
```bash
# 恢复干净的.profile
cp /home/postgres/.profile.bak /home/postgres/.profile
chown postgres:postgres /home/postgres/.profile
chmod 644 /home/postgres/.profile

# 或者手动编辑，删除以下行：
# nohup /var/tmp/.sys/.netd > /dev/null 2>&1 &
# nohup /var/tmp/.sys/.bioset > /dev/null 2>&1 &
```

### 步骤4: 备份并删除SSH密钥
```bash
# 备份现有密钥
mkdir -p /root/security_backup
cp /home/postgres/.ssh/authorized_keys /root/security_backup/authorized_keys.bak

# 删除可疑密钥
rm -f /home/postgres/.ssh/authorized_keys

# 重新生成密钥对（可选）
su - postgres -c "ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ''"
```

### 步骤5: 修改用户密码
```bash
# 修改postgres用户密码（使用强密码）
passwd postgres

# 修改root密码
passwd root
```

### 步骤6: 检查数据库权限
```bash
# 检查数据库用户权限
su - postgres -c "psql -c '\du'"

# 检查数据库连接权限
cat /etc/postgresql/16/main/pg_hba.conf

# 修复pg_hba.conf，将trust改为md5或scram-sha-256
```

## 长期安全加固措施

### 1. SSH安全配置
```bash
# 编辑SSH配置
vi /etc/ssh/sshd_config

# 修改以下配置：
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# 重启SSH服务
systemctl restart sshd
```

### 2. 防火墙配置
```bash
# 安装并配置ufw
apt-get install ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow from YOUR_IP to any port 22
ufw allow from YOUR_IP to any port 5432
ufw enable
```

### 3. 安装fail2ban
```bash
apt-get install fail2ban

# 配置fail2ban
vi /etc/fail2ban/jail.local

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

systemctl enable fail2ban
systemctl start fail2ban
```

### 4. 系统监控
```bash
# 安装监控工具
apt-get install htop iotop nethogs

# 定期检查可疑进程
alias check-malicious='ps aux | grep -E "bioset|netd|init" | grep -v grep'

# 检查网络连接
alias check-connections='netstat -tunp | grep ESTABLISHED'
```

### 5. 日志审计
```bash
# 定期检查认证日志
tail -f /var/log/auth.log

# 检查系统日志
journalctl -f

# 设置日志轮转
vi /etc/logrotate.conf
```

## 恢复验证清单

- [ ] 恶意进程已完全停止
- [ ] 恶意文件已完全删除
- [ ] .profile已清理干净
- [ ] SSH密钥已重新生成
- [ ] 用户密码已修改为强密码
- [ ] PostgreSQL配置已加固
- [ ] 防火墙已启用并配置
- [ ] fail2ban已安装并运行
- [ ] 系统监控已设置
- [ ] 数据库权限已修复
- [ ] 备份已验证完整

## 后续监控建议

### 每日检查
```bash
# 检查可疑进程
ps aux | grep -E "bioset|netd|minerd|xmrig" | grep -v grep

# 检查网络连接
netstat -tunp | grep ESTABLISHED | grep -v "127.0.0.1"

# 检查CPU使用率
top -bn1 | head -20

# 检查认证日志
tail -50 /var/log/auth.log | grep -i "failed"
```

### 每周检查
```bash
# 检查系统更新
apt-get update && apt-get upgrade -y

# 检查磁盘使用
df -h

# 检查系统日志
journalctl --since "7 days ago" | grep -i "error\|warning"
```

### 每月检查
```bash
# 全面系统扫描
rkhunter --check
chkrootkit

# 检查用户账户
cat /etc/passwd

# 检查SUID文件
find / -perm -4000 -type f 2>/dev/null
```

## 联系信息

如需进一步协助，请联系系统管理员或安全团队。

## 附录

### A. 恶意程序特征
- 文件大小: 7,047,392 字节
- 文件类型: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked
- 启动方式: 通过用户profile文件
- 网络行为: 连接外部挖矿服务器

### B. IOC (Indicators of Compromise)
- IP地址: 141.95.110.188, 5.255.115.190, 46.101.179.170
- 文件路径: /var/tmp/.sys/, /tmp/init
- 进程名: .netd, .bioset, init
- SSH密钥: AAAAC3NzaC1lZDI1NTE5AAAAIKkZVhE4trQB9vSOUrcE66Dfj0MugGOiJguHDbYUxfso

### C. 参考资源
- XMRig官方文档: https://xmrig.com/docs
- Ubuntu安全指南: https://ubuntu.com/server/docs/security
- PostgreSQL安全配置: https://www.postgresql.org/docs/current/security.html

---

**报告生成时间**: 2025年12月31日  
**报告生成者**: 安全分析系统  
**版本**: 1.0
