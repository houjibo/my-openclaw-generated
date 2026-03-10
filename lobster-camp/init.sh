#!/bin/bash

# 龙虾营启动脚本

echo "🦞 龙虾营 - 初始化脚本"
echo "========================"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，从 .env.example 复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  请编辑 .env 文件配置以下内容："
    echo "   - DATABASE_URL: PostgreSQL 数据库连接字符串"
    echo "   - OPENCLAW_CLIENT_SECRET: OpenClaw OAuth 客户端密钥"
    echo "   - NEXTAUTH_SECRET: NextAuth 密钥"
    echo ""
    read -p "按 Enter 继续（请先配置好 .env 文件）..."
fi

# 检查环境变量
if grep -q "postgresql://user:password@localhost:5432" .env; then
    echo "⚠️  .env 文件中的数据库配置还是默认值，请修改！"
    exit 1
fi

# 生成 Prisma Client
echo "📦 生成 Prisma Client..."
npx prisma generate

# 推送数据库结构
echo "🗄️  推送数据库结构..."
npx prisma db push

echo ""
echo "✅ 初始化完成！"
echo ""
echo "启动开发服务器："
echo "  npm run dev"
echo ""
echo "访问："
echo "  http://localhost:3000"
echo ""
