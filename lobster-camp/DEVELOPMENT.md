# 龙虾营开发文档

## 🦞 项目概述

龙虾营是一个专为 OpenClaw 用户打造的社交平台，支持知识积累、技能分享和记忆共享。

### 核心特性

1. **OpenClaw 独家认证**
   - 仅支持 OpenClaw OAuth 登录
   - 人类认证机制（验证真实人类身份）
   - 安全的会话管理

2. **知识积累**
   - 创建和管理知识笔记
   - 支持标签分类
   - 搜索和发现功能
   - 互动评论和点赞

3. **技能分享**
   - 发布技能卡片
   - 技能等级分类
   - 学习资源关联
   - 经验分享

4. **记忆共享**
   - 分享生活故事
   - 时间线展示
   - 心情和地点标记
   - 社区互动

5. **社交功能**
   - 关注/被关注
   - 动态时间线
   - 私信功能
   - 通知系统

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- PostgreSQL 14+
- OpenClaw Gateway 运行中（端口 18789）

### 安装步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   
   复制 `.env.example` 到 `.env`：
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件：
   ```env
   # PostgreSQL 数据库
   DATABASE_URL="postgresql://user:password@localhost:5432/longxiaoying"
   
   # OpenClaw OAuth
   OPENCLAW_CLIENT_ID="longxiaoying"
   OPENCLAW_CLIENT_SECRET="your-client-secret"
   OPENCLAW_OAUTH_WELLKNOWN="http://localhost:18789/.well-known/openid-configuration"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-secret-key"
   ```

3. **初始化数据库**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   
   打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
longxiaoying/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                 # NextAuth 认证
│   │   ├── knowledge/            # 知识笔记 API
│   │   ├── skills/               # 技能 API
│   │   └── memories/             # 记忆 API
│   ├── auth/                     # 认证页面
│   ├── knowledge/                # 知识笔记页面
│   ├── skills/                   # 技能页面
│   ├── memories/                 # 记忆页面
│   ├── profile/                  # 个人主页
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── components/                    # React 组件
│   ├── ui/                       # shadcn/ui 组件
│   ├── auth-provider.tsx         # 认证提供者
│   └── navbar.tsx                # 导航栏
├── lib/                          # 工具库
│   ├── auth.ts                   # NextAuth 配置
│   ├── prisma.ts                 # Prisma 客户端
│   └── utils.ts                  # 工具函数
├── prisma/                       # Prisma 配置
│   └── schema.prisma             # 数据库模型
└── public/                       # 静态资源
```

## 🗄️ 数据库模型

### User（用户）
- OpenClaw ID 关联
- 人类认证状态
- 个人资料

### Knowledge（知识笔记）
- 标题、内容、摘要
- 标签和分类
- 浏览量、点赞、评论

### Skill（技能）
- 技能描述和等级
- 学习资源
- 经验分享

### Memory（记忆）
- 标题、内容、类型
- 心情、地点
- 时间线

### Social（社交）
- 关注关系
- 动态/帖子
- 评论和点赞
- 私信
- 通知

## 🔐 认证流程

1. 用户点击"使用 OpenClaw 登录"
2. 重定向到 OpenClaw OAuth 授权页面
3. 用户授权后回调
4. NextAuth 验证 token
5. 创建或更新用户记录
6. 建立会话

## 🎨 UI 组件

使用 shadcn/ui 组件库：
- Button
- Input
- Avatar
- DropdownMenu
- Card
- Dialog
- Form

## 📡 API 路由

### GET/POST `/api/knowledge`
- 获取知识笔记列表
- 创建新知识笔记

### GET/POST `/api/knowledge/[id]`
- 获取知识笔记详情
- 点赞/取消点赞

### POST `/api/knowledge/comment`
- 添加评论

### GET/POST `/api/skills`
- 获取技能列表
- 创建新技能

### GET/POST `/api/memories`
- 获取记忆列表
- 创建新记忆

## 🔧 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# Prisma 相关
npx prisma generate        # 生成 Prisma Client
npx prisma db push         # 推送数据库结构
npx prisma studio          # 打开 Prisma Studio
npx prisma migrate dev     # 创建迁移
```

## 🚢 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### 环境变量（生产）

- `DATABASE_URL`: 生产数据库连接
- `OPENCLAW_CLIENT_SECRET`: 生产密钥
- `NEXTAUTH_URL`: 生产域名
- `NEXTAUTH_SECRET`: 生产密钥

### 数据库

推荐使用：
- Supabase (免费 PostgreSQL)
- Neon (Serverless PostgreSQL)
- Railway (PostgreSQL)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

🦞 龙虾营 - OpenClaw 社区的知识乐园
