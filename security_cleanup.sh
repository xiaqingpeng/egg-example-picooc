#!/bin/bash

# 安全清理脚本
# 用途: 清理恶意软件并加固系统安全
# 使用方法: sudo bash security_cleanup.sh

set -e

echo "=========================================="
echo "    安全清理和系统加固脚本"
echo "=========================================="
echo "开始时间: $(date)"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否以root身份运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误: 请使用root权限运行此脚本${NC}"
    echo "使用方法: sudo bash $0"
    exit 1
fi

# 创建备份目录
BACKUP_DIR="/root/security_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}[✓]${NC} 备份目录创建: $BACKUP_DIR"

# 步骤1: 停止恶意进程
echo ""
echo "=========================================="
echo "步骤 1/9: 停止恶意进程"
echo "=========================================="

MALICIOUS_PROCESSES=(".netd" "bioset" "/tmp/init" "minerd" "xmrig")
KILLED_COUNT=0

for proc in "${MALICIOUS_PROCESSES[@]}"; do
    if pgrep -f "$proc" > /dev/null; then
        echo -e "${YELLOW}[!]${NC} 发现恶意进程: $proc"
        pkill -f "$proc" 2>/dev/null || true
        sleep 2
        # 强制杀死
        pkill -9 -f "$proc" 2>/dev/null || true
        ((KILLED_COUNT++))
        echo -e "${GREEN}[✓]${NC} 已停止进程: $proc"
    fi
done

if [ $KILLED_COUNT -eq 0 ]; then
    echo -e "${GREEN}[✓]${NC} 未发现运行中的恶意进程"
else
    echo -e "${GREEN}[✓]${NC} 共停止 $KILLED_COUNT 个恶意进程"
fi

# 步骤2: 删除恶意文件
echo ""
echo "=========================================="
echo "步骤 2/9: 删除恶意文件"
echo "=========================================="

MALICIOUS_FILES=(
    "/var/tmp/.sys"
    "/tmp/init"
    "/var/tmp/.netd"
    "/var/tmp/.bioset"
)

for file in "${MALICIOUS_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "${YELLOW}[!]${NC} 发现恶意文件: $file"
        # 备份文件
        if [ -f "$file" ]; then
            cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        elif [ -d "$file" ]; then
            cp -r "$file" "$BACKUP_DIR/" 2>/dev/null || true
        fi
        # 删除文件
        rm -rf "$file"
        echo -e "${GREEN}[✓]${NC} 已删除: $file"
    fi
done

echo -e "${GREEN}[✓]${NC} 恶意文件清理完成"

# 步骤3: 清理 .profile
echo ""
echo "=========================================="
echo "步骤 3/9: 清理用户配置文件"
echo "=========================================="

if [ -f "/home/postgres/.profile" ]; then
    echo -e "${YELLOW}[!]${NC} 备份原始 .profile"
    cp /home/postgres/.profile "$BACKUP_DIR/profile.original"
    
    if [ -f "/home/postgres/.profile.bak" ]; then
        echo -e "${GREEN}[✓]${NC} 恢复 .profile.bak"
        cp /home/postgres/.profile.bak /home/postgres/.profile
    else
        echo -e "${YELLOW}[!]${NC} 手动清理 .profile"
        # 删除恶意启动命令
        sed -i '/nohup \/var\/tmp\/\.sys\/\.netd/d' /home/postgres/.profile
        sed -i '/nohup \/var\/tmp\/\.sys\/\.bioset/d' /home/postgres/.profile
    fi
    
    chown postgres:postgres /home/postgres/.profile
    chmod 644 /home/postgres/.profile
    echo -e "${GREEN}[✓]${NC} .profile 已清理"
fi

# 步骤4: 处理SSH密钥
echo ""
echo "=========================================="
echo "步骤 4/9: 处理SSH密钥"
echo "=========================================="

