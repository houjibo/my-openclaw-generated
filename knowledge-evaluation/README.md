# Knowledge Evaluation - 知识评价和评测系统

## 项目简介

Knowledge Evaluation 是一个面向 AI 消费的知识评价和评测系统，支持多种文档格式的解析、质量评估、优化改写和向量化评测。

## 核心功能

### 1. 性能优化
- **数据库查询优化**：连接池、内存缓存、慢查询监控
- **API 响应优化**：超时控制、流式响应、请求去重、速率限制
- **前端性能优化**：虚拟列表、防抖节流、懒加载、代码分割
- **文件处理优化**：流式上传、进度追踪、文件缓存、分块处理

### 2. 错误处理
- 结构化错误类型和严重级别
- 全局错误日志记录
- 自动重试机制
- 错误通知系统
- API 错误边界处理

### 3. 多格式文档解析
- 支持 DOCX, PDF, PPTX, XLSX, TXT, MD 等多种格式
- 自动提取文档内容和结构
- 生成统一的文档表示格式

### 2. 三维质量评估
从三个维度全面评估文档质量：

#### 内在质量 (Intrinsic Quality)
- 解析成功率
- 信息密度
- 代词占比
- 术语一致性
- 可读性得分
- 错误率

#### 结构语义 (Structural Semantic)
- 层次结构完整度
- 段落连贯性
- 列表/表格使用
- 代码块标注
- 图表质量
- 引用完整性

#### 消费效果 (Consumption Effect)
- 检索友好度
- 上下文自包含性
- 问答匹配度
- 向量相似度分布
- Token 效率

### 3. 评测集生成
- 基于文档内容自动生成问答对
- 支持多种问题类型（事实、概念、应用、对比、综合）
- 可用于评估向量化效果

### 4. 文档优化改写
- 基于评估结果提供优化建议
- 自动改写文档内容
- 保留原始语义
- 版本管理

### 5. 向量化评测
- 文档向量化（支持多种 Embedding 模型）
- 使用评测集测试向量化效果
- 对比优化前后的效果
- 计算通过率和相关指标

## 技术栈

