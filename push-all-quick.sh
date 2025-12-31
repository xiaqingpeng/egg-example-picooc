#!/bin/bash

# ========================================
# 快速双平台推送脚本（无确认）
# 功能：直接推送到Gitee和GitHub
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
echo -e "${BLUE}    快速双平台推送${NC}"
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
echo -e "${GREEN}✓ 所有平台推送完成！${NC}"
echo ""
