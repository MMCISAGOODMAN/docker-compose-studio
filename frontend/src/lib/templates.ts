import type { Template, Topology } from '@/types';

function createNode(
  catalogId: string,
  name: string,
  image: string,
  x: number,
  y: number,
  extras: Partial<Topology['nodes'][0]['data']> = {}
) {
  return {
    id: `svc-${name}-${x}`,
    type: 'serviceNode' as const,
    position: { x, y },
    data: {
      catalogId,
      name,
      image,
      ports: extras.ports ?? [],
      volumes: extras.volumes ?? [],
      environment: extras.environment ?? {},
      ...(extras.healthcheck ? { healthcheck: extras.healthcheck } : {}),
      ...(extras.command ? { command: extras.command } : {}),
    },
  };
}

export const BUILTIN_TEMPLATES: Template[] = [
  {
    slug: 'spring-boot-dev',
    name: 'Spring Boot Dev',
    category: 'dev',
    description: 'Spring Boot + PostgreSQL + Redis',
    topology: {
      nodes: [
        createNode('spring-boot', 'app', 'eclipse-temurin:21-jdk-alpine', 100, 100, {
          ports: [{ host: 8080, container: 8080 }],
          environment: {
            SPRING_PROFILES_ACTIVE: 'dev',
            SPRING_DATASOURCE_URL: 'jdbc:postgresql://postgres:5432/appdb',
            SPRING_REDIS_HOST: 'redis',
          },
        }),
        createNode('postgresql', 'postgres', 'postgres:16-alpine', 350, 100, {
          ports: [{ host: 5432, container: 5432 }],
          volumes: [{ name: 'pgdata', path: '/var/lib/postgresql/data' }],
          environment: { POSTGRES_USER: 'app', POSTGRES_PASSWORD: 'secret', POSTGRES_DB: 'appdb' },
          healthcheck: { test: ['CMD-SHELL', 'pg_isready -U app -d appdb'], interval: '10s', retries: 5 },
        }),
        createNode('redis', 'redis', 'redis:7-alpine', 600, 100, {
          ports: [{ host: 6379, container: 6379 }],
          volumes: [{ name: 'redisdata', path: '/data' }],
          healthcheck: { test: ['CMD', 'redis-cli', 'ping'], interval: '10s', retries: 5 },
        }),
      ],
      edges: [
        { id: 'e-app-pg', source: 'svc-app-100', target: 'svc-postgres-350', type: 'dependency' },
        { id: 'e-app-redis', source: 'svc-app-100', target: 'svc-redis-600', type: 'dependency' },
      ],
    },
  },
  {
    slug: 'python-dev',
    name: 'Python Dev',
    category: 'dev',
    description: 'Python + PostgreSQL + Redis',
    topology: {
      nodes: [
        createNode('python', 'api', 'python:3.12-slim', 100, 100, {
          ports: [{ host: 8000, container: 8000 }],
          environment: { DATABASE_URL: 'postgresql://app:secret@postgres:5432/appdb', REDIS_URL: 'redis://redis:6379' },
        }),
        createNode('postgresql', 'postgres', 'postgres:16-alpine', 350, 100, {
          ports: [{ host: 5432, container: 5432 }],
          volumes: [{ name: 'pgdata', path: '/var/lib/postgresql/data' }],
          environment: { POSTGRES_USER: 'app', POSTGRES_PASSWORD: 'secret', POSTGRES_DB: 'appdb' },
          healthcheck: { test: ['CMD-SHELL', 'pg_isready -U app'], interval: '10s', retries: 5 },
        }),
        createNode('redis', 'redis', 'redis:7-alpine', 600, 100, {
          ports: [{ host: 6379, container: 6379 }],
        }),
      ],
      edges: [
        { id: 'e-api-pg', source: 'svc-api-100', target: 'svc-postgres-350', type: 'dependency' },
        { id: 'e-api-redis', source: 'svc-api-100', target: 'svc-redis-600', type: 'dependency' },
      ],
    },
  },
  {
    slug: 'rag-dev',
    name: 'RAG Dev Environment',
    category: 'ai',
    description: 'Ollama + Open WebUI + Qdrant + PostgreSQL',
    topology: {
      nodes: [
        createNode('ollama', 'ollama', 'ollama/ollama:latest', 100, 100, {
          ports: [{ host: 11434, container: 11434 }],
          volumes: [{ name: 'ollamadata', path: '/root/.ollama' }],
        }),
        createNode('openwebui', 'openwebui', 'ghcr.io/open-webui/open-webui:main', 350, 100, {
          ports: [{ host: 3001, container: 8080 }],
          volumes: [{ name: 'webuidata', path: '/app/backend/data' }],
          environment: { OLLAMA_BASE_URL: 'http://ollama:11434' },
        }),
        createNode('qdrant', 'qdrant', 'qdrant/qdrant:latest', 600, 100, {
          ports: [{ host: 6333, container: 6333 }],
          volumes: [{ name: 'qdrantdata', path: '/qdrant/storage' }],
        }),
        createNode('postgresql', 'postgres', 'postgres:16-alpine', 350, 280, {
          ports: [{ host: 5432, container: 5432 }],
          volumes: [{ name: 'pgdata', path: '/var/lib/postgresql/data' }],
          environment: { POSTGRES_USER: 'rag', POSTGRES_PASSWORD: 'secret', POSTGRES_DB: 'ragdb' },
        }),
      ],
      edges: [
        { id: 'e-webui-ollama', source: 'svc-openwebui-350', target: 'svc-ollama-100', type: 'dependency' },
      ],
    },
  },
  {
    slug: 'ai-dev',
    name: 'AI Dev Environment',
    category: 'ai',
    description: 'Ollama + Open WebUI',
    topology: {
      nodes: [
        createNode('ollama', 'ollama', 'ollama/ollama:latest', 100, 100, {
          ports: [{ host: 11434, container: 11434 }],
          volumes: [{ name: 'ollamadata', path: '/root/.ollama' }],
        }),
        createNode('openwebui', 'openwebui', 'ghcr.io/open-webui/open-webui:main', 350, 100, {
          ports: [{ host: 3001, container: 8080 }],
          environment: { OLLAMA_BASE_URL: 'http://ollama:11434' },
        }),
      ],
      edges: [
        { id: 'e-webui-ollama', source: 'svc-openwebui-350', target: 'svc-ollama-100', type: 'dependency' },
      ],
    },
  },
  {
    slug: 'microservices-dev',
    name: 'Microservices Dev',
    category: 'dev',
    description: 'Spring Boot + Kafka + PostgreSQL + Redis + Nginx',
    topology: {
      nodes: [
        createNode('nginx', 'gateway', 'nginx:alpine', 100, 50, { ports: [{ host: 80, container: 80 }] }),
        createNode('spring-boot', 'servicea', 'eclipse-temurin:21-jdk-alpine', 100, 200, {
          ports: [{ host: 8080, container: 8080 }],
          environment: { SPRING_DATASOURCE_URL: 'jdbc:postgresql://postgres:5432/appdb', SPRING_KAFKA_BOOTSTRAP_SERVERS: 'kafka:9092' },
        }),
        createNode('postgresql', 'postgres', 'postgres:16-alpine', 350, 200, {
          ports: [{ host: 5432, container: 5432 }],
          volumes: [{ name: 'pgdata', path: '/var/lib/postgresql/data' }],
          environment: { POSTGRES_USER: 'app', POSTGRES_PASSWORD: 'secret', POSTGRES_DB: 'appdb' },
        }),
        createNode('redis', 'redis', 'redis:7-alpine', 600, 200, { ports: [{ host: 6379, container: 6379 }] }),
        createNode('kafka', 'kafka', 'confluentinc/cp-kafka:7.6.0', 350, 380, {
          ports: [{ host: 9092, container: 9092 }],
          environment: { KAFKA_BROKER_ID: '1', KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181', KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:9092', KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1' },
        }),
      ],
      edges: [
        { id: 'e-sa-pg', source: 'svc-servicea-100', target: 'svc-postgres-350', type: 'dependency' },
        { id: 'e-sa-redis', source: 'svc-servicea-100', target: 'svc-redis-600', type: 'dependency' },
        { id: 'e-sa-kafka', source: 'svc-servicea-100', target: 'svc-kafka-350', type: 'dependency' },
      ],
    },
  },
  {
    slug: 'kafka-cluster',
    name: 'Kafka Cluster',
    category: 'messaging',
    description: 'Kafka + Zookeeper + Kafka UI',
    topology: {
      nodes: [
        createNode('kafka', 'zookeeper', 'confluentinc/cp-zookeeper:7.6.0', 100, 100, {
          ports: [{ host: 2181, container: 2181 }],
          environment: { ZOOKEEPER_CLIENT_PORT: '2181', ZOOKEEPER_TICK_TIME: '2000' },
        }),
        createNode('kafka', 'kafka', 'confluentinc/cp-kafka:7.6.0', 350, 100, {
          ports: [{ host: 9092, container: 9092 }],
          environment: { KAFKA_BROKER_ID: '1', KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181', KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:9092', KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1' },
        }),
      ],
      edges: [
        { id: 'e-kafka-zk', source: 'svc-kafka-350', target: 'svc-zookeeper-100', type: 'dependency' },
      ],
    },
  },
];
