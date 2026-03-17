# Enterprise Claw - 轻量级企业定制 OpenClaw

基于 OpenClaw 的企业级轻量定制方案，**零代码修改**实现企业需求。

## 🎯 核心特性

- ✅ **零修改核心代码** - 所有定制在 workspace/ 目录
- ✅ **配置驱动** - 80% 需求通过配置实现
- ✅ **插件化架构** - 企业功能独立打包
- ✅ **易于更新** - 核心代码升级不影响定制
- ✅ **类型安全** - Plugin SDK 提供完整 TypeScript 支持

## 📁 项目结构

```
enterprise-claw/
├── README.md                    # 本文件
├── config/                      # 企业配置文件
│   ├── openclaw.json            # 主配置（覆盖 ~/.openclaw/openclaw.json）
│   ├── security-policy.json     # 安全策略
│   └── audit-rules.json         # 审计规则
├── hooks/                       # 企业自定义 hooks
│   ├── audit-logger/            # 审计日志
│   │   ├── HOOK.md
│   │   └── handler.ts
│   ├── security-guard/          # 安全护栏
│   │   ├── HOOK.md
│   │   └── handler.ts
│   └── dlp-guard/               # 数据防泄漏
│       ├── HOOK.md
│       └── handler.ts
├── skills/                      # 企业专属技能
│   ├── enterprise-hr.js         # HR 系统对接
│   ├── crm-connector.js         # CRM 集成
│   └── erp-bridge.js            # ERP 数据访问
├── extensions/                  # 企业插件（可选）
│   └── your-enterprise/
│       ├── openclaw.plugin.json
│       ├── hooks/
│       └── skills/
└── scripts/                     # 部署脚本
    ├── install.sh               # 安装脚本
    └── deploy.sh                # 部署脚本
```

## 🚀 快速开始

### 1. 安装企业定制

```bash
# 克隆项目
cd ~/.openclaw/workspace/projects/code/my-openclaw-generated/enterprise-claw

# 运行安装脚本
./scripts/install.sh
```

### 2. 配置企业策略

编辑 `config/openclaw.json`：

```json
{
  "tools": {
    "profile": "minimal",
    "allow": ["read", "write", "edit", "web_search", "browser"],
    "deny": ["message"],
    "exec": {
      "security": "allowlist",
      "safeBins": ["git", "curl", "npm", "node"],
      "ask": "on-miss"
    }
  },
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": ["./hooks"]
      }
    }
  }
}
```

### 3. 启用企业 Hooks

```bash
# 创建符号链接到 OpenClaw workspace
ln -sf ~/.openclaw/workspace/projects/code/my-openclaw-generated/enterprise-claw/hooks \
       ~/.openclaw/workspace/hooks/enterprise

# 重启 Gateway
openclaw gateway restart
```

### 4. 验证安装

```bash
# 查看 hooks 状态
openclaw hooks status

# 查看配置
openclaw config show
```

## 🛡️ 安全护栏

### 内置安全策略

1. **命令拦截** - 阻止危险命令执行
2. **数据防泄漏** - 检测敏感信息外发
3. **审计日志** - 记录所有敏感操作
4. **工具访问控制** - 白名单机制

### 自定义安全规则

编辑 `hooks/security-guard/handler.ts`：

```typescript
const DANGEROUS_PATTERNS = [
  'rm -rf',
  'dd if=/dev/zero',
  'mkfs',
  'chmod 777'
];

export const handler: HookHandler = {
  async onCommand(event) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (event.command.includes(pattern)) {
        throw new Error(`[SECURITY] Blocked: ${event.command}`);
      }
    }
  }
};
```

## 📊 企业技能

### HR 系统对接

```javascript
// skills/enterprise-hr.js
export async function queryEmployee(name) {
  const response = await fetch('https://your-hr-system.com/api/employees', {
    headers: {
      'Authorization': `Bearer ${process.env.HR_API_KEY}`
    }
  });
  return await response.json();
}
```

### CRM 集成

```javascript
// skills/crm-connector.js
export async function getCustomer(id) {
  // CRM 系统对接逻辑
}
```

## 🔄 保持更新

```bash
# 1. 备份企业定制
cp -r ~/.openclaw/workspace/hooks/enterprise /tmp/

# 2. 更新 OpenClaw
npm update -g openclaw

# 3. 恢复企业定制
cp -r /tmp/enterprise ~/.openclaw/workspace/hooks/

# 4. 重启
openclaw gateway restart
```

## 📋 配置说明

### openclaw.json 关键配置

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `tools.profile` | 工具预设 | `minimal` |
| `tools.exec.security` | 执行安全级别 | `allowlist` |
| `tools.exec.ask` | 审批模式 | `on-miss` |
| `hooks.internal.enabled` | 启用 hooks | `true` |
| `sandbox.security` | 沙箱安全 | `strict` |

### Hooks 配置

| Hook | 事件 | 用途 |
|------|------|------|
| `audit-logger` | command, session | 审计日志 |
| `security-guard` | command, agent | 安全拦截 |
| `dlp-guard` | message | 数据防泄漏 |

## 🐛 故障排查

### Hooks 不生效

```bash
# 检查 hooks 是否加载
openclaw hooks status

# 查看 Gateway 日志
tail -f ~/.openclaw/logs/gateway.log | grep hook
```

### 配置不生效

```bash
# 验证配置语法
openclaw config validate

# 查看配置合并结果
openclaw config show --merged
```

## 📚 参考资源

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [Plugin SDK 文档](https://github.com/openclaw/openclaw/tree/main/docs/plugin-sdk)
- [Hooks 开发指南](https://docs.openclaw.ai/hooks)

## 📄 许可证

MIT License

---

**企业定制，从零开始，保持轻量！** 🦞
