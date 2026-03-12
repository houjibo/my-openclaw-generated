# Knowledge Evaluation - 技术方案文档

## 1. 项目概述

### 1.1 项目定位
Knowledge Evaluation 是一个面向 AI 消费的知识评价和评测系统，支持多种文档格式的解析、质量评估、优化改写和向量化评测。

### 1.2 核心功能
1. **多格式文档解析** - 支持 DOCX, PDF, PPTX, TXT, MD 等格式
2. **三维质量评估** - 内在质量、结构语义、消费效果
3. **评测集生成** - 针对文档知识自动生成评测集
4. **文档优化改写** - 提高文档质量评分
5. **向量化评测** - 对比优化前后的向量化效果

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  文档管理     │  │  质量评估     │  │  评测对比     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Next.js API Routes)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 文档解析服务  │  │ 评分引擎      │  │ 向量化服务    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 评测集生成    │  │ 优化改写服务  │  │ 测试执行引擎  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (PostgreSQL)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 文档存储      │  │ 评测数据      │  │ 向量数据      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

#### 前端
- **框架**: Next.js 16.2+ (App Router)
- **UI 库**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS 4
- **状态管理**: React Server Components + SWR
- **图表**: Recharts / Chart.js

#### 后端
- **API 框架**: Next.js API Routes
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **文件存储**: 本地文件系统 / S3

#### 文档处理
- **DOCX**: python-docx (Python 微服务)
- **PDF**: PyPDF2, pdfplumber
- **PPTX**: python-pptx
- **Excel**: openpyxl
- **Markdown**: marked / remark

#### 向量化与 AI
- **Embedding API**: 
  - OpenAI text-embedding-3-small (推荐，性价比高)
  - 或 Cohere embed-multilingual-v3.0
  - 或本地部署 BGE-large-zh
- **LLM 服务**: 
  - OpenAI GPT-4 / GPT-3.5-turbo
  - 用于文档优化改写和评测集生成

#### 向量数据库（可选）
- **PostgreSQL + pgvector** (轻量级方案)
- **Pinecone / Weaviate** (生产级方案)

## 3. 核心模块设计

### 3.1 文档解析模块

#### 功能描述
- 支持多种文档格式上传
- 提取文档内容和结构
- 生成统一的文档表示格式

#### 处理流程
```
文件上传 → 格式识别 → 内容提取 → 结构分析 → 存储入库
```

#### 数据格式
```typescript
interface ParsedDocument {
  id: string
  filename: string
  fileType: FileType
  rawContent: string
  structuredContent: DocumentSection[]
  metadata: DocumentMetadata
  parseStatus: 'pending' | 'success' | 'failed'
  parseError?: string
}

interface DocumentSection {
  id: string
  type: 'title' | 'paragraph' | 'list' | 'table' | 'code' | 'image'
  content: string
  level?: number // 标题层级
  position: number
  children?: DocumentSection[]
}

interface DocumentMetadata {
  pageCount?: number
  wordCount: number
  charCount: number
  language: string
  author?: string
  createdAt?: Date
  modifiedAt?: Date
}
```

### 3.2 质量评估模块

#### 三维评估体系

##### 维度一：内在质量 (Intrinsic Quality)
评估文档内容的客观质量

**指标**:
1. **解析成功率** (Parse Success Rate)
   - 完整解析: 100分
   - 部分解析: 50-80分
   - 解析失败: 0分

2. **信息密度** (Information Density)
   - 实质性内容占比
   - 公式: (总字数 - 冗余字数) / 总字数 × 100
   - 冗余包括：重复内容、模板文字、无意义标点

3. **代词占比** (Pronoun Ratio)
   - 代词使用频率
   - 过高会影响 AI 理解上下文
   - 理想范围: 2-5%

4. **术语一致性** (Terminology Consistency)
   - 同一概念使用统一术语
   - 使用 NER 识别术语并检查一致性

5. **可读性得分** (Readability Score)
   - 中文使用类似 Flesch-Kincaid 的指标
   - 句子长度、段落结构

6. **错误率** (Error Rate)
   - 语法错误
   - 拼写错误
   - 格式错误

##### 维度二：结构语义 (Structural Semantic)
评估文档的结构化程度和语义清晰度

**指标**:
1. **层次结构完整度** (Hierarchy Completeness)
   - 标题层级是否完整
   - 是否有目录
   - 层级深度是否合理

