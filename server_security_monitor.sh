#!/bin/bash

# ============================================
# 服务器安全监控脚本
# 版本: 1.0
# 最后更新: 2025-12-31
# ============================================

# 配置
LOG_FILE="/var/log/server_security_monitor.log"
ALERT_FILE="/var/log/security_alerts.log"
MAX_LOG_SIZE=10485760  # 10MB
ALERT_EMAIL=""  # 设置告警邮箱，如: admin@example.com

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 告警函数
alert() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] 安全告警: $1"
    echo -e "${RED}$message${NC}" | tee -a "$ALERT_FILE"
    
    # 如果配置了邮箱，发送邮件
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "服务器安全告警" "$ALERT_EMAIL"
    fi
}

# 成功函数
success() {
    echo -e "${GREEN}✓ $1${NC}"
    log "成功: $1"
}

# 警告函数
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    log "警告: $1"
}

# 错误函数
error() {
    echo -e "${RED}✗ $1${NC}"
    log "错误: $1"
}

# 检查日志文件大小
check_log_size() {
    if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        log "日志文件已轮转"
    fi
}

# 检查恶意进程
check_malicious_processes() {
    echo ""
    echo "=========================================="
    echo "1. 检查恶意进程"
    echo "=========================================="
    
    local malicious_patterns="bioset|\.netd|minerd|xmrig|/tmp/init|stratum+tcp"
    local found_procs=$(ps aux | grep -E "$malicious_patterns" | grep -v grep)
    
    if [ -n "$found_procs" ]; then
        error "发现恶意进程:"
        echo "$found_procs"
        alert "发现恶意进程: $found_procs"
        return 1
    else
        success "未发现恶意进程"
        return 0
    fi
}

# 检查恶意文件
check_malicious_files() {
    echo ""
    echo "=========================================="
    echo "2. 检查恶意文件"
    echo "=========================================="
    
    local found_files=0
    
    # 检查已知恶意目录和文件
    if [ -d "/var/tmp/.sys" ]; then
        error "发现恶意目录: /var/tmp/.sys"
        ls -la /var/tmp/.sys/
        alert "发现恶意目录: /var/tmp/.sys"
        found_files=1
    fi
    
    if [ -f "/tmp/init" ]; then
        error "发现恶意文件: /tmp/init"
        ls -la /tmp/init
        alert "发现恶意文件: /tmp/init"
        found_files=1
    fi
    
    if [ -f "/var/tmp/.netd" ]; then
        error "发现恶意文件: /var/tmp/.netd"
        ls -la /var/tmp/.netd
        alert "发现恶意文件: /var/tmp/.netd"
        found_files=1
    fi
    
    if [ -f "/var/tmp/.bioset" ]; then
        error "发现恶意文件: /var/tmp/.bioset"
        ls -la /var/tmp/.bioset
        alert "发现恶意文件: /var/tmp/.bioset"
        found_files=1
    fi
    
    if [ $found_files -eq 0 ]; then
        success "未发现恶意文件"
        return 0
    else
        return 1
    fi
}