if [ -f "/home/postgres/.ssh/authorized_keys" ]; then
    echo -e "${YELLOW}[!]${NC} 备份SSH密钥"
    cp /home/postgres/.ssh/authorized_keys "$BACKUP_DIR/authorized_keys.bak"
    
    echo -e "${YELLOW}[!]${NC} 检查可疑SSH密钥"
    if grep -q "pg2026-deployer" /home/postgres/.ssh/authorized_keys; then
        echo -e "${RED}[!]${NC} 发现可疑SSH密钥: pg2026-deployer"
        read -p "是否删除可疑SSH密钥? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f /home/postgres/.ssh/authorized_keys
            echo -e "${GREEN}[✓]${NC} 可疑SSH密钥已删除"
        fi
    else
        echo -e "${GREEN}[✓]${NC} 未发现可疑SSH密钥"
    fi
fi

# 步骤5: 修改用户密码
echo ""
echo "=========================================="
echo "步骤 5/9: 修改用户密码"
echo "=========================================="

echo -e "${YELLOW}[!]${NC} 建议修改以下用户密码:"
echo "  - postgres"
echo "  - root"
echo ""
read -p "是否现在修改postgres用户密码? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    passwd postgres
else
    echo -e "${YELLOW}[!]${NC} 请稍后手动执行: passwd postgres"
fi

read -p "是否现在修改root用户密码? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    passwd root
else
    echo -e "${YELLOW}[!]${NC} 请稍后手动执行: passwd root"
fi

# 步骤6: 检查并修复数据库配置
echo ""
echo "=========================================="
echo "步骤 6/9: 检查PostgreSQL配置"
echo "=========================================="

if [ -f "/etc/postgresql/16/main/pg_hba.conf" ]; then
    echo -e "${YELLOW}[!]${NC} 备份pg_hba.conf"
    cp /etc/postgresql/16/main/pg_hba.conf "$BACKUP_DIR/pg_hba.conf.bak"
    
    echo -e "${YELLOW}[!]${NC} 检查pg_hba.conf中的trust配置"
    if grep -q "trust" /etc/postgresql/16/main/pg_hba.conf; then
        echo -e "${RED}[!]${NC} 发现trust配置，建议修改为md5或scram-sha-256"
        read -p "是否自动修复pg_hba.conf? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i 's/trust/md5/g' /etc/postgresql/16/main/pg_hba.conf
            echo -e "${GREEN}[✓]${NC} pg_hba.conf已更新"
            echo -e "${YELLOW}[!]${NC} 需要重启PostgreSQL服务"
            systemctl restart postgresql
        fi
    else
        echo -e "${GREEN}[✓]${NC} pg_hba.conf配置安全"
    fi
fi

# 步骤7: 安装并配置防火墙
echo ""
echo "=========================================="
echo "步骤 7/9: 配置防火墙"
echo "=========================================="

if command -v ufw &> /dev/null; then
    echo -e "${GREEN}[✓]${NC} ufw已安装"
else
    echo -e "${YELLOW}[!]${NC} 安装ufw防火墙"
    apt-get update -qq
    apt-get install -y ufw
fi

echo -e "${YELLOW}[!]${NC} 配置防火墙规则"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 5432/tcp  # PostgreSQL

echo -e "${GREEN}[✓]${NC} 防火墙已启用"
ufw status numbered

# 步骤8: 安装fail2ban
echo ""
echo "=========================================="
echo "步骤 8/9: 安装fail2ban"
echo "=========================================="

if command -v fail2ban-client &> /dev/null; then
    echo -e "${GREEN}[✓]${NC} fail2ban已安装"
else
    echo -e "${YELLOW}[!]${NC} 安装fail2ban"
    apt-get update -qq
    apt-get install -y fail2ban
fi

# 配置fail2ban
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

systemctl enable fail2ban
systemctl restart fail2ban
echo -e "${GREEN}[✓]${NC} fail2ban已配置并启动"