2. **段落连贯性** (Paragraph Coherence)
   - 段落间逻辑关系
   - 过渡语句使用

3. **列表/表格使用** (List & Table Usage)
   - 结构化数据是否使用表格
   - 枚举项是否使用列表

4. **代码块标注** (Code Block Annotation)
   - 代码是否标注语言
   - 是否有注释

5. **图表质量** (Figure/Table Quality)
   - 图表是否有标题
   - 是否有说明文字

6. **引用完整性** (Reference Integrity)
   - 引用是否有标注
   - 链接是否有效

##### 维度三：消费效果 (Consumption Effect)
评估文档对 AI 的消费友好度

**指标**:
1. **检索友好度** (Retrieval Friendliness)
   - 关键词密度
   - 语义明确性

2. **上下文自包含性** (Context Self-containment)
   - 是否需要外部知识
   - 缩写是否有展开

3. **问答匹配度** (QA Matching Score)
   - 使用评测集测试
   - 问题召回率

4. **向量相似度分布** (Vector Similarity Distribution)
   - 文档内部相似度
   - 过高表示重复，过低表示碎片化

5. **token 效率** (Token Efficiency)
   - 信息量 / token 数量
   - 衡量内容紧凑度

#### 评分计算
```typescript
interface EvaluationScore {
  documentId: string
  overallScore: number // 总分 (0-100)
  
  intrinsic: {
    total: number
    metrics: {
      parseSuccessRate: number
      informationDensity: number
      pronounRatio: number
      terminologyConsistency: number
      readabilityScore: number
      errorRate: number
    }
  }
  
  structural: {
    total: number
    metrics: {
      hierarchyCompleteness: number
      paragraphCoherence: number
      listTableUsage: number
      codeBlockAnnotation: number
      figureQuality: number
      referenceIntegrity: number
    }
  }
  
  consumption: {
    total: number
    metrics: {
      retrievalFriendliness: number
      contextSelfContainment: number
      qaMatchingScore: number
      vectorSimilarityDistribution: number
      tokenEfficiency: number
    }
  }
  
  evaluatedAt: Date
  version: number
}
```

### 3.3 评测集生成模块

#### 功能描述
- 基于文档内容自动生成问答对
- 支持多种问题类型
- 评测集可复用于优化前后对比

#### 生成策略
```typescript
interface TestSuite {
  id: string
  documentId: string
  name: string
  description: string
  questions: TestQuestion[]
  generatedBy: 'auto' | 'manual'
  version: number
  createdAt: Date
}

interface TestQuestion {
  id: string
  type: 'fact' | 'concept' | 'application' | 'comparison' | 'synthesis'
  question: string
  expectedAnswer: string
  referenceSections: string[] // 文档段落 ID
  difficulty: 'easy' | 'medium' | 'hard'
  keywords: string[]
  metadata?: Record<string, any>
}
```

#### 问题类型
1. **事实类** - 提取文档中的事实信息
   - 示例：文档中提到的核心观点是什么？

2. **概念类** - 理解文档中的概念
   - 示例：什么是 X？它有哪些特点？

3. **应用类** - 应用文档知识解决问题
   - 示例：基于文档内容，如何实现 Y？

4. **对比类** - 比较文档中的概念
   - 示例：A 和 B 有什么区别？

5. **综合类** - 综合多个知识点
   - 示例：结合文档内容，分析 Z 的优缺点

### 3.4 文档优化模块

#### 功能描述
- 基于评估结果提供优化建议
- 自动改写文档内容
- 保留原始语义

#### 优化策略
```typescript
interface OptimizationPlan {
  documentId: string
  currentScore: EvaluationScore
  targetScore: number
  actions: OptimizationAction[]
}

interface OptimizationAction {
  type: 'rewrite' | 'restructure' | 'annotate' | 'deduplicate' | 'expand'
  target: string // 文档段落 ID
  reason: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  autoApplicable: boolean
}

interface OptimizedDocument {
  originalId: string
  newId: string
  changes: DocumentChange[]
  scoreImprovement: {
    before: EvaluationScore
    after: EvaluationScore
    delta: number
  }
  createdAt: Date
}

interface DocumentChange {
  section: string
  original: string
  optimized: string
  reason: string
}
```

