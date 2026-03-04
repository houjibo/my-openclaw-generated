# 🎯 意图管理系统

一个基于意图本体建模和意图网络的 AI 原生软件工程平台。

## 🌟 核心特性

### 意图网络
- 🌐 **意图关系网络** - 意图之间有明确的关系（前置、下一步、替代、冲突）
- 🤖 **智能推荐** - 基于网络关系和上下文的智能意图推荐
- 🛤️ **路径规划** - 查找最短路径、所有路径
- ⚠️ **冲突检测** - 自动检测意图冲突
- 💾 **持久化** - 支持保存和加载意图网络

### AI 集成
- 🧠 **GLM-4.7 集成** - 真实的大语言模型意图理解
- 🔁 **规则回退** - LLM 失败时自动回退到规则引擎
- 📊 **置信度评估** - 智能的置信度计算

### 交互式体验
- 📦 **黑盒子模式** - 拖入文件/文件夹，自动识别并推荐操作
- 🎨 **美观界面** - 彩色终端界面，置信度可视化
- 🖼️ **Web 可视化** - 交互式意图网络图谱

## 📦 快速开始

### 安装依赖

```bash
cd ~/code/intent-management
npm install
```

### 编译

```bash
npm run build
```

## 🚀 使用方法

### 1. 黑盒子模式

```bash
# 文件夹操作
node dist/index.js ~/Documents

# Maven 项目
node dist/index.js ~/code/project/pom.xml

# Node.js 项目
node dist/index.js ~/code/project/package.json
```

### 2. 网络演示

```bash
node dist/demo-network.js
```

输出示例：
```
📦 创建意图网络...
   已注册 12 个意图
   已定义 13 个关系

📂 按分类的意图：

  folder:
    • open_folder: 打开文件夹
    • explore_folder: 探索文件夹
    • compress_folder: 压缩文件夹
    • delete_folder: 删除文件夹

  maven:
    • analyze_content: 分析项目内容
    • analyze_dependencies: 分析依赖
    • test_project: 运行测试
    • build_project: 构建项目

  nodejs:
    • analyze_package: 分析 package.json
    • install_dependencies: 安装依赖
    • test_nodejs: 运行测试
    • build_nodejs: 构建项目
```

### 3. Web 可视化

```bash
# 启动 HTTP 服务器
cd ~/code/intent-management
python3 -m http.server 8080

# 访问浏览器
open http://localhost:8080/web/index.html
```

功能：
- 🖱️ 交互式网络图
- 📊 关系类型图例
- 👆 点击节点查看详情
- 🔍 缩放和平移

### 4. 生成网络图

```bash
# 使用 Graphviz 生成 PNG
dot -Tpng output/intent-network.dot -o output/intent-network.png

# 或使用在线工具
# 访问 https://dreampuf.github.io/GraphvizOnline/
# 粘贴 output/intent-network.dot 的内容
```

## 🌐 意图网络架构

### 关系类型

| 类型 | 说明 | 颜色 |
|-----|------|------|
| NEXT_STEP | 下一步 | 🟢 绿色 |
| PREREQUISITE | 前置条件 | 🔵 蓝色 |
| ALTERNATIVE | 替代方案 | 🟠 橙色 |
| RELATED | 相关 | ⚪ 灰色 |
| CONFLICT | 冲突 | 🔴 红色 |
| REQUIRES | 依赖 | 🟣 紫色 |

### 网络示例

```
[analyze_content]
      ↓ (NEXT_STEP, 0.9)
[analyze_dependencies]
      ↓ (NEXT_STEP, 0.9)
[build_project]
```

## 📁 项目结构

```
~/code/intent-management/
├── src/
│   ├── models/
│   │   └── intent.ts                  # 意图本体模型
│   ├── network/                       # 意图网络模块
│   │   ├── types.ts                   # 网络类型
│   │   ├── intent-network.ts           # 网络核心
│   │   ├── registry.ts                # 注册表
│   │   ├── index.ts                   # 统一导出
│   │   └── scenarios/
│   │       ├── folder-scenario.ts      # 文件夹场景
│   │       ├── maven-scenario.ts      # Maven 场景
│   │       └── nodejs-scenario.ts     # Node.js 场景
│   ├── recognizers/
│   │   ├── base.ts
│   │   └── llm-recognizer.ts
│   ├── demo/
│   │   ├── folder-intents.ts
│   │   └── pom-intents.ts
│   ├── utils/
│   │   ├── file-detector.ts
│   │   └── context-inferencer.ts
│   ├── ui/
│   │   └── interactive-menu.ts
│   ├── llm-client.ts
│   ├── index.ts                       # 主入口（黑盒子）
│   └── demo-network.ts                # 网络演示
├── web/
│   └── index.html                     # Web 可视化
├── output/
│   ├── intent-network.dot
│   └── intent-network.json
├── dist/
├── package.json
└── tsconfig.json
```

## 🔧 技术栈

- **TypeScript** - 类型安全的开发
- **Node.js** - 运行时环境
- **GLM-4.7** - 大语言模型
- **inquirer** - 交互式终端
- **chalk** - 彩色输出
- **Cytoscape.js** - 网络可视化

## 🎯 支持的场景

### 文件夹场景
- 打开文件夹
- 探索文件夹
- 压缩文件夹
- 删除文件夹

### Maven 场景
- 分析项目内容
- 分析依赖
- 运行测试
- 构建项目

### Node.js 场景
- 分析 package.json
- 安装依赖
- 运行测试
- 构建项目

## 📊 统计数据

- **意图总数**: 12
- **关系总数**: 13
- **场景数**: 3 (folder, maven, nodejs)
- **关系类型**: 6

## 🎓 设计理念

### 意图网络

意图不再孤立，而是形成网络：

```
节点（Intent）+ 边（Relationship）= 意图网络

节点 → 意图定义
边 → 意图关系
权重 → 关系强度
类型 → 关系类型
```

### 核心价值

1. **关系明确** - 意图之间有清晰的关系定义
2. **智能推荐** - 基于网络拓扑的推荐算法
3. **路径规划** - 自动规划最优执行路径
4. **冲突检测** - 防止不一致的操作
5. **可视化** - 直观展示意图网络

## 🚀 开发计划

- [ ] 添加更多场景（Python, Go, Rust）
- [ ] 实现意图链式执行
- [ ] 添加意图版本管理
- [ ] 实现基于用户反馈的意图优化
- [ ] 开发完整的 Web 应用

## 📝 许可证

MIT

---

Created by Cola 🥤
