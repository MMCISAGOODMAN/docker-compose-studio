# Contributing to Docker Compose Studio

> **Language:** [English](CONTRIBUTING.md) · [中文](CONTRIBUTING.zh-CN.md)

Thank you for your interest in contributing! This project aims to become the go-to tool for visual Docker Compose orchestration.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/MMCISAGOODMAN/docker-compose-studio.git
cd docker-compose-studio

# Start infrastructure
docker compose up -d postgres redis

# Backend
cd backend && ./mvnw spring-boot:run

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## How to Contribute

### Add a Service to the Catalog

1. Edit `backend/src/main/resources/catalog/services.json`
2. Mirror the entry in `frontend/src/lib/catalog.ts`
3. Include best-practice defaults: health checks, volumes, env vars

### Add an Environment Template

1. Create `backend/src/main/resources/templates/your-template.json`
2. Add to `frontend/src/lib/templates.ts`
3. Include realistic service topology with dependency edges

### Code Style

- **Frontend**: TypeScript strict mode, functional React components, TailwindCSS
- **Backend**: Java 21, Spring Boot 3 conventions, Lombok for boilerplate
- Keep PRs focused — one feature or fix per PR

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with clear messages
4. Push to your fork and open a PR
5. Ensure CI passes

## Documentation

All docs are bilingual. When updating documentation:

- English: `docs/en/` and root `README.md`, `CONTRIBUTING.md`
- 中文: `docs/zh/` and root `README.zh-CN.md`, `CONTRIBUTING.zh-CN.md`
- Index: [docs/README.md](docs/README.md)

## Community

- [GitHub Issues](https://github.com/MMCISAGOODMAN/docker-compose-studio/issues) for bugs and feature requests
- [GitHub Discussions](https://github.com/MMCISAGOODMAN/docker-compose-studio/discussions) for questions and ideas
- Be respectful and inclusive