#### 优化动作类型
1. **rewrite** - 改写内容
   - 降低代词使用
   - 提高信息密度
   - 修正错误

2. **restructure** - 调整结构
   - 添加标题层级
   - 拆分长段落
   - 合并碎片内容

3. **annotate** - 添加标注
   - 标注代码块语言
   - 添加图表说明
   - 展开缩写

4. **deduplicate** - 去重
   - 识别重复段落
   - 合并相似内容

5. **expand** - 扩展内容
   - 补充必要上下文
   - 添加解释说明

### 3.5 向量化评测模块

#### 功能描述
- 对文档进行向量化
- 使用评测集测试向量化效果
- 对比优化前后的效果

#### 测试流程
```
文档向量化 → 存储向量 → 运行测试 → 计算通过率 → 生成报告
```

#### 数据模型
```typescript
interface VectorizedDocument {
  id: string
  documentId: string
  version: 'original' | 'optimized'
  embeddingModel: string
  chunks: VectorChunk[]
  vectorizedAt: Date
}

interface VectorChunk {
  id: string
  content: string
  embedding: number[]
  position: number
  tokenCount: number
}

interface EvaluationRun {
  id: string
  testSuiteId: string
  vectorizedDocumentId: string
  results: TestResult[]
  summary: EvaluationSummary
  executedAt: Date
}

interface TestResult {
  questionId: string
  retrieved: boolean // 是否检索到正确段落
  retrievedChunks: string[] // 检索到的段落 ID
  relevanceScore: number // 相似度得分
  passed: boolean
}

interface EvaluationSummary {
  totalQuestions: number
  passedQuestions: number
  passRate: number
  avgRelevanceScore: number
  metrics: {
    precision: number
    recall: number
    f1Score: number
  }
}
```

## 4. 数据库设计

### 4.1 核心表结构

```sql
-- 文档表
CREATE TABLE documents (
  id VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT,
  file_path VARCHAR(1000),
  raw_content TEXT,
  structured_content JSONB,
  metadata JSONB,
  parse_status VARCHAR(20) DEFAULT 'pending',
  parse_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 文档版本表（用于存储优化后的版本）
CREATE TABLE document_versions (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) REFERENCES documents(id),
  version INT NOT NULL,
  content TEXT NOT NULL,
  structured_content JSONB,
  is_optimized BOOLEAN DEFAULT FALSE,
  optimization_plan JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评测记录表
CREATE TABLE evaluations (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) REFERENCES documents(id),
  document_version_id VARCHAR(255) REFERENCES document_versions(id),
  overall_score DECIMAL(5,2),
  intrinsic_score DECIMAL(5,2),
  structural_score DECIMAL(5,2),
  consumption_score DECIMAL(5,2),
  metrics JSONB,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evaluation_time_ms INT
);

-- 评测集表
CREATE TABLE test_suites (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) REFERENCES documents(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  generated_by VARCHAR(20) DEFAULT 'auto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 测试问题表
CREATE TABLE test_questions (
  id VARCHAR(255) PRIMARY KEY,
  test_suite_id VARCHAR(255) REFERENCES test_suites(id),
  type VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  reference_sections JSONB,
  difficulty VARCHAR(20),
  keywords JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 向量化文档表
CREATE TABLE vectorized_documents (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) REFERENCES documents(id),
  document_version_id VARCHAR(255) REFERENCES document_versions(id),
  version VARCHAR(20) NOT NULL, -- 'original' or 'optimized'
  embedding_model VARCHAR(100) NOT NULL,
  chunking_strategy JSONB,
  total_chunks INT,
  total_tokens INT,
  vectorized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 向量块表
CREATE TABLE vector_chunks (
  id VARCHAR(255) PRIMARY KEY,
  vectorized_document_id VARCHAR(255) REFERENCES vectorized_documents(id),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  position INT NOT NULL,
  token_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评测执行记录表
CREATE TABLE evaluation_runs (
  id VARCHAR(255) PRIMARY KEY,
  test_suite_id VARCHAR(255) REFERENCES test_suites(id),
  vectorized_document_id VARCHAR(255) REFERENCES vectorized_documents(id),
  total_questions INT,
  passed_questions INT,
  pass_rate DECIMAL(5,4),
  avg_relevance_score DECIMAL(5,4),
  metrics JSONB,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INT
);

-- 测试结果明细表
CREATE TABLE test_results (
  id VARCHAR(255) PRIMARY KEY,
  evaluation_run_id VARCHAR(255) REFERENCES evaluation_runs(id),
  question_id VARCHAR(255) REFERENCES test_questions(id),
  retrieved BOOLEAN,
  retrieved_chunks JSONB,
  relevance_score DECIMAL(5,4),
  passed BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_documents_file_type ON documents(file_type);
CREATE INDEX idx_documents_parse_status ON documents(parse_status);
CREATE INDEX idx_evaluations_document_id ON evaluations(document_id);
CREATE INDEX idx_evaluations_score ON evaluations(overall_score);
CREATE INDEX idx_test_suites_document_id ON test_suites(document_id);
CREATE INDEX idx_test_questions_suite_id ON test_questions(test_suite_id);
CREATE INDEX idx_vectorized_documents_doc_id ON vectorized_documents(document_id);
CREATE INDEX idx_vector_chunks_doc_id ON vector_chunks(vectorized_document_id);
CREATE INDEX idx_evaluation_runs_suite_id ON evaluation_runs(test_suite_id);
CREATE INDEX idx_test_results_run_id ON test_results(evaluation_run_id);
```

