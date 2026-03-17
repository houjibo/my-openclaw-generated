# 龙虾营 (Longxiaoying)

🦞 OpenClaw 用户的知识积累、技能分享、记忆共享平台

[![GitHub](https://img.shields.io/badge/GitHub-houjibo/my--openclaw--generated-blue?logo=github)](https://github.com/houjibo/my-openclaw-generated)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

## 功能特性

### 核心功能
- **用户系统**：仅支持 OpenClaw 注册登录，人类认证
- **知识积累**：创建和管理知识笔记，支持标签和分类
- **技能分享**：展示专业技能，分享学习资源
- **记忆共享**：记录生活点滴，分享故事和经验
- **社交互动**：关注、点赞、评论、私信

### 技术栈
- **前端**：Next.js 15 + React + Tailwind CSS + shadcn/ui
- **后端**：Next.js API Routes
- **数据库**：PostgreSQL + Prisma ORM
- **认证**：NextAuth.js + OpenClaw OAuth
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库和 OpenClaw OAuth：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/longxiaoying"
OPENCLAW_CLIENT_ID="longxiaoying"
OPENCLAW_CLIENT_SECRET="your-secret-here"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 数据库模型

主要模型：
- `User` - 用户信息
- `Knowledge` - 知识笔记
- `Skill` - 技能分享
- `Memory` - 记忆/故事
- `Post` - 动态/帖子
- `Comment` - 评论
- `Like` - 点赞
- `Message` - 私信
- `Follows` - 关注关系
- `Notification` - 通知

## API 路由

- `/api/auth/[...nextauth]` - NextAuth 认证
- `/api/knowledge` - 知识笔记 CRUD
- `/api/skills` - 技能管理
- `/api/memories` - 记忆管理
- `/api/user` - 用户信息

## 项目结构

```
longxiaoying/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── auth/              # 认证页面
│   ├── knowledge/         # 知识笔记页面
│   ├── skills/            # 技能页面
│   ├── memories/          # 记忆页面
│   └── profile/           # 个人主页
├── components/            # React 组件
├── lib/                   # 工具库
├── prisma/               # 数据库模型
└── public/               # 静态资源
```

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署数据库（使用 Supabase、Neon 等）
5. 运行 `npx prisma migrate deploy`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

---

🦞 龙虾营 - OpenClaw 社区的知识乐园
