export interface PortMapping {
  host: number;
  container: number;
}

export interface VolumeMapping {
  name: string;
  path: string;
}

export interface HealthCheck {
  test: string[];
  interval?: string;
  timeout?: string;
  retries?: number;
}

export interface ServiceData extends Record<string, unknown> {
  catalogId: string;
  name: string;
  image: string;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  environment: Record<string, string>;
  healthcheck?: HealthCheck;
  command?: string;
  resources?: Record<string, unknown>;
}

export interface ServiceNode {
  id: string;
  type: 'serviceNode';
  position: { x: number; y: number };
  data: ServiceData;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency';
}

export interface Topology {
  nodes: ServiceNode[];
  edges: DependencyEdge[];
}

export interface CatalogService {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  defaultImage: string;
  defaults: Partial<ServiceData>;
  isCustom?: boolean;
}

export interface Template {
  id?: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  topology: Topology;
  composeYaml?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface ComposeDiffResult {
  added: string[];
  removed: string[];
  changed: Array<{ path: string; from: string; to: string }>;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
  service?: string;
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ContainerInfo {
  id: string;
  name: string;
  service: string;
  image: string;
  status: string;
  state: string;
  health: string;
  ports: string;
}

export interface ContainerStats {
  containerId: string;
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
}

export interface LogLine {
  containerId: string;
  line: string;
  timestamp: number;
}

export interface RuntimeDeployResult {
  deployId: string;
  status: string;
  message: string;
  composeProjectName: string;
}

export type DeployStatus = 'idle' | 'deploying' | 'running' | 'stopping' | 'failed';

export type PanelView = 'compose' | 'diff' | 'ai' | 'templates' | 'runtime';
