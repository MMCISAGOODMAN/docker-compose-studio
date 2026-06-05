import YAML from 'yaml';
import type { DependencyEdge, ServiceNode, Topology } from '@/types';

function buildDependsOnMap(edges: DependencyEdge[], nodes: ServiceNode[]): Map<string, string[]> {
  const idToName = new Map(nodes.map((n) => [n.id, n.data.name]));
  const map = new Map<string, string[]>();

  for (const edge of edges) {
    const sourceName = idToName.get(edge.source);
    const targetName = idToName.get(edge.target);
    if (sourceName && targetName) {
      const deps = map.get(sourceName) ?? [];
      deps.push(targetName);
      map.set(sourceName, deps);
    }
  }
  return map;
}

function collectNamedVolumes(nodes: ServiceNode[]): Record<string, Record<string, never>> {
  const volumes: Record<string, Record<string, never>> = {};
  for (const node of nodes) {
    for (const vol of node.data.volumes ?? []) {
      if (vol.name) volumes[vol.name] = {};
    }
  }
  return volumes;
}

export function generateComposeYaml(topology: Topology): string {
  const { nodes, edges } = topology;
  const dependsOnMap = buildDependsOnMap(edges, nodes);

  const services: Record<string, Record<string, unknown>> = {};

  for (const node of nodes) {
    const { data } = node;
    const service: Record<string, unknown> = {
      image: data.image,
      restart: 'unless-stopped',
      networks: ['dcs-network'],
    };

    if (data.ports?.length) {
      service.ports = data.ports.map((p) => `${p.host}:${p.container}`);
    }

    if (data.volumes?.length) {
      service.volumes = data.volumes.map((v) => `${v.name}:${v.path}`);
    }

    if (data.environment && Object.keys(data.environment).length) {
      service.environment = data.environment;
    }

    const deps = dependsOnMap.get(data.name);
    if (deps?.length) {
      service.depends_on = Object.fromEntries(
        deps.map((d) => [d, { condition: 'service_healthy' }])
      );
    }

    if (data.healthcheck) {
      service.healthcheck = data.healthcheck;
    }

    if (data.command) {
      service.command = data.command;
    }

    services[data.name] = service;
  }

  const compose = {
    name: 'dcs-environment',
    services,
    networks: {
      'dcs-network': { driver: 'bridge' },
    },
    ...(Object.keys(collectNamedVolumes(nodes)).length
      ? { volumes: collectNamedVolumes(nodes) }
      : {}),
  };

  return YAML.stringify(compose, { indent: 2, lineWidth: 0 });
}

