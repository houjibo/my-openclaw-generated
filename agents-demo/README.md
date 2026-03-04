# Agents Demo - Agent框架验证项目

基于 Java Agent Framework 的多Agent演示应用，验证框架的核心能力。

## 🎯 验证目标

1. ✅ **意图分析** - 准确识别用户请求类型
2. ✅ **Agent路由** - 根据意图选择合适Agent
3. ✅ **多Agent协作** - 不同Agent处理不同任务
4. ✅ **LLM集成** - 使用Kimi K2.5生成响应
5. ✅ **配置驱动** - Markdown配置定义Agent

## 🚀 快速开始

### 1. 配置API Key
```bash
export MOONSHOT_API_KEY=your-api-key
```

### 2. 编译运行
```bash
cd ~/code/agents-demo
mvn clean package
java -jar target/agents-demo-1.0.0.jar
```

### 3. 测试API

#### 查看可用Agent
```bash
curl http://localhost:8080/api/demo/agents
```

#### 测试意图分析
```bash
curl -X POST http://localhost:8080/api/demo/intent \
  -H "Content-Type: application/json" \
  -d '{"input":"List files in current directory"}'
```

#### 测试Agent对话
```bash
curl -X POST http://localhost:8080/api/demo/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Research Java 25 features"}'
```

#### 批量测试
```bash
curl -X POST http://localhost:8080/api/demo/batch
```

## 📊 测试场景

### 场景1: 文件管理
```bash
curl -X POST http://localhost:8080/api/demo/chat \
  -d '{"message":"List all files"}'
```
- **预期**: 路由到 file-manager Agent
- **验证**: 意图=EXECUTE, Agent=file-manager

### 场景2: 技术研究
```bash
curl -X POST http://localhost:8080/api/demo/chat \
  -d '{"message":"Research intent economy"}'
```
- **预期**: 路由到 researcher Agent
- **验证**: 意图=EXPLORE, Agent=researcher

### 场景3: 代码审查
```bash
curl -X POST http://localhost:8080/api/demo/chat \
  -d '{"message":"Review this code"}'
```
- **预期**: 路由到 coder Agent
- **验证**: 意图=QUERY, Agent=coder

## 🏗️ 架构

```
agents-demo/
├── src/main/java/com/cola/agents/demo/
│   ├── AgentsDemoApplication.java     # 启动类
│   ├── MultiAgentDemo.java            # 演示核心类
│   └── controller/
│       └── DemoController.java        # REST API
│
├── src/main/java/com/cola/agent/      # Agent框架
│   ├── intent/                        # 意图分析
│   ├── llm/                           # LLM客户端
│   ├── core/                          # 核心框架
│   └── ...
│
└── src/main/resources/agents/         # Agent配置
    ├── assistant.md                   # 通用助手
    ├── file-manager.md                # 文件管理
    ├── researcher.md                  # 研究员
    ├── coder.md                       # 程序员
    ├── writer.md                      # 写手
    └── agents-config.yml              # 注册配置
```

## ✅ 验证清单

### 框架功能验证
- [ ] Agent配置加载（Markdown）
- [ ] 意图分析（5种类型）
- [ ] Agent路由选择
- [ ] LLM调用（Kimi K2.5）
- [ ] 响应生成

### API测试
- [ ] GET /api/demo/agents
- [ ] POST /api/demo/intent
- [ ] POST /api/demo/chat
- [ ] POST /api/demo/batch
- [ ] GET /api/demo/health

### 场景测试
- [ ] 文件管理场景
- [ ] 技术研究场景
- [ ] 代码审查场景
- [ ] 文档写作场景

## 📈 预期结果

### 意图分析准确率
| 输入类型 | 预期意图 | 准确率目标 |
|---------|---------|-----------|
| "List files" | EXECUTE | >80% |
| "Research..." | EXPLORE | >80% |
| "What is..." | QUERY | >80% |
| "Write..." | EXECUTE | >70% |

### 响应时间
| 操作 | 目标 | 可接受 |
|-----|------|--------|
| 意图分析 | <10ms | <50ms |
| Agent选择 | <5ms | <20ms |
| LLM调用 | 2-5s | <10s |
| 总响应 | 2-5s | <10s |

## 🎉 验证结论

如果所有测试通过，证明：

1. ✅ **框架可用** - 核心功能正常工作
2. ✅ **易于使用** - 配置驱动，API简洁
3. ✅ **可扩展** - 易于添加新Agent
4. ✅ **实用** - 能解决实际问题

**框架验证通过，可用于生产开发！**

## 📚 相关项目

- [java-agent-prototype](../java-agent-prototype) - Agent框架核心
- [file-manager-agent](../file-manager-agent) - 文件管理应用
