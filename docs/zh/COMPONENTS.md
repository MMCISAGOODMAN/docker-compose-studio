# React 组件设计

> **语言：** [English](../en/COMPONENTS.md) · [中文](COMPONENTS.md)

**技术栈：** React 18 · TypeScript · Vite · Tailwind CSS · @xyflow/react · Monaco Editor · Zustand  
**仓库：** [https://github.com/MMCISAGOODMAN/docker-compose-studio](https://github.com/MMCISAGOODMAN/docker-compose-studio)

## 应用布局

`App.tsx` 定义四栏式外壳：

```
┌────────────┬──────────────────────┬─────────────┬─────────────────────┐
│ Marketplace│       Canvas         │ ConfigPanel │  Right panel tabs   │
│   (264px)  │     (flex grow)      │   (288px)   │  Compose / Runtime│
│            │                      │             │  Templates / AI/Diff│
└────────────┴──────────────────────┴─────────────┴─────────────────────┘
```

`Header.tsx` 横跨顶部：项目名称、撤销/重做、校验徽章、导入/导出、`ThemeToggle` 及右侧面板 Tab 切换。

## 组件树

```
App.tsx
├── Header.tsx
│   ├── ImportButton.tsx
│   ├── ThemeToggle.tsx          ← v0.3
│   └── RightPanelTabs (exported from Header)
├── ServiceMarketplace.tsx
│   └── CustomServiceDialog.tsx  ← v0.3 自定义目录
├── Canvas.tsx
│   └── ServiceNode.tsx
├── ConfigPanel.tsx
└── Right panel (panelView switch)
    ├── ComposeEditor.tsx
    │   └── ValidationPanel.tsx  ← v0.3
    ├── RuntimePanel.tsx         ← v0.2
    ├── TemplateGallery.tsx
    │   └── SaveTemplateDialog.tsx  ← v0.3 自定义模板
    ├── AiAssistant.tsx
    └── DiffPanel.tsx
```

## 状态管理（Zustand）

| Store | 文件 | 职责 |
|-------|------|------|
| `useProjectStore` | `stores/project-store.ts` | 节点、边、YAML、选中、撤销/重做、校验、面板视图 |
| `useRuntimeStore` | `stores/runtime-store.ts` | 部署会话、容器、指标、日志、WebSocket 状态 |
| `useThemeStore` | `stores/theme-store.ts` | `dark` / `light` 主题、DOM class、Monaco 主题名 |
| `useCustomCatalogStore` | `stores/custom-catalog-store.ts` | 用户自定义服务市场（`localStorage`） |
| `useCustomTemplatesStore` | `stores/custom-templates-store.ts` | 用户保存的模板（`localStorage`） |

## 核心组件

### `ServiceMarketplace`

**路径：** `components/marketplace/ServiceMarketplace.tsx`

- 按类别（database、messaging、AI 等）渲染服务目录。
- 合并内置目录（`lib/catalog.ts`）与 `useCustomCatalogStore` 中的自定义服务。
- 拖拽开始时设置 `application/dcs-service` 数据传输；画布 `onDrop` 创建节点。

### `CustomServiceDialog`（v0.3）

**路径：** `components/marketplace/CustomServiceDialog.tsx`

- 表单定义自定义服务：名称、镜像、默认端口/环境变量。
- 持久化至 `localStorage`，以 `isCustom: true` 出现在服务市场。

### `Canvas`

**路径：** `components/canvas/Canvas.tsx`

- React Flow 图，使用 `ServiceNode` 自定义节点。
- 支持平移/缩放、创建 `depends_on` 边、节点选择。
- 拓扑变更通过 `project-store` 同步至 compose YAML。

### `ServiceNode`

**路径：** `components/canvas/ServiceNode.tsx`

- 每个服务的可视化卡片：图标、名称、镜像摘要、端口徽章。
- 选中或被校验问题引用时高亮。

### `ConfigPanel`

**路径：** `components/config/ConfigPanel.tsx`

- 编辑选中节点：image、ports、volumes、环境变量、healthcheck、command、资源限制。
- 变更触发 YAML 重新生成。

### `ComposeEditor`

**路径：** `components/compose/ComposeEditor.tsx`

- Monaco 编辑器编辑 `composeYaml`；主题来自 `getMonacoTheme(theme)`。
- 编辑器上方挂载 `ValidationPanel`。
- 挂载时及 YAML/拓扑变更时调用 `runValidation()`（store 内防抖）。
- `onIssueClick` 选中与 `issue.service` 匹配的画布节点。

### `ValidationPanel`（v0.3）

**路径：** `components/compose/ValidationPanel.tsx`

| Prop | 类型 | 说明 |
|------|------|------|
| `validation` | `ValidationResult \| null` | 来自 `/compose/validate/yaml` 或客户端镜像的结果 |
| `onIssueClick` | `(issue) => void` | 可选，导航至问题服务 |

**UI 状态：**

- 无问题 — 绿色横幅："Compose is valid — ready to deploy"
- 仅警告 — 黄色可折叠列表
- 错误 — 红色列表；`valid === false` 时 `RuntimePanel` 阻止部署

校验可在客户端（`lib/compose-validate.ts`）运行，或在后端可用时通过 `api.validateYaml`。

### `RuntimePanel`（v0.2）

**路径：** `components/runtime/RuntimePanel.tsx`

本地一键部署与可观测性。

| 区域 | 行为 |
|------|------|
| Docker 状态 | 挂载时 `GET /docker/health` — 显示已连接/未连接 |
| Deploy / Stop | `api.deploy` / `api.stop`；受校验门禁约束 |
| 容器列表 | 由 WebSocket `container.status` 更新 |
| 指标 | `container.stats` — CPU %、内存 MB |
| 日志 | `useRuntimeWebSocket` 对选中容器发送 `subscribe.logs` |
| 实时指示 | WebSocket 连接图标 |

所有实时数据通过 `useRuntimeWebSocket(deployId)` 钩子获取。

### `useRuntimeWebSocket`

**路径：** `hooks/useRuntimeWebSocket.ts`

- 打开 `createRuntimeWebSocket(deployId)` → `/ws/runtime/{deployId}`
- 处理 `container.status`、`container.stats`、`container.logs`
- `selectedContainerId` 变更时订阅/取消订阅日志流

### `ThemeToggle`（v0.3）

**路径：** `components/theme/ThemeToggle.tsx`

- 在 `useThemeStore` 的 `dark` 与 `light` 间切换。
- 深色模式显示 Sun 图标（切换至浅色），浅色模式显示 Moon。
- 位于 `Header`；在 `document.documentElement` 上应用 `dark` class 以启用 Tailwind `dark:` 变体。

### `TemplateGallery`

**路径：** `components/templates/TemplateGallery.tsx`

- 列出 `lib/templates.ts` 内置模板；后端运行时同时拉取 API `GET /templates`。
- 合并 **自定义模板**（`useCustomTemplatesStore`，localStorage）。
- 「加载模板」替换当前拓扑；「另存为模板」打开对话框。

### `SaveTemplateDialog`（v0.3）

**路径：** `components/templates/SaveTemplateDialog.tsx`

- 从当前画布采集名称、描述、类别。
- 调用 `saveTemplate()` — 生成 slug、`composeYaml`，持久化至 `dcs-custom-templates`。

### `AiAssistant`

**路径：** `components/ai/AiAssistant.tsx`

- 自然语言 prompt → 拓扑，通过 `api.generateTopology` 或 `lib/ai-local.ts` 降级。
- 将返回的图应用到画布。

### `DiffPanel`

**路径：** `components/diff/DiffPanel.tsx`

- 通过 `api.diffCompose` 对两份 YAML 进行并排或统一 diff。

### `ImportButton`

**路径：** `components/import/ImportButton.tsx`

- 文件选择器导入现有 `docker-compose.yml` → `api.parseCompose` 或客户端解析器。

### `Header`

**路径：** `components/layout/Header.tsx`

- 项目名称输入、撤销/重做按钮、校验错误徽章。
- 导出 YAML/ZIP、GitHub 链接、`ThemeToggle`。
- `RightPanelTabs`：Compose · **Runtime** · Templates · AI · Diff。
- Runtime Tab 在部署活跃时显示状态圆点。

## 自定义模板流程（v0.3）

```
用户在 Canvas 设计拓扑
        │
        ▼
SaveTemplateDialog → useCustomTemplatesStore.saveTemplate()
        │
        ▼
localStorage key: dcs-custom-templates
        │
        ▼
TemplateGallery 合并自定义 + 内置 → 用户稍后加载
```

自定义模板包含 `isCustom: true` 及生成的 slug，如 `custom-my-stack-1717584000000`。

## 自定义服务流程（v0.3）

```
CustomServiceDialog → useCustomCatalogStore.addService()
        │
        ▼
App onDrop 处理器中的 mergeCatalog()
        │
        ▼
Canvas 上带用户默认值的新节点
```

## 键盘快捷键

**路径：** `hooks/useKeyboardShortcuts.ts`

| 快捷键 | 操作 |
|--------|------|
| ⌘Z / Ctrl+Z | 撤销 |
| ⌘⇧Z / Ctrl+Shift+Z | 重做 |
| Delete | 删除选中节点 |

## API 集成

**路径：** `lib/api.ts`

统一 `fetch` 封装 `/api/v1/*` 及 `createRuntimeWebSocket()`。Vite 开发服务器将 `/api` 和 `/ws` 代理至 8080 端口。

## 样式约定

- CSS 变量：`dcs-bg`、`dcs-surface`、`dcs-border`、`dcs-text`、`dcs-muted`、`dcs-accent`
- 默认深色模式；通过 `ThemeToggle` 与 `theme-store` 切换浅色
- 图标：`lucide-react`

## 相关文档

- [Architecture](ARCHITECTURE.md) — 前后端划分
- [API](API.md) — 组件消费的端点
- [Roadmap](ROADMAP.md) — v0.3 功能完成情况