### 4.2 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Document {
  id                String            @id @default(cuid())
  filename          String
  fileType          String
  fileSize          BigInt?
  filePath          String?
  rawContent        String?           @db.Text
  structuredContent Json?
  metadata          Json?
  parseStatus       String            @default("pending")
  parseError        String?           @db.Text
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  deletedAt         DateTime?
  
  versions          DocumentVersion[]
  evaluations       Evaluation[]
  testSuites        TestSuite[]
  vectorizedDocs    VectorizedDocument[]
  
  @@index([fileType])
  @@index([parseStatus])
}

model DocumentVersion {
  id                String            @id @default(cuid())
  documentId        String
  document          Document          @relation(fields: [documentId], references: [id], onDelete: Cascade)
  version           Int
  content           String            @db.Text
  structuredContent Json?
  isOptimized       Boolean           @default(false)
  optimizationPlan  Json?
  createdAt         DateTime          @default(now())
  
  evaluations       Evaluation[]
  vectorizedDocs    VectorizedDocument[]
  
  @@unique([documentId, version])
  @@index([documentId])
}

model Evaluation {
  id                String            @id @default(cuid())
  documentId        String
  document          Document          @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentVersionId String?
  documentVersion   DocumentVersion?  @relation(fields: [documentVersionId], references: [id], onDelete: SetNull)
  
  overallScore      Decimal           @db.Decimal(5, 2)
  intrinsicScore    Decimal           @db.Decimal(5, 2)
  structuralScore   Decimal           @db.Decimal(5, 2)
  consumptionScore  Decimal           @db.Decimal(5, 2)
  metrics           Json
  
  evaluatedAt       DateTime          @default(now())
  evaluationTimeMs  Int?
  
  @@index([documentId])
  @@index([overallScore])
}

model TestSuite {
  id                String            @id @default(cuid())
  documentId        String
  document          Document          @relation(fields: [documentId], references: [id], onDelete: Cascade)
  name              String
  description       String?           @db.Text
  version           Int               @default(1)
  generatedBy       String            @default("auto")
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  questions         TestQuestion[]
  evaluationRuns    EvaluationRun[]
  
  @@index([documentId])
}

model TestQuestion {
  id                String            @id @default(cuid())
  testSuiteId       String
  testSuite         TestSuite         @relation(fields: [testSuiteId], references: [id], onDelete: Cascade)
  type              String
  question          String            @db.Text
  expectedAnswer    String            @db.Text
  referenceSections Json?
  difficulty        String?
  keywords          Json?
  metadata          Json?
  createdAt         DateTime          @default(now())
  
  testResults       TestResult[]
  
  @@index([testSuiteId])
}

model VectorizedDocument {
  id                String            @id @default(cuid())
  documentId        String
  document          Document          @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentVersionId String?
  documentVersion   DocumentVersion?  @relation(fields: [documentVersionId], references: [id], onDelete: SetNull)
  
  version           String            // 'original' or 'optimized'
  embeddingModel    String
  chunkingStrategy  Json?
  totalChunks       Int
  totalTokens       Int?
  vectorizedAt      DateTime          @default(now())
  
  chunks            VectorChunk[]
  evaluationRuns    EvaluationRun[]
  
  @@index([documentId])
  @@index([documentVersionId])
}

