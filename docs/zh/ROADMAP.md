# 开源路线图

> **语言：** [English](../en/ROADMAP.md) · [中文](ROADMAP.md)

**仓库：** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

Docker Compose Studio 是一款面向**本地开发环境**的开源可视化编排工具。本路线图跟踪已交付里程碑与计划中的工作。

## 状态概览

| 版本 | 主题 | 状态 |
|------|------|------|
| v0.1 | 可视化编辑器 MVP | ✅ 已完成 |
| v0.2 | Docker 运行时 | ✅ 已完成 |
| v0.3 | 体验优化与校验 | ✅ 已完成 |
| v0.4 | 协作与历史 | 🔜 计划中 |
| v1.0 | 生产级开源 | 🔜 计划中 |

---

## v0.1 — 可视化编辑器 MVP ✅

**目标：** 验证核心价值 — 拖拽、配置、导出 compose，无需手写 YAML。

| 功能 | 状态 |
|------|------|
| 服务市场（16+ 目录服务） | ✅ |
| 可视化画布（React Flow） | ✅ |
| 服务配置面板 | ✅ |
| 实时 compose 生成（客户端） | ✅ |
| 导出 YAML / ZIP | ✅ |
| Compose 导入（YAML → 图） | ✅ |
| Compose 差异对比 | ✅ |
| 环境模板（6 套预设） | ✅ |
| AI 拓扑生成（基于规则的 MVP） | ✅ |
| Spring Boot 后端 + PostgreSQL schema | ✅ |
| CI 流水线（GitHub Actions） | ✅ |

---

## v0.2 — Docker 运行时 ✅

**目标：** 在 UI 中本地运行生成的栈，并实时反馈。

| 功能 | 状态 |
|------|------|
| `POST /api/v1/runtime/deploy` | ✅ |
| `POST /api/v1/runtime/stop` | ✅ |
| `GET /api/v1/runtime/containers` | ✅ |
| `GET /api/v1/runtime/containers/{id}/stats` | ✅ |
| WebSocket `/ws/runtime/{deployId}` | ✅ |
| Runtime 面板（部署、停止、状态） | ✅ |
| 通过 WebSocket 订阅容器日志 | ✅ |
| CPU / 内存指标流式推送 | ✅ |
| `GET /api/v1/docker/health` | ✅ |
| Docker socket 集成（`DOCKER_ENABLED`） | ✅ |

运行时设计详见 [API](API.md) 与 [Architecture](ARCHITECTURE.md)。

---

## v0.3 — 体验优化与校验 ✅

**目标：** 更安全的部署、更好的编辑体验与用户可扩展性。

| 功能 | 状态 |
|------|------|
| Compose 校验（`/compose/validate/yaml`、`/topology`） | ✅ |
| Compose 编辑器中的 `ValidationPanel` | ✅ |
| 校验存在错误时阻止部署 | ✅ |
| 撤销 / 重做（快捷键 ⌘Z / ⌘⇧Z） | ✅ |
| 深色 / 浅色主题 + `ThemeToggle` | ✅ |
| 自定义服务（localStorage 目录） | ✅ |
| 自定义模板（将当前图保存为模板） | ✅ |
| `SaveTemplateDialog` + 合并模板库 | ✅ |
| Monaco 主题跟随应用主题 | ✅ |

---

## v0.4 — 协作与历史 🔜

**目标：** 多用户工作区与持久化项目历史。

| 功能 | 优先级 |
|------|--------|
| 用户认证（OAuth / 本地账号） | 高 |
| 工作区成员与角色 | 高 |
| 通过链接或导出分享项目 | 中 |
| `compose_snapshot` API — 版本历史与回滚 | 高 |
| 自定义模板/服务同步至后端 | 中 |
| 将 deploy run 与 runtime `deployId` 关联持久化 | 中 |
| 基于 Redis 的会话 / 缓存 | 低 |
| 拓扑节点评论 | 低 |

---

## v1.0 — 生产级开源 🔜

**目标：** 稳定、文档完善、社区就绪的正式发布。

| 功能 | 优先级 |
|------|--------|
| 远程 Docker 上下文（SSH / TLS） | 高 |
| LLM 驱动的 AI 拓扑（OpenAI / Ollama 等） | 高 |
| 国际化（i18n）— 中英文文档已启动 | 中 |
| OpenAPI 3 规范 + Swagger UI | 中 |
| Helm Chart / 生产 compose profile | 中 |
| 自定义目录 Provider 插件 API | 低 |
| E2E 测试（Playwright + Testcontainers） | 高 |
| 安全审计（socket 访问、SSRF、YAML 炸弹） | 高 |

---

## 社区贡献

欢迎以下方向的 PR：

1. **目录条目** — 带合理默认端口、环境变量、健康检查的新服务。
2. **模板** — `backend/src/main/resources/templates/` 下的 JSON 预设。
3. **Compose 解析器** — `POST /compose/parse` 边界情况。
4. **校验规则** — `ComposeValidationService` 中的额外检查。
5. **UI/UX** — 无障碍、键盘导航、移动端布局。

详见 GitHub 上的 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 进度跟踪

- GitHub Issues 与 Discussions：[https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)
- 根目录 [README.md](../../README.md) 中的功能表
