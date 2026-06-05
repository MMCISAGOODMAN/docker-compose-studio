import YAML from 'yaml';
import type { DependencyEdge, ServiceNode, Topology } from '@/types';

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

const SERVICE_NAME_RE = /^[a-z][a-z0-9_-]*$/;

export function validateTopology(topology: Topology): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const { nodes, edges } = topology;

  if (nodes.length === 0) {
    warnings.push(issue('warning', 'EMPTY_TOPOLOGY', 'Canvas is empty — add at least one service', undefined, undefined));
    return result(errors, warnings);
  }

  const names = new Map<string, string>();
  const hostPorts = new Map<number, string>();

  for (const node of nodes) {
    const { data } = node;
    const svc = data.name || node.id;

    if (!data.name?.trim()) {
      errors.push(issue('error', 'MISSING_SERVICE_NAME', 'Service name is required', `services.${node.id}`, svc));
    } else if (!SERVICE_NAME_RE.test(data.name)) {
      errors.push(
        issue(
          'error',
          'INVALID_SERVICE_NAME',
          `Service name "${data.name}" must start with a lowercase letter and contain only [a-z0-9_-]`,
          `services.${data.name}`,
          data.name
        )
      );
    }

    if (names.has(data.name)) {
      errors.push(
        issue(
          'error',
          'DUPLICATE_SERVICE_NAME',
          `Duplicate service name "${data.name}" — each service must have a unique name`,
          `services.${data.name}`,
          data.name
        )
      );
    } else {
      names.set(data.name, node.id);
    }

    if (!data.image?.trim()) {
      errors.push(issue('error', 'MISSING_IMAGE', 'Docker image is required', `services.${svc}.image`, svc));
    }

    for (const port of data.ports ?? []) {
      if (port.host < 1 || port.host > 65535) {
        errors.push(
          issue('error', 'INVALID_PORT', `Host port ${port.host} is out of range (1–65535)`, `services.${svc}.ports`, svc)
        );
      }
      if (port.container < 1 || port.container > 65535) {
        errors.push(
          issue(
            'error',
            'INVALID_PORT',
            `Container port ${port.container} is out of range (1–65535)`,
            `services.${svc}.ports`,
            svc
          )
        );
      }
      const existing = hostPorts.get(port.host);
      if (existing && existing !== svc) {
        errors.push(
          issue(
            'error',
            'PORT_CONFLICT',
            `Host port ${port.host} is used by both "${existing}" and "${svc}"`,
            `services.${svc}.ports`,
            svc
          )
        );
      } else {
        hostPorts.set(port.host, svc);
      }
    }

    for (const vol of data.volumes ?? []) {
      if (!vol.name?.trim() || !vol.path?.trim()) {
        errors.push(
          issue(
            'error',
            'INVALID_VOLUME',
            'Volume mapping requires both a name and container path (name:/path)',
            `services.${svc}.volumes`,
            svc
          )
        );
      }
    }
  }

  const nameSet = new Set(nodes.map((n) => n.data.name));
  const idToName = new Map(nodes.map((n) => [n.id, n.data.name]));

  for (const edge of edges) {
    const sourceName = idToName.get(edge.source);
    const targetName = idToName.get(edge.target);
    if (!sourceName || !targetName) {
      errors.push(issue('error', 'INVALID_EDGE', 'Dependency edge references a missing service', edge.id));
      continue;
    }
    if (!nameSet.has(targetName)) {
      errors.push(
        issue(
          'error',
          'MISSING_DEPENDENCY',
          `Service "${sourceName}" depends on "${targetName}" which does not exist`,
          `services.${sourceName}.depends_on`,
          sourceName
        )
      );
    }
  }

  const cycles = detectCycles(nodes, edges);
  for (const cycle of cycles) {
    errors.push(
      issue(
        'error',
        'CIRCULAR_DEPENDENCY',
        `Circular dependency detected: ${cycle.join(' → ')} → ${cycle[0]}`,
        `services.${cycle[0]}.depends_on`,
        cycle[0]
      )
    );
  }

  for (const node of nodes) {
    const deps = edges.filter((e) => e.source === node.id).map((e) => idToName.get(e.target)).filter(Boolean);
    const hc = node.data.healthcheck;
    if (deps.length > 0 && !hc) {
      warnings.push(
        issue(
          'warning',
          'MISSING_HEALTHCHECK',
          `Service "${node.data.name}" has dependencies but no healthcheck — depends_on may fail at startup`,
          `services.${node.data.name}.healthcheck`,
          node.data.name
        )
      );
    }
  }

  return result(errors, warnings);
}

