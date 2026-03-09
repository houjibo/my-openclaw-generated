#!/bin/bash
# 配置下载脚本 - 从 Git 仓库下载角色配置

set -e

ROLE="${1:-$LOBSTER_ROLE}"
TEAM="${2:-$LOBSTER_TEAM}"
CONFIG_REPO="${CONFIG_REPO:-https://github.com/houjibo/lobster-squad-config.git}"
TEMP_DIR="/tmp/lobster-config-$$"

echo "📥 下载角色配置..."
echo "👤 角色: $ROLE"
echo "👥 团队: $TEAM"

# 克隆配置仓库
git clone --depth 1 "$CONFIG_REPO" "$TEMP_DIR"

# 检查角色配置是否存在
ROLE_DIR="$TEMP_DIR/roles/$ROLE"
if [ ! -d "$ROLE_DIR" ]; then
    echo "❌ 错误: 角色配置不存在: $ROLE"
    echo "💡 可用角色:"
    ls -1 "$TEMP_DIR/roles/" 2>/dev/null || echo "  (无)"
    exit 1
fi

# 复制角色配置
echo "📋 应用角色配置..."
mkdir -p /app/.openclaw/workspace

# 复制核心配置文件
for file in SOUL.md AGENT.md USER.md MEMORY.md; do
    if [ -f "$ROLE_DIR/$file" ]; then
        cp "$ROLE_DIR/$file" "/app/.openclaw/workspace/$file"
        echo "  ✅ $file"
    else
        echo "  ⚠️  警告: $file 不存在"
    fi
done

# 复制团队配置（如果存在）
if [ -d "$TEMP_DIR/teams/$TEAM" ]; then
    echo "👥 应用团队配置..."
    cp -r "$TEMP_DIR/teams/$TEAM/"* "/app/.openclaw/workspace/" 2>/dev/null || true
fi

# 合并角色特定的 OpenClaw 配置
if [ -f "$ROLE_DIR/config.json" ]; then
    echo "⚙️  合并 OpenClaw 配置..."
    jq -s '.[0] * .[1]' /app/config/openclaw.json.template "$ROLE_DIR/config.json" \
        > /app/config/openclaw.json
else
    echo "⚙️  使用默认配置..."
    cp /app/config/openclaw.json.template /app/config/openclaw.json
fi

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "✅ 配置下载完成"

# 移除待下载标记
rm -f /app/config/pending-download

exit 0
