#!/bin/bash

# 测试更新用户信息接口 - 改进版
# Base URL (默认使用本地服务器，如需测试远程服务器请修改为远程地址)
BASE_URL="http://120.48.95.51:7001"
# BASE_URL="http://120.48.95.51:7001"  # 远程服务器地址

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "测试更新用户信息接口"
echo "========================================"
echo ""

# 清理旧的cookie文件
rm -f cookies.txt

# 生成随机用户名和邮箱
TIMESTAMP=$(date +%s)
USERNAME="testuser_${TIMESTAMP}"
EMAIL="test_${TIMESTAMP}@example.com"
PASSWORD="password123"

echo -e "${BLUE}测试用户信息:${NC}"
echo "用户名: $USERNAME"
echo "邮箱: $EMAIL"
echo "密码: $PASSWORD"
echo ""

# 1. 注册新用户
echo -e "${YELLOW}[1/8] 注册新用户...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"confirmPassword\": \"$PASSWORD\"
  }")
echo "注册响应: $REGISTER_RESPONSE"

# 检查注册是否成功
if echo "$REGISTER_RESPONSE" | grep -q "success\|code.*0\|token"; then
  echo -e "${GREEN}✓ 注册成功${NC}"
elif echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
  echo -e "${YELLOW}⚠ 用户已存在，尝试直接登录${NC}"
else
  echo -e "${RED}✗ 注册失败: $REGISTER_RESPONSE${NC}"
  exit 1
fi
echo ""

# 2. 登录获取session
echo -e "${YELLOW}[2/8] 登录获取Session...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "登录响应: $LOGIN_RESPONSE"

# 检查登录是否成功
if echo "$LOGIN_RESPONSE" | grep -q "success\|code.*0\|token"; then
  echo -e "${GREEN}✓ 登录成功${NC}"
else
  echo -e "${RED}✗ 登录失败: $LOGIN_RESPONSE${NC}"
  exit 1
fi
echo ""

# 3. 测试场景1: 只更新用户名
echo -e "${YELLOW}[3/8] 测试场景1: 只更新用户名${NC}"
NEW_USERNAME="updated_${TIMESTAMP}"
UPDATE1_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"username\": \"$NEW_USERNAME\"
  }")
echo "请求: {\"username\": \"$NEW_USERNAME\"}"
echo "响应: $UPDATE1_RESPONSE"
if echo "$UPDATE1_RESPONSE" | grep -q "success\|code.*0"; then
  echo -e "${GREEN}✓ 测试通过${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 4. 测试场景2: 更新邮箱和密码
echo -e "${YELLOW}[4/8] 测试场景2: 更新邮箱和密码${NC}"
NEW_EMAIL="new_${TIMESTAMP}@example.com"
NEW_PASSWORD="newpassword456"
UPDATE2_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"email\": \"$NEW_EMAIL\",
    \"password\": \"$NEW_PASSWORD\"
  }")
echo "请求: {\"email\": \"$NEW_EMAIL\", \"password\": \"$NEW_PASSWORD\"}"
echo "响应: $UPDATE2_RESPONSE"
if echo "$UPDATE2_RESPONSE" | grep -q "success\|code.*0"; then
  echo -e "${GREEN}✓ 测试通过${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 5. 测试场景3: 更新所有字段
echo -e "${YELLOW}[5/8] 测试场景3: 更新所有字段${NC}"
FULL_USERNAME="full_${TIMESTAMP}"
FULL_EMAIL="full_${TIMESTAMP}@example.com"
FULL_PASSWORD="fullpass789"
FULL_AVATAR="http://example.com/avatar_${TIMESTAMP}.jpg"
UPDATE3_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"username\": \"$FULL_USERNAME\",
    \"email\": \"$FULL_EMAIL\",
    \"password\": \"$FULL_PASSWORD\",
    \"avatar\": \"$FULL_AVATAR\"
  }")
echo "请求: {\"username\": \"$FULL_USERNAME\", \"email\": \"$FULL_EMAIL\", \"password\": \"$FULL_PASSWORD\", \"avatar\": \"$FULL_AVATAR\"}"
echo "响应: $UPDATE3_RESPONSE"
if echo "$UPDATE3_RESPONSE" | grep -q "success\|code.*0"; then
  echo -e "${GREEN}✓ 测试通过${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 6. 测试场景4: 无效的用户ID
echo -e "${YELLOW}[6/8] 测试场景4: 无效的用户ID${NC}"
UPDATE4_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "id": -1,
    "username": "test"
  }')
echo "请求: {\"id\": -1, \"username\": \"test\"}"
echo "响应: $UPDATE4_RESPONSE"
if echo "$UPDATE4_RESPONSE" | grep -q "Invalid user ID\|422"; then
  echo -e "${GREEN}✓ 测试通过（正确拒绝无效ID）${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 7. 测试场景5: 空用户名
echo -e "${YELLOW}[7/8] 测试场景5: 空用户名${NC}"
UPDATE5_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": ""
  }')
echo "请求: {\"username\": \"\"}"
echo "响应: $UPDATE5_RESPONSE"
if echo "$UPDATE5_RESPONSE" | grep -q "cannot be empty\|422"; then
  echo -e "${GREEN}✓ 测试通过（正确拒绝空用户名）${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 8. 测试场景6: 无效邮箱格式
echo -e "${YELLOW}[8/8] 测试场景6: 无效邮箱格式${NC}"
UPDATE6_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "invalid-email"
  }')
echo "请求: {\"email\": \"invalid-email\"}"
echo "响应: $UPDATE6_RESPONSE"
if echo "$UPDATE6_RESPONSE" | grep -q "Invalid email format\|422"; then
  echo -e "${GREEN}✓ 测试通过（正确拒绝无效邮箱）${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 9. 测试场景7: 密码太短
echo -e "${YELLOW}[9/8] 测试场景7: 密码太短${NC}"
UPDATE7_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "password": "123"
  }')
echo "请求: {\"password\": \"123\"}"
echo "响应: $UPDATE7_RESPONSE"
if echo "$UPDATE7_RESPONSE" | grep -q "at least 6 characters\|422"; then
  echo -e "${GREEN}✓ 测试通过（正确拒绝短密码）${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 10. 测试场景8: 未登录访问
echo -e "${YELLOW}[10/8] 测试场景8: 未登录访问${NC}"
rm -f cookies.txt
UPDATE8_RESPONSE=$(curl -s -X PUT ${BASE_URL}/user/info \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test"
  }')
echo "请求: {\"username\": \"test\"} (无cookie)"
echo "响应: $UPDATE8_RESPONSE"
if echo "$UPDATE8_RESPONSE" | grep -q "Not logged in\|401"; then
  echo -e "${GREEN}✓ 测试通过（正确拒绝未登录访问）${NC}"
else
  echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 清理临时文件
rm -f cookies.txt

echo "========================================"
echo -e "${GREEN}测试完成！${NC}"
echo "========================================"
