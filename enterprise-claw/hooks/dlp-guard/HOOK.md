---
name: dlp-guard
description: 数据防泄漏（DLP）防护
version: 1.0.0
author: Enterprise Team
events:
  - message
  - agent
---

# 数据防泄漏（DLP）Hook

## 功能

- 检测敏感信息外发
- 自动脱敏处理
- 记录数据泄漏尝试
- 阻止未授权数据传输

## 检测类型

### API 密钥
- 通用 API Key（32+ 字符）
- AWS Access Key
- GitHub Token
- 其他云服务密钥

### 认证信息
- 密码
- 私钥
- Session Token

### 个人隐私
- 手机号
- 身份证号
- 邮箱地址

## 响应动作

1. **检测** - 识别敏感信息
2. **记录** - 发送到审计日志
3. **脱敏** - 替换为 [REDACTED]
4. **阻止** - 可选，根据配置

## 配置

编辑 `config/audit-rules.json` 自定义检测规则。
