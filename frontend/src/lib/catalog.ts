import type { CatalogService, ServiceData } from '@/types';

export const SERVICE_CATALOG: CatalogService[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    icon: 'database',
    description: 'Powerful open-source relational database',
    defaultImage: 'postgres:16-alpine',
    defaults: {
      image: 'postgres:16-alpine',
      ports: [{ host: 5432, container: 5432 }],
      volumes: [{ name: 'pgdata', path: '/var/lib/postgresql/data' }],
      environment: { POSTGRES_USER: 'app', POSTGRES_PASSWORD: 'secret', POSTGRES_DB: 'appdb' },
      healthcheck: { test: ['CMD-SHELL', 'pg_isready -U app -d appdb'], interval: '10s', retries: 5 },
    },
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    icon: 'database',
    description: 'Popular open-source relational database',
    defaultImage: 'mysql:8.0',
    defaults: {
      image: 'mysql:8.0',
      ports: [{ host: 3306, container: 3306 }],
      volumes: [{ name: 'mysqldata', path: '/var/lib/mysql' }],
      environment: { MYSQL_ROOT_PASSWORD: 'root', MYSQL_DATABASE: 'appdb', MYSQL_USER: 'app', MYSQL_PASSWORD: 'secret' },
    },
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    icon: 'database',
    description: 'Document-oriented NoSQL database',
    defaultImage: 'mongo:7',
    defaults: {
      image: 'mongo:7',
      ports: [{ host: 27017, container: 27017 }],
      volumes: [{ name: 'mongodata', path: '/data/db' }],
      environment: { MONGO_INITDB_ROOT_USERNAME: 'root', MONGO_INITDB_ROOT_PASSWORD: 'secret' },
    },
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    icon: 'zap',
    description: 'In-memory data store and cache',
    defaultImage: 'redis:7-alpine',
    defaults: {
      image: 'redis:7-alpine',
      ports: [{ host: 6379, container: 6379 }],
      volumes: [{ name: 'redisdata', path: '/data' }],
      healthcheck: { test: ['CMD', 'redis-cli', 'ping'], interval: '10s', retries: 5 },
    },
  },
  {
    id: 'kafka',
    name: 'Kafka',
    category: 'messaging',
    icon: 'radio',
    description: 'Distributed event streaming platform',
    defaultImage: 'confluentinc/cp-kafka:7.6.0',
    defaults: {
      image: 'confluentinc/cp-kafka:7.6.0',
      ports: [{ host: 9092, container: 9092 }],
      environment: {
        KAFKA_BROKER_ID: '1',
        KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181',
        KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:9092',
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
      },
    },
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'messaging',
    icon: 'radio',
    description: 'Message broker with management UI',
    defaultImage: 'rabbitmq:3-management-alpine',
    defaults: {
      image: 'rabbitmq:3-management-alpine',
      ports: [{ host: 5672, container: 5672 }, { host: 15672, container: 15672 }],
      environment: { RABBITMQ_DEFAULT_USER: 'guest', RABBITMQ_DEFAULT_PASS: 'guest' },
    },
  },
  {
    id: 'minio',
    name: 'MinIO',
    category: 'storage',
    icon: 'hard-drive',
    description: 'S3-compatible object storage',
    defaultImage: 'minio/minio:latest',
    defaults: {
      image: 'minio/minio:latest',
      ports: [{ host: 9000, container: 9000 }, { host: 9001, container: 9001 }],
      volumes: [{ name: 'miniodata', path: '/data' }],
      environment: { MINIO_ROOT_USER: 'minioadmin', MINIO_ROOT_PASSWORD: 'minioadmin' },
      command: 'server /data --console-address ":9001"',
    },
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'search',
    icon: 'search',
    description: 'Distributed search and analytics engine',
    defaultImage: 'docker.elastic.co/elasticsearch/elasticsearch:8.12.0',
    defaults: {
      image: 'docker.elastic.co/elasticsearch/elasticsearch:8.12.0',
      ports: [{ host: 9200, container: 9200 }],
      volumes: [{ name: 'esdata', path: '/usr/share/elasticsearch/data' }],
      environment: { 'discovery.type': 'single-node', 'xpack.security.enabled': 'false', ES_JAVA_OPTS: '-Xms512m -Xmx512m' },
    },
  },
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'dev',
    icon: 'globe',
    description: 'High-performance reverse proxy',
    defaultImage: 'nginx:alpine',
    defaults: { image: 'nginx:alpine', ports: [{ host: 80, container: 80 }] },
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    category: 'dev',
    icon: 'coffee',
    description: 'Java application framework',
    defaultImage: 'eclipse-temurin:21-jdk-alpine',
    defaults: {
      image: 'eclipse-temurin:21-jdk-alpine',
      ports: [{ host: 8080, container: 8080 }],
      environment: {
        SPRING_PROFILES_ACTIVE: 'dev',
        SPRING_DATASOURCE_URL: 'jdbc:postgresql://postgres:5432/appdb',
        SPRING_REDIS_HOST: 'redis',
      },
    },
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'dev',
    icon: 'code',
    description: 'JavaScript runtime environment',
    defaultImage: 'node:20-alpine',
    defaults: {
      image: 'node:20-alpine',
      ports: [{ host: 3000, container: 3000 }],
      environment: { NODE_ENV: 'development', DATABASE_URL: 'postgresql://app:secret@postgres:5432/appdb' },
    },
  },
  {
    id: 'python',
    name: 'Python',
    category: 'dev',
    icon: 'code',
    description: 'Python application runtime',
    defaultImage: 'python:3.12-slim',
    defaults: {
      image: 'python:3.12-slim',
      ports: [{ host: 8000, container: 8000 }],
      environment: { DATABASE_URL: 'postgresql://app:secret@postgres:5432/appdb' },
    },
  },
  {
    id: 'ollama',
    name: 'Ollama',
    category: 'ai',
    icon: 'brain',
    description: 'Run LLMs locally',
    defaultImage: 'ollama/ollama:latest',
    defaults: {
      image: 'ollama/ollama:latest',
      ports: [{ host: 11434, container: 11434 }],
      volumes: [{ name: 'ollamadata', path: '/root/.ollama' }],
    },
  },
  {
    id: 'openwebui',
    name: 'Open WebUI',
    category: 'ai',
    icon: 'message-circle',
    description: 'Chat UI for LLMs',
    defaultImage: 'ghcr.io/open-webui/open-webui:main',
    defaults: {
      image: 'ghcr.io/open-webui/open-webui:main',
      ports: [{ host: 3001, container: 8080 }],
      volumes: [{ name: 'webuidata', path: '/app/backend/data' }],
      environment: { OLLAMA_BASE_URL: 'http://ollama:11434' },
    },
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    category: 'ai',
    icon: 'layers',
    description: 'Vector database for AI/RAG',
    defaultImage: 'qdrant/qdrant:latest',
    defaults: {
      image: 'qdrant/qdrant:latest',
      ports: [{ host: 6333, container: 6333 }],
      volumes: [{ name: 'qdrantdata', path: '/qdrant/storage' }],
    },
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  database: 'Database',
  messaging: 'Messaging',
  storage: 'Storage',
  search: 'Search',
  dev: 'Development',
  ai: 'AI',
  custom: 'Custom',
};

export function mergeCatalog(customServices: CatalogService[]): CatalogService[] {
  const builtinIds = new Set(SERVICE_CATALOG.map((s) => s.id));
  const uniqueCustom = customServices.filter((s) => !builtinIds.has(s.id));
  return [...SERVICE_CATALOG, ...uniqueCustom];
}

export function createServiceFromCatalog(catalog: CatalogService, index: number): {
  id: string;
  data: ServiceData;
} {
  const defaults = catalog.defaults;
  const name = catalog.id.replace(/-/g, '') + (index > 0 ? index : '');
  return {
    id: `svc-${catalog.id}-${Date.now()}-${index}`,
    data: {
      catalogId: catalog.id,
      name,
      image: defaults.image ?? catalog.defaultImage,
      ports: structuredClone(defaults.ports ?? []),
      volumes: structuredClone(defaults.volumes ?? []),
      environment: structuredClone(defaults.environment ?? {}),
      ...(defaults.healthcheck ? { healthcheck: structuredClone(defaults.healthcheck) } : {}),
      ...(defaults.command ? { command: defaults.command } : {}),
    },
  };
}