# 步骤9: 生成安全报告
echo ""
echo "=========================================="
echo "步骤 9/9: 生成安全报告"
echo "=========================================="

REPORT_FILE="/root/security_report_$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
==========================================
        安全事件清理报告
==========================================

清理时间: $(date)
服务器主机名: $(hostname)
服务器IP: $(hostname -I | awk '{print $1}')
备份目录: $BACKUP_DIR

==========================================
清理操作摘要
==========================================

1. 恶意进程清理
   - 已停止恶意进程数量: $KILLED_COUNT
   - 清理的进程: ${MALICIOUS_PROCESSES[*]}

2. 恶意文件删除
   - 已删除恶意文件: ${MALICIOUS_FILES[*]}

3. 用户配置清理
   - 已清理: /home/postgres/.profile
   - 已恢复: /home/postgres/.profile.bak

4. SSH密钥处理
   - 已备份: /home/postgres/.ssh/authorized_keys
   - 状态: 已检查可疑密钥

5. 密码修改
   - postgres用户: 已提示修改
   - root用户: 已提示修改

6. PostgreSQL配置
   - pg_hba.conf: 已检查并修复
   - 服务状态: $(systemctl is-active postgresql)

7. 防火墙配置
   - ufw状态: $(ufw status | head -1)
   - 已启用规则: SSH, PostgreSQL

8. 入侵防护
   - fail2ban状态: $(systemctl is-active fail2ban)

==========================================
系统状态
==========================================

当前用户: $(whoami)
系统负载: $(uptime | awk -F'load average:' '{print $2}')
内存使用: $(free -h | grep Mem | awk '{print $3 "/" $2}')
磁盘使用: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')

运行中的服务:
$(systemctl list-units --type=service --state=running | grep -E "ssh|postgres|fail2ban|ufw" | awk '{print "  - " $1 ": " $3}')

网络连接:
$(netstat -tunp 2>/dev/null | grep ESTABLISHED | head -10 | awk '{print "  - " $5 " -> " $6}')

==========================================
后续建议
==========================================

1. 立即执行:
   - 修改所有用户密码为强密码
   - 重新生成SSH密钥对
   - 检查数据库权限配置

2. 短期执行(1周内):
   - 全面检查系统日志
   - 审查所有用户账户
   - 更新系统补丁
   - 配置日志监控告警

3. 长期执行(1个月内):
   - 定期安全扫描
   - 建立安全基线
   - 制定应急响应计划
   - 进行安全培训

==========================================
监控命令
==========================================

每日检查:
  ps aux | grep -E "bioset|netd|minerd|xmrig" | grep -v grep
  netstat -tunp | grep ESTABLISHED | grep -v "127.0.0.1"
  tail -50 /var/log/auth.log | grep -i "failed"

每周检查:
  apt-get update && apt-get upgrade -y
  df -h
  journalctl --since "7 days ago" | grep -i "error|warning"

每月检查:
  rkhunter --check
  find / -perm -4000 -type f 2>/dev/null

==========================================
联系方式
==========================================

如需进一步协助，请联系系统管理员或安全团队。

==========================================
报告结束
==========================================

生成时间: $(date)
EOF

echo -e "${GREEN}[✓]${NC} 安全报告已生成: $REPORT_FILE"

# 最终总结
echo ""
echo "=========================================="
echo "清理完成"
echo "=========================================="
echo -e "${GREEN}[✓]${NC} 所有清理步骤已完成"
echo ""
echo "备份目录: $BACKUP_DIR"
echo "安全报告: $REPORT_FILE"
echo ""
echo -e "${YELLOW}[!]${NC} 重要提醒:"
echo "  1. 请立即修改所有用户密码"
echo "  2. 请检查并重新生成SSH密钥"
echo "  3. 请验证数据库配置和权限"
echo "  4. 请定期检查系统日志和进程"
echo ""
echo "结束时间: $(date)"
echo "=========================================="
