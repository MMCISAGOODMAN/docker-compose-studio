import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Brain,
  Code,
  Coffee,
  Database,
  Globe,
  HardDrive,
  Layers,
  MessageCircle,
  Radio,
  Search,
  Zap,
} from 'lucide-react';
import type { ServiceData } from '@/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  database: Database,
  zap: Zap,
  radio: Radio,
  'hard-drive': HardDrive,
  search: Search,
  globe: Globe,
  coffee: Coffee,
  code: Code,
  brain: Brain,
  'message-circle': MessageCircle,
  layers: Layers,
};

const CATEGORY_COLORS: Record<string, string> = {
  database: 'text-emerald-400',
  messaging: 'text-orange-400',
  storage: 'text-yellow-400',
  search: 'text-purple-400',
  dev: 'text-blue-400',
  ai: 'text-pink-400',
};

type ServiceNodeData = ServiceData & { catalogId: string };

function ServiceNodeComponent({ data, selected }: NodeProps & { data: ServiceNodeData }) {
  const Icon = ICONS[data.catalogId === 'postgresql' || data.catalogId === 'mysql' || data.catalogId === 'mongodb' ? 'database' : data.catalogId === 'redis' ? 'zap' : data.catalogId === 'kafka' || data.catalogId === 'rabbitmq' ? 'radio' : data.catalogId === 'minio' ? 'hard-drive' : data.catalogId === 'elasticsearch' ? 'search' : data.catalogId === 'nginx' ? 'globe' : data.catalogId === 'spring-boot' ? 'coffee' : data.catalogId === 'python' || data.catalogId === 'nodejs' ? 'code' : data.catalogId === 'ollama' ? 'brain' : data.catalogId === 'openwebui' ? 'message-circle' : data.catalogId === 'qdrant' ? 'layers' : 'database'] ?? Database;

  const colorClass = CATEGORY_COLORS[
    ['postgresql', 'mysql', 'mongodb', 'redis'].includes(data.catalogId)
      ? 'database'
      : ['kafka', 'rabbitmq'].includes(data.catalogId)
        ? 'messaging'
        : data.catalogId === 'minio'
          ? 'storage'
          : data.catalogId === 'elasticsearch'
            ? 'search'
            : ['spring-boot', 'python', 'nodejs', 'nginx'].includes(data.catalogId)
              ? 'dev'
              : ['ollama', 'openwebui', 'qdrant'].includes(data.catalogId)
                ? 'ai'
                : 'dev'
  ];

  return (
    <div
      className={`min-w-[180px] rounded-lg border bg-dcs-surface px-4 py-3 transition-shadow ${
        selected ? 'border-dcs-accent shadow-lg shadow-blue-500/20' : 'border-dcs-border'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-dcs-accent !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorClass}`} />
        <div>
          <div className="text-sm font-semibold text-dcs-text">{data.name}</div>
          <div className="text-xs text-dcs-muted truncate max-w-[140px]">{data.image}</div>
        </div>
      </div>
      {data.ports?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.ports.slice(0, 2).map((p) => (
            <span key={`${p.host}-${p.container}`} className="rounded bg-dcs-bg px-1.5 py-0.5 text-xs text-dcs-muted">
              :{p.host}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-dcs-accent !w-2 !h-2" />
    </div>
  );
}

export default memo(ServiceNodeComponent);
