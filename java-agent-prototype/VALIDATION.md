# Java Agent Prototype - 验证指南

## 🎯 验证目标

验证框架的可用性和实用性，确保：
1. ✅ 所有组件能正常编译和运行
2. ✅ 核心功能按预期工作
3. ✅ 集成场景能正常处理
4. ✅ 性能满足基本要求

---

## 📋 验证清单

### 1. 编译验证

```bash
# 进入项目目录
cd ~/code/java-agent-prototype

# 编译项目
mvn clean compile

# 预期结果：BUILD SUCCESS
```

**验证点：**
- [ ] 无编译错误
- [ ] 所有依赖正确下载
- [ ] 无警告（或警告可接受）

---

### 2. 单元测试

```bash
# 运行单元测试
mvn test

# 预期结果：Tests run: X, Failures: 0, Errors: 0
```

**测试覆盖：**
- [ ] IntentAnalyzer - 意图分类准确性
- [ ] AgentRegistry - 注册/发现/心跳
- [ ] MemoryService - 三层记忆存储
- [ ] LLMService - 多Provider切换

---

### 3. 集成测试

#### 3.1 意图分析流程

```bash
# 运行意图分析测试
mvn test -Dtest=IntentIntegrationTest
```

**测试场景：**
| 输入 | 预期意图 | 置信度 |
|------|---------|--------|
| "What is Java 25?" | QUERY | >0.7 |
| "Create a new agent" | EXECUTE | >0.8 |
| "Explore AI trends" | EXPLORE | >0.7 |
| "Remember this decision" | REMEMBER | >0.8 |

#### 3.2 A2A通信测试

```bash
# 启动两个Agent实例
# 实例1（端口8080）
java -jar target/java-agent-prototype.jar --server.port=8080 --agent.id=agent1

# 实例2（端口8081）
java -jar target/java-agent-prototype.jar --server.port=8081 --agent.id=agent2

# 测试通信
curl -X POST http://localhost:8080/a2a/send \
  -H "Content-Type: application/json" \
  -d '{"from":"agent1","to":"agent2","payload":"Hello"}'
```

#### 3.3 LLM客户端测试

```bash
# 配置API Key
export MOONSHOT_API_KEY=your-key-here
export OPENAI_API_KEY=your-key-here

# 运行LLM测试
mvn test -Dtest=LLMIntegrationTest
```

**验证点：**
- [ ] Moonshot API调用成功
- [ ] OpenAI API调用成功
- [ ] 响应格式正确
- [ ] Token计数准确

---

### 4. 端到端场景测试

#### 场景1：完整对话流程

```java
// 测试代码
@Test
public void testCompleteConversation() {
    // 1. 用户发送消息
    String userInput = "What is the intent economy?";
    
    // 2. 分析意图
    Intent intent = intentService.analyze(userInput);
    assertEquals(IntentType.QUERY, intent.getType());
    
    // 3. 查询记忆
    String context = memoryService.getRelevantContext(intent);
    
    // 4. 调用LLM
    LLMResponse response = llmService.chat(
        List.of(LLMMessage.user(userInput)),
        "moonshot",
        "kimi-k2.5"
    );
    
    // 5. 存储到记忆
    memoryService.addToDailyContext(userInput + " -> " + response.getContent());
    
    // 验证
    assertNotNull(response.getContent());
    assertTrue(response.getContent().length() > 0);
}
```

#### 场景2：Agent协作

```java
@Test
public void testAgentCollaboration() {
    // 1. 注册多个Agent
    AgentDescriptor researcher = AgentDescriptor.withCapabilities(
        "researcher", "Research Agent", "http://localhost:8081",
        "research", "analysis"
    );
    AgentDescriptor writer = AgentDescriptor.withCapabilities(
        "writer", "Writer Agent", "http://localhost:8082",
        "writing", "editing"
    );
    
    a2aService.registerAgent(researcher);
    a2aService.registerAgent(writer);
    
    // 2. 协调任务
    String task = "Research and write about AI trends";
    List<A2AMessage> results = coordinator.coordinate(
        task,
        AgentCoordinator.CoordinationPattern.PIPELINE,
        List.of("researcher", "writer")
    );
    
    // 验证
    assertEquals(2, results.size());
    assertFalse(results.get(0).isError());
    assertFalse(results.get(1).isError());
}
```

