# 🦞 龙虾软件特工队 (Lobster Squad)

通过 Docker 虚拟化技术，创建多个角色化的 OpenClaw 实例，组成一个协作的软件特工队。

---

## 🎯 项目愿景

每个特工都有独特的角色、能力和配置，通过协作完成复杂的软件开发任务。

---

## 📦 项目结构

```
lobster-squad/
├── docker/                    # Docker 镜像
│   ├── Dockerfile
│   ├── scripts/
│   │   ├── start.sh           # 启动脚本
│   │   └── download-config.sh # 配置下载脚本
│   ├── config/
│   │   └── openclaw.json.template
│   └── healthcheck.sh
├── docker-compose.yml         # Docker Compose 配置
└── README.md

lobster-squad-config/          # 角色配置仓库
├── roles/                     # 角色配置
│   ├── captain/               # 队长
│   ├── cto/                   # 首席技术官
│   ├── pm/                    # 项目经理/产品经理
│   ├── ba/                    # 业务架构师
│   ├── ia/                    # 信息架构师
│   ├── aa/                    # 应用架构师
│   ├── ta/                    # 技术架构师
│   ├── se/                    # 系统工程师
│   ├── tse/                   # 测试系统工程师
│   ├── mde/                   # 模块设计工程师
│   ├── swe/                   # 软件开发工程师
│   ├── te/                    # 测试开发工程师
│   ├── cie/                   # 持续集成工程师
│   └── committer/             # 代码审查者
└── teams/                     # 团队配置
    └── team-alpha/
```

---

## 👥 角色定义

### 管理层
- **CTO** - 首席技术官：技术架构决策、技术选型
- **PM** - 项目经理/产品经理：项目规划、需求管理
- **Committer** - 代码审查者：代码审查、质量把关
- **Captain** - 队长：统筹管理所有实例

### 架构层
- **BA** - 业务架构师：业务流程设计、业务建模
- **IA** - 信息架构师：信息结构设计、数据模型
- **AA** - 应用架构师：应用架构设计、模块划分
- **TA** - 技术架构师：技术架构设计、技术选型

### 工程层
- **SE** - 系统工程师：系统设计、系统集成、部署运维
- **TSE** - 测试系统工程师：测试框架搭建、测试环境管理
- **MDE** - 模块设计工程师：模块设计、接口定义
- **SWE** - 软件开发工程师：功能开发、代码实现
- **TE** - 测试开发工程师：测试用例开发、自动化测试
- **CIE** - 持续集成工程师：CI/CD 流程搭建、自动化部署

---

## 🚀 快速开始

### 1. 构建镜像

```bash
cd ~/code/lobster-squad
docker-compose build
```

### 2. 启动团队

```bash
docker-compose up -d
```

### 3. 查看状态

```bash
docker-compose ps
```

### 4. 查看日志

```bash
# 查看所有日志
docker-compose logs

# 查看特定实例日志
docker-compose logs captain
docker-compose logs coder-1
docker-compose logs tester-1
```

### 5. 停止团队

```bash
docker-compose down
```

---

## 🔧 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LOBSTER_ROLE` | 角色名称 | default |
| `LOBSTER_TEAM` | 团队名称 | default |
| `LOBSTER_NAME` | 实例名称 | default |
| `CONFIG_REPO` | 配置仓库 URL | https://github.com/houjibo/lobster-squad-config.git |

---

## 📊 端口映射

| 实例 | 容器端口 | 主机端口 | 说明 |
|------|---------|---------|------|
| captain | 18789 | 18790 | 队长 |
| coder-1 | 18789 | 18791 | 编码者 1 |
| tester-1 | 18789 | 18792 | 测试者 1 |

---

## 🌐 网络架构

所有容器都连接到 `lobster-squad-network` 网络，可以通过容器名称相互通信：

```bash
# 从 captain 访问 coder-1
curl http://coder-1:18789/status

# 从 coder-1 访问 captain
curl http://captain:18789/status
```

---

## 📝 角色配置格式

每个角色的配置目录包含以下文件：

```
roles/<role-name>/
├── SOUL.md       # 灵魂、性格、使命、价值观
├── AGENT.md      # 能力、技能、限制、工具使用规则
├── USER.md       # 了解的用户信息、偏好、上下文
├── MEMORY.md     # 长期记忆、经验、教训
└── config.json   # OpenClaw 技术配置
```

---

## 🛠️ 开发

### 使用 Kimi Code CLI

```bash
# 进入项目目录
cd ~/code/lobster-squad

# 启动 Kimi Code CLI
kimi term

# 或启动 ACP 服务器
kimi acp --port 8080
```

### 添加新角色

1. 在 `lobster-squad-config/roles/` 创建角色目录
2. 创建配置文件（SOUL.md, AGENT.md, USER.md, config.json）
3. 在 `docker-compose.yml` 添加新实例
4. 重新构建和启动

---

## 📊 监控

### 实例健康检查

```bash
# 检查所有实例
curl http://localhost:18790/status  # captain
curl http://localhost:18791/status  # coder-1
curl http://localhost:18792/status  # tester-1
```

### Docker 健康检查

Docker 会自动检查容器健康状态：

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🔍 故障排查

### 实例无法启动

```bash
# 查看日志
docker logs lobster-captain

# 进入容器调试
docker exec -it lobster-captain bash

# 检查配置
cat /app/.openclaw/openclaw.json
```

### 配置未加载

```bash
# 检查配置下载脚本
docker exec -it lobster-captain bash
/app/scripts/download-config.sh captain team-alpha
```

---

## 📖 文档

详细文档请参考：
- [架构规划](https://github.com/houjibo/lobster-squad-config/docs/ARCHITECTURE.md)
- [角色指南](https://github.com/houjibo/lobster-squad-config/docs/ROLE_GUIDE.md)
- [API 文档](https://github.com/houjibo/lobster-squad-config/docs/API.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

**项目创建时间**: 2026-03-08
**当前版本**: 0.1.0-alpha
