# Java Agent Prototype

> 本地化AI Agent系统 - 意图经济与A2A协议探索
>
> Java 25 + Spring Boot 4.0

---

## 🎯 项目目标

构建一个**本地化、可控的AI Agent系统**，探索：

1. **意图经济** - 意图分析、分类、执行
2. **A2A协议** - Agent间通信标准
3. **本地化控制** - 完全可控，不依赖外部SaaS
4. **Markdown优先** - Agent定义和记忆都用Markdown

---

## 🏗️ 项目结构

```
java-agent-prototype/
├── pom.xml                              # Maven配置（Spring Boot 4.0 + Java 25）
├── README.md                             # 项目文档
├── .gitignore                            # Git忽略
├── run.sh                                # 启动脚本
├── src/main/java/com/cola/agent/
│   ├── Application.java                    # 主类
│   ├── config/
│   │   ├── WorkspaceConfig.java          # 工作空间配置
│   │   ├── LLMConfig.java               # LLM配置
│   │   └── AgentConfig.java             # Agent配置
│   ├── core/
│   │   ├── Agent.java                   # Agent核心类
│   │   └── AgentLoader.java            # Agent加载器（Markdown解析）
│   └── memory/
│       ├── MemoryStore.java             # 记忆存储接口
│       ├── AlwaysLoadedMemory.java      # Tier 1记忆
│       ├── DailyContextMemory.java      # Tier 2记忆
│       ├── DeepKnowledgeMemory.java     # Tier 3记忆
│       └── MemoryService.java          # 记忆服务
├── src/main/resources/
│   └── application.yaml                 # 应用配置
└── agents/                              # Agent定义（Markdown目录）
    └── assistant.md                    # 示例Agent
```

---

## 🚀 快速开始

### 前置要求

- **Java 25** 或更高
- **Maven 3.9** 或更高
- **Spring Boot 4.0**
- **API Key**（至少一个）：
  - OpenAI API Key（推荐）
  - Anthropic API Key
  - DeepSeek API Key

### 安装与运行

```bash
# 1. 克隆或进入项目目录
cd ~/code/java-agent-prototype

# 2. 配置环境变量（推荐使用.env文件）
export OPENAI_API_KEY=your-openai-key-here
export ANTHROPIC_API_KEY=your-anthropic-key-here
export AGENT_WORKSPACE=~/.openclaw/workspace

# 3. 编译项目
mvn clean package

# 4. 运行应用
mvn spring-boot:run

# 或直接运行JAR
java -jar target/java-agent-prototype-0.1.0.jar
```

### 配置

**application.yaml** 主要配置：

```yaml
spring:
  workspace:
    base-dir: ~/.openclaw/workspace
    agents-dir: agents
    memory-dir: workspace/memory

agent:
  default-model: openai:gpt-5.2
  default-temperature: 0.7
  default-max-tokens: 4000

a2a:
  enabled: true
  discovery:
    enabled: true
    port: 9090

memory:
  always-loaded:
    max-size: 100
  daily-context:
    retention-days: 7
  deep-knowledge:
    enabled: true
    vector-search-enabled: true
```

---

## 📋 Agent定义格式

### Markdown示例

```markdown
---
name: assistant
model: openai:gpt-5.2
temperature: 0.7
max_tokens: 4000
system_prompt: |
  You are a helpful assistant...
---

## Role
你的角色描述...

## Capabilities
- 能力1
- 能力2

## Preferences
- 偏好1
- 偏好2

## Memory Guidelines
记忆指导原则...
```

### Frontmatter字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | String | ✅ | Agent名称 |
| `model` | String | ✅ | 模型标识（provider:model）|
| `temperature` | Double | ❌ | 温度参数（0.0-1.0）|
| `max_tokens` | Integer | ❌ | 最大token数 |
| `system_prompt` | String | ❌ | 系统提示词 |

### Body部分

- `## Role` - 角色描述
- `## Capabilities` - 能力列表
- `## Preferences` - 偏好设置
- `## Memory Guidelines` - 记忆指导

---

## 🎯 核心特性

### ✅ Phase 1: 核心框架（已完成）
- [x] Maven项目初始化
- [x] Spring Boot 4.0 + Java 25配置
- [x] 工作空间配置（WorkspaceConfig）
- [x] LLM配置（LLMConfig）
- [x] Agent配置（AgentConfig）
- [x] Agent核心类（Agent.java）
- [x] Agent加载器（AgentLoader）
- [x] 示例Agent定义（assistant.md）

### ✅ Phase 2: 记忆系统（已完成）
- [x] MemoryStore接口
- [x] AlwaysLoadedMemory（Tier 1 - MEMORY.md）
- [x] DailyContextMemory（Tier 2 - YYYY-MM-DD.md）
- [x] DeepKnowledgeMemory（Tier 3 - people/projects/topics/decisions）
- [x] MemoryService（统一记忆服务）

### ✅ Phase 3: 意图分析（已完成）
- [x] IntentAnalyzer类
- [x] 意图分类（QUERY, EXECUTE, EXPLORE, COLLABORATE, REMEMBER, NEGOTIATE）
- [x] 意图提取和参数解析

### ✅ Phase 4: A2A协议（已完成）
- [x] A2AProtocol接口
- [x] HTTP通信支持
- [ ] gRPC通信支持（可选）
- [x] Agent发现机制
- [x] Agent协调和工作流

### ✅ Phase 5: LLM客户端（已完成）
- [x] LLMClient统一接口
- [x] OpenAI客户端实现
- [ ] Anthropic客户端实现（可选）
- [ ] DeepSeek客户端实现（可选）
- [x] 流式响应支持（SSE，框架已支持）

---

## 🧠 三层记忆架构

### Tier 1: Always-Loaded Memory
- **文件**: MEMORY.md
- **大小**: ~100行
- **特点**: 核心essentials，常驻内存
- **用途**: 最重要、最常用的信息

### Tier 2: Daily Context Memory
- **文件**: YYYY-MM-DD.md（今天+昨天）
- **特点**: 最近上下文，追加写入
- **用途**: 最近的对话、任务、事件

### Tier 3: Deep Knowledge Memory
- **文件**: people/{name}.md, projects/{name}.md, topics/{name}.md, decisions/{name}.md
- **特点**: 长期知识，关键词搜索
- **用途**: 领域知识、项目信息、决策历史

---

## 🔧 技术栈

- **Java 25** - 最新Java版本（虚拟线程、模式匹配、Records）
- **Spring Boot 4.0** - 现代Spring框架
- **Spring AI 2.0** - AI集成和向量存储（规划中）
- **Project Lombok** - 减少样板代码
- **Jackson** - JSON/YAML序列化
- **WebFlux** - 响应式编程（支持A2A流式响应）

---

## 📊 实施进度

| Phase | 描述 | 状态 | 完成 |
|-------|------|------|------|
| Phase 1 | 核心框架 | ✅ 已完成 | 2026-03-03 16:06 |
| Phase 2 | 记忆系统 | ✅ 已完成 | 2026-03-03 16:50 |
| Phase 3 | 意图分析 | ✅ 已完成 | 2026-03-04 22:00 |
| Phase 4 | A2A协议 | ✅ 已完成 | 2026-03-04 22:15 |
| Phase 5 | LLM客户端 | ✅ 已完成 | 2026-03-04 22:20 |

---

## 📝 开发者

- **作者**: 可乐 (Cola)
- **维护者**: 波哥
- **版本**: 0.1.0 (Phase 2 - 记忆系统)
- **许可证**: MIT

---

*最后更新：2026-03-03*
*状态：Phase 2完成，准备Phase 3*