---

### 5. 性能测试

```bash
# 运行性能测试
mvn test -Dtest=PerformanceTest
```

**基准指标：**

| 指标 | 目标 | 可接受范围 |
|------|------|-----------|
| 意图分析 | <10ms | <50ms |
| 记忆查询 | <20ms | <100ms |
| LLM调用 | 取决于Provider | - |
| A2A通信（本地） | <5ms | <20ms |
| 内存占用 | <500MB | <1GB |

---

### 6. 可用性评估

#### 6.1 易用性检查

**配置简单性：**
```yaml
# application.yaml 最小配置
agent:
  default-model: moonshot:kimi-k2.5
  
moonshot:
  api:
    key: ${MOONSHOT_API_KEY}
```

**API简洁性：**
```java
// 是否简单易懂？
AgentResponse response = agentService.processMessage("Hello");
```

#### 6.2 文档完整性

- [ ] README.md 包含快速开始
- [ ] API文档完整
- [ ] 示例代码可运行
- [ ] 故障排查指南

#### 6.3 错误处理

```java
// 测试错误场景
@Test
public void testErrorHandling() {
    // 无效输入
    AgentResponse response = agentService.processMessage(null);
    assertFalse(response.isSuccess());
    assertNotNull(response.getError());
    
    // LLM调用失败
    LLMResponse llmResponse = llmService.chat("test", "invalid-provider", "model");
    assertFalse(llmResponse.isSuccess());
}
```

---

## 🔧 快速验证脚本

创建 `validate.sh`：

```bash
#!/bin/bash
set -e

echo "=== Java Agent Prototype 验证 ==="

# 1. 编译
echo "1. 编译项目..."
mvn clean compile -q
echo "✅ 编译成功"

# 2. 单元测试
echo "2. 运行单元测试..."
mvn test -q
echo "✅ 单元测试通过"

# 3. 打包
echo "3. 打包..."
mvn package -DskipTests -q
echo "✅ 打包成功"

# 4. 检查代码风格（可选）
echo "4. 代码风格检查..."
mvn checkstyle:check -q || echo "⚠️ 代码风格警告"

echo ""
echo "=== 验证完成 ==="
echo "项目状态：✅ 可用"
echo ""
echo "下一步："
echo "- 配置API Key并运行集成测试"
echo "- 启动应用：java -jar target/java-agent-prototype.jar"
echo "- 查看文档：open README.md"
```

---

## 📊 评估标准

### 可用性评分（满分100）

| 维度 | 权重 | 评估标准 |
|------|------|---------|
| 功能性 | 30% | 核心功能正常工作 |
| 稳定性 | 25% | 无崩溃，错误处理完善 |
| 性能 | 20% | 响应时间可接受 |
| 易用性 | 15% | 配置简单，API清晰 |
| 文档 | 10% | 文档完整，示例可运行 |

**评分等级：**
- 90-100：优秀，生产就绪
- 80-89：良好，需要微调
- 70-79：可用，需要改进
- <70：需要大量工作

---

## 🚀 实际运行验证

### 步骤1：环境准备

```bash
# 检查Java版本
java -version  # 需要 Java 25

# 检查Maven
mvn -version   # 需要 Maven 3.9+

# 配置API Key
export MOONSHOT_API_KEY=your-key
```

### 步骤2：编译运行

```bash
# 编译
mvn clean package -DskipTests

# 运行
java -jar target/java-agent-prototype-0.1.0.jar
```

### 步骤3：功能测试

```bash
# 测试健康检查
curl http://localhost:8080/actuator/health

# 测试Agent列表
curl http://localhost:8080/api/agents

# 测试意图分析
curl -X POST http://localhost:8080/api/intent/analyze \
  -H "Content-Type: application/json" \
  -d '{"input":"What is Java 25?"}'

# 测试对话
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## 📝 反馈收集

验证后请评估：

1. **功能完整性**（1-5分）：____
2. **易用性**（1-5分）：____
3. **性能**（1-5分）：____
4. **文档质量**（1-5分）：____
5. **整体满意度**（1-5分）：____

**改进建议：**
________________

---

*验证指南版本：1.0*
*最后更新：2026-03-04*
