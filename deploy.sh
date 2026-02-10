#!/bin/bash

# 快速部署脚本 - 将代码推送到远程服务器

echo "========================================"
echo "快速部署到远程服务器"
echo "========================================"
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "发现未提交的更改："
  git status --short
  echo ""
  
  read -p "是否要提交这些更改？(y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "请输入提交信息："
    read COMMIT_MESSAGE
    git add .
    git commit -m "$COMMIT_MESSAGE"
    echo "✓ 代码已提交"
  else
    echo "取消部署"
    exit 1
  fi
else
  echo "没有未提交的更改"
fi

echo ""
echo "开始推送到远程仓库..."
echo ""

# 推送到main分支
git push origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ 代码推送成功！"
  echo ""
  echo "GitHub Actions将自动部署到远程服务器"
  echo "部署状态: https://github.com/your-username/egg-example-picooc/actions"
  echo ""
  echo "预计部署时间: 2-3分钟"
  echo ""
  echo "部署完成后，远程服务器地址: http://120.48.95.51:7001"
else
  echo ""
  echo "✗ 代码推送失败"
  exit 1
fi

echo ""
echo "========================================"
