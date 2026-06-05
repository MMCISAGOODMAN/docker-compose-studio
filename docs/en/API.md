# REST API Reference

> **Language:** [English](API.md) · [中文](../zh/API.md)

**Base URL:** `http://localhost:8080/api/v1`  
**Repository:** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

All JSON endpoints use `Content-Type: application/json`. Errors follow a consistent envelope:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable detail",
    "details": {}
  },
  "timestamp": "2026-06-05T12:00:00Z"
}
```

| HTTP Status | Typical `code` |
|-------------|----------------|
| 400 | `BAD_REQUEST`, `VALIDATION_ERROR` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL_ERROR` |

---

## Compose

### `POST /compose/generate`

Convert a topology graph to `docker-compose.yml`.

**Request**

```json
{
  "topology": {
    "nodes": [],
    "edges": []
  }
}
```

**Response**

```json
{
  "composeYaml": "services:\n  ..."
}
```

### `POST /compose/parse`

Parse YAML into a topology graph.

**Request**

```json
{
  "yaml": "services:\n  postgres:\n    image: postgres:16-alpine"
}
```

**Response**

```json
{
  "topology": { "nodes": [], "edges": [] },
  "yaml": "..."
}
```

### `POST /compose/diff`

Compare two compose documents.

**Request**

```json
{
  "source": "services:\n  redis:\n    image: redis:7",
  "target": "services:\n  redis:\n    image: redis:7-alpine"
}
```

**Response**

```json
{
  "added": ["services.postgres"],
  "removed": [],
  "changed": [
    { "path": "services.redis.image", "from": "redis:7", "to": "redis:7-alpine" }
  ]
}
```

### `POST /compose/validate/yaml`

Validate compose YAML (syntax, structure, best-practice warnings).

**Request**

```json
{
  "yaml": "services:\n  app:\n    image: nginx"
}
```

