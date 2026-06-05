import { create } from 'zustand';
import type { CatalogService, PanelView, ServiceData, ServiceNode, Topology, ValidationResult } from '@/types';
import { generateComposeYaml } from '@/lib/compose';
import { validateAll } from '@/lib/compose-validate';
import { createServiceFromCatalog } from '@/lib/catalog';

const MAX_HISTORY = 50;

interface HistorySnapshot {
  nodes: ServiceNode[];
  edges: Topology['edges'];
}

interface ProjectState {
  projectName: string;
  nodes: ServiceNode[];
  edges: Topology['edges'];
  selectedNodeId: string | null;
  composeYaml: string;
  panelView: PanelView;
  diffSource: string;
  diffTarget: string;
  historyPast: HistorySnapshot[];
  historyFuture: HistorySnapshot[];
  validation: ValidationResult | null;

  setProjectName: (name: string) => void;
  setPanelView: (view: PanelView) => void;
  setSelectedNode: (id: string | null) => void;
  addService: (catalog: CatalogService) => void;
  updateNodeData: (nodeId: string, data: Partial<ServiceData>) => void;
  removeNode: (nodeId: string) => void;
  setNodes: (nodes: ServiceNode[]) => void;
  setEdges: (edges: Topology['edges']) => void;
  loadTopology: (topology: Topology) => void;
  setComposeYaml: (yaml: string) => void;
  setDiffSource: (yaml: string) => void;
  setDiffTarget: (yaml: string) => void;
  regenerateCompose: () => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  runValidation: () => void;
}

let nodeCounter = 0;
let historyLock = false;

function snapshot(nodes: ServiceNode[], edges: Topology['edges']): HistorySnapshot {
  return { nodes: structuredClone(nodes), edges: structuredClone(edges) };
}

function applySnapshot(_state: ProjectState, snap: HistorySnapshot) {
  const topology = { nodes: snap.nodes, edges: snap.edges };
  return {
    nodes: snap.nodes,
    edges: snap.edges,
    composeYaml: generateComposeYaml(topology),
    selectedNodeId: null,
  };
}

function pushHistory(state: ProjectState): Partial<ProjectState> {
  const entry = snapshot(state.nodes, state.edges);
  const past = [...state.historyPast, entry].slice(-MAX_HISTORY);
  return { historyPast: past, historyFuture: [] };
}

function withHistory<T extends Partial<ProjectState>>(
  get: () => ProjectState,
  update: () => T
): T {
  if (historyLock) return update();
  const historyUpdate = pushHistory(get());
  return { ...historyUpdate, ...update() } as T;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Untitled Environment',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  composeYaml: 'services: {}\n',
  panelView: 'compose',
  diffSource: '',
  diffTarget: '',
  historyPast: [],
  historyFuture: [],
  validation: null,

  setProjectName: (name) => set({ projectName: name }),

  setPanelView: (view) => set({ panelView: view }),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  addService: (catalog) => {
    set((state) => {
      nodeCounter++;
      const { id, data } = createServiceFromCatalog(catalog, nodeCounter);
      const newNode: ServiceNode = {
        id,
        type: 'serviceNode',
        position: { x: 100 + (state.nodes.length % 3) * 250, y: 100 + Math.floor(state.nodes.length / 3) * 180 },
        data,
      };
      const newNodes = [...state.nodes, newNode];
      const topology = { nodes: newNodes, edges: state.edges };
      return withHistory(get, () => ({
        nodes: newNodes,
        composeYaml: generateComposeYaml(topology),
        selectedNodeId: id,
      }));
    });
    get().runValidation();
  },

  updateNodeData: (nodeId, data) => {
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      );
      const topology = { nodes, edges: state.edges };
      return withHistory(get, () => ({
        nodes,
        composeYaml: generateComposeYaml(topology),
      }));
    });
    get().runValidation();
  },

  removeNode: (nodeId) => {
    set((state) => {
      const nodes = state.nodes.filter((n) => n.id !== nodeId);
      const edges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      const topology = { nodes, edges };
      return withHistory(get, () => ({
        nodes,
        edges,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        composeYaml: generateComposeYaml(topology),
      }));
    });
    get().runValidation();
  },

  setNodes: (nodes) => {
    set((state) => {
      const topology = { nodes, edges: state.edges };
      return withHistory(get, () => ({
        nodes,
        composeYaml: generateComposeYaml(topology),
      }));
    });
    get().runValidation();
  },

  setEdges: (edges) => {
    set((state) => {
      const topology = { nodes: state.nodes, edges };
      return withHistory(get, () => ({
        edges,
        composeYaml: generateComposeYaml(topology),
      }));
    });
    get().runValidation();
  },

  loadTopology: (topology) => {
    set(() =>
      withHistory(get, () => ({
        nodes: topology.nodes,
        edges: topology.edges,
        composeYaml: generateComposeYaml(topology),
        selectedNodeId: null,
      }))
    );
    get().runValidation();
  },

  setComposeYaml: (yaml) => {
    set({ composeYaml: yaml });
    get().runValidation();
  },

  setDiffSource: (yaml) => set({ diffSource: yaml }),

  setDiffTarget: (yaml) => set({ diffTarget: yaml }),

  regenerateCompose: () => {
    const { nodes, edges } = get();
    set({ composeYaml: generateComposeYaml({ nodes, edges }) });
    get().runValidation();
  },

  clearCanvas: () => {
    set(() =>
      withHistory(get, () => ({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        composeYaml: 'services: {}\n',
      }))
    );
    get().runValidation();
  },

  undo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyPast.length === 0) return;

    historyLock = true;
    const previous = historyPast[historyPast.length - 1];
    const current = snapshot(nodes, edges);

    set({
      historyPast: historyPast.slice(0, -1),
      historyFuture: [current, ...historyFuture].slice(0, MAX_HISTORY),
      ...applySnapshot(get(), previous),
    });
    historyLock = false;
    get().runValidation();
  },

  redo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyFuture.length === 0) return;

    historyLock = true;
    const next = historyFuture[0];
    const current = snapshot(nodes, edges);

    set({
      historyFuture: historyFuture.slice(1),
      historyPast: [...historyPast, current].slice(-MAX_HISTORY),
      ...applySnapshot(get(), next),
    });
    historyLock = false;
    get().runValidation();
  },

  canUndo: () => get().historyPast.length > 0,

  canRedo: () => get().historyFuture.length > 0,

  runValidation: () => {
    const { nodes, edges, composeYaml } = get();
    const result = validateAll({ nodes, edges }, composeYaml);
    set({ validation: result });
  },
}));
