#!/bin/bash
# 龙虾软件特工队 - 阶段1验证脚本

echo "🦞 龙虾软件特工队 - 阶段1验证"
echo "================================"
echo ""

# 检查项目结构
echo "1️⃣ 检查项目结构..."
if [ -d ~/code/lobster-squad ]; then
    echo "✅ lobster-squad 目录存在"
else
    echo "❌ lobster-squad 目录不存在"
    exit 1
fi

if [ -d ~/code/lobster-squad-config ]; then
    echo "✅ lobster-squad-config 目录存在"
else
    echo "❌ lobster-squad-config 目录不存在"
    exit 1
fi

echo ""

# 检查 Docker 文件
echo "2️⃣ 检查 Docker 文件..."
FILES=(
    "docker/Dockerfile"
    "docker/scripts/start.sh"
    "docker/scripts/download-config.sh"
    "docker/healthcheck.sh"
    "docker/config/openclaw.json.template"
    "docker-compose.yml"
    "README.md"
)

for file in "${FILES[@]}"; do
    if [ -f ~/code/lobster-squad/$file ]; then
        echo "✅ $file"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""

# 检查角色配置
echo "3️⃣ 检查角色配置..."
if [ -f ~/code/lobster-squad-config/roles/captain/SOUL.md ]; then
    echo "✅ captain/SOUL.md"
else
    echo "❌ captain/SOUL.md 不存在"
    exit 1
fi

if [ -f ~/code/lobster-squad-config/roles/captain/AGENT.md ]; then
    echo "✅ captain/AGENT.md"
else
    echo "❌ captain/AGENT.md 不存在"
    exit 1
fi

if [ -f ~/code/lobster-squad-config/roles/captain/USER.md ]; then
    echo "✅ captain/USER.md"
else
    echo "❌ captain/USER.md 不存在"
    exit 1
fi

if [ -f ~/code/lobster-squad-config/roles/captain/config.json ]; then
    echo "✅ captain/config.json"
else
    echo "❌ captain/config.json 不存在"
    exit 1
fi

# 检查所有角色目录
ROLES=(cto pm ba ia aa ta se tse mde swe te cie committer)
for role in "${ROLES[@]}"; do
    if [ -d ~/code/lobster-squad-config/roles/$role ]; then
        echo "✅ roles/$role/ 目录存在"
    else
        echo "❌ roles/$role/ 目录不存在"
        exit 1
    fi
done

echo ""

# 检查脚本权限
echo "4️⃣ 检查脚本权限..."
SCRIPTS=(
    "docker/scripts/start.sh"
    "docker/scripts/download-config.sh"
    "docker/healthcheck.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -x ~/code/lobster-squad/$script ]; then
        echo "✅ $script 可执行"
    else
        echo "❌ $script 不可执行，添加执行权限..."
        chmod +x ~/code/lobster-squad/$script
    fi
done

echo ""

# 检查 Docker
echo "5️⃣ 检查 Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker 已安装"
    docker --version
else
    echo "❌ Docker 未安装"
    exit 1
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo "✅ Docker Compose 已安装"
else
    echo "❌ Docker Compose 未安装"
    exit 1
fi

echo ""

# 检查 Kimi Code CLI
echo "6️⃣ 检查 Kimi Code CLI..."
if command -v kimi &> /dev/null; then
    echo "✅ Kimi Code CLI 已安装"
    kimi --version
else
    echo "❌ Kimi Code CLI 未安装"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 阶段1 验证完成！"
echo ""
echo "🚀 下一步："
echo "   cd ~/code/lobster-squad"
echo "   docker-compose build"
echo "   docker-compose up -d"
echo ""
