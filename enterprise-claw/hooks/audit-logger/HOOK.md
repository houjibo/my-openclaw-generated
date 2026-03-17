---
name: enterprise-audit-logger
description: 企业级审计日志记录器
version: 1.0.0
author: Enterprise Team
events:
  - command
  - session
  - agent
  - message
---

# 企业审计日志 Hook

## 功能

- 记录所有命令执行
- 记录会话创建/销毁
- 记录 Agent 工具调用
- 记录敏感消息

## 配置

编辑 `config/audit-rules.json` 自定义审计规则。

## 输出

审计日志发送到：
- 控制台（开发模式）
- 企业 SIEM 系统（生产模式）

## 示例

```typescript
// 审计日志格式
{
  "timestamp": "2026-03-17T14:00:00.000Z",
  "type": "command",
  "user": "user123",
  "session": "session-abc",
  "command": "git status",
  "cwd": "/workspace/project",
  "result": "success"
}
```
