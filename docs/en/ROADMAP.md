# Product Roadmap

> **Language:** [English](ROADMAP.md) · [中文](../zh/ROADMAP.md)

**Repository:** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

Docker Compose Studio is an open-source visual orchestration tool for **local development environments**. This roadmap tracks shipped milestones and planned work.

## Status Summary

| Version | Theme | Status |
|---------|-------|--------|
| v0.1 | Visual editor MVP | ✅ Complete |
| v0.2 | Docker runtime | ✅ Complete |
| v0.3 | UX polish & validation | ✅ Complete |
| v0.4 | Collaboration & history | 🔜 Planned |
| v1.0 | Production-ready OSS | 🔜 Planned |

---

## v0.1 — Visual Editor MVP ✅

**Goal:** Prove the core value — drag, configure, export compose without hand-writing YAML.

| Feature | Status |
|---------|--------|
| Service marketplace (16+ catalog services) | ✅ |
| Visual canvas (React Flow) | ✅ |
| Service configuration panel | ✅ |
| Real-time compose generation (client-side) | ✅ |
| Export YAML / ZIP | ✅ |
| Compose import (YAML → graph) | ✅ |
| Compose diff viewer | ✅ |
| Environment templates (6 presets) | ✅ |
| AI topology generator (rule-based MVP) | ✅ |
| Spring Boot backend + PostgreSQL schema | ✅ |
| CI pipeline (GitHub Actions) | ✅ |

---

## v0.2 — Docker Runtime ✅

**Goal:** Run generated stacks locally from the UI with live feedback.

| Feature | Status |
|---------|--------|
| `POST /api/v1/runtime/deploy` | ✅ |
| `POST /api/v1/runtime/stop` | ✅ |
| `GET /api/v1/runtime/containers` | ✅ |
| `GET /api/v1/runtime/containers/{id}/stats` | ✅ |
| WebSocket `/ws/runtime/{deployId}` | ✅ |
| Runtime panel (deploy, stop, status) | ✅ |
| Container logs via WebSocket subscribe | ✅ |
| CPU / memory metrics streaming | ✅ |
| `GET /api/v1/docker/health` | ✅ |
| Docker socket integration (`DOCKER_ENABLED`) | ✅ |

See [API](API.md) and [Architecture](ARCHITECTURE.md) for runtime design details.

---

## v0.3 — UX Polish & Validation ✅

**Goal:** Safer deploys, better editor ergonomics, and user extensibility.

| Feature | Status |
|---------|--------|
| Compose validation (`/compose/validate/yaml`, `/topology`) | ✅ |
| `ValidationPanel` in compose editor | ✅ |
| Block deploy when validation has errors | ✅ |
| Undo / redo (keyboard shortcuts ⌘Z / ⌘⇧Z) | ✅ |
| Dark / light theme + `ThemeToggle` | ✅ |
| Custom services (localStorage catalog) | ✅ |
| Custom templates (save current graph as template) | ✅ |
| `SaveTemplateDialog` + merged template gallery | ✅ |
| Monaco theme follows app theme | ✅ |

---

## v0.4 — Collaboration & History 🔜

**Goal:** Multi-user workspaces and durable project history.

| Feature | Priority |
|---------|----------|
| User authentication (OAuth / local accounts) | High |
| Workspace membership and roles | High |
| Share project via link or export | Medium |
| `compose_snapshot` API — version history & rollback | High |
| Sync custom templates/services to backend | Medium |
| Persist deploy runs linked to runtime `deployId` | Medium |
| Redis-backed sessions / caching | Low |
| Commenting on topology nodes | Low |

---

## v1.0 — Production-Ready Open Source 🔜

**Goal:** Stable, documented, community-ready release.

| Feature | Priority |
|---------|----------|
| Remote Docker contexts (SSH / TLS) | High |
| LLM-backed AI topology (OpenAI / Ollama providers) | High |
| Internationalization (i18n) — EN / 中文 docs started | Medium |
| OpenAPI 3 specification + Swagger UI | Medium |
| Helm chart / production docker-compose profile | Medium |
| Plugin API for custom catalog providers | Low |
| E2E test suite (Playwright + Testcontainers) | High |
| Security audit (socket access, SSRF, YAML bombs) | High |

---

## Community Contributions

We welcome PRs in these areas:

1. **Catalog entries** — New services with sensible defaults (ports, env, health checks).
2. **Templates** — JSON presets under `backend/src/main/resources/templates/`.
3. **Compose parser** — Edge cases for `POST /compose/parse`.
4. **Validation rules** — Additional checks in `ComposeValidationService`.
5. **UI/UX** — Accessibility, keyboard navigation, mobile-friendly layout.

See [CONTRIBUTING.md](../../CONTRIBUTING.md) on GitHub.

## How to Track Progress

- GitHub Issues and Discussions: [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)
- Feature table in root [README.md](../../README.md)
