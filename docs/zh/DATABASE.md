# 数据库设计

> **语言：** [English](../en/DATABASE.md) · [中文](DATABASE.md)

**引擎：** PostgreSQL 16  
**迁移：** Flyway（`backend/src/main/resources/db/migration/`）  
**ORM：** Spring Data JPA，Hibernate `ddl-auto: validate`  
**仓库：** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

## 概述

Docker Compose Studio 持久化工作区、项目、环境模板、部署历史与 compose 版本快照。MVP 编辑器可在浏览器中完全离线运行；数据库用于多项目工作流、模板实例化及部署审计。

`docker-compose.yml` 中已配置 Redis，供未来会话缓存与限流使用，当前应用代码尚未接入。

## 实体关系图

```
workspace (1) ──────< (N) project (1) ──────< (N) deploy_run
                              │
                              └──────< (N) compose_snapshot

template (独立表，启动时种子数据)
```

## 表结构

### `workspace`

未来团队功能（v0.4）的多租户边界。

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK，默认 `gen_random_uuid()` | 工作区标识 |
| `name` | VARCHAR(255) | NOT NULL | 显示名称 |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | URL 安全标识 |
| `owner_id` | UUID | 可空 | 未来用户归属 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 最后修改时间 |

**种子数据：** 迁移时插入默认工作区：

```sql
INSERT INTO workspace (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Default', 'default');
```

### `project`

工作区内保存的拓扑与 compose YAML。

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK | 项目标识 |
| `workspace_id` | UUID | FK → `workspace(id)` ON DELETE CASCADE | 所属工作区 |
| `name` | VARCHAR(255) | NOT NULL | 项目名称 |
| `description` | TEXT | 可空 | 可选备注 |
| `topology` | JSONB | NOT NULL，默认 `{"nodes":[],"edges":[]}` | 画布图 |
| `compose_yaml` | TEXT | 可空 | 最后生成或编辑的 YAML |
| `status` | VARCHAR(50) | NOT NULL，默认 `DRAFT` | `DRAFT`、`DEPLOYED`、`STOPPED` |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 最后修改时间 |

**索引：** `idx_project_workspace`（`workspace_id`）。

**JPA 实体：** `com.dockercompose.studio.domain.Project`

### `template`

内置及数据库存储的环境预设。

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK | 模板标识 |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | 稳定键（如 `spring-boot-dev`） |
| `name` | VARCHAR(255) | NOT NULL | 显示名称 |
| `category` | VARCHAR(50) | NOT NULL | 如 `spring`、`ai`、`messaging` |
| `description` | TEXT | 可空 | 简短说明 |
| `topology` | JSONB | NOT NULL | 预构建图 |
| `compose_yaml` | TEXT | NOT NULL | 预构建 YAML |
| `is_builtin` | BOOLEAN | NOT NULL，默认 TRUE | 区分种子与用户模板 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |

**索引：** `idx_template_category`（`category`）。

内置模板由 `TemplateService` 在应用启动时从 `resources/templates/*.json` 加载。

**JPA 实体：** `com.dockercompose.studio.domain.Template`

### `deploy_run`

与项目关联的部署尝试历史记录（运行时会话主要在内存中；本表支持审计与未来同步）。

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK | 部署运行标识 |
| `project_id` | UUID | NOT NULL，FK → `project(id)` ON DELETE CASCADE | 关联项目 |
| `status` | VARCHAR(50) | NOT NULL | `RUNNING`、`SUCCESS`、`FAILED` |
| `compose_hash` | VARCHAR(64) | 可空 | 已部署 YAML 的 SHA-256 |
| `started_at` | TIMESTAMPTZ | NOT NULL | 部署开始 |
| `finished_at` | TIMESTAMPTZ | 可空 | 部署结束 |
| `error_message` | TEXT | 可空 | 失败详情 |

**索引：** `idx_deploy_run_project`（`project_id`）。

**JPA 实体：** `com.dockercompose.studio.domain.DeployRun`

### `compose_snapshot`

每个项目的 compose YAML 版本历史（schema 已就绪；API 计划 v0.4）。

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | UUID | PK | 快照标识 |
| `project_id` | UUID | NOT NULL，FK → `project(id)` ON DELETE CASCADE | 关联项目 |
| `yaml_content` | TEXT | NOT NULL | 快照内容 |
| `version` | INT | NOT NULL | 单调递增版本号 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 快照时间 |

**索引：** `idx_compose_snapshot_project`（`project_id`）。

> **说明：** `compose_snapshot` 已在 Flyway 中创建，尚无 JPA 实体。版本历史 API 将在后续版本提供。

## 拓扑 JSON Schema（JSONB）

`topology` 列存储与 REST API 及 React Flow 画布相同的结构：

```json
{
  "nodes": [
    {
      "id": "string",
      "type": "serviceNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "catalogId": "string",
        "name": "string",
        "image": "string",
        "ports": [],
        "volumes": [],
        "environment": {}
      }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "node-id",
      "target": "node-id",
      "type": "dependency"
    }
  ]
}
```

PostgreSQL JSONB 支持索引及未来 GIN 查询（例如查找使用某 `catalogId` 的项目）。

## 连接配置

来自 `application.yml`：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_HOST` | `localhost` | PostgreSQL 主机 |
| `DB_PORT` | `5432` | 端口 |
| `DB_NAME` | `dcs` | 数据库名 |
| `DB_USER` | `dcs` | 用户名 |
| `DB_PASSWORD` | `dcs` | 密码 |

本地开发：

```bash
docker compose up -d postgres redis
cd backend && ./mvnw spring-boot:run
```

## 迁移策略

- **V1__init_schema.sql** — 初始 schema、索引、默认工作区及 `compose_snapshot` 表。
- 新迁移应为增量式；Hibernate 仅校验最新 schema。
- 生产环境切勿修改已应用的迁移文件；变更请新增 `V2__*.sql`。

## 客户端存储（非 PostgreSQL）

v0.3 中以下功能不使用数据库：

| 键 | 存储 | 内容 |
|----|------|------|
| `dcs-custom-templates` | `localStorage` | 用户保存的环境模板 |
| 自定义目录服务 | `localStorage` | 用户定义的服务市场条目 |

详见 [Components](COMPONENTS.md)；v0.4 可能同步至后端。

## 相关文档

- [Entities](ENTITIES.md) — Java JPA 映射
- [Architecture](ARCHITECTURE.md) — 系统上下文
- [API](API.md) — 项目与模板端点
