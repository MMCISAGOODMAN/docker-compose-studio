# React Components

> **Language:** [English](COMPONENTS.md) · [中文](../zh/COMPONENTS.md)

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · @xyflow/react · Monaco Editor · Zustand  
**Repository:** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

## Application Layout

`App.tsx` defines a four-column shell:

```
┌────────────┬──────────────────────┬─────────────┬─────────────────────┐
│ Marketplace│       Canvas         │ ConfigPanel │  Right panel tabs   │
│   (264px)  │     (flex grow)      │   (288px)   │  Compose / Runtime│
│            │                      │             │  Templates / AI/Diff│
└────────────┴──────────────────────┴─────────────┴─────────────────────┘
```

`Header.tsx` spans the top: project name, undo/redo, validation badge, import/export, `ThemeToggle`, and right-panel tab triggers.

## Component Tree

```
App.tsx
├── Header.tsx
│   ├── ImportButton.tsx
│   ├── ThemeToggle.tsx          ← v0.3
│   └── RightPanelTabs (exported from Header)
├── ServiceMarketplace.tsx
│   └── CustomServiceDialog.tsx  ← v0.3 custom catalog
├── Canvas.tsx
│   └── ServiceNode.tsx
├── ConfigPanel.tsx
└── Right panel (panelView switch)
    ├── ComposeEditor.tsx
    │   └── ValidationPanel.tsx  ← v0.3
    ├── RuntimePanel.tsx         ← v0.2
    ├── TemplateGallery.tsx
    │   └── SaveTemplateDialog.tsx  ← v0.3 custom templates
    ├── AiAssistant.tsx
    └── DiffPanel.tsx
```

## State Management (Zustand)

| Store | File | Responsibility |
|-------|------|----------------|
| `useProjectStore` | `stores/project-store.ts` | Nodes, edges, YAML, selection, undo/redo, validation, panel view |
| `useRuntimeStore` | `stores/runtime-store.ts` | Deploy session, containers, stats, logs, WebSocket status |
| `useThemeStore` | `stores/theme-store.ts` | `dark` / `light` theme, DOM class, Monaco theme name |
| `useCustomCatalogStore` | `stores/custom-catalog-store.ts` | User-defined marketplace services (`localStorage`) |
| `useCustomTemplatesStore` | `stores/custom-templates-store.ts` | User-saved templates (`localStorage`) |

## Core Components

### `ServiceMarketplace`

**Path:** `components/marketplace/ServiceMarketplace.tsx`

- Renders catalog grouped by category (database, messaging, AI, etc.).
- Merges builtin catalog (`lib/catalog.ts`) with custom services from `useCustomCatalogStore`.
- Drag start sets `application/dcs-service` data transfer; canvas `onDrop` creates a node.

### `CustomServiceDialog` (v0.3)

**Path:** `components/marketplace/CustomServiceDialog.tsx`

- Form to define a custom service: name, image, default ports/env.
- Persists to `localStorage` and appears in the marketplace with `isCustom: true`.

### `Canvas`

**Path:** `components/canvas/Canvas.tsx`

- React Flow graph with `ServiceNode` custom nodes.
- Supports pan/zoom, edge creation for `depends_on`, node selection.
- Syncs topology changes to compose YAML via `project-store`.

### `ServiceNode`

**Path:** `components/canvas/ServiceNode.tsx`

- Visual card per service: icon, name, image snippet, port badges.
- Highlights when selected or referenced by validation issues.

### `ConfigPanel`

**Path:** `components/config/ConfigPanel.tsx`

- Edits selected node: image, ports, volumes, environment variables, health check, command, resource limits.
- Changes propagate to YAML regeneration.

### `ComposeEditor`

**Path:** `components/compose/ComposeEditor.tsx`

- Monaco editor for `composeYaml`; theme from `getMonacoTheme(theme)`.
- Mounts `ValidationPanel` above the editor.
- Calls `runValidation()` on mount and when YAML/topology changes (debounced in store).
- `onIssueClick` selects the canvas node matching `issue.service`.

### `ValidationPanel` (v0.3)

