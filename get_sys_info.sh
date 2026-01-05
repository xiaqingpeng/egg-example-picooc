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
    \"load_15\": $load_15
}"