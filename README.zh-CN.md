<div align="center">

# Docker Compose Studio

**面向本地开发环境的可视化 Docker Compose 编排平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](backend/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](frontend/)
[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.3-green.svg)](backend/)

*告别手写 docker-compose.yml。拖拽、配置、导出、一键运行。*

**语言：** [English](README.md) · [中文](README.zh-CN.md)

[快速开始](#快速开始) · [功能](#功能) · [架构](docs/zh/ARCHITECTURE.md) · [路线图](docs/zh/ROADMAP.md) · [贡献指南](CONTRIBUTING.zh-CN.md) · [文档索引](docs/README.md)

</div>

---

## 为什么选择 Docker Compose Studio？

搭建本地开发环境不应依赖记忆 Docker Compose 语法。Docker Compose Studio 是一款**可视化编排平台**，帮助你：

- **拖拽**服务（PostgreSQL、Redis、Kafka、Ollama、Spring Boot 等）到画布
- **自动生成**生产可用的 `docker-compose.yml`，含网络、卷、健康检查与 `depends_on`
- **导入**现有 compose 文件并可视化为拓扑图
- **使用模板**快速搭建 Spring Boot、Python、RAG、微服务、AI 等环境
- **AI 生成**用自然语言描述即可生成环境拓扑

> 可以理解为 **Docker Compose 的 Figma** — 专注本地开发，而非云部署。

## 功能

| 功能 | 状态 |
|------|------|
| 服务市场（16+ 服务） | ✅ MVP |
| 可视化画布（React Flow） | ✅ MVP |
| 服务配置面板 | ✅ MVP |
| 实时 Compose 生成 | ✅ MVP |
| 导出 YAML / ZIP | ✅ MVP |
| Compose 导入（YAML → 图） | ✅ MVP |
| Compose Diff | ✅ MVP |
| Compose 校验 | ✅ v0.3 |
| 撤销 / 重做 | ✅ v0.3 |
| 深色 / 浅色主题 | ✅ v0.3 |
| 自定义模板与服务 | ✅ v0.3 |
| 环境模板（6 套预设） | ✅ MVP |
| AI 拓扑生成 | ✅ MVP |
| Docker 一键部署 | ✅ v0.2 |
| 容器日志与指标 | ✅ v0.2 |

## 快速开始

### 方式 1：仅前端（最快）

Compose 生成器完全在浏览器中运行，无需后端。

```bash
cd frontend
npm install
npm run dev
# 打开 http://localhost:5173
```

### 方式 2：全栈

```bash
# 启动 PostgreSQL + Redis
docker compose up -d postgres redis

# 后端
cd backend
./mvnw spring-boot:run

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### 方式 3：Docker 一键启动

```bash
docker compose up -d
# 前端：http://localhost:5173
# 后端 API：http://localhost:8080
```

## 界面示意

```
┌──────────────┬─────────────────────────────┬──────────────┬─────────────────┐
│   服务市场   │                             │   服务配置   │  docker-compose │
│              │      可视化画布             │   面板       │     .yml        │
│  PostgreSQL  │  [Spring Boot]──→[Redis]   │              │  (Monaco 编辑器)│
│  Redis       │       │                     │  Image: ...  │  services:      │
│  Kafka       │       └──→[PostgreSQL]      │  Ports: ...  │    postgres:    │
│  Ollama      │                             │  环境变量    │      image: ... │
│  ...         │                             │              │                 │
└──────────────┴─────────────────────────────┴──────────────┴─────────────────┘
```

## 支持的服务

| 类别 | 服务 |
|------|------|
| **数据库** | PostgreSQL、MySQL、MongoDB、Redis |
| **消息队列** | Kafka、RabbitMQ |
| **存储** | MinIO |
| **搜索** | Elasticsearch |
| **AI** | Ollama、Open WebUI、Qdrant |
| **开发** | Spring Boot、Node.js、Python、Nginx |

## 架构

```
React SPA (Vite + React Flow + Monaco)
         │ REST + WebSocket
Spring Boot 3 API (Java 21)
         │
PostgreSQL · Redis · Docker Engine
```

详细设计见 [docs/zh/ARCHITECTURE.md](docs/zh/ARCHITECTURE.md)。

## 项目结构

```
docker-compose-studio/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # 画布、市场、配置、AI、Diff
│   │   ├── lib/          # Compose 生成、解析、目录
│   │   └── stores/       # Zustand 状态管理
├── backend/           # Spring Boot 3 + Java 21
│   └── src/main/java/com/dockercompose/studio/
│       ├── controller/   # REST API
│       ├── service/      # 业务逻辑 + Docker 集成
│       └── domain/       # JPA 实体
├── docs/              # 中英双语文档 (en/ + zh/)
├── .github/workflows/ # CI 流水线
└── docker-compose.yml # 开发环境
```

## API

REST API 前缀 `/api/v1`。主要端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/catalog/services` | 服务市场 |
| POST | `/compose/generate` | 图 → YAML |
| POST | `/compose/parse` | YAML → 图 |
| POST | `/compose/diff` | 对比两份 compose |
| POST | `/ai/generate-topology` | 自然语言 → 拓扑 |
| GET | `/templates` | 环境模板 |
| POST | `/runtime/deploy` | Docker 一键部署 |
| WS | `/ws/runtime/{deployId}` | 实时日志与状态 |

完整 API 文档：[docs/zh/API.md](docs/zh/API.md)

## 环境模板

| 模板 | 服务 |
|------|------|
| Spring Boot Dev | Spring Boot + PostgreSQL + Redis |
| Python Dev | Python + PostgreSQL + Redis |
| RAG Dev | Ollama + Open WebUI + Qdrant + PostgreSQL |
| AI Dev | Ollama + Open WebUI |
| Microservices | Spring Boot + Kafka + PostgreSQL + Redis + Nginx |
| Kafka Cluster | Kafka + Zookeeper |

## 路线图

- **v0.1** ✅ 可视化编辑器、Compose 生成、模板、AI、导入/Diff
- **v0.2** ✅ Docker 一键部署、日志、容器指标
- **v0.3** ✅ 自定义服务、撤销/重做、校验、主题
- **v0.4**：团队工作区、分享、版本历史
- **v1.0**：远程 Docker、LLM AI、国际化

完整计划见 [docs/zh/ROADMAP.md](docs/zh/ROADMAP.md)。

## 文档

| English | 中文 |
|---------|------|
| [Architecture](docs/en/ARCHITECTURE.md) | [系统架构](docs/zh/ARCHITECTURE.md) |
| [API](docs/en/API.md) | [API 设计](docs/zh/API.md) |
| [Database](docs/en/DATABASE.md) | [数据库设计](docs/zh/DATABASE.md) |
| [Roadmap](docs/en/ROADMAP.md) | [路线图](docs/zh/ROADMAP.md) |
| [Components](docs/en/COMPONENTS.md) | [React 组件](docs/zh/COMPONENTS.md) |
| [Entities](docs/en/ENTITIES.md) | [Java 实体](docs/zh/ENTITIES.md) |
| [Launch](docs/en/LAUNCH.md) | [首发文章](docs/zh/LAUNCH.md) |

完整索引：[docs/README.md](docs/README.md)

## 贡献

欢迎贡献！请参阅 [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)（[English](CONTRIBUTING.md)）。

优先方向：
- 带最佳实践默认值的新服务目录条目
- 社区环境模板
- Compose 解析器边界情况
- UI/UX 改进

## 许可证

[MIT](LICENSE) — 个人与商业使用均可免费。

---

<div align="center">
如果 Docker Compose Studio 帮你节省了时间，欢迎在 <a href="https://github.com/MMCISAGOODMAN/docker-compose-studio">GitHub</a> 上给个 ⭐！
</div>
