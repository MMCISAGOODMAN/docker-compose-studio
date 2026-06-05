<div align="center">

# Docker Compose Studio

**Visual Docker Compose orchestration for local development environments**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](backend/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](frontend/)
[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.3-green.svg)](backend/)

*Stop hand-writing docker-compose.yml. Drag, configure, export, and run.*

**Language:** [English](README.md) · [中文](README.zh-CN.md)

[Demo](#quick-start) · [Features](#features) · [Architecture](docs/en/ARCHITECTURE.md) · [Roadmap](docs/en/ROADMAP.md) · [Contributing](CONTRIBUTING.md) · [Docs Index](docs/README.md)

</div>

---

## Why Docker Compose Studio?

Building local dev environments shouldn't require memorizing Docker Compose syntax. Docker Compose Studio is a **visual orchestration platform** that helps you:

- **Drag & drop** services (PostgreSQL, Redis, Kafka, Ollama, Spring Boot...) onto a canvas
- **Auto-generate** production-ready `docker-compose.yml` with networks, volumes, health checks, and `depends_on`
- **Import** existing compose files and visualize them as topology graphs
- **Use templates** for Spring Boot, Python, RAG, Microservices, and AI environments
- **Ask AI** to generate environments from natural language

> Think **Figma for Docker Compose** — focused on local development, not cloud deployment.

## Features

| Feature | Status |
|---------|--------|
| Service Marketplace (16+ services) | ✅ MVP |
| Visual Canvas (React Flow) | ✅ MVP |
| Service Configuration Panel | ✅ MVP |
| Real-time Compose Generation | ✅ MVP |
| Export YAML / ZIP | ✅ MVP |
| Compose Import (YAML → Graph) | ✅ MVP |
| Compose Diff | ✅ MVP |
| Compose Validation | ✅ v0.3 |
| Undo/Redo | ✅ v0.3 |
| Dark / Light Theme | ✅ v0.3 |
| Custom Templates & Services | ✅ v0.3 |
| Environment Templates (6 presets) | ✅ MVP |
| AI Topology Generator | ✅ MVP |
| Docker one-click deploy | ✅ v0.2 |
| Container Logs & Metrics | ✅ v0.2 |

## Quick Start

### Option 1: Frontend Only (fastest)

The compose generator runs entirely in the browser — no backend required.

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Option 2: Full Stack

```bash
# Start PostgreSQL + Redis
docker compose up -d postgres redis

# Backend
cd backend
./mvnw spring-boot:run

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Option 3: Docker (all services)

```bash
docker compose up -d
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
```

## Screenshots

```
┌──────────────┬─────────────────────────────┬──────────────┬─────────────────┐
│   Service    │                             │   Service    │  docker-compose │
│  Marketplace │      Visual Canvas          │   Config     │     .yml        │
│              │                             │   Panel      │  (Monaco Editor)│
│  PostgreSQL  │  [Spring Boot]──→[Redis]   │              │                 │
│  Redis       │       │                     │  Image: ...  │  services:      │
│  Kafka       │       └──→[PostgreSQL]      │  Ports: ...  │    postgres:    │
│  Ollama      │                             │  Env vars    │      image: ... │
│  ...         │                             │              │                 │
└──────────────┴─────────────────────────────┴──────────────┴─────────────────┘
```

## Supported Services

| Category | Services |
|----------|----------|
| **Database** | PostgreSQL, MySQL, MongoDB, Redis |
| **Messaging** | Kafka, RabbitMQ |
| **Storage** | MinIO |
| **Search** | Elasticsearch |
| **AI** | Ollama, Open WebUI, Qdrant |
| **Development** | Spring Boot, Node.js, Python, Nginx |

## Architecture

```
React SPA (Vite + React Flow + Monaco)
         │ REST + WebSocket
Spring Boot 3 API (Java 21)
         │
PostgreSQL · Redis · Docker Engine
```

See [docs/en/ARCHITECTURE.md](docs/en/ARCHITECTURE.md) for detailed system design.

## Project Structure

```
docker-compose-studio/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # Canvas, Marketplace, Config, AI, Diff
│   │   ├── lib/          # Compose generator, parser, catalog
│   │   └── stores/       # Zustand state management
├── backend/           # Spring Boot 3 + Java 21
│   └── src/main/java/com/dockercompose/studio/
│       ├── controller/   # REST API
│       ├── service/      # Business logic + Docker integration
│       └── domain/       # JPA entities
├── docs/              # Bilingual docs (en/ + zh/)
├── .github/workflows/ # CI pipeline
└── docker-compose.yml # Dev environment
```

## API

REST API at `/api/v1`. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/catalog/services` | Service marketplace |
| POST | `/compose/generate` | Graph → YAML |
| POST | `/compose/parse` | YAML → Graph |
| POST | `/compose/diff` | Compare two compose files |
| POST | `/ai/generate-topology` | NL → Topology |
| GET | `/templates` | Environment templates |
| POST | `/runtime/deploy` | One-click Docker deploy |
| WS | `/ws/runtime/{deployId}` | Live logs & status |

Full API docs: [docs/en/API.md](docs/en/API.md)

## Environment Templates

| Template | Services |
|----------|----------|
| Spring Boot Dev | Spring Boot + PostgreSQL + Redis |
| Python Dev | Python + PostgreSQL + Redis |
| RAG Dev | Ollama + Open WebUI + Qdrant + PostgreSQL |
| AI Dev | Ollama + Open WebUI |
| Microservices | Spring Boot + Kafka + PostgreSQL + Redis + Nginx |
| Kafka Cluster | Kafka + Zookeeper |

## Roadmap

- **v0.1** ✅ Visual editor, compose gen, templates, AI, import/diff
- **v0.2** ✅ Docker one-click deploy, logs, container metrics
- **v0.3** ✅ Custom services, undo/redo, validation, theme
- **v0.4**: Team workspaces, sharing, version history
- **v1.0**: Remote Docker, LLM AI, i18n

See [docs/en/ROADMAP.md](docs/en/ROADMAP.md) for the full plan.

## Documentation

| English | 中文 |
|---------|------|
| [Architecture](docs/en/ARCHITECTURE.md) | [系统架构](docs/zh/ARCHITECTURE.md) |
| [API](docs/en/API.md) | [API 设计](docs/zh/API.md) |
| [Database](docs/en/DATABASE.md) | [数据库设计](docs/zh/DATABASE.md) |
| [Roadmap](docs/en/ROADMAP.md) | [路线图](docs/zh/ROADMAP.md) |
| [Components](docs/en/COMPONENTS.md) | [React 组件](docs/zh/COMPONENTS.md) |
| [Entities](docs/en/ENTITIES.md) | [Java 实体](docs/zh/ENTITIES.md) |
| [Launch](docs/en/LAUNCH.md) | [首发文章](docs/zh/LAUNCH.md) |

Full index: [docs/README.md](docs/README.md)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) ([中文](CONTRIBUTING.zh-CN.md)).

Priority areas:
- New service catalog entries with best-practice defaults
- Community environment templates
- Compose parser edge cases
- UI/UX improvements

## License

[MIT](LICENSE) — free for personal and commercial use.

---

<div align="center">
If Docker Compose Studio saves you time, consider giving it a ⭐ on <a href="https://github.com/MMCISAGOODMAN/docker-compose-studio">GitHub</a>!
</div>
