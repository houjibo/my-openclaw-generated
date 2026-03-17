#!/bin/bash

# 龙虾营 - 文件上传功能测试脚本

echo "🦞 龙虾营 - 文件上传功能测试"
echo "================================"
echo ""

# 创建测试图片（1x1 像素的 PNG）
TEST_IMAGE="/tmp/test-avatar.png"
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE"

echo "✅ 测试图片已创建：$TEST_IMAGE"
echo ""

# 测试 1: 未登录状态（应该失败）
echo "测试 1: 未登录状态上传（预期：401 未授权）"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  -F "file=@$TEST_IMAGE" \
  -F "type=avatar" \
  http://localhost:3000/api/upload)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ 通过：未登录用户被正确拒绝 (HTTP $HTTP_CODE)"
else
  echo "❌ 失败：预期 401，实际 HTTP $HTTP_CODE"
  echo "响应：$BODY"
fi
echo ""

# 测试 2: 文件类型验证
echo "测试 2: 无效文件类型测试"
echo "---"
TEST_TXT="/tmp/test.txt"
echo "这是测试文本文件" > "$TEST_TXT"

# 注意：这个测试需要登录状态，暂时跳过
echo "⏭️  跳过：需要登录状态（需要配置认证 Cookie）"
echo ""

# 测试 3: 检查上传目录
echo "测试 3: 检查上传目录结构"
echo "---"
UPLOAD_DIR="./public/uploads"
if [ -d "$UPLOAD_DIR" ]; then
  echo "✅ 上传目录存在：$UPLOAD_DIR"
  ls -la "$UPLOAD_DIR"
else
  echo "❌ 上传目录不存在"
fi
echo ""

# 测试 4: 检查 API 路由
echo "测试 4: 检查 API 路由文件"
echo "---"
if [ -f "./app/api/upload/route.ts" ]; then
  echo "✅ 上传 API 路由存在"
  echo "文件信息:"
  ls -lh "./app/api/upload/route.ts"
else
  echo "❌ 上传 API 路由不存在"
fi
echo ""

# 测试 5: 检查前端组件
echo "测试 5: 检查前端组件"
echo "---"
if [ -f "./components/avatar-upload.tsx" ]; then
  echo "✅ 头像上传组件存在"
else
  echo "❌ 头像上传组件不存在"
fi

if [ -f "./app/settings/settings-form.tsx" ]; then
  echo "✅ 设置表单组件存在"
else
  echo "❌ 设置表单组件不存在"
fi
echo ""

# 清理测试文件
rm -f "$TEST_IMAGE" "$TEST_TXT"

echo "================================"
echo "测试完成！"
echo ""
echo "📝 手动测试步骤："
echo "1. 访问 http://localhost:3000/auth/signin 登录"
echo "2. 访问 http://localhost:3000/settings 进入设置页面"
echo "3. 点击'选择图片'上传头像"
echo "4. 验证头像预览和保存功能"
echo ""
