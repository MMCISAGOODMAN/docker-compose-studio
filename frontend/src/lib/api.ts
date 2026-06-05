import type {
  ContainerInfo,
  ContainerStats,
  RuntimeDeployResult,
} from '@/types';

const API_BASE = '/api/v1';

export interface AiProviderOverride {
  type: 'ollama' | 'openai-compatible';
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface AiProviderInfo {
  id: string;
  name: string;
  available: boolean;
  model: string;
  baseUrl: string;
  requiresApiKey: boolean;
}

export interface AiStatusResult {
  mode: string;
  defaultLlm: string;
  providers: AiProviderInfo[];
  message: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listCatalog: () => request<Array<import('@/types').CatalogService>>('/catalog/services'),

  aiStatus: (provider?: AiProviderOverride) =>
    provider
      ? request<AiStatusResult>('/ai/status', {
          method: 'POST',
          body: JSON.stringify(provider),
        })
      : request<AiStatusResult>('/ai/status'),

  generateTopology: (prompt: string, provider?: AiProviderOverride) =>
    request<{
      topology: import('@/types').Topology;
      composeYaml: string;
      explanation: string;
      provider?: string;
    }>('/ai/generate-topology', {
      method: 'POST',
      body: JSON.stringify({ prompt, provider }),
    }),

  listTemplates: (category?: string) =>
    request<Array<import('@/types').Template>>(
      `/templates${category ? `?category=${category}` : ''}`
    ),

  parseCompose: (yaml: string) =>
    request<{ topology: import('@/types').Topology }>('/compose/parse', {
      method: 'POST',
      body: JSON.stringify({ yaml }),
    }),

  diffCompose: (source: string, target: string) =>
    request<import('@/types').ComposeDiffResult>('/compose/diff', {
      method: 'POST',
      body: JSON.stringify({ source, target }),
    }),

  validateYaml: (yaml: string) =>
    request<import('@/types').ValidationResult>('/compose/validate/yaml', {
      method: 'POST',
      body: JSON.stringify({ yaml }),
    }),

  validateTopology: (topology: import('@/types').Topology) =>
    request<import('@/types').ValidationResult>('/compose/validate/topology', {
      method: 'POST',
      body: JSON.stringify({ topology }),
    }),

  dockerHealth: () =>
    request<{ connected: boolean; message: string; version: string | null }>('/docker/health'),

  deploy: (composeYaml: string, projectName?: string) =>
    request<RuntimeDeployResult>('/runtime/deploy', {
      method: 'POST',
      body: JSON.stringify({ composeYaml, projectName }),
    }),

  stop: (deployId: string) =>
    request<void>('/runtime/stop', {
      method: 'POST',
      body: JSON.stringify({ deployId }),
    }),

  listContainers: (deployId: string) =>
    request<ContainerInfo[]>(`/runtime/containers?deployId=${deployId}`),

  getStats: (containerId: string) =>
    request<ContainerStats>(`/runtime/containers/${containerId}/stats`),
};

export function createRuntimeWebSocket(deployId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/ws/runtime/${deployId}`);
}
