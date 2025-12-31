#!/bin/bash

# ========================================
# 双平台推送脚本
# 功能：同时推送到Gitee和GitHub
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    双平台推送脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}当前分支: ${CURRENT_BRANCH}${NC}"
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}⚠️  警告: 存在未提交的更改${NC}"
    echo -e "${YELLOW}请先提交更改后再推送${NC}"
    echo ""
    git status --short
    exit 1
fi

# 检查远程仓库配置
echo -e "${BLUE}检查远程仓库配置...${NC}"
if ! git remote | grep -q "gitee"; then
    echo -e "${RED}✗ 未找到gitee远程仓库${NC}"
    exit 1
fi

if ! git remote | grep -q "github"; then
    echo -e "${RED}✗ 未找到github远程仓库${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 远程仓库配置正确${NC}"
echo ""

# 显示推送计划
echo -e "${BLUE}推送计划:${NC}"
echo -e "  1. Gitee  (git@gitee.com:xiaqqingpeng/egg-example-picooc.git)"
echo -e "  2. GitHub (https://github.com/xiaqingpeng/egg-example-picooc.git)"
echo ""

# 确认推送
read -p "是否继续推送? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消推送${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}开始推送...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 推送到Gitee
echo -e "${YELLOW}[1/2] 推送到Gitee...${NC}"
if git push gitee "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✓ Gitee推送成功${NC}"
else
    echo -e "${RED}✗ Gitee推送失败${NC}"
    exit 1
fi
echo ""

# 推送到GitHub
echo -e "${YELLOW}[2/2] 推送到GitHub...${NC}"
if git push github "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✓ GitHub推送成功${NC}"
else
    echo -e "${RED}✗ GitHub推送失败${NC}"
    exit 1
fi
echo ""

# 推送完成
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 所有平台推送完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}最新提交:${NC}"
git log -1 --oneline
echo ""
echo -e "${YELLOW}远程仓库状态:${NC}"
git remote -v
