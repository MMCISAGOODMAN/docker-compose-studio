import { create } from 'zustand';
import type { ContainerInfo, ContainerStats, DeployStatus, LogLine } from '@/types';

interface RuntimeState {
  deployId: string | null;
  composeProjectName: string | null;
  deployStatus: DeployStatus;
  deployError: string | null;
  dockerConnected: boolean | null;
  containers: ContainerInfo[];
  stats: Record<string, ContainerStats>;
  logs: LogLine[];
  selectedContainerId: string | null;
  wsConnected: boolean;

  setDeployId: (id: string | null) => void;
  setComposeProjectName: (name: string | null) => void;
  setDeployStatus: (status: DeployStatus) => void;
  setDeployError: (error: string | null) => void;
  setDockerConnected: (connected: boolean) => void;
  setContainers: (containers: ContainerInfo[]) => void;
  setStats: (containerId: string, stats: ContainerStats) => void;
  appendLog: (log: LogLine) => void;
  clearLogs: () => void;
  setSelectedContainer: (id: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  deployId: null,
  composeProjectName: null,
  deployStatus: 'idle',
  deployError: null,
  dockerConnected: null,
  containers: [],
  stats: {},
  logs: [],
  selectedContainerId: null,
  wsConnected: false,

  setDeployId: (id) => set({ deployId: id }),
  setComposeProjectName: (name) => set({ composeProjectName: name }),
  setDeployStatus: (status) => set({ deployStatus: status }),
  setDeployError: (error) => set({ deployError: error }),
  setDockerConnected: (connected) => set({ dockerConnected: connected }),
  setContainers: (containers) => set({ containers }),
  setStats: (containerId, stats) =>
    set((s) => ({ stats: { ...s.stats, [containerId]: stats } })),
  appendLog: (log) =>
    set((s) => ({ logs: [...s.logs.slice(-500), log] })),
  clearLogs: () => set({ logs: [] }),
  setSelectedContainer: (id) => set({ selectedContainerId: id }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  reset: () =>
    set({
      deployId: null,
      composeProjectName: null,
      deployStatus: 'idle',
      deployError: null,
      containers: [],
      stats: {},
      logs: [],
      selectedContainerId: null,
      wsConnected: false,
    }),
}));
