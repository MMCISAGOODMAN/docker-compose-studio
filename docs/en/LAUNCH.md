# Launch: Docker Compose Studio

> **Language:** [English](LAUNCH.md) · [中文](../zh/LAUNCH.md)

**Stop hand-writing `docker-compose.yml`. Start shipping local dev environments in minutes.**

- **GitHub:** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)
- **License:** MIT

---

## The Problem

Every new project starts the same way: copy an old `docker-compose.yml`, fix image tags, hunt for port conflicts, wire up `depends_on`, and hope health checks are right. For stacks with PostgreSQL, Redis, Kafka, and an app service, that is an hour of yak-shaving before you write application code.

Tools like Docker Desktop and Portainer focus on **running** containers. Railway and Render target **cloud deployment**. What is missing is a tool built specifically for **designing local development environments** — visually, correctly, and repeatably.

## The Solution

**Docker Compose Studio** is open-source visual orchestration for local dev:

- Drag **PostgreSQL**, **Redis**, **Kafka**, **Ollama**, **Spring Boot**, and 12+ more services onto a canvas
- Connect dependencies with edges — `depends_on` is generated for you
- Edit ports, volumes, env vars, and health checks in a side panel
- Export production-ready YAML or **run it locally with one click**
- Import existing compose files and see them as a topology graph
- Start from templates: Spring Boot, Python, RAG, Microservices, Kafka

Think **Figma for Docker Compose** — not for production clusters, but for the environment you code against every day.

## What Shipped

### MVP (v0.1)

Service marketplace, React Flow canvas, Monaco editor, compose generate/parse/diff, six environment templates, and a rule-based AI assistant that builds topologies from plain English.

### Runtime (v0.2)

Deploy and stop stacks against your local Docker Engine. Stream container status, CPU/memory stats, and logs over WebSocket — no terminal juggling.

### Polish (v0.3)

Compose validation before deploy, undo/redo, dark/light theme, and **custom templates and services** saved in the browser so your stack definitions travel with you.

## Quick Start

### Fastest path — frontend only

The compose generator runs in the browser. No Java, no database.

```bash
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio/frontend
npm install
npm run dev
```

Open **http://localhost:5173** and start dragging services.

### Full stack with Docker runtime

```bash
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio

# Start PostgreSQL, Redis, backend, frontend
docker compose up -d

# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
```

The backend container mounts `docker.sock` and sets `DOCKER_ENABLED=true` so the **Runtime** panel can deploy your graph.

### Local development (backend + frontend)

```bash
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio

docker compose up -d postgres redis

# Terminal 1
cd backend
./mvnw spring-boot:run

# Terminal 2
cd frontend
npm install
npm run dev
```

Set `DOCKER_ENABLED=true` on the backend to use runtime deploy from your host Docker.

## Who It Is For

- **Backend developers** spinning up Spring Boot / Node / Python with databases and caches
- **AI engineers** prototyping RAG stacks (Ollama, Qdrant, Open WebUI)
- **Platform enthusiasts** who want readable, shareable compose definitions
- **Open-source contributors** extending the catalog, templates, and validation rules

## Differentiators

| | Docker Compose Studio | Generic compose generators |
|--|----------------------|----------------------------|
| Focus | Local dev environments | One-off YAML snippets |
| Input | Visual graph + templates | Forms or text only |
| Output | Validated YAML + live deploy | Static file |
| Extensibility | Custom services & templates | Fixed lists |

## Try These Flows

1. **Template → Edit → Export** — Load “Spring Boot Dev”, add MinIO, export ZIP.
2. **Import → Visualize** — Paste an existing compose file; inspect the graph.
3. **AI → Deploy** — Ask for “Python app with PostgreSQL and Redis”, validate, hit **Deploy** in the Runtime panel.
4. **Save custom template** — Build a stack, save it, reload in your next session.

## Documentation

| Doc | Link |
|-----|------|
| Architecture | [docs/en/ARCHITECTURE.md](ARCHITECTURE.md) |
| API | [docs/en/API.md](API.md) |
| Roadmap | [docs/en/ROADMAP.md](ROADMAP.md) |
| Components | [docs/en/COMPONENTS.md](COMPONENTS.md) |

## Get Involved

- ⭐ Star the repo: [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)
- 🐛 Report issues or request catalog services
- 🔧 See [CONTRIBUTING.md](../../CONTRIBUTING.md) for PR guidelines

Priority contributions: new catalog entries, community templates, compose parser edge cases, and validation rules.

---

*Docker Compose Studio — design your local stack visually, deploy it confidently.*
