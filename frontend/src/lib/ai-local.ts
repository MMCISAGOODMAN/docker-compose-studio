import type { Topology } from '@/types';
import { SERVICE_CATALOG, createServiceFromCatalog } from '@/lib/catalog';
import { generateComposeYaml } from '@/lib/compose';
import { BUILTIN_TEMPLATES } from '@/lib/templates';

export type AiProvider = 'template' | 'rules' | 'local';

const TEMPLATE_MATCHES: { slug: string; keywords: string[] }[] = [
  { slug: 'rag-dev', keywords: ['rag', '检索增强', '向量', 'qdrant', '知识库'] },
  { slug: 'spring-boot-dev', keywords: ['spring boot', 'springboot', 'spring', 'java'] },
  { slug: 'python-dev', keywords: ['python', 'django', 'fastapi', 'flask'] },
  { slug: 'microservices-dev', keywords: ['microservice', 'microservices', '微服务'] },
  { slug: 'kafka-cluster', keywords: ['kafka cluster', 'kafka集群', 'kafka ui'] },
  { slug: 'ai-dev', keywords: ['open webui', 'openwebui', 'ollama', '大模型', 'llm'] },
  { slug: 'kafka-cluster', keywords: ['kafka', '消息队列'] },
];

const KEYWORD_SERVICES: Record<string, string[]> = {
  'spring boot': ['spring-boot', 'postgresql', 'redis'],
  springboot: ['spring-boot', 'postgresql', 'redis'],
  spring: ['spring-boot', 'postgresql', 'redis'],
  java: ['spring-boot', 'postgresql', 'redis'],
  python: ['python', 'postgresql', 'redis'],
  node: ['nodejs', 'postgresql', 'redis'],
  nodejs: ['nodejs', 'postgresql', 'redis'],
  rag: ['ollama', 'openwebui', 'qdrant', 'postgresql'],
  llm: ['ollama', 'openwebui'],
  ai: ['ollama', 'openwebui', 'qdrant'],
  ollama: ['ollama', 'openwebui'],
  kafka: ['kafka', 'zookeeper'],
  microservice: ['spring-boot', 'postgresql', 'redis', 'kafka', 'nginx'],
  microservices: ['spring-boot', 'postgresql', 'redis', 'kafka', 'nginx'],
  微服务: ['spring-boot', 'postgresql', 'redis', 'kafka', 'nginx'],
  postgresql: ['postgresql'],
  postgres: ['postgresql'],
  mysql: ['mysql'],
  redis: ['redis'],
  mongodb: ['mongodb'],
  mongo: ['mongodb'],
  elasticsearch: ['elasticsearch'],
  minio: ['minio'],
  rabbitmq: ['rabbitmq'],
  nginx: ['nginx'],
};

function matchTemplateSlug(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  let best: { slug: string; score: number } | null = null;

  for (const { slug, keywords } of TEMPLATE_MATCHES) {
    const score = keywords.reduce(
      (acc, keyword) => acc + (lower.includes(keyword.toLowerCase()) ? 1 : 0),
      0
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { slug, score };
    }
  }

  return best?.slug ?? null;
}

function buildFromKeywords(prompt: string): Topology {
  const lower = prompt.toLowerCase();
  const serviceIds = new Set<string>();

  for (const [keyword, ids] of Object.entries(KEYWORD_SERVICES)) {
    if (lower.includes(keyword)) ids.forEach((id) => serviceIds.add(id));
  }

  if (serviceIds.size === 0) {
    serviceIds.add('postgresql');
    serviceIds.add('redis');
  }

  const nodes: Topology['nodes'] = [];
  const edges: Topology['edges'] = [];
  let appNodeId: string | null = null;
  let index = 0;

  for (const id of serviceIds) {
    const catalog = SERVICE_CATALOG.find((s) => s.id === id);
    if (!catalog) continue;

    const { id: nodeId, data } = createServiceFromCatalog(catalog, index);
    nodes.push({
      id: nodeId,
      type: 'serviceNode',
      position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 180 },
      data,
    });

    if (['spring-boot', 'python', 'nodejs'].includes(id)) appNodeId = nodeId;
    index++;
  }

  if (appNodeId) {
    for (const node of nodes) {
      if (['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka'].includes(node.data.catalogId)) {
        edges.push({
          id: `e-${appNodeId}-${node.id}`,
          source: appNodeId,
          target: node.id,
          type: 'dependency',
        });
      }
    }
  }

  if (serviceIds.has('kafka') && serviceIds.has('zookeeper')) {
    const kafkaNode = nodes.find((n) => n.data.catalogId === 'kafka');
    const zkNode = nodes.find((n) => n.data.catalogId === 'zookeeper');
    if (kafkaNode && zkNode) {
      edges.push({
        id: `e-${kafkaNode.id}-${zkNode.id}`,
        source: kafkaNode.id,
        target: zkNode.id,
        type: 'dependency',
      });
    }
  }

  return { nodes, edges };
}

export function generateTopologyLocally(prompt: string): {
  topology: Topology;
  composeYaml: string;
  explanation: string;
  provider: AiProvider;
} {
  const slug = matchTemplateSlug(prompt);
  const template = slug ? BUILTIN_TEMPLATES.find((t) => t.slug === slug) : null;

  if (template) {
    const topology = structuredClone(template.topology);
    return {
      topology,
      composeYaml: generateComposeYaml(topology),
      explanation: `Matched template "${template.name}": ${template.description}`,
      provider: 'template',
    };
  }

  const topology = buildFromKeywords(prompt);
  const serviceNames = topology.nodes.map((n) => n.data.catalogId).join(', ');

  return {
    topology,
    composeYaml: generateComposeYaml(topology),
    explanation: `Generated environment with: ${serviceNames}`,
    provider: 'rules',
  };
}
