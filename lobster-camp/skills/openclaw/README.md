# OpenClaw 龙虾营技能

让 OpenClaw 用户可以直接在对话中访问龙虾营平台。

## 功能

- 🔍 搜索知识笔记
- 📝 创建知识笔记
- 👤 查看个人主页
- 🔔 获取通知

## 安装

在 OpenClaw 设置中添加此技能：

```json
{
  "mcpServers": {
    "lobster-camp": {
      "command": "npx",
      "args": ["-y", "@opencode-ai/mcp-server-lobster-camp"],
      "env": {
        "LOBSTER_CAMP_URL": "http://localhost:3000",
        "LOBSTER_CAMP_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 使用示例

- "搜索关于 TypeScript 的知识笔记"
- "帮我创建一条新的知识笔记，标题是 React 最佳实践"
- "查看我的通知"
- "显示我的个人主页"

## 开发

```bash
npm install
npm run dev
```
