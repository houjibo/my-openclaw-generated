#!/bin/bash

set -e

# 企业定制 OpenClaw 部署脚本

echo "🦞 Enterprise Claw Deployment Script"
echo "===================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 部署配置
DEPLOY_TARGET="${DEPLOY_TARGET:-production}"
BACKUP_DIR="/tmp/enterprise-claw-backup"

echo ""
echo -e "${BLUE}部署目标：$DEPLOY_TARGET${NC}"
echo ""

# 1. 创建备份
echo "⏳ 创建备份..."
mkdir -p "$BACKUP_DIR"

if [ -d "$HOME/.openclaw/workspace/hooks/enterprise" ]; then
    cp -r "$HOME/.openclaw/workspace/hooks/enterprise" "$BACKUP_DIR/" 2>/dev/null || true
    echo -e "${GREEN}✅ Hooks 已备份${NC}"
fi

if [ -f "$HOME/.openclaw/openclaw.json" ]; then
    cp "$HOME/.openclaw/openclaw.json" "$BACKUP_DIR/openclaw.json"
    echo -e "${GREEN}✅ 配置已备份${NC}"
fi

# 2. 运行安装脚本
echo ""
echo "⏳ 执行安装..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/install.sh"

# 3. 验证部署
echo ""
echo "⏳ 验证部署..."

# 检查 Hooks
if openclaw hooks status &> /dev/null; then
    echo -e "${GREEN}✅ Hooks 验证通过${NC}"
else
    echo -e "${RED}❌ Hooks 验证失败${NC}"
    echo "回滚备份..."
    # 这里可以添加回滚逻辑
    exit 1
fi

# 检查配置
if openclaw config validate &> /dev/null; then
    echo -e "${GREEN}✅ 配置验证通过${NC}"
else
    echo -e "${RED}❌ 配置验证失败${NC}"
    exit 1
fi

# 4. 显示部署报告
echo ""
echo "======================================"
echo -e "${GREEN}✅ 部署成功！${NC}"
echo ""
echo "部署报告："
echo "-----------"
openclaw hooks status
echo ""
echo "已安装的 Hooks："
ls -la "$HOME/.openclaw/workspace/hooks/"
echo ""
echo "======================================"

# 5. 提示重启
echo ""
read -p "是否现在重启 Gateway? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏳ 重启 Gateway..."
    openclaw gateway restart
    echo -e "${GREEN}✅ Gateway 已重启${NC}"
fi

echo ""
echo "部署完成！"
