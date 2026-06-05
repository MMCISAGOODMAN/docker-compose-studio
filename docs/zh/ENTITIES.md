# Java 实体设计

> **语言：** [English](../en/ENTITIES.md) · [中文](ENTITIES.md)

**包名：** `com.dockercompose.studio.domain`  
**持久化：** Spring Data JPA · PostgreSQL · Flyway 迁移  
**仓库：** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

## 概述

领域实体映射至 `V1__init_schema.sql` 定义的 PostgreSQL 表。`com.dockercompose.studio.dto` 中的 DTO record 将 REST 契约与持久化层解耦。Repository 位于 `com.dockercompose.studio.repository`。

```
Workspace ──< Project ──< DeployRun
Template (独立)
```

`compose_snapshot` 仅在 SQL 中定义；JPA 实体计划 v0.4 引入。

---

## `Workspace`

**表：** `workspace`  
**文件：** `domain/Workspace.java`

表示项目所属的逻辑租户或团队容器。

| 字段 | Java 类型 | 列 | 说明 |
|------|-----------|-----|------|
| `id` | `UUID` | `id` | 主键，自动生成 |
| `name` | `String` | `name` | 显示名称 |
| `slug` | `String` | `slug` | 唯一 URL 键 |
| `ownerId` | `UUID` | `owner_id` | 可空；未来认证 |
| `createdAt` | `Instant` | `created_at` | `@CreatedDate` |
| `updatedAt` | `Instant` | `updated_at` | `@LastModifiedDate` |

**审计：** 通过 `JpaConfig` 启用 `AuditingEntityListener`。

**关系：** 一个工作区包含多个项目（`project.workspace_id`）。

---

## `Project`

**表：** `project`  
**文件：** `domain/Project.java`

保存环境设计。

| 字段 | Java 类型 | 列 | 说明 |
|------|-----------|-----|------|
| `id` | `UUID` | `id` | 主键 |
| `workspaceId` | `UUID` | `workspace_id` | 外键至 workspace |
| `name` | `String` | `name` | 必填 |
| `description` | `String` | `description` | 可选 |
| `topology` | `Map<String, Object>` | `topology` | JSONB — nodes/edges 图 |
| `composeYaml` | `String` | `compose_yaml` | TEXT — 生成的 YAML |
| `status` | `ProjectStatus` | `status` | 枚举，STRING 存储 |
| `createdAt` | `Instant` | `created_at` | 审计 |
| `updatedAt` | `Instant` | `updated_at` | 审计 |

### `ProjectStatus` 枚举

| 值 | 含义 |
|----|------|
| `DRAFT` | 默认；已编辑但未通过持久化层部署 |
| `DEPLOYED` | 与活跃或近期部署关联 |
| `STOPPED` | 栈已拆除 |

**Repository：** `ProjectRepository`  
**Service：** `ProjectService`  
**API：** `ProjectController` → `ProjectRequest` / `ProjectResponse`

---

## `Template`

**表：** `template`  
**文件：** `domain/Template.java`

环境预设（内置或未来用户创建的 DB 行）。

| 字段 | Java 类型 | 列 | 说明 |
|------|-----------|-----|------|
| `id` | `UUID` | `id` | 主键 |
| `slug` | `String` | `slug` | 唯一（如 `spring-boot-dev`） |
| `name` | `String` | `name` | 显示名称 |
| `category` | `String` | `category` | API 过滤分组 |
| `description` | `String` | `description` | 可选 |
| `topology` | `Map<String, Object>` | `topology` | JSONB 图 |
| `composeYaml` | `String` | `compose_yaml` | 必填 TEXT |
| `builtin` | `boolean` | `is_builtin` | 种子 vs 自定义 |
| `createdAt` | `Instant` | `created_at` | 审计 |

**种子数据：** `TemplateService` 在 `@PostConstruct` 时从 `classpath:templates/*.json` 加载（若不存在）。

**Repository：** `TemplateRepository`  
**API：** `GET /templates`、`POST /templates/{slug}/instantiate`

---

## `DeployRun`

**表：** `deploy_run`  
**文件：** `domain/DeployRun.java`

针对项目的部署操作审计记录。

| 字段 | Java 类型 | 列 | 说明 |
|------|-----------|-----|------|
| `id` | `UUID` | `id` | 主键 |
| `projectId` | `UUID` | `project_id` | 外键，必填 |
| `status` | `DeployStatus` | `status` | 枚举，STRING 存储 |
| `composeHash` | `String` | `compose_hash` | 可选 SHA-256 |
| `startedAt` | `Instant` | `started_at` | `@CreatedDate` |
| `finishedAt` | `Instant` | `finished_at` | 可空 |
| `errorMessage` | `String` | `error_message` | 失败文本 |

### `DeployStatus` 枚举

| 值 | 含义 |
|----|------|
| `RUNNING` | 部署进行中 |
| `SUCCESS` | 成功完成 |
| `FAILED` | 失败；见 `errorMessage` |

**Repository：** `DeployRunRepository`

> **运行时说明：** 实时部署会话使用内存中的 `DeploySession`（UUID `deployId`），由 `DeploySessionManager` 管理。`DeployRun` 持久化将在 v0.4 与 runtime 对齐。

---

## 内存运行时模型（非 JPA）

### `DeploySession`

**文件：** `service/DeploySession.java`

| 字段 | 说明 |
|------|------|
| `deployId` | 返回给客户端的 UUID 字符串 |
| `workDir` | 含 `docker-compose.yml` 的临时目录 |
| `composeProjectName` | `docker compose -p` 项目名 |
| `createdAt` | 会话开始时间 |

由 `DeploySessionManager` 管理 — v0.2 期间不写入 PostgreSQL。

---

## DTO 层（参考）

实体不会直接暴露于 API。常见 DTO 映射：

| DTO | 用途 |
|-----|------|
| `ProjectRequest` / `ProjectResponse` | Projects API |
| `TemplateResponse` | Templates API |
| `RuntimeDeployRequest` / `RuntimeDeployResponse` | Runtime 部署 |
| `RuntimeStopRequest` | Runtime 停止 |
| `ContainerInfoResponse` | 容器列表 |
| `ContainerStatsResponse` | 容器指标 |
| `ComposeValidateResponse` | 校验 |
| `ErrorResponse` | 全局异常处理 |

---

## JSONB 映射

`topology` 字段使用 Hibernate 6 JSON 映射：

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(nullable = false, columnDefinition = "jsonb")
private Map<String, Object> topology;
```

可在不迁移 schema 的情况下演进节点 `data` 字段。

---

## 未来实体（v0.4+）

| 计划实体 | 表 | 用途 |
|----------|-----|------|
| `ComposeSnapshot` | `compose_snapshot` | YAML 版本历史 |
| `User` | TBD | 认证 |
| `WorkspaceMember` | TBD | 团队访问控制 |

---

## 相关文档

- [Database](DATABASE.md) — SQL schema 与索引
- [API](API.md) — 实体的 REST 暴露
- [Architecture](ARCHITECTURE.md) — 服务层上下文
