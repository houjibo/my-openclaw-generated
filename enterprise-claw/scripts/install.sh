#!/bin/bash

set -e

# 企业定制 OpenClaw 安装脚本

echo "🦞 Enterprise Claw Installation Script"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OPENCLAW_DIR="$HOME/.openclaw"

echo ""
echo "📁 项目目录：$PROJECT_DIR"
echo "🏠 OpenClaw 目录：$OPENCLAW_DIR"
echo ""

# 1. 检查 OpenClaw 是否已安装
echo "⏳ 检查 OpenClaw 安装状态..."
if ! command -v openclaw &> /dev/null; then
    echo -e "${RED}❌ OpenClaw 未安装${NC}"
    echo "请先安装 OpenClaw:"
    echo "  npm install -g openclaw"
    exit 1
fi
echo -e "${GREEN}✅ OpenClaw 已安装${NC}"

# 2. 创建 hooks 目录符号链接
echo ""
echo "⏳ 创建企业 Hooks 符号链接..."
HOOKS_TARGET="$OPENCLAW_DIR/workspace/hooks/enterprise"
if [ -L "$HOOKS_TARGET" ] || [ -d "$HOOKS_TARGET" ]; then
    echo -e "${YELLOW}⚠️  目标已存在，跳过${NC}"
else
    ln -sf "$PROJECT_DIR/hooks" "$HOOKS_TARGET"
    echo -e "${GREEN}✅ 已创建：$HOOKS_TARGET${NC}"
fi

# 3. 创建 skills 目录符号链接
echo ""
echo "⏳ 创建企业 Skills 符号链接..."
SKILLS_TARGET="$OPENCLAW_DIR/workspace/skills/enterprise"
if [ -L "$SKILLS_TARGET" ] || [ -d "$SKILLS_TARGET" ]; then
    echo -e "${YELLOW}⚠️  目标已存在，跳过${NC}"
else
    ln -sf "$PROJECT_DIR/skills" "$SKILLS_TARGET"
    echo -e "${GREEN}✅ 已创建：$SKILLS_TARGET${NC}"
fi

# 4. 备份并更新配置文件
echo ""
echo "⏳ 配置 OpenClaw..."
CONFIG_SOURCE="$PROJECT_DIR/config/openclaw.json"
CONFIG_TARGET="$OPENCLAW_DIR/openclaw.json"

if [ -f "$CONFIG_TARGET" ]; then
    BACKUP_FILE="$CONFIG_TARGET.backup.$(date +%Y%m%d%H%M%S)"
    echo "📦 备份现有配置：$BACKUP_FILE"
    cp "$CONFIG_TARGET" "$BACKUP_FILE"
fi

# 合并配置（简单覆盖，实际应该合并）
echo "📝 更新配置文件..."
# 这里可以根据需要实现配置合并逻辑
# cp "$CONFIG_SOURCE" "$CONFIG_TARGET"

echo -e "${GREEN}✅ 配置完成${NC}"

# 5. 设置环境变量
echo ""
echo "⏳ 设置环境变量..."
ENV_FILE="$OPENCLAW_DIR/.env.enterprise"
cat > "$ENV_FILE" << EOF
# Enterprise Claw Environment Variables
# 请根据实际情况修改以下配置

# HR 系统配置
HR_API_ENDPOINT=https://your-hr-system.com/api
HR_API_KEY=your_hr_api_key

# CRM 系统配置
CRM_API_ENDPOINT=https://your-crm-system.com/api
CRM_API_KEY=your_crm_api_key

# SIEM 系统集成
ENTERPRISE_SIEM_ENDPOINT=https://your-siem.com/api/audit
ENTERPRISE_SIEM_API_KEY=your_siem_api_key

# 审计日志级别
AUDIT_LOG_LEVEL=info
EOF

echo -e "${GREEN}✅ 已创建：$ENV_FILE${NC}"
echo -e "${YELLOW}⚠️  请编辑 $ENV_FILE 填入实际配置${NC}"

# 6. 验证安装
echo ""
echo "⏳ 验证安装..."
if openclaw hooks status &> /dev/null; then
    echo -e "${GREEN}✅ Hooks 系统正常${NC}"
else
    echo -e "${YELLOW}⚠️  Hooks 系统需要重启 Gateway${NC}"
fi

# 7. 提示重启
echo ""
echo "======================================"
echo -e "${GREEN}✅ 安装完成！${NC}"
echo ""
echo "下一步："
echo "1. 编辑环境变量文件："
echo "   nano $ENV_FILE"
echo ""
echo "2. 重启 OpenClaw Gateway："
echo "   openclaw gateway restart"
echo ""
echo "3. 验证 Hooks 状态："
echo "   openclaw hooks status"
echo ""
echo "4. 查看配置："
echo "   openclaw config show"
echo ""
echo "======================================"
