#!/bin/bash

# ========================================
# 双平台推送脚本
# 功能：同时推送到Gitee和GitHub，并检查GitHub CI/CD构建状态
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# GitHub配置
GITHUB_REPO="xiaqingpeng/egg-example-picooc"
GITHUB_API_URL="https://api.github.com/repos/${GITHUB_REPO}/actions/runs"

# 检查GitHub CLI是否安装
check_github_cli() {
    if command -v gh &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# 检查GitHub API Token
check_github_token() {
    if [ -n "$GITHUB_TOKEN" ]; then
        return 0
    else
        return 1
    fi
}

# 获取最新一次GitHub Actions运行状态
get_github_actions_status() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    检查GitHub CI/CD构建状态${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    local latest_run
    local status
    local conclusion
    local run_id
    local run_url
    
    # 优先使用GitHub CLI
    if check_github_cli; then
        echo -e "${CYAN}使用GitHub CLI查询构建状态...${NC}"
        
        # 获取最新的workflow运行
        latest_run=$(gh run list --repo "$GITHUB_REPO" --limit 1 --json databaseId,status,conclusion,url 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$latest_run" ]; then
            run_id=$(echo "$latest_run" | jq -r '.[0].databaseId')
            status=$(echo "$latest_run" | jq -r '.[0].status')
            conclusion=$(echo "$latest_run" | jq -r '.[0].conclusion')
            run_url=$(echo "$latest_run" | jq -r '.[0].url')
            
            display_run_status "$run_id" "$status" "$conclusion" "$run_url"
            return 0
        else
            echo -e "${YELLOW}✗ GitHub CLI查询失败，尝试使用API...${NC}"
        fi
    fi
    
    # 使用GitHub API查询
    if check_github_token; then
        echo -e "${CYAN}使用GitHub API查询构建状态...${NC}"
        
        # 获取最新的workflow运行
        local api_response
        api_response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" "$GITHUB_API_URL?per_page=1")
        
        if [ $? -eq 0 ]; then
            run_id=$(echo "$api_response" | jq -r '.workflow_runs[0].id')
            status=$(echo "$api_response" | jq -r '.workflow_runs[0].status')
            conclusion=$(echo "$api_response" | jq -r '.workflow_runs[0].conclusion')
            run_url=$(echo "$api_response" | jq -r '.workflow_runs[0].html_url')
            
            if [ "$run_id" != "null" ]; then
                display_run_status "$run_id" "$status" "$conclusion" "$run_url"
                return 0
            else
                echo -e "${YELLOW}✗ 未找到workflow运行记录${NC}"
                return 1
            fi
        else
            echo -e "${RED}✗ GitHub API请求失败${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  未配置GITHUB_TOKEN，无法查询构建状态${NC}"
        echo -e "${YELLOW}提示: 设置环境变量 GITHUB_TOKEN 来启用此功能${NC}"
        echo -e "${CYAN}查看构建状态: https://github.com/${GITHUB_REPO}/actions${NC}"
        return 1
    fi
}

# 显示workflow运行状态
display_run_status() {
    local run_id="$1"
    local status="$2"
    local conclusion="$3"
    local run_url="$4"
    
    echo ""
    echo -e "${CYAN}构建信息:${NC}"
    echo -e "  Run ID: ${run_id}"
    echo -e "  状态: ${status}"
    
    if [ "$status" = "completed" ]; then
        if [ "$conclusion" = "success" ]; then
            echo -e "  结论: ${GREEN}✓ 成功${NC}"
        elif [ "$conclusion" = "failure" ]; then
            echo -e "  结论: ${RED}✗ 失败${NC}"
        elif [ "$conclusion" = "cancelled" ]; then
            echo -e "  结论: ${YELLOW}已取消${NC}"
        else
            echo -e "  结论: ${conclusion}"
        fi
    else
        echo -e "  结论: ${YELLOW}运行中...${NC}"
    fi
    
    echo -e "  详情: ${run_url}"
    echo ""
    
    # 如果构建失败，提供快速查看日志的命令
    if [ "$status" = "completed" ] && [ "$conclusion" = "failure" ]; then
        if check_github_cli; then
            echo -e "${YELLOW}查看失败日志:${NC}"
            echo -e "  gh run view ${run_id} --repo ${GITHUB_REPO} --log-failed"
        fi
    fi
}

# 执行推送并处理强推选项
execute_push() {
    local remote="$1"
    local branch="$2"
    local platform="$3"
    
    echo -e "${YELLOW}[${4}/${5}] 推送到${platform}...${NC}"
    
    # 尝试正常推送
    if git push "$remote" "$branch"; then
        echo -e "${GREEN}✓ ${platform}推送成功${NC}"
        return 0
    else
        # 检查推送失败原因
        local push_output=$(git push "$remote" "$branch" 2>&1)
        
        # 如果是non-fast-forward错误，询问是否强推
        if echo "$push_output" | grep -q "non-fast-forward"; then
            echo -e "${RED}✗ ${platform}推送失败: 本地分支落后于远程分支${NC}"
            echo -e "${YELLOW}提示: 远程分支有新的提交，需要先合并或使用强推${NC}"
            
            # 询问用户是否强推
            read -p "是否使用强推? 这将覆盖远程分支的提交! (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}执行强推到${platform}...${NC}"
                if git push -f "$remote" "$branch"; then
                    echo -e "${GREEN}✓ ${platform}强推成功${NC}"
                    return 0
                else
                    echo -e "${RED}✗ ${platform}强推失败${NC}"
                    return 1
                fi
            else
                echo -e "${YELLOW}已取消${platform}强推${NC}"
                return 1
            fi
        else
            # 其他错误
            echo -e "${RED}✗ ${platform}推送失败${NC}"
            echo -e "${RED}错误信息:${NC}"
            echo "$push_output"
            return 1
        fi
    fi
}

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
if execute_push "gitee" "$CURRENT_BRANCH" "Gitee" "1" "2"; then
    echo ""
else
    exit 1
fi

# 推送到GitHub
if execute_push "github" "$CURRENT_BRANCH" "GitHub" "2" "2"; then
    echo ""
else
    exit 1
fi

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
echo ""

# 检查GitHub CI/CD构建状态
get_github_actions_status

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 脚本执行完成！${NC}"
echo -e "${GREEN}========================================${NC}"