model VectorChunk {
  id                    String            @id @default(cuid())
  vectorizedDocumentId  String
  vectorizedDocument    VectorizedDocument @relation(fields: [vectorizedDocumentId], references: [id], onDelete: Cascade)
  content               String            @db.Text
  embedding             Unsupported("vector(1536)")?
  position              Int
  tokenCount            Int?
  createdAt             DateTime          @default(now())
  
  @@index([vectorizedDocumentId])
}

model EvaluationRun {
  id                    String            @id @default(cuid())
  testSuiteId           String
  testSuite             TestSuite         @relation(fields: [testSuiteId], references: [id], onDelete: Cascade)
  vectorizedDocumentId  String
  vectorizedDocument    VectorizedDocument @relation(fields: [vectorizedDocumentId], references: [id], onDelete: Cascade)
  
  totalQuestions        Int
  passedQuestions       Int
  passRate              Decimal           @db.Decimal(5, 4)
  avgRelevanceScore     Decimal           @db.Decimal(5, 4)
  metrics               Json?
  
  executedAt            DateTime          @default(now())
  executionTimeMs       Int?
  
  testResults           TestResult[]
  
  @@index([testSuiteId])
  @@index([vectorizedDocumentId])
}

model TestResult {
  id                String            @id @default(cuid())
  evaluationRunId   String
  evaluationRun     EvaluationRun     @relation(fields: [evaluationRunId], references: [id], onDelete: Cascade)
  questionId        String
  question          TestQuestion      @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  retrieved         Boolean
  retrievedChunks   Json?
  relevanceScore    Decimal           @db.Decimal(5, 4)
  passed            Boolean
  
  createdAt         DateTime          @default(now())
  
  @@unique([evaluationRunId, questionId])
  @@index([evaluationRunId])
  @@index([questionId])
}
```

## 5. API 设计

### 5.1 RESTful API 端点

#### 文档管理
```
POST   /api/documents              - 上传文档
GET    /api/documents              - 获取文档列表
GET    /api/documents/:id          - 获取文档详情
DELETE /api/documents/:id          - 删除文档
POST   /api/documents/:id/reparse  - 重新解析文档
```

#### 质量评估
```
POST   /api/evaluations                    - 创建评测任务
GET    /api/evaluations                    - 获取评测列表
GET    /api/evaluations/:id                - 获取评测详情
GET    /api/documents/:id/evaluations      - 获取文档的所有评测
```

#### 评测集管理
```
POST   /api/test-suites                    - 生成评测集
GET    /api/test-suites                    - 获取评测集列表
GET    /api/test-suites/:id                - 获取评测集详情
PUT    /api/test-suites/:id                - 更新评测集
DELETE /api/test-suites/:id                - 删除评测集
POST   /api/test-suites/:id/questions      - 添加测试问题
```

#### 文档优化
```
POST   /api/optimizations                  - 创建优化任务
GET    /api/optimizations/:id              - 获取优化详情
POST   /api/optimizations/:id/apply        - 应用优化
GET    /api/documents/:id/versions         - 获取文档版本列表
GET    /api/documents/:id/versions/:vid    - 获取特定版本
```

#### 向量化评测
```
POST   /api/vectorizations                 - 创建向量化任务
GET    /api/vectorizations/:id             - 获取向量化详情
POST   /api/evaluation-runs                - 执行评测
GET    /api/evaluation-runs/:id            - 获取评测结果
GET    /api/evaluation-runs/compare        - 对比评测结果
```

### 5.2 API 响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}

// 错误响应
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// 分页响应
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

## 6. 前端界面设计

### 6.1 页面结构

```
/                       - 首页/仪表盘
/documents              - 文档列表
/documents/:id          - 文档详情（解析结果+评分）
/documents/:id/evaluate - 质量评估
/documents/:id/optimize - 文档优化
/documents/:id/compare  - 版本对比

/test-suites            - 评测集列表
/test-suites/:id        - 评测集详情

/evaluations            - 评测执行
/evaluations/compare    - 评测对比