**Response**

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "severity": "warning",
      "code": "NO_HEALTHCHECK",
      "message": "Service has no healthcheck defined",
      "path": "services.app",
      "service": "app",
      "line": null
    }
  ]
}
```

### `POST /compose/validate/topology`

Validate the canvas topology before generation.

**Request**

```json
{
  "topology": { "nodes": [], "edges": [] }
}
```

**Response:** Same shape as `validate/yaml`.

---

## Catalog

### `GET /catalog/services`

List all marketplace services (loaded from `catalog/services.json` at startup).

**Response:** Array of catalog entries:

```json
[
  {
    "id": "postgres",
    "name": "PostgreSQL",
    "category": "database",
    "icon": "database",
    "description": "...",
    "defaultImage": "postgres:16-alpine",
    "defaults": {}
  }
]
```

### `GET /catalog/services/{id}`

Return a single catalog service by id.

---

## Templates

### `GET /templates`

List environment templates. Optional query: `?category=spring`.

### `GET /templates/{slug}`

Get one template (e.g. `spring-boot-dev`, `rag-dev`).

### `POST /templates/{slug}/instantiate`

Create a new `Project` from a builtin template.

**Response:** `201 Created` with `ProjectResponse`.

---

## AI

### `POST /ai/generate-topology`

Generate a topology from a natural-language prompt (rule-based MVP; no external LLM required).

**Request**

```json
{
  "prompt": "Spring Boot with PostgreSQL and Redis"
}
```

**Response**

```json
{
  "topology": { "nodes": [], "edges": [] },
  "composeYaml": "services:\n  ...",
  "explanation": "Created Spring Boot, PostgreSQL, and Redis with dependency edges."
}
```

---

## Projects

### `GET /projects`

List all projects.

### `GET /projects/{id}`

Get project by UUID.

### `POST /projects`

Create project.

**Request**

```json
{
  "name": "My Dev Stack",
  "description": "Optional",
  "topology": { "nodes": [], "edges": [] },
  "composeYaml": null
}
```

### `PUT /projects/{id}`

Update project fields.

### `DELETE /projects/{id}`

Delete project. **Response:** `204 No Content`.

---

## Docker Health

### `GET /docker/health`

Check whether the backend can reach Docker Engine.

**Response**

```json
{
  "connected": true,
  "message": "Connected to Docker Engine",
  "version": "27.3.1"
}
```

When `DOCKER_ENABLED=false`, `connected` is `false` with an explanatory message.

---

## Runtime (v0.2)

Runtime endpoints deploy and manage compose stacks on the host Docker Engine. Enable with `DOCKER_ENABLED=true` and access to `docker.sock`.

### `POST /runtime/deploy`

Deploy compose YAML via `docker compose up -d`.

**Request**

```json
{
  "composeYaml": "services:\n  redis:\n    image: redis:7-alpine",
  "projectName": "my-dev-stack"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `composeYaml` | Yes | Full compose file content |
| `projectName` | No | Compose project name (`-p`); derived from YAML `name` or timestamp if omitted |

**Response:** `201 Created`

```json
{
  "deployId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "running",
  "message": "Deploy started",
  "composeProjectName": "my-dev-stack"
}
```

Use `deployId` for subsequent runtime calls and the WebSocket URL.

### `POST /runtime/stop`

Stop and remove a deployment (`docker compose down`).

**Request**

```json
{
  "deployId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response:** `204 No Content`

### `GET /runtime/containers?deployId={deployId}`

List containers belonging to the deploy session.

**Response**

```json
[
  {
    "id": "abc123",
    "name": "my-dev-stack-redis-1",
    "service": "redis",
    "image": "redis:7-alpine",
    "status": "Up 2 minutes",
    "state": "running",
    "health": "healthy",
    "ports": "6379/tcp"
  }
]
```

### `GET /runtime/containers/{containerId}/stats`

Snapshot CPU and memory usage for one container.

**Response**

```json
{
  "containerId": "abc123",
  "cpuPercent": 1.25,
  "memoryUsageMb": 12,
  "memoryLimitMb": 512,
  "memoryPercent": 2.34
}
```

---

## WebSocket: Runtime Stream

**URL:** `ws://localhost:8080/ws/runtime/{deployId}`  
(proxied as `ws://localhost:5173/ws/runtime/{deployId}` in Vite dev)

Connect after a successful deploy. The server rejects connections for unknown or expired `deployId` values.

### Server → Client events

Messages are JSON objects: `{ "type": "<event>", "payload": { ... } }`.

| `type` | Description |
|--------|-------------|
| `deploy.connected` | Connection established |
| `container.status` | Periodic container list (`payload.containers`) |
| `container.stats` | CPU/memory for running containers |
| `container.logs` | Log line (`containerId`, `line`, `timestamp`) |
| `error` | Fatal connection error |

**Example: container status**

```json
{
  "type": "container.status",
  "payload": {
    "containers": [
      {
        "id": "abc123",
        "name": "stack-redis-1",
        "service": "redis",
        "image": "redis:7-alpine",
        "status": "Up 1 minute",
        "state": "running",
        "health": "",
        "ports": "6379/tcp"
      }
    ]
  }
}
```

Status and stats are polled every **3 seconds** while the socket is open.

### Client → Server messages

Send JSON text frames:

**Subscribe to logs**

```json
{
  "type": "subscribe.logs",
  "containerId": "abc123"
}
```

**Unsubscribe**

```json
{
  "type": "unsubscribe.logs",
  "containerId": "abc123"
}
```

---

## Frontend Client

The TypeScript client in `frontend/src/lib/api.ts` wraps REST calls. WebSocket creation:

```typescript
import { createRuntimeWebSocket } from '@/lib/api';

const ws = createRuntimeWebSocket(deployId);
```

---

## OpenAPI / Future

An OpenAPI 3 spec may be added under `docs/openapi.yaml` in a future release. Until then, this document and controller source code are the source of truth.
