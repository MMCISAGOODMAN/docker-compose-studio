# 贡献指南

> **语言：** [English](CONTRIBUTING.md) · [中文](CONTRIBUTING.zh-CN.md)

感谢你对 Docker Compose Studio 的关注！本项目致力于成为可视化 Docker Compose 编排的首选工具。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio

# 启动基础设施
docker compose up -d postgres redis

# 后端
cd backend && ./mvnw spring-boot:run

# 前端（新终端）
cd frontend && npm install && npm run dev
```

## 如何贡献

### 添加服务到目录

1. 编辑 `backend/src/main/resources/catalog/services.json`
2. 在 `frontend/src/lib/catalog.ts` 中同步添加对应条目
3. 包含最佳实践默认值：健康检查、卷、环境变量

### 添加环境模板

1. 创建 `backend/src/main/resources/templates/your-template.json`
2. 在 `frontend/src/lib/templates.ts` 中注册
3. 包含真实的服务拓扑与依赖边

### 代码风格

- **前端**：TypeScript 严格模式、函数式 React 组件、TailwindCSS
- **后端**：Java 21、Spring Boot 3 约定、Lombok 减少样板代码
- 保持 PR 聚焦 — 每个 PR 只做一件事

## Pull Request 流程

1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交清晰的 commit 信息
4. 推送到你的 fork 并开启 PR
5. 确保 CI 通过

## 文档

所有文档均为中英双语。更新文档时：

- 英文：`docs/en/` 及根目录 `README.md`、`CONTRIBUTING.md`
- 中文：`docs/zh/` 及根目录 `README.zh-CN.md`、`CONTRIBUTING.zh-CN.md`
- 索引：[docs/README.md](docs/README.md)

## 社区

- [GitHub Issues](https://github.com/MMCISAGOODMAN/docker-compose-studio/issues) — Bug 与功能请求
- [GitHub Discussions](https://github.com/MMCISAGOODMAN/docker-compose-studio/discussions) — 问题与想法
- 请保持尊重与包容
