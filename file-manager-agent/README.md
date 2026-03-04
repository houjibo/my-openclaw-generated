# File Manager Agent - 文件管理智能体

基于 Java Agent Framework 开发的 AI 驱动文件管理应用。

## 🎯 功能特性

- **自然语言交互** - 用自然语言管理文件
- **智能意图识别** - 自动识别 LIST/SEARCH/CREATE/DELETE 等操作
- **AI 响应生成** - 使用 Kimi K2.5 生成友好回复
- **REST API** - 提供完整的 HTTP API 接口

## 🚀 快速开始

### 1. 环境要求

- Java 17+
- Maven 3.9+
- Moonshot API Key

### 2. 配置 API Key

```bash
export MOONSHOT_API_KEY=your-api-key-here
```

### 3. 编译运行

```bash
# 编译
mvn clean package

# 运行
java -jar target/file-manager-agent-1.0.0.jar
```

### 4. 测试

```bash
# 测试文件列表
curl http://localhost:8080/api/files/list?path=/Users

# 测试智能对话
curl -X POST http://localhost:8080/api/files/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"List all files in current directory"}'
```

## 📚 API 文档

### 智能对话
```http
POST /api/files/chat
Content-Type: application/json

{
  "message": "List files in current directory"
}
```

### 文件列表
```http
GET /api/files/list?path=/Users
```

### 搜索文件
```http
GET /api/files/search?pattern=test&path=/Users
```

### 创建目录
```http
POST /api/files/directory?path=/Users/test/new-folder
```

### 删除文件
```http
DELETE /api/files/delete?path=/Users/test/file.txt
```

## 💡 使用示例

### 示例 1: 列出文件
```bash
curl -X POST http://localhost:8080/api/files/chat \
  -d '{"message":"Show me all files in the current directory"}'
```

### 示例 2: 搜索文件
```bash
curl -X POST http://localhost:8080/api/files/chat \
  -d '{"message":"Find all files containing \"report\""}'
```

### 示例 3: 创建目录
```bash
curl -X POST http://localhost:8080/api/files/chat \
  -d '{"message":"Create a new folder named \"projects\""}'
```

### 示例 4: 删除文件
```bash
curl -X POST http://localhost:8080/api/files/chat \
  -d '{"message":"Delete the file named \"old.txt\""}'
```

## 🏗️ 架构

```
file-manager-agent/
├── src/main/java/com/cola/filemanager/
│   ├── agent/
│   │   └── FileManagerAgent.java    # 核心Agent
│   ├── service/
│   │   ├── FileService.java         # 文件操作服务
│   │   └── FileInfo.java            # 文件信息
│   ├── controller/
│   │   └── FileManagerController.java # REST API
│   └── FileManagerApplication.java  # 启动类
│
└── src/main/java/com/cola/agent/    # 框架代码
    ├── intent/                      # 意图分析
    ├── llm/                         # LLM客户端
    ├── a2a/                         # A2A协议
    └── memory/                      # 记忆系统
```

## 🧪 测试

```bash
# 运行所有测试
mvn test

# 运行特定测试
mvn test -Dtest=FileManagerAgentTest
```

## 📝 技术栈

- **Spring Boot 3.2** - Web框架
- **Java Agent Framework** - 自定义Agent框架
- **Kimi K2.5** - LLM (通过Moonshot API)
- **Lombok** - 代码简化

## 🎉 验证框架可用性

这个应用验证了 Java Agent Framework 的以下能力：

✅ **意图分析** - 自然语言理解文件操作意图  
✅ **LLM集成** - 使用Kimi K2.5生成响应  
✅ **服务编排** - Agent + Service + Controller 分层架构  
✅ **REST API** - 提供HTTP接口  
✅ **实际应用** - 完整的文件管理功能  

## 📄 License

MIT License
