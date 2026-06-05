# 首发文章：Docker Compose Studio

> **语言：** [English](../en/LAUNCH.md) · [中文](LAUNCH.md)

**别再手写 `docker-compose.yml`。几分钟内搭建本地开发环境。**

- **GitHub：** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)
- **许可证：** MIT

---

## 问题

每个新项目都如出一辙：复制一份旧的 `docker-compose.yml`，改镜像标签，排查端口冲突，配置 `depends_on`，还要祈祷健康检查没问题。对于包含 PostgreSQL、Redis、Kafka 和应用服务的栈，往往在写业务代码之前就要花上一小时在环境配置上。

Docker Desktop 和 Portainer 侧重**运行**容器；Railway 和 Render 面向**云端部署**。缺少的是一款专为**设计本地开发环境**而生的工具 —— 可视化、正确、可复现。

## 解决方案

**Docker Compose Studio** 是面向本地开发的开源可视化编排平台：

- 将 **PostgreSQL**、**Redis**、**Kafka**、**Ollama**、**Spring Boot** 等 16+ 服务拖拽至画布
- 用连线表达依赖 —— `depends_on` 自动生成
- 在侧边栏编辑端口、卷、环境变量与健康检查
- 导出生产可用的 YAML，或**一键在本地运行**
- 导入现有 compose 文件，以拓扑图可视化
- 从模板起步：Spring Boot、Python、RAG、微服务、Kafka

可以把它理解为 **Docker Compose 的 Figma** —— 不是面向生产集群，而是你每天编码所依赖的环境。

## 已交付功能

### MVP（v0.1）

服务市场、React Flow 画布、Monaco 编辑器、compose 生成/解析/对比、六套环境模板，以及基于规则的 AI 助手（用自然语言生成拓扑）。

### 运行时（v0.2）

针对本地 Docker Engine 部署与停止栈。通过 WebSocket 流式推送容器状态、CPU/内存指标与日志 —— 无需在终端间切换。

### 体验优化（v0.3）

部署前 Compose 校验、撤销/重做、深色/浅色主题，以及保存在浏览器中的**自定义模板与服务**，让栈定义随会话保留。

## 快速开始

### 最快路径 — 仅前端

Compose 生成器完全在浏览器运行，无需 Java 或数据库。

```bash
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio/frontend
npm install
npm run dev
```

打开 **http://localhost:5173**，开始拖拽服务。

### 全栈 + Docker 运行时

```bash
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio

# 启动 PostgreSQL、Redis、后端、前端
docker compose up -d

# 前端：http://localhost:5173
# 后端：http://localhost:8080
```

后端容器挂载 `docker.sock` 并设置 `DOCKER_ENABLED=true`，**Runtime** 面板即可部署你的拓扑图。

### 本地开发（后端 + 前端）

```bash
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio

docker compose up -d postgres redis

# 终端 1
cd backend
./mvnw spring-boot:run

# 终端 2
cd frontend
npm install
npm run dev
```

在后端设置 `DOCKER_ENABLED=true`，即可从宿主机 Docker 使用运行时部署。

## 适用人群

- **后端开发者** — 快速搭建 Spring Boot / Node / Python 及数据库、缓存
- **AI 工程师** — 原型 RAG 栈（Ollama、Qdrant、Open WebUI）
- **平台爱好者** — 需要可读、可分享的 compose 定义
- **开源贡献者** — 扩展目录、模板与校验规则

## 差异化

| | Docker Compose Studio | 通用 compose 生成器 |
|--|----------------------|---------------------|
| 定位 | 本地开发环境 | 一次性 YAML 片段 |
| 输入 | 可视化图 + 模板 | 仅表单或文本 |
| 输出 | 校验后的 YAML + 实时部署 | 静态文件 |
| 可扩展 | 自定义服务与模板 | 固定列表 |

## 推荐体验流程

1. **模板 → 编辑 → 导出** — 加载「Spring Boot Dev」，添加 MinIO，导出 ZIP。
2. **导入 → 可视化** — 粘贴现有 compose 文件，查看拓扑图。
3. **AI → 部署** — 描述「带 PostgreSQL 和 Redis 的 Python 应用」，校验后在 Runtime 面板点击 **Deploy**。
4. **保存自定义模板** — 搭建栈、保存、下次会话直接加载。

## 文档

| 文档 | 链接 |
|------|------|
| 系统架构 | [docs/zh/ARCHITECTURE.md](ARCHITECTURE.md) |
| API | [docs/zh/API.md](API.md) |
| 路线图 | [docs/zh/ROADMAP.md](ROADMAP.md) |
| 组件设计 | [docs/zh/COMPONENTS.md](COMPONENTS.md) |

## 参与项目

- ⭐ Star 仓库：[https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)
- 🐛 提交 Issue 或请求新目录服务
- 🔧 PR 规范见 [CONTRIBUTING.md](../../CONTRIBUTING.md)

优先贡献方向：新目录条目、社区模板、compose 解析边界情况、校验规则。

---

*Docker Compose Studio — 可视化设计本地栈，自信部署。*
