# Knowledge Evaluation - 部署指南

## 系统要求

- Node.js 20+
- PostgreSQL 15+ (带 pgvector 扩展)
- npm 或 yarn

## 环境变量配置

复制 `.env.example` 到 `.env` 并配置以下变量：

```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_evaluation?schema=public"

# OpenAI API (必需)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_LLM_MODEL="gpt-4-turbo-preview"

# 文件上传配置
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=52428800  # 50MB

# 可选: 缓存配置
CACHE_DIR="./cache/files"

# 可选: 生产环境配置
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 部署方式

### 1. 本地部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 初始化数据库
npx prisma migrate dev

# 4. 构建应用
npm run build

# 5. 启动应用
npm start
```

### 2. Docker 部署

```bash
# 1. 构建并启动所有服务
docker-compose up -d

# 2. 查看日志
docker-compose logs -f app

# 3. 停止服务
docker-compose down
```

### 3. Vercel 部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel --prod
```

### 4. 生产服务器部署

```bash
# 1. 克隆代码
git clone <repository-url>
cd knowledge-evaluation

# 2. 安装依赖
npm ci

# 3. 配置环境变量
export DATABASE_URL="postgresql://..."
export OPENAI_API_KEY="sk-..."

# 4. 构建
npm run build

# 5. 使用 PM2 启动
npm install -g pm2
pm2 start npm --name "knowledge-evaluation" -- start

# 6. 配置 Nginx 反向代理
# 参考 nginx.conf 配置
```

## 数据库配置

### 安装 pgvector

```sql
-- 在 PostgreSQL 中启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 验证安装
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 数据库迁移

```bash
# 开发环境
npx prisma migrate dev

# 生产环境
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

## 监控和日志

### 使用 PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs knowledge-evaluation

# 监控性能
pm2 monit
```

### 日志配置

应用日志输出到以下位置：
- 应用日志: `./logs/app.log`
- 错误日志: `./logs/error.log`
- 数据库慢查询: 控制台输出

## 性能优化建议

1. **数据库优化**
   - 使用 PostgreSQL 连接池
   - 配置适当的 max_connections
   - 启用查询缓存

2. **应用优化**
   - 使用 CDN 托管静态资源
   - 启用 gzip/brotli 压缩
   - 配置 Redis 缓存（可选）

3. **文件上传优化**
   - 配置 Nginx 客户端文件大小限制
   - 使用对象存储（如 AWS S3）存储大文件

## 备份策略

### 数据库备份

```bash
# 自动备份脚本 (daily-backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/knowledge_evaluation_$DATE.sql

# 保留最近 7 天的备份
find /backups -name "knowledge_evaluation_*.sql" -mtime +7 -delete
```

### 文件备份

```bash
# 备份上传的文件
rsync -avz ./uploads/ /backups/uploads/
```

## 故障排查

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库状态
   pg_isready -h localhost -p 5432
   
   # 查看连接数
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **构建失败**
   ```bash
   # 清理缓存
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **内存不足**
   ```bash
   # 增加 Node.js 内存限制
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

## 安全建议

1. 使用 HTTPS
2. 配置 CORS 白名单
3. 限制文件上传类型和大小
4. 定期更新依赖
5. 使用环境变量存储敏感信息
6. 配置适当的防火墙规则

## 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖
npm install

# 3. 执行数据库迁移
npx prisma migrate deploy

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 restart knowledge-evaluation
```

## 支持

如有问题，请查看：
- 项目文档: `./docs`
- GitHub Issues
- 技术规范: `TECHNICAL_SPECIFICATION.md`