**Path:** `components/compose/ValidationPanel.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `validation` | `ValidationResult \| null` | Result from `/compose/validate/yaml` or client mirror |
| `onIssueClick` | `(issue) => void` | Optional navigation to offending service |

**UI states:**

- No issues — green banner: “Compose is valid — ready to deploy”
- Warnings only — yellow collapsible list
- Errors — red list; deploy blocked in `RuntimePanel` when `valid === false`

Validation can run client-side (`lib/compose-validate.ts`) or via `api.validateYaml` when the backend is available.

### `RuntimePanel` (v0.2)

**Path:** `components/runtime/RuntimePanel.tsx`

One-click local deploy and observability.

| Section | Behavior |
|---------|----------|
| Docker status | `GET /docker/health` on mount — shows connected/disconnected |
| Deploy / Stop | `api.deploy` / `api.stop`; respects validation gate |
| Container list | Updated from WebSocket `container.status` |
| Metrics | `container.stats` — CPU %, memory MB |
| Logs | `useRuntimeWebSocket` sends `subscribe.logs` for selected container |
| Live indicator | WebSocket connected icon |

Uses `useRuntimeWebSocket(deployId)` hook for all real-time data.

### `useRuntimeWebSocket`

**Path:** `hooks/useRuntimeWebSocket.ts`

- Opens `createRuntimeWebSocket(deployId)` → `/ws/runtime/{deployId}`
- Handles `container.status`, `container.stats`, `container.logs`
- Subscribes/unsubscribes log stream when `selectedContainerId` changes

### `ThemeToggle` (v0.3)

**Path:** `components/theme/ThemeToggle.tsx`

- Toggles `useThemeStore` between `dark` and `light`.
- Renders Sun icon in dark mode (switch to light) and Moon in light mode.
- Placed in `Header`; applies `dark` class on `document.documentElement` for Tailwind `dark:` variants.

### `TemplateGallery`

**Path:** `components/templates/TemplateGallery.tsx`

- Lists builtin templates from `lib/templates.ts` and API `GET /templates` when backend runs.
- Merges **custom templates** from `useCustomTemplatesStore` (localStorage).
- “Load template” replaces current topology; “Save as template” opens dialog.

### `SaveTemplateDialog` (v0.3)

**Path:** `components/templates/SaveTemplateDialog.tsx`

- Captures name, description, category from current canvas.
- Calls `saveTemplate()` — generates slug, `composeYaml`, persists to `dcs-custom-templates`.

### `AiAssistant`

**Path:** `components/ai/AiAssistant.tsx`

- Natural-language prompt → topology via `api.generateTopology` or `lib/ai-local.ts` fallback.
- Applies returned graph to the canvas.

### `DiffPanel`

**Path:** `components/diff/DiffPanel.tsx`

- Side-by-side or unified diff of two YAML sources via `api.diffCompose`.

### `ImportButton`

**Path:** `components/import/ImportButton.tsx`

- File picker for existing `docker-compose.yml` → `api.parseCompose` or client parser.

### `Header`

**Path:** `components/layout/Header.tsx`

- Project name input, undo/redo buttons, validation error badge.
- Export YAML/ZIP, GitHub link, `ThemeToggle`.
- `RightPanelTabs`: Compose · **Runtime** · Templates · AI · Diff.
- Runtime tab shows deploy status dot when active.

## Custom Templates Flow (v0.3)

```
User designs topology on Canvas
        │
        ▼
SaveTemplateDialog → useCustomTemplatesStore.saveTemplate()
        │
        ▼
localStorage key: dcs-custom-templates
        │
        ▼
TemplateGallery merges custom + builtin → user loads later
```

Custom templates include `isCustom: true` and a generated `slug` like `custom-my-stack-1717584000000`.

## Custom Services Flow (v0.3)

```
CustomServiceDialog → useCustomCatalogStore.addService()
        │
        ▼
mergeCatalog() in App onDrop handler
        │
        ▼
New node on Canvas with user defaults
```

## Keyboard Shortcuts

**Path:** `hooks/useKeyboardShortcuts.ts`

| Shortcut | Action |
|----------|--------|
| ⌘Z / Ctrl+Z | Undo |
| ⌘⇧Z / Ctrl+Shift+Z | Redo |
| Delete | Remove selected node |

## API Integration

**Path:** `lib/api.ts`

Central `fetch` wrapper for `/api/v1/*` and `createRuntimeWebSocket()`. Vite dev server proxies `/api` and `/ws` to port 8080.

## Styling Conventions

- CSS variables: `dcs-bg`, `dcs-surface`, `dcs-border`, `dcs-text`, `dcs-muted`, `dcs-accent`
- Dark mode is default; light mode via `ThemeToggle` and `theme-store`
- Icons: `lucide-react`

## Related Documentation

- [Architecture](ARCHITECTURE.md) — frontend/backend split
- [API](API.md) — endpoints consumed by components
- [Roadmap](ROADMAP.md) — v0.3 feature completion
