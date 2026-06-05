# Java Domain Entities

> **Language:** [English](ENTITIES.md) · [中文](../zh/ENTITIES.md)

**Package:** `com.dockercompose.studio.domain`  
**Persistence:** Spring Data JPA · PostgreSQL · Flyway migrations  
**Repository:** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

## Overview

Domain entities map to PostgreSQL tables defined in `V1__init_schema.sql`. DTO records in `com.dockercompose.studio.dto` decouple REST contracts from persistence. Repositories live under `com.dockercompose.studio.repository`.

```
Workspace ──< Project ──< DeployRun
Template (independent)
```

`compose_snapshot` is defined in SQL only; a JPA entity is planned for v0.4.

---

## `Workspace`

**Table:** `workspace`  
**File:** `domain/Workspace.java`

Represents a logical tenant or team container for projects.

| Field | Java type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `UUID` | `id` | Primary key, auto-generated |
| `name` | `String` | `name` | Display name |
| `slug` | `String` | `slug` | Unique URL key |
| `ownerId` | `UUID` | `owner_id` | Nullable; future auth |
| `createdAt` | `Instant` | `created_at` | `@CreatedDate` |
| `updatedAt` | `Instant` | `updated_at` | `@LastModifiedDate` |

**Auditing:** `AuditingEntityListener` enabled via `JpaConfig`.

**Relationships:** One workspace has many projects (`project.workspace_id`).

---

## `Project`

**Table:** `project`  
**File:** `domain/Project.java`

Stores a saved environment design.

| Field | Java type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `UUID` | `id` | Primary key |
| `workspaceId` | `UUID` | `workspace_id` | FK to workspace |
| `name` | `String` | `name` | Required |
| `description` | `String` | `description` | Optional |
| `topology` | `Map<String, Object>` | `topology` | JSONB — nodes/edges graph |
| `composeYaml` | `String` | `compose_yaml` | TEXT — generated YAML |
| `status` | `ProjectStatus` | `status` | Enum as STRING |
| `createdAt` | `Instant` | `created_at` | Auditing |
| `updatedAt` | `Instant` | `updated_at` | Auditing |

### `ProjectStatus` enum

| Value | Meaning |
|-------|---------|
| `DRAFT` | Default; edited but not deployed via persistence layer |
| `DEPLOYED` | Associated with an active or recent deploy |
| `STOPPED` | Stack torn down |

**Repository:** `ProjectRepository`  
**Service:** `ProjectService`  
**API:** `ProjectController` → `ProjectRequest` / `ProjectResponse`

---

## `Template`

**Table:** `template`  
**File:** `domain/Template.java`

Environment preset (builtin or future user-created DB rows).

| Field | Java type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `UUID` | `id` | Primary key |
| `slug` | `String` | `slug` | Unique (`spring-boot-dev`) |
| `name` | `String` | `name` | Display name |
| `category` | `String` | `category` | Grouping for API filter |
| `description` | `String` | `description` | Optional |
| `topology` | `Map<String, Object>` | `topology` | JSONB graph |
| `composeYaml` | `String` | `compose_yaml` | Required TEXT |
| `builtin` | `boolean` | `is_builtin` | Seeded vs custom |
| `createdAt` | `Instant` | `created_at` | Auditing |

**Seeding:** `TemplateService` loads JSON from `classpath:templates/*.json` on `@PostConstruct` if not present.

**Repository:** `TemplateRepository`  
**API:** `GET /templates`, `POST /templates/{slug}/instantiate`

---

## `DeployRun`

**Table:** `deploy_run`  
**File:** `domain/DeployRun.java`

Audit record for deploy operations against a project.

| Field | Java type | Column | Notes |
|-------|-----------|--------|-------|
| `id` | `UUID` | `id` | Primary key |
| `projectId` | `UUID` | `project_id` | FK, required |
| `status` | `DeployStatus` | `status` | Enum as STRING |
| `composeHash` | `String` | `compose_hash` | Optional SHA-256 |
| `startedAt` | `Instant` | `started_at` | `@CreatedDate` |
| `finishedAt` | `Instant` | `finished_at` | Nullable |
| `errorMessage` | `String` | `error_message` | Failure text |

### `DeployStatus` enum

| Value | Meaning |
|-------|---------|
| `RUNNING` | Deploy in progress |
| `SUCCESS` | Completed successfully |
| `FAILED` | Error; see `errorMessage` |

**Repository:** `DeployRunRepository`

> **Runtime note:** Live deploy sessions use in-memory `DeploySession` (UUID `deployId`) in `DeploySessionManager`. `DeployRun` persistence will align with runtime in v0.4.

---

## In-Memory Runtime Model (Not JPA)

### `DeploySession`

**File:** `service/DeploySession.java`

| Field | Description |
|-------|-------------|
| `deployId` | UUID string returned to clients |
| `workDir` | Temp directory with `docker-compose.yml` |
| `composeProjectName` | `docker compose -p` project name |
| `createdAt` | Session start time |

Managed by `DeploySessionManager` — not stored in PostgreSQL during v0.2.

---

## DTO Layer (Reference)

Entities are never exposed directly on the wire. Common DTO mappings:

| DTO | Used by |
|-----|---------|
| `ProjectRequest` / `ProjectResponse` | Projects API |
| `TemplateResponse` | Templates API |
| `RuntimeDeployRequest` / `RuntimeDeployResponse` | Runtime deploy |
| `RuntimeStopRequest` | Runtime stop |
| `ContainerInfoResponse` | Container list |
| `ContainerStatsResponse` | Container metrics |
| `ComposeValidateResponse` | Validation |
| `ErrorResponse` | Global exception handler |

---

## JSONB Mapping

`topology` fields use Hibernate 6 JSON mapping:

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(nullable = false, columnDefinition = "jsonb")
private Map<String, Object> topology;
```

This allows arbitrary graph evolution without schema migrations for new node `data` fields.

---

## Future Entities (v0.4+)

| Planned entity | Table | Purpose |
|----------------|-------|---------|
| `ComposeSnapshot` | `compose_snapshot` | YAML version history |
| `User` | TBD | Authentication |
| `WorkspaceMember` | TBD | Team access control |

---

## Related Documentation

- [Database](DATABASE.md) — SQL schema and indexes
- [API](API.md) — REST exposure of entities
- [Architecture](ARCHITECTURE.md) — service layer context
