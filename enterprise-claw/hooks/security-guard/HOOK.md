---
name: enterprise-security-guard
description: 企业安全护栏 - 拦截危险操作
version: 1.0.0
author: Enterprise Team
events:
  - command
  - agent
---

# 企业安全护栏 Hook

## 功能

- 拦截危险命令执行
- 阻止敏感路径访问
- 检查工具调用权限
- 执行企业安全策略

## 配置

编辑 `config/security-policy.json` 自定义安全规则。

## 拦截规则

### 危险命令
- `rm -rf` - 递归删除
- `dd` - 磁盘操作
- `mkfs` - 格式化
- `chmod 777` - 权限设置
- `curl | bash` - 远程执行

### 敏感路径
- `/etc/` - 系统配置
- `/usr/` - 系统程序
- `/System/` - macOS 系统
- `api-keys` - API 密钥
- `.env` - 环境变量

## 示例

```typescript
// 拦截示例
[SECURITY] Blocked dangerous command: rm -rf /tmp
[SECURITY] Sensitive path access: /etc/passwd
[SECURITY] Sudo commands are not allowed
```
