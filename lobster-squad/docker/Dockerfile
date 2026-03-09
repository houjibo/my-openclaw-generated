FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    && rm -rf /var/lib/apt/lists/*

# 安装 OpenClaw
RUN npm install -g openclaw@latest

# 复制脚本文件
COPY scripts/*.sh /app/scripts/
RUN chmod +x /app/scripts/*.sh

# 复制健康检查脚本
COPY healthcheck.sh /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# 复制配置模板
COPY config/openclaw.json.template /app/config/

# 设置环境变量
ENV OPENCLAW_HOME=/app/.openclaw
ENV OPENCLAW_CONFIG=/app/.openclaw/openclaw.json
ENV LOBSTER_ROLE=default
ENV LOBSTER_TEAM=default
ENV LOBSTER_NAME=default

# 暴露 Gateway 端口
EXPOSE 18789

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD /app/healthcheck.sh

# 启动脚本
CMD ["/app/scripts/start.sh"]
