#!/bin/bash

# 检测操作系统类型
OS_TYPE=$(uname -s)

# 获取CPU使用率
if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS
    cpu_usage=$(top -l 1 | grep "CPU usage" | awk -F'[^0-9.]+' '{print $2}')
else
    # Linux
    cpu_usage=$(top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - $1}')
fi

# 获取内存使用情况
if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS (单位：MB)
    mem_total=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024)}')
    # 解析PhysMem行，提取已用内存并转换为MB
    physmem=$(top -l 1 | grep "PhysMem")
    used_mem=$(echo $physmem | awk '{print $2}' | sed 's/G//')
    # 如果是GB，转换为MB
    if [[ $physmem == *"G used"* ]]; then
        mem_used=$(echo "$used_mem * 1024" | bc -l | awk '{print int($1)}')
    else
        mem_used=$(echo $used_mem | sed 's/M//')
    fi
else
    # Linux (单位：MB)
    mem_total=$(free -m | grep Mem | awk '{print $2}')
    mem_used=$(free -m | grep Mem | awk '{print $3}')
fi
mem_usage=$(echo "scale=2; $mem_used / $mem_total * 100" | bc -l 2>/dev/null || awk "BEGIN {printf \"%.2f\", $mem_used / $mem_total * 100}")

# 获取磁盘使用情况（根目录）
if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS (单位：GB)
    disk_total=$(df -g / | tail -1 | awk '{print $2}')
    disk_used=$(df -g / | tail -1 | awk '{print $3}')
else
    # Linux (单位：GB)
    disk_total=$(df -BG / | grep / | awk '{print $2}' | sed 's/G//')
    disk_used=$(df -BG / | grep / | awk '{print $3}' | sed 's/G//')
fi
disk_usage=$(echo "scale=2; $disk_used / $disk_total * 100" | bc 2>/dev/null || awk "BEGIN {printf \"%.2f\", $disk_used / $disk_total * 100}")

# 获取系统负载
if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS
    load_info=$(uptime | awk -F'load averages:' '{print $2}')
    load_1=$(echo $load_info | awk '{print $1}' | sed 's/,//')
    load_5=$(echo $load_info | awk '{print $2}' | sed 's/,//')
    load_15=$(echo $load_info | awk '{print $3}')
else
    # Linux
    load_1=$(cat /proc/loadavg | awk '{print $1}')
    load_5=$(cat /proc/loadavg | awk '{print $2}')
    load_15=$(cat /proc/loadavg | awk '{print $3}')
fi

# 获取服务器运行时间（天数）
uptime_str=$(uptime)

# 解析运行时间
days=0
hours=0
minutes=0

if echo "$uptime_str" | grep -q "days"; then
    # 包含days的格式
    days=$(echo "$uptime_str" | awk '{print $3}')
    time_part=$(echo "$uptime_str" | awk '{print $5}' | sed 's/,//')
    hours=$(echo $time_part | cut -d: -f1)
    minutes=$(echo $time_part | cut -d: -f2)
else
    # 不包含days的格式
    time_part=$(echo "$uptime_str" | awk '{print $3}' | sed 's/,//')
    hours=$(echo $time_part | cut -d: -f1)
    minutes=$(echo $time_part | cut -d: -f2)
fi

# 计算总小时数（包括分钟）
total_hours=$(echo "$hours + $minutes / 60" | bc -l 2>/dev/null || awk "BEGIN {print $hours + $minutes / 60}")

# 计算总天数（包括小时转换为小数天数）
total_days=$(echo "$days + $total_hours / 24" | bc -l 2>/dev/null || awk "BEGIN {printf \"%.2f\", $days + $total_hours / 24}")

# 将总天数限制为2位小数
total_days=$(echo "scale=2; $total_days / 1" | bc -l 2>/dev/null || awk "BEGIN {printf \"%.2f\", $total_days}")

# 确保总天数有值
total_days=${total_days:-0}

# 获取网络流量信息
if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS - 获取默认网络接口
    NETWORK_INTERFACE=$(route get default | grep interface | awk '{print $2}')
    if [ -n "$NETWORK_INTERFACE" ]; then
        # 使用netstat获取流量数据（单位：bytes）
        rx_bytes=$(netstat -ibn | grep "$NETWORK_INTERFACE" | grep -v "Link#" | awk '{print $7}' | head -n 1)
        tx_bytes=$(netstat -ibn | grep "$NETWORK_INTERFACE" | grep -v "Link#" | awk '{print $10}' | head -n 1)
    fi
else
    # Linux - 获取默认网络接口
    NETWORK_INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n 1)
    if [ -z "$NETWORK_INTERFACE" ]; then
        for iface in eth0 ens33 enp0s3; do
            if [ -d "/sys/class/net/$iface" ]; then
                NETWORK_INTERFACE=$iface
                break
            fi
        done
    fi
    if [ -n "$NETWORK_INTERFACE" ] && [ -d "/sys/class/net/$NETWORK_INTERFACE" ]; then
        rx_bytes=$(cat /proc/net/dev | grep "$NETWORK_INTERFACE" | awk '{print $2}')
        tx_bytes=$(cat /proc/net/dev | grep "$NETWORK_INTERFACE" | awk '{print $10}')
    fi
fi

# 确保网络流量数据有值
rx_bytes=${rx_bytes:-0}
tx_bytes=${tx_bytes:-0}

# 转换为MB
rx_mb=$(echo "scale=2; $rx_bytes / 1024 / 1024" | bc 2>/dev/null || awk "BEGIN {printf \"%.2f\", $rx_bytes / 1024 / 1024}")
tx_mb=$(echo "scale=2; $tx_bytes / 1024 / 1024" | bc 2>/dev/null || awk "BEGIN {printf \"%.2f\", $tx_bytes / 1024 / 1024}")

# 输出JSON格式数据
echo "{
    \"cpu_usage\": $cpu_usage,
    \"mem_total\": $mem_total,
    \"mem_used\": $mem_used,
    \"mem_usage\": $mem_usage,
    \"disk_total\": $disk_total,
    \"disk_used\": $disk_used,
    \"disk_usage\": $disk_usage,
    \"load_1\": $load_1,
    \"load_5\": $load_5,
    \"load_15\": $load_15,
    \"uptime_days\": $total_days,
    \"network_interface\": \"$NETWORK_INTERFACE\",
    \"network_rx_bytes\": $rx_bytes,
    \"network_tx_bytes\": $tx_bytes,
    \"network_rx_mb\": $rx_mb,
    \"network_tx_mb\": $tx_mb
}"