export function validateYaml(yamlContent: string): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!yamlContent?.trim()) {
    errors.push(issue('error', 'EMPTY_YAML', 'Compose file is empty'));
    return result(errors, warnings);
  }

  let doc: Record<string, unknown>;
  try {
    doc = YAML.parse(yamlContent) as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid YAML';
    const lineMatch = msg.match(/line (\d+)/i);
    errors.push(
      issue('error', 'YAML_SYNTAX', `YAML syntax error: ${msg}`, undefined, undefined, lineMatch ? parseInt(lineMatch[1], 10) : undefined)
    );
    return result(errors, warnings);
  }

  if (!doc || typeof doc !== 'object') {
    errors.push(issue('error', 'INVALID_ROOT', 'Compose file must be a YAML mapping'));
    return result(errors, warnings);
  }

  if (!doc.services || typeof doc.services !== 'object') {
    errors.push(issue('error', 'MISSING_SERVICES', 'Compose file must contain a top-level "services" section', 'services'));
    return result(errors, warnings);
  }

  const services = doc.services as Record<string, Record<string, unknown>>;
  const serviceNames = Object.keys(services);

  if (serviceNames.length === 0) {
    warnings.push(issue('warning', 'EMPTY_SERVICES', 'No services defined', 'services'));
  }

  const hostPorts = new Map<number, string>();

  for (const [name, config] of Object.entries(services)) {
    if (!SERVICE_NAME_RE.test(name)) {
      errors.push(
        issue(
          'error',
          'INVALID_SERVICE_NAME',
          `Service name "${name}" must start with a lowercase letter and contain only [a-z0-9_-]`,
          `services.${name}`,
          name
        )
      );
    }

    if (!config.image) {
      errors.push(issue('error', 'MISSING_IMAGE', 'Docker image is required', `services.${name}.image`, name));
    }

    if (config.ports && Array.isArray(config.ports)) {
      for (const p of config.ports) {
        if (typeof p === 'string' && p.includes(':')) {
          const host = parseInt(p.split(':')[0], 10);
          if (!isNaN(host)) {
            const existing = hostPorts.get(host);
            if (existing && existing !== name) {
              errors.push(
                issue(
                  'error',
                  'PORT_CONFLICT',
                  `Host port ${host} is used by both "${existing}" and "${name}"`,
                  `services.${name}.ports`,
                  name
                )
              );
            } else {
              hostPorts.set(host, name);
            }
          }
        }
      }
    }

    if (config.depends_on) {
      const deps = normalizeDependsOn(config.depends_on);
      for (const dep of deps) {
        if (!serviceNames.includes(dep)) {
          errors.push(
            issue(
              'error',
              'MISSING_DEPENDENCY',
              `Service "${name}" depends on "${dep}" which is not defined`,
              `services.${name}.depends_on`,
              name
            )
          );
        }
      }
    }
  }

  const graphDeps = new Map<string, string[]>();
  for (const [name, config] of Object.entries(services)) {
    if (config.depends_on) {
      graphDeps.set(name, normalizeDependsOn(config.depends_on));
    }
  }
  for (const cycle of detectCyclesFromNames(graphDeps)) {
    errors.push(
      issue(
        'error',
        'CIRCULAR_DEPENDENCY',
        `Circular dependency: ${cycle.join(' → ')} → ${cycle[0]}`,
        `services.${cycle[0]}.depends_on`,
        cycle[0]
      )
    );
  }

  return result(errors, warnings);
}

export function validateAll(topology: Topology, yamlContent: string): ValidationResult {
  const topo = validateTopology(topology);
  const yaml = validateYaml(yamlContent);

  const errors = [...topo.errors, ...yaml.errors];
  const warnings = [...topo.warnings, ...yaml.warnings];
  return result(errors, warnings);
}

function detectCycles(nodes: ServiceNode[], edges: DependencyEdge[]): string[][] {
  const idToName = new Map(nodes.map((n) => [n.id, n.data.name]));
  const graph = new Map<string, string[]>();

  for (const node of nodes) {
    graph.set(node.data.name, []);
  }
  for (const edge of edges) {
    const source = idToName.get(edge.source);
    const target = idToName.get(edge.target);
    if (source && target) {
      graph.get(source)?.push(target);
    }
  }
  return detectCyclesFromNames(graph);
}

function detectCyclesFromNames(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]) {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      if (idx >= 0) cycles.push([...path.slice(idx)]);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const next of graph.get(node) ?? []) {
      dfs(next, [...path, node]);
    }
    stack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }
  return cycles;
}

function normalizeDependsOn(dependsOn: unknown): string[] {
  if (Array.isArray(dependsOn)) return dependsOn.map(String);
  if (typeof dependsOn === 'object' && dependsOn !== null) {
    return Object.keys(dependsOn as Record<string, unknown>);
  }
  return [];
}

function issue(
  severity: 'error' | 'warning',
  code: string,
  message: string,
  path?: string,
  service?: string,
  line?: number
): ValidationIssue {
  return { severity, code, message, path, service, line };
}

function result(errors: ValidationIssue[], warnings: ValidationIssue[]): ValidationResult {
  return { valid: errors.length === 0, errors, warnings };
}