/settings               - 设置
```

### 6.2 核心组件

#### 文档上传组件
- 拖拽上传
- 多文件上传
- 格式验证
- 上传进度

#### 评分展示组件
- 三维雷达图
- 指标详情列表
- 历史趋势图
- 同类对比

#### 评测结果对比组件
- 并排对比视图
- 差异高亮
- 通过率图表
- 改进建议

#### 文档编辑器组件
- Markdown 编辑
- 实时评分预览
- 优化建议提示
- 版本管理

## 7. 开发计划

### 7.1 开发阶段划分

#### 第一阶段：基础架构（2周）
- [ ] 项目初始化和配置
- [ ] 数据库设计和迁移
- [ ] 基础 API 框架搭建
- [ ] 文档上传和解析功能

#### 第二阶段：质量评估（2周）
- [ ] 实现内在质量指标计算
- [ ] 实现结构语义指标计算
- [ ] 实现消费效果指标计算
- [ ] 评分引擎和 API 开发
- [ ] 前端评分展示界面

#### 第三阶段：评测集生成（1.5周）
- [ ] 评测集生成算法
- [ ] 问题生成 LLM 集成
- [ ] 评测集管理 API
- [ ] 前端评测集界面

#### 第四阶段：文档优化（2周）
- [ ] 优化建议生成算法
- [ ] LLM 文档改写集成
- [ ] 版本管理功能
- [ ] 前端优化界面

#### 第五阶段：向量化评测（2周）
- [ ] 文档分块策略
- [ ] Embedding API 集成
- [ ] 向量存储和检索
- [ ] 评测执行引擎
- [ ] 前端评测对比界面

#### 第六阶段：优化和部署（1周）
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 测试覆盖
- [ ] 部署和文档

**总计：约 10.5 周**

### 7.2 技术难点和解决方案

#### 难点 1：文档解析的准确性
**问题**：不同格式文档解析可能丢失信息或产生错误
**解决方案**：
- 使用成熟的解析库
- 建立解析结果校验机制
- 支持手动修正

#### 难点 2：评分指标的合理性
**问题**：如何设计科学合理的评分指标
**解决方案**：
- 参考学术研究和行业标准
- 建立指标权重可配置机制
- 持续迭代优化

#### 难点 3：评测集生成的质量
**问题**：自动生成的问题质量参差不齐
**解决方案**：
- 使用高质量 LLM（GPT-4）
- 多轮对话优化问题
- 支持人工审核和编辑

#### 难点 4：向量化效果评估
**问题**：如何客观评估向量检索效果
**解决方案**：
- 建立多样化评测集
- 使用多维度评估指标
- 对比不同 Embedding 模型

#### 难点 5：文档优化不改变原意
**问题**：优化改写可能改变文档语义
**解决方案**：
- 使用保守的改写策略
- 保留原文对比功能
- 支持人工审核

## 8. 扩展性设计

### 8.1 插件化架构
- 支持自定义评分指标插件
- 支持自定义文档解析器
- 支持自定义 Embedding 模型

### 8.2 配置化
- 评分权重可配置
- 分块策略可配置
- 问题生成策略可配置

### 8.3 扩展功能规划
- 批量文档评估
- 定期重测机制
- 评测报告导出
- API 开放接口
- 团队协作功能

## 9. 部署架构

### 9.1 开发环境
```
PostgreSQL (本地)
Next.js Dev Server
Python 微服务 (文档解析)
```

### 9.2 生产环境
```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│ Next  │ │ Next  │
│ App 1 │ │ App 2 │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │PostgreSQL│
    │ + pgvector│
    └──────────┘
```

## 10. 安全性考虑

### 10.1 文件上传安全
- 文件类型白名单
- 文件大小限制
- 病毒扫描集成

### 10.2 数据安全
- 敏感信息脱敏
- 数据库访问控制
- 定期备份机制

### 10.3 API 安全
- 请求频率限制
- 身份认证和授权
- 输入验证和过滤

## 11. 监控和日志

### 11.1 性能监控
- API 响应时间
- 文档解析时间
- 向量化耗时

### 11.2 错误日志
- 解析失败日志
- 评测异常日志
- 系统错误日志

### 11.3 使用统计
- 文档上传量
- 评测执行次数
- 用户活跃度

---

## 附录：参考文献

1. [Evaluating RAG Applications](https://www.pinecone.io/learn/evaluating-rag-applications/)
2. [Document Quality Metrics](https://arxiv.org/abs/2305.11991)
3. [RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217)
4. [pgvector Documentation](https://github.com/pgvector/pgvector)
5. [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
