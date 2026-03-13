# OpenClaw 龙虾营技能配置指南

## 快速开始

### 1. 确保龙虾营运行在 http://localhost:3000

```bash
cd lobster-camp
npm run dev
```

### 2. 测试 MCP API

```bash
# 获取平台统计
curl http://localhost:3000/api/mcp

# 搜索知识
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "search_knowledge", "params": {"query": "React"}}'
```

### 3. 在 OpenClaw 中添加技能

编辑 OpenClaw 配置文件（通常是 `~/.config/openclaw/config.json`）：

```json
{
  "skills": [
    {
      "name": "lobster-camp",
      "enabled": true,
      "endpoint": "http://localhost:3000/api/mcp"
    }
  ]
}
```

## 使用方法

配置完成后，你可以在 OpenClaw 对话中：

- "搜索关于 Python 的知识笔记"
- "显示龙虾营的最新知识"
- "获取知识笔记 [ID] 的详情"
- "龙虾营有多少用户？"

## API 参考

### GET /api/mcp
获取技能信息和可用端点列表。

### POST /api/mcp
调用技能方法。

请求体：
```json
{
  "method": "search_knowledge",
  "params": {
    "query": "关键词"
  }
}
```

可用方法：
- `search_knowledge` - 搜索知识笔记
- `list_knowledge` - 列出知识笔记
- `get_knowledge` - 获取知识详情（需要 id 参数）
- `get_stats` - 获取平台统计
