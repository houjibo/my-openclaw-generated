#!/bin/bash
# 健康检查脚本

# 检查 OpenClaw Gateway 是否运行
if curl -s --max-time 3 http://127.0.0.1:18789/status >/dev/null 2>&1; then
    echo "✅ OpenClaw Gateway 运行正常"
    exit 0
else
    echo "❌ OpenClaw Gateway 未响应"
    exit 1
fi
