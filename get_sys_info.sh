#!/bin/bash

# 获取CPU使用率（取1分钟平均值）
cpu_usage=$(top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - $1}')

# 获取内存使用情况（单位：MB）
mem_total=$(free -m | grep Mem | awk '{print $2}')
mem_used=$(free -m | grep Mem | awk '{print $3}')
mem_usage=$(echo "scale=2; $mem_used / $mem_total * 100" | bc)

# 获取磁盘使用情况（根目录，单位：GB）
disk_total=$(df -BG / | grep / | awk '{print $2}' | sed 's/G//')
disk_used=$(df -BG / | grep / | awk '{print $3}' | sed 's/G//')
disk_usage=$(echo "scale=2; $disk_used / $disk_total * 100" | bc)

# 获取系统负载（1/5/15分钟）
load_1=$(cat /proc/loadavg | awk '{print $1}')
load_5=$(cat /proc/loadavg | awk '{print $2}')
load_15=$(cat /proc/loadavg | awk '{print $3}')

# 获取网络流量信息
# 自动检测默认网络接口
NETWORK_INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n 1)

# 如果无法获取默认接口，尝试常见的网络接口
if [ -z "$NETWORK_INTERFACE" ]; then
    for iface in eth0 ens33 enp0s3; do
        if [ -d "/sys/class/net/$iface" ]; then
            NETWORK_INTERFACE=$iface
            break
        fi
    done
fi

# 获取网络流量数据（单位：bytes）
if [ -n "$NETWORK_INTERFACE" ] && [ -d "/sys/class/net/$NETWORK_INTERFACE" ]; then
    # 使用 /proc/net/dev 获取更准确的流量数据
    rx_bytes=$(cat /proc/net/dev | grep "$NETWORK_INTERFACE" | awk '{print $2}')
    tx_bytes=$(cat /proc/net/dev | grep "$NETWORK_INTERFACE" | awk '{print $10}')
    
    # 转换为MB（可选，根据需求调整）
    rx_mb=$(echo "scale=2; $rx_bytes / 1024 / 1024" | bc)
    tx_mb=$(echo "scale=2; $tx_bytes / 1024 / 1024" | bc)
else
    rx_bytes=0
    tx_bytes=0
    rx_mb=0
    tx_mb=0
fi

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
    \"network_interface\": \"$NETWORK_INTERFACE\",
    \"network_rx_bytes\": $rx_bytes,
    \"network_tx_bytes\": $tx_bytes,
    \"network_rx_mb\": $rx_mb,
    \"network_tx_mb\": $tx_mb
}"