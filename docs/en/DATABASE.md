# Database Design

> **Language:** [English](DATABASE.md) · [中文](../zh/DATABASE.md)

**Engine:** PostgreSQL 16  
**Migrations:** Flyway (`backend/src/main/resources/db/migration/`)  
**ORM:** Spring Data JPA with Hibernate `ddl-auto: validate`  
**Repository:** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

## Overview

Docker Compose Studio persists workspaces, projects, environment templates, deploy history, and compose version snapshots. The MVP editor can run entirely in the browser without touching the database; persistence is required for multi-project workflows, template instantiation, and deploy audit trails.

Redis is provisioned in `docker-compose.yml` for future session caching and rate limiting but is not yet used by application code.

## Entity Relationship Diagram

```
workspace (1) ──────< (N) project (1) ──────< (N) deploy_run
                              │
                              └──────< (N) compose_snapshot

template (standalone, seeded at startup)
```

## Tables

### `workspace`

Multi-tenant boundary for future team features (v0.4).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default `gen_random_uuid()` | Workspace identifier |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | URL-safe identifier |
| `owner_id` | UUID | nullable | Future user ownership |
| `created_at` | TIMESTAMPTZ | NOT NULL | Created timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last modified |

**Seed data:** A default workspace is inserted on migration:

```sql
INSERT INTO workspace (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Default', 'default');
```

### `project`

Saved topology and compose YAML for a workspace.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Project identifier |
| `workspace_id` | UUID | FK → `workspace(id)` ON DELETE CASCADE | Parent workspace |
| `name` | VARCHAR(255) | NOT NULL | Project name |
| `description` | TEXT | nullable | Optional notes |
| `topology` | JSONB | NOT NULL, default `{"nodes":[],"edges":[]}` | Canvas graph |
| `compose_yaml` | TEXT | nullable | Last generated or edited YAML |
| `status` | VARCHAR(50) | NOT NULL, default `DRAFT` | `DRAFT`, `DEPLOYED`, `STOPPED` |
| `created_at` | TIMESTAMPTZ | NOT NULL | Created timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last modified |

**Index:** `idx_project_workspace` on `workspace_id`.

**JPA entity:** `com.dockercompose.studio.domain.Project`

### `template`

Builtin and database-stored environment presets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Template identifier |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | Stable key (`spring-boot-dev`) |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `category` | VARCHAR(50) | NOT NULL | e.g. `spring`, `ai`, `messaging` |
| `description` | TEXT | nullable | Short summary |
| `topology` | JSONB | NOT NULL | Pre-built graph |
| `compose_yaml` | TEXT | NOT NULL | Pre-built YAML |
| `is_builtin` | BOOLEAN | NOT NULL, default TRUE | Distinguishes seeded vs user templates |
| `created_at` | TIMESTAMPTZ | NOT NULL | Created timestamp |

**Index:** `idx_template_category` on `category`.

Builtin templates are loaded from `resources/templates/*.json` at application startup via `TemplateService`.

**JPA entity:** `com.dockercompose.studio.domain.Template`

### `deploy_run`

Historical record of deploy attempts tied to a project (runtime sessions are primarily in-memory; this table supports audit and future sync).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Deploy run identifier |
| `project_id` | UUID | NOT NULL, FK → `project(id)` ON DELETE CASCADE | Related project |
| `status` | VARCHAR(50) | NOT NULL | `RUNNING`, `SUCCESS`, `FAILED` |
| `compose_hash` | VARCHAR(64) | nullable | SHA-256 of deployed YAML |
| `started_at` | TIMESTAMPTZ | NOT NULL | Deploy start |
| `finished_at` | TIMESTAMPTZ | nullable | Deploy end |
| `error_message` | TEXT | nullable | Failure detail |

**Index:** `idx_deploy_run_project` on `project_id`.

**JPA entity:** `com.dockercompose.studio.domain.DeployRun`

### `compose_snapshot`

Version history for compose YAML per project (schema ready; API planned for v0.4).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Snapshot identifier |
| `project_id` | UUID | NOT NULL, FK → `project(id)` ON DELETE CASCADE | Related project |
| `yaml_content` | TEXT | NOT NULL | Snapshot body |
| `version` | INT | NOT NULL | Monotonic version number |
| `created_at` | TIMESTAMPTZ | NOT NULL | Snapshot time |

**Index:** `idx_compose_snapshot_project` on `project_id`.

> **Note:** `compose_snapshot` exists in Flyway but has no JPA entity yet. Version history will be exposed via API in a future release.

## Topology JSON Schema (JSONB)

The `topology` column stores the same structure used by the REST API and React Flow canvas:

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

PostgreSQL JSONB allows indexing and future GIN queries (e.g. find projects using a given `catalogId`).

## Connection Configuration

From `application.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | Port |
| `DB_NAME` | `dcs` | Database name |
| `DB_USER` | `dcs` | Username |
| `DB_PASSWORD` | `dcs` | Password |

Local development:

```bash
docker compose up -d postgres redis
cd backend && ./mvnw spring-boot:run
```

## Migration Strategy

- **V1__init_schema.sql** — Initial schema, indexes, default workspace, and `compose_snapshot` table.
- New migrations must be additive; Hibernate validates against the latest schema only.
- Never edit applied migration files in production; add `V2__*.sql` for changes.

## Client-Side Storage (Non-PostgreSQL)

These features do not use the database in v0.3:

| Key | Store | Content |
|-----|-------|---------|
| `dcs-custom-templates` | `localStorage` | User-saved environment templates |
| Custom catalog services | `localStorage` | User-defined marketplace entries |

They are documented in [Components](COMPONENTS.md) and may sync to the backend in v0.4.

## Related Documentation

- [Entities](ENTITIES.md) — Java JPA mapping
- [Architecture](ARCHITECTURE.md) — system context
- [API](API.md) — project and template endpoints
