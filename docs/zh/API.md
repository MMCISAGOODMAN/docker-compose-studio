# REST API 设计

> **语言：** [English](../en/API.md) · [中文](API.md)

**Base URL：** `http://localhost:8080/api/v1`  
**仓库：** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

所有 JSON 端点使用 `Content-Type: application/json`。错误响应采用统一结构：

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

| HTTP 状态码 | 典型 `code` |
|-------------|-------------|
| 400 | `BAD_REQUEST`、`VALIDATION_ERROR` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL_ERROR` |

---

## Compose

### `POST /compose/generate`

将拓扑图转换为 `docker-compose.yml`。

**请求**

```json
{
  "topology": {
    "nodes": [],
    "edges": []
  }
}
```

**响应**

```json
{
  "composeYaml": "services:\n  ..."
}
```

### `POST /compose/parse`

将 YAML 解析为拓扑图。

**请求**

```json
{
  "yaml": "services:\n  postgres:\n    image: postgres:16-alpine"
}
```

**响应**

```json
{
  "topology": { "nodes": [], "edges": [] },
  "yaml": "..."
}
```

### `POST /compose/diff`

对比两份 compose 文档。

**请求**

```json
{
  "source": "services:\n  redis:\n    image: redis:7",
  "target": "services:\n  redis:\n    image: redis:7-alpine"
}
```

**响应**

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

校验 compose YAML（语法、结构、最佳实践警告）。

**请求**

```json
{
  "yaml": "services:\n  app:\n    image: nginx"
}
```

**响应**

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

在生成前校验画布拓扑。

**请求**

```json
{
  "topology": { "nodes": [], "edges": [] }
}
```

**响应：** 与 `validate/yaml` 结构相同。

---

## Catalog（服务目录）

### `GET /catalog/services`

列出服务市场全部服务（启动时从 `catalog/services.json` 加载）。

**响应：** 目录条目数组：

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

按 id 返回单个目录服务。

---

## Templates（环境模板）

### `GET /templates`

列出环境模板。可选查询参数：`?category=spring`。

### `GET /templates/{slug}`

获取单个模板（如 `spring-boot-dev`、`rag-dev`）。

### `POST /templates/{slug}/instantiate`

从内置模板创建新 `Project`。

**响应：** `201 Created`，返回 `ProjectResponse`。

---

## AI

### `POST /ai/generate-topology`

根据自然语言 prompt 生成拓扑（基于规则的 MVP，无需外部 LLM）。

**请求**

```json
{
  "prompt": "Spring Boot with PostgreSQL and Redis"
}
```

**响应**

```json
{
  "topology": { "nodes": [], "edges": [] },
  "composeYaml": "services:\n  ...",
  "explanation": "Created Spring Boot, PostgreSQL, and Redis with dependency edges."
}
```

---

## Projects（项目）

### `GET /projects`

列出全部项目。

### `GET /projects/{id}`

按 UUID 获取项目。

### `POST /projects`

创建项目。

**请求**

```json
{
  "name": "My Dev Stack",
  "description": "Optional",
  "topology": { "nodes": [], "edges": [] },
  "composeYaml": null
}
```

### `PUT /projects/{id}`

更新项目字段。

### `DELETE /projects/{id}`

删除项目。**响应：** `204 No Content`。

---

## Docker Health

### `GET /docker/health`

检查后端是否能连接 Docker Engine。

**响应**

```json
{
  "connected": true,
  "message": "Connected to Docker Engine",
  "version": "27.3.1"
}
```

当 `DOCKER_ENABLED=false` 时，`connected` 为 `false`，并附带说明信息。

---

## Runtime（v0.2）

Runtime 端点在宿主机 Docker Engine 上部署并管理 compose 栈。需设置 `DOCKER_ENABLED=true` 且可访问 `docker.sock`。

### `POST /runtime/deploy`

通过 `docker compose up -d` 部署 compose YAML。

**请求**

```json
{
  "composeYaml": "services:\n  redis:\n    image: redis:7-alpine",
  "projectName": "my-dev-stack"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `composeYaml` | 是 | 完整 compose 文件内容 |
| `projectName` | 否 | Compose 项目名（`-p`）；省略时从 YAML `name` 或时间戳推导 |

**响应：** `201 Created`

```json
{
  "deployId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "running",
  "message": "Deploy started",
  "composeProjectName": "my-dev-stack"
}
```

后续 runtime 调用与 WebSocket URL 均使用 `deployId`。

### `POST /runtime/stop`

停止并移除部署（`docker compose down`）。

**请求**

```json
{
  "deployId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**响应：** `204 No Content`

### `GET /runtime/containers?deployId={deployId}`

列出属于该部署会话的容器。

**响应**

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

获取单个容器的 CPU 与内存快照。

**响应**

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

## WebSocket：Runtime 实时流

**URL：** `ws://localhost:8080/ws/runtime/{deployId}`  
（Vite 开发模式下代理为 `ws://localhost:5173/ws/runtime/{deployId}`）

部署成功后建立连接。未知或已过期的 `deployId` 将被拒绝。

### 服务端 → 客户端事件

消息为 JSON：`{ "type": "<event>", "payload": { ... } }`。

| `type` | 说明 |
|--------|------|
| `deploy.connected` | 连接已建立 |
| `container.status` | 周期性容器列表（`payload.containers`） |
| `container.stats` | 运行中容器的 CPU/内存 |
| `container.logs` | 日志行（`containerId`、`line`、`timestamp`） |
| `error` | 致命连接错误 |

**示例：container status**

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

连接保持期间，状态与指标每 **3 秒** 轮询一次。

### 客户端 → 服务端消息

发送 JSON 文本帧：

**订阅日志**

```json
{
  "type": "subscribe.logs",
  "containerId": "abc123"
}
```

**取消订阅**

```json
{
  "type": "unsubscribe.logs",
  "containerId": "abc123"
}
```

---

## 前端客户端

`frontend/src/lib/api.ts` 封装 REST 调用。WebSocket 创建方式：

```typescript
import { createRuntimeWebSocket } from '@/lib/api';

const ws = createRuntimeWebSocket(deployId);
```

---

## OpenAPI / 后续计划

未来版本可能在 `docs/openapi.yaml` 提供 OpenAPI 3 规范。在此之前，本文档与 Controller 源码为权威参考。
