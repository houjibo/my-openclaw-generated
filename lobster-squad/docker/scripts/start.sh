#!/bin/bash
# 启动脚本 - 龙虾特工队实例

set -e

echo "🦞 启动龙虾特工队实例..."
echo "👤 角色: $LOBSTER_ROLE"
echo "👥 团队: $LOBSTER_TEAM"
echo "🏷️  名称: $LOBSTER_NAME"

# 等待配置下载
if [ -f /app/config/pending-download ]; then
    echo "⏳ 等待角色配置下载..."
    while [ -f /app/config/pending-download ]; do
        sleep 1
    done
fi

# 如果有自定义配置，应用它
if [ -f /app/config/openclaw.json ]; then
    echo "✅ 应用自定义配置..."
    mkdir -p /app/.openclaw
    cp /app/config/openclaw.json /app/.openclaw/openclaw.json
fi

# 启动 OpenClaw Gateway
echo "🚀 启动 OpenClaw Gateway..."
openclaw gateway start --port 18789

echo "✅ 启动完成！"
echo "📊 状态: openclaw status"
echo "📝 日志: openclaw gateway logs"

# 保持容器运行
tail -f /dev/null