### 前端
- Next.js 16.2+ (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

### 后端
- Next.js API Routes
- Prisma ORM
- PostgreSQL

### AI 服务
- OpenAI Embedding API
- OpenAI GPT-4 / GPT-3.5

## 项目结构

```
knowledge-evaluation/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── documents/     # 文档管理 API
│   │   ├── evaluations/   # 评测 API
│   │   ├── test-suites/   # 评测集 API
│   │   ├── optimizations/ # 优化 API
│   │   ├── vectorizations/# 向量化 API
│   │   └── evaluation-runs/# 评测执行 API
│   ├── documents/         # 文档页面
│   ├── evaluations/       # 评测页面
│   ├── test-suites/       # 评测集页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── ui/               # UI 组件（shadcn/ui）
├── lib/                   # 工具函数
│   ├── db.ts             # 数据库连接（含缓存优化）
│   ├── utils.ts          # 工具函数
│   ├── file-utils.ts     # 文件处理工具
│   ├── error-handling.ts # 错误处理和日志
│   ├── api-optimization.ts # API 性能优化
│   ├── file-optimization.ts # 文件处理优化
│   └── performance-hooks.ts # 前端性能优化 Hooks
├── __tests__/            # 测试文件
│   ├── db.test.ts        # 数据库测试
│   ├── error-handling.test.ts # 错误处理测试
│   └── api-optimization.test.ts # API 优化测试
├── .github/workflows/    # CI/CD 配置
│   └── ci-cd.yml         # GitHub Actions 工作流
├── prisma/               # Prisma 配置
│   └── schema.prisma     # 数据库模型
├── types/                # TypeScript 类型定义
│   └── index.ts          # 核心类型
├── public/               # 静态资源
├── .env.example          # 环境变量示例
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
└── README.md             # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
cd knowledge-evaluation
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_evaluation?schema=public"
OPENAI_API_KEY="your-openai-api-key"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_LLM_MODEL="gpt-4-turbo-preview"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=52428800
```

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 数据库模型

### 核心表

1. **Document** - 文档表
   - 存储上传的文档信息和解析结果

2. **DocumentVersion** - 文档版本表
   - 存储优化后的文档版本

3. **Evaluation** - 评测记录表
   - 存储文档质量评估结果

4. **TestSuite** - 评测集表
   - 存储评测集基本信息

5. **TestQuestion** - 测试问题表
   - 存储评测集中的问题

6. **VectorizedDocument** - 向量化文档表
   - 存储向量化后的文档

7. **VectorChunk** - 向量块表
   - 存储文档分块和向量

8. **EvaluationRun** - 评测执行记录表
   - 存储评测执行结果

9. **TestResult** - 测试结果明细表
   - 存储每个问题的测试结果

## API 文档

### 文档管理

- `POST /api/documents` - 上传文档
- `GET /api/documents` - 获取文档列表
- `GET /api/documents/:id` - 获取文档详情
- `DELETE /api/documents/:id` - 删除文档
- `POST /api/documents/:id/reparse` - 重新解析文档

### 质量评估

- `POST /api/evaluations` - 创建评测任务
- `GET /api/evaluations` - 获取评测列表
- `GET /api/evaluations/:id` - 获取评测详情
- `GET /api/documents/:id/evaluations` - 获取文档的所有评测

### 评测集管理

- `POST /api/test-suites` - 生成评测集
- `GET /api/test-suites` - 获取评测集列表
- `GET /api/test-suites/:id` - 获取评测集详情
- `PUT /api/test-suites/:id` - 更新评测集
- `DELETE /api/test-suites/:id` - 删除评测集

### 文档优化

- `POST /api/optimizations` - 创建优化任务
- `GET /api/optimizations/:id` - 获取优化详情
- `POST /api/optimizations/:id/apply` - 应用优化
- `GET /api/documents/:id/versions` - 获取文档版本列表

### 向量化评测

- `POST /api/vectorizations` - 创建向量化任务
- `GET /api/vectorizations/:id` - 获取向量化详情
- `POST /api/evaluation-runs` - 执行评测
- `GET /api/evaluation-runs/:id` - 获取评测结果
- `GET /api/evaluation-runs/compare` - 对比评测结果

## 开发指南

### 开发命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint
- `npm run typecheck` - 运行 TypeScript 类型检查
- `npm test` - 运行单元测试
- `npm run test:watch` - 以监视模式运行测试
- `npm run test:coverage` - 生成测试覆盖率报告
- `npm run db:generate` - 生成 Prisma Client
- `npm run db:push` - 推送数据库 schema
- `npm run db:migrate` - 创建数据库迁移
- `npm run db:studio` - 打开 Prisma Studio

### 开发流程

1. 创建新功能分支
2. 开发功能
3. 编写测试
4. 提交代码
5. 创建 Pull Request

## 部署

### Docker 部署

```bash
# 使用 Docker Compose（推荐）
docker-compose up -d

# 或使用单容器
docker build -t knowledge-evaluation .
docker run -p 3000:3000 knowledge-evaluation
```

### CI/CD

项目已配置 GitHub Actions 工作流：
- **CI Pipeline**: 代码检查、类型检查、单元测试
- **Staging Deployment**: 自动部署到测试环境
- **Production Deployment**: 自动部署到生产环境

详见 `.github/workflows/ci-cd.yml`

### 详细部署指南

请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整的部署指南，包括：
- 系统要求
- 环境变量配置
- 数据库设置
- 性能优化建议
- 监控和日志配置
- 备份策略

### 环境变量

确保设置以下环境变量：
- `DATABASE_URL` - PostgreSQL 连接字符串
- `OPENAI_API_KEY` - OpenAI API 密钥
- `OPENAI_EMBEDDING_MODEL` - Embedding 模型
- `OPENAI_LLM_MODEL` - LLM 模型
- `UPLOAD_DIR` - 上传目录
- `MAX_FILE_SIZE` - 最大文件大小

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请创建 Issue 或联系维护者。