export function parseComposeYaml(yamlContent: string): Topology {
  const doc = YAML.parse(yamlContent) as Record<string, unknown>;
  if (!doc?.services) {
    throw new Error('Invalid compose file: missing services section');
  }

  const services = doc.services as Record<string, Record<string, unknown>>;
  const nodes: ServiceNode[] = [];
  const edges: DependencyEdge[] = [];

  let x = 100;
  let y = 100;
  let index = 0;

  for (const [name, config] of Object.entries(services)) {
    const nodeId = `svc-${name}-${index}`;

    nodes.push({
      id: nodeId,
      type: 'serviceNode',
      position: { x, y },
      data: {
        catalogId: inferCatalogId(String(config.image ?? '')),
        name,
        image: String(config.image ?? ''),
        ports: parsePorts(config.ports),
        volumes: parseVolumes(config.volumes),
        environment: normalizeEnv(config.environment),
        ...(config.healthcheck ? { healthcheck: config.healthcheck as ServiceNode['data']['healthcheck'] } : {}),
        ...(config.command ? { command: String(config.command) } : {}),
      },
    });

    x += 250;
    if (index % 3 === 2) {
      x = 100;
      y += 180;
    }
    index++;
  }

  for (const [name, config] of Object.entries(services)) {
    const sourceId = nodes.find((n) => n.data.name === name)?.id;
    if (!sourceId || !config.depends_on) continue;

    const deps = normalizeDependsOn(config.depends_on);
    for (const dep of deps) {
      const targetId = nodes.find((n) => n.data.name === dep)?.id;
      if (targetId) {
        edges.push({
          id: `e-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'dependency',
        });
      }
    }
  }

  return { nodes, edges };
}

function inferCatalogId(image: string): string {
  const lower = image.toLowerCase();
  if (lower.includes('postgres')) return 'postgresql';
  if (lower.includes('mysql')) return 'mysql';
  if (lower.includes('mongo')) return 'mongodb';
  if (lower.includes('redis')) return 'redis';
  if (lower.includes('kafka')) return 'kafka';
  if (lower.includes('zookeeper')) return 'zookeeper';
  if (lower.includes('rabbitmq')) return 'rabbitmq';
  if (lower.includes('minio')) return 'minio';
  if (lower.includes('elastic')) return 'elasticsearch';
  if (lower.includes('nginx')) return 'nginx';
  if (lower.includes('ollama')) return 'ollama';
  if (lower.includes('open-webui')) return 'openwebui';
  if (lower.includes('qdrant')) return 'qdrant';
  if (lower.includes('temurin') || lower.includes('spring')) return 'spring-boot';
  if (lower.includes('python')) return 'python';
  if (lower.includes('node')) return 'nodejs';
  return 'custom';
}

function parsePorts(ports: unknown): ServiceNode['data']['ports'] {
  if (!Array.isArray(ports)) return [];
  return ports
    .map((p) => {
      if (typeof p === 'string' && p.includes(':')) {
        const [host, container] = p.split(':');
        return { host: parseInt(host, 10), container: parseInt(container, 10) };
      }
      return null;
    })
    .filter(Boolean) as ServiceNode['data']['ports'];
}

function parseVolumes(volumes: unknown): ServiceNode['data']['volumes'] {
  if (!Array.isArray(volumes)) return [];
  return volumes
    .map((v) => {
      if (typeof v === 'string' && v.includes(':')) {
        const [name, path] = v.split(':', 2);
        return { name, path };
      }
      return null;
    })
    .filter(Boolean) as ServiceNode['data']['volumes'];
}

function normalizeEnv(env: unknown): Record<string, string> {
  if (!env) return {};
  if (Array.isArray(env)) {
    return Object.fromEntries(
      env.map((e) => {
        const [k, ...rest] = String(e).split('=');
        return [k, rest.join('=')];
      })
    );
  }
  if (typeof env === 'object') {
    return Object.fromEntries(
      Object.entries(env as Record<string, unknown>).map(([k, v]) => [k, String(v)])
    );
  }
  return {};
}

function normalizeDependsOn(dependsOn: unknown): string[] {
  if (Array.isArray(dependsOn)) return dependsOn.map(String);
  if (typeof dependsOn === 'object' && dependsOn !== null) {
    return Object.keys(dependsOn as Record<string, unknown>);
  }
  return [];
}

export function diffCompose(source: string, target: string): {
  added: string[];
  removed: string[];
  changed: Array<{ path: string; from: string; to: string }>;
} {
  const flatten = (obj: unknown, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {};
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          Object.assign(result, flatten(v, path));
        } else {
          result[path] = String(v);
        }
      }
    }
    return result;
  };

  const sourceFlat = flatten(YAML.parse(source) ?? {});
  const targetFlat = flatten(YAML.parse(target) ?? {});

  const allKeys = new Set([...Object.keys(sourceFlat), ...Object.keys(targetFlat)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ path: string; from: string; to: string }> = [];

  for (const key of allKeys) {
    const inSource = key in sourceFlat;
    const inTarget = key in targetFlat;
    if (inSource && !inTarget) removed.push(key);
    else if (!inSource && inTarget) added.push(key);
    else if (inSource && inTarget && sourceFlat[key] !== targetFlat[key]) {
      changed.push({ path: key, from: sourceFlat[key], to: targetFlat[key] });
    }
  }

  return { added, removed, changed };
}