# 检查配置文件
check_config_files() {
    echo ""
    echo "=========================================="
    echo "3. 检查配置文件"
    echo "=========================================="
    
    local found_issues=0
    
    # 检查postgres用户的.profile
    if [ -f "/home/postgres/.profile" ]; then
        local malicious_config=$(grep -E 'bioset|netd|\.sys' /home/postgres/.profile)
        if [ -n "$malicious_config" ]; then
            error "postgres/.profile 包含恶意配置:"
            echo "$malicious_config"
            alert "postgres/.profile 包含恶意配置"
            found_issues=1
        fi
    fi
    
    # 检查其他用户的配置文件
    for user_home in /home/* /root; do
        if [ -d "$user_home" ]; then
            for config_file in "$user_home/.bashrc" "$user_home/.bash_profile" "$user_home/.profile"; do
                if [ -f "$config_file" ]; then
                    local malicious_config=$(grep -E 'bioset|netd|\.sys' "$config_file")
                    if [ -n "$malicious_config" ]; then
                        error "$config_file 包含恶意配置:"
                        echo "$malicious_config"
                        alert "$config_file 包含恶意配置"
                        found_issues=1
                    fi
                fi
            done
        fi
    done
    
    if [ $found_issues -eq 0 ]; then
        success "配置文件检查通过"
        return 0
    else
        return 1
    fi
}

# 检查网络连接
check_network_connections() {
    echo ""
    echo "=========================================="
    echo "4. 检查网络连接"
    echo "=========================================="
    
    local found_malicious=0
    
    # 检查已知的恶意IP
    local malicious_ips="141.95.110.188|5.255.115.190"
    local malicious_conns=$(netstat -tunp 2>/dev/null | grep -E "$malicious_ips")
    
    if [ -n "$malicious_conns" ]; then
        error "发现恶意网络连接:"
        echo "$malicious_conns"
        alert "发现恶意网络连接: $malicious_conns"
        found_malicious=1
    fi
    
    # 检查可疑的挖矿连接
    local mining_conns=$(netstat -tunp 2>/dev/null | grep -E 'stratum+tcp|:3333|:14444')
    if [ -n "$mining_conns" ]; then
        error "发现可疑挖矿连接:"
        echo "$mining_conns"
        alert "发现可疑挖矿连接: $mining_conns"
        found_malicious=1
    fi
    
    # 显示当前连接数
    local total_conns=$(netstat -tunp 2>/dev/null | grep ESTABLISHED | wc -l)
    echo "当前活跃连接数: $total_conns"
    
    if [ $found_malicious -eq 0 ]; then
        success "未发现恶意网络连接"
        return 0
    else
        return 1
    fi
}

# 检查系统负载
check_system_load() {
    echo ""
    echo "=========================================="
    echo "5. 检查系统负载"
    echo "=========================================="
    
    local load=$(uptime | awk -F'load average:' '{print $2}')
    local load1=$(echo $load | awk '{print $1}' | sed 's/,//')
    local load5=$(echo $load | awk '{print $2}' | sed 's/,//')
    local load15=$(echo $load | awk '{print $3}')
    
    # 获取CPU核心数
    local cpu_cores=$(nproc)
    local warning_threshold=$(echo "$cpu_cores * 0.8" | bc)
    local critical_threshold=$(echo "$cpu_cores * 1.5" | bc)
    
    echo "系统负载: $load"
    echo "CPU核心数: $cpu_cores"
    echo "警告阈值: $warning_threshold"
    echo "严重阈值: $critical_threshold"
    
    # 比较负载（使用awk进行浮点数比较）
    local is_critical=$(echo "$load1 > $critical_threshold" | bc)
    local is_warning=$(echo "$load1 > $warning_threshold" | bc)
    
    if [ "$is_critical" = "1" ]; then
        error "系统负载过高!"
        alert "系统负载过高: $load"
        return 1
    elif [ "$is_warning" = "1" ]; then
        warning "系统负载较高"
        return 0
    else
        success "系统负载正常"
        return 0
    fi
}

# 检查内存使用
check_memory_usage() {
    echo ""
    echo "=========================================="
    echo "6. 检查内存使用"
    echo "=========================================="
    
    local mem_info=$(free -h | grep Mem)
    local total=$(echo $mem_info | awk '{print $2}')
    local used=$(echo $mem_info | awk '{print $3}')
    local percent=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    
    echo "内存使用: $used / $total ($percent%)"
    
    local is_critical=$(echo "$percent > 90" | bc)
    local is_warning=$(echo "$percent > 80" | bc)
    
    if [ "$is_critical" = "1" ]; then
        error "内存使用率过高!"
        alert "内存使用率过高: $percent%"
        return 1
    elif [ "$is_warning" = "1" ]; then
        warning "内存使用率较高"
        return 0
    else
        success "内存使用正常"
        return 0
    fi
}

# 检查磁盘使用
check_disk_usage() {
    echo ""
    echo "=========================================="
    echo "7. 检查磁盘使用"
    echo "=========================================="
    
    local disk_info=$(df -h / | tail -1)
    local total=$(echo $disk_info | awk '{print $2}')
    local used=$(echo $disk_info | awk '{print $3}')
    local percent=$(echo $disk_info | awk '{print $5}' | sed 's/%//')
    
    echo "磁盘使用: $used / $total ($percent%)"
    
    if [ "$percent" -gt 90 ]; then
        error "磁盘使用率过高!"
        alert "磁盘使用率过高: $percent%"
        return 1
    elif [ "$percent" -gt 80 ]; then
        warning "磁盘使用率较高"
        return 0
    else
        success "磁盘使用正常"
        return 0
    fi
}

# 检查服务状态
check_services() {
    echo ""
    echo "=========================================="
    echo "8. 检查服务状态"
    echo "=========================================="
    
    local services=("postgresql" "sshd" "fail2ban")
    local all_ok=1
    
    for service in "${services[@]}"; do
        local status=$(systemctl is-active "$service" 2>/dev/null)
        if [ "$status" = "active" ]; then
            success "$service: 运行中"
        else
            error "$service: 未运行 (状态: $status)"
            alert "$service 服务未运行"
            all_ok=0
        fi
    done
    
    # 检查PM2
    if command -v pm2 &> /dev/null; then
        local pm2_status=$(pm2 list 2>/dev/null | grep -E "online|stopped" | head -5)
        if [ -n "$pm2_status" ]; then
            echo ""
            echo "PM2进程状态:"
            echo "$pm2_status"
        fi
    fi
    
    if [ $all_ok -eq 1 ]; then
        return 0
    else
        return 1
    fi
}

# 检查登录失败
check_failed_logins() {
    echo ""
    echo "=========================================="
    echo "9. 检查登录失败"
    echo "=========================================="
    
    local failed_logins=$(tail -100 /var/log/auth.log 2>/dev/null | grep "Failed password" | tail -10)
    
    if [ -n "$failed_logins" ]; then
        warning "最近的登录失败记录:"
        echo "$failed_logins"
        
        # 统计失败次数
        local failed_count=$(tail -100 /var/log/auth.log 2>/dev/null | grep "Failed password" | wc -l)
        echo "最近100条日志中失败登录次数: $failed_count"
        
        if [ $failed_count -gt 10 ]; then
            alert "频繁的登录失败尝试: $failed_count 次"
            return 1
        fi
    else
        success "无登录失败记录"
    fi
    
    return 0
}

# 检查防火墙状态
check_firewall() {
    echo ""
    echo "=========================================="
    echo "10. 检查防火墙状态"
    echo "=========================================="
    
    if command -v ufw &> /dev/null; then
        local ufw_status=$(ufw status | head -1)
        echo "UFW状态: $ufw_status"
        
        if echo "$ufw_status" | grep -q "active"; then
            success "防火墙已启用"
            return 0
        else
            error "防火墙未启用"
            alert "防火墙未启用"
            return 1
        fi
    else
        warning "UFW未安装"
        return 0
    fi
}

# 检查fail2ban状态
check_fail2ban() {
    echo ""
    echo "=========================================="
    echo "11. 检查fail2ban状态"
    echo "=========================================="
    
    if command -v fail2ban-client &> /dev/null; then
        local f2b_status=$(systemctl is-active fail2ban)
        if [ "$f2b_status" = "active" ]; then
            success "fail2ban运行中"
            
            # 显示被封禁的IP
            echo ""
            echo "被封禁的IP:"
            fail2ban-client status sshd 2>/dev/null | grep "Banned IP" || echo "无被封禁的IP"
            
            return 0
        else
            error "fail2ban未运行"
            alert "fail2ban未运行"
            return 1
        fi
    else
        warning "fail2ban未安装"
        return 0
    fi
}

# 检查SSH配置
check_ssh_config() {
    echo ""
    echo "=========================================="
    echo "12. 检查SSH配置"
    echo "=========================================="
    
    local sshd_config="/etc/ssh/sshd_config"
    
    if [ -f "$sshd_config" ]; then
        # 检查Root登录
        local root_login=$(grep "^PermitRootLogin" "$sshd_config" | awk '{print $2}')
        echo "Root登录: $root_login"
        
        # 检查密码认证
        local password_auth=$(grep "^PasswordAuthentication" "$sshd_config" | awk '{print $2}')
        echo "密码认证: $password_auth"
        
        # 检查端口
        local port=$(grep "^Port" "$sshd_config" | awk '{print $2}')
        echo "SSH端口: ${port:-22}"
        
        if [ "$root_login" = "no" ] && [ "$password_auth" = "no" ]; then
            success "SSH配置安全"
            return 0
        else
            warning "SSH配置可能不够安全"
            return 0
        fi
    else
        error "SSH配置文件不存在"
        return 1
    fi
}

# 检查PostgreSQL配置
check_postgres_config() {
    echo ""
    echo "=========================================="
    echo "13. 检查PostgreSQL配置"
    echo "=========================================="
    
    local pg_hba="/etc/postgresql/16/main/pg_hba.conf"
    
    if [ -f "$pg_hba" ]; then
        # 检查trust认证
        local trust_count=$(grep -c "trust" "$pg_hba")
        echo "trust认证配置数: $trust_count"
        
        if [ $trust_count -gt 0 ]; then
            error "PostgreSQL使用trust认证，存在安全风险"
            alert "PostgreSQL使用trust认证"
            return 1
        else
            success "PostgreSQL配置安全"
            return 0
        fi
    else
        warning "PostgreSQL配置文件不存在或路径不同"
        return 0
    fi
}

# 生成摘要报告
generate_summary() {
    echo ""
    echo "=========================================="
    echo "监控摘要"
    echo "=========================================="
    
    echo "检查时间: $(date)"
    echo "服务器: $(hostname)"
    echo "IP地址: $(hostname -I | awk '{print $1}')"
    echo ""
    
    echo "系统信息:"
    echo "  操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "  内核版本: $(uname -r)"
    echo "  运行时间: $(uptime -p)"
    echo ""
    
    echo "资源使用:"
    echo "  负载: $(uptime | awk -F'load average:' '{print $2}')"
    echo "  内存: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
    echo "  磁盘: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
    echo ""
    
    echo "服务状态:"
    echo "  PostgreSQL: $(systemctl is-active postgresql)"
    echo "  SSH: $(systemctl is-active sshd)"
    echo "  fail2ban: $(systemctl is-active fail2ban)"
    echo "  防火墙: $(ufw status | head -1)"
    
    echo ""
    echo "=========================================="
    echo "监控完成"
    echo "=========================================="
}

# 主函数
main() {
    check_log_size
    
    echo "=========================================="
    echo "服务器安全监控"
    echo "=========================================="
    echo "开始时间: $(date)"
    echo ""
    
    local total_checks=0
    local failed_checks=0
    
    # 执行所有检查
    check_malicious_processes || ((failed_checks++))
    ((total_checks++))
    
    check_malicious_files || ((failed_checks++))
    ((total_checks++))
    
    check_config_files || ((failed_checks++))
    ((total_checks++))
    
    check_network_connections || ((failed_checks++))
    ((total_checks++))
    
    check_system_load || ((failed_checks++))
    ((total_checks++))
    
    check_memory_usage || ((failed_checks++))
    ((total_checks++))
    
    check_disk_usage || ((failed_checks++))
    ((total_checks++))
    
    check_services || ((failed_checks++))
    ((total_checks++))
    
    check_failed_logins || ((failed_checks++))
    ((total_checks++))
    
    check_firewall || ((failed_checks++))
    ((total_checks++))
    
    check_fail2ban || ((failed_checks++))
    ((total_checks++))
    
    check_ssh_config || ((failed_checks++))
    ((total_checks++))
    
    check_postgres_config || ((failed_checks++))
    ((total_checks++))
    
    # 生成摘要
    generate_summary
    
    echo ""
    echo "检查结果: $((total_checks - failed_checks))/$total_checks 通过"
    
    if [ $failed_checks -gt 0 ]; then
        error "发现 $failed_checks 个问题，请查看日志: $LOG_FILE"
        return 1
    else
        success "所有检查通过"
        return 0
    fi
}

# 执行主函数
main "$@"
