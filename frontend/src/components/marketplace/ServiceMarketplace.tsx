import { useMemo, useState } from 'react';
import {
  Brain,
  Code,
  Coffee,
  Database,
  Globe,
  HardDrive,
  Layers,
  MessageCircle,
  Plus,
  Radio,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import { CATEGORY_LABELS, mergeCatalog } from '@/lib/catalog';
import { useProjectStore } from '@/stores/project-store';
import { useCustomCatalogStore } from '@/stores/custom-catalog-store';
import CustomServiceDialog from './CustomServiceDialog';
import type { CatalogService } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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

function ServiceCard({ service, onDelete }: { service: CatalogService; onDelete?: () => void }) {
  const addService = useProjectStore((s) => s.addService);
  const Icon = ICON_MAP[service.icon] ?? Database;

  return (
    <div className="group relative">
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/dcs-service', service.id);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={() => addService(service)}
        className="flex w-full items-start gap-2 rounded-lg border border-dcs-border bg-dcs-bg p-2.5 text-left transition-colors hover:border-dcs-accent hover:bg-dcs-surface"
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-dcs-accent" />
        <div className="min-w-0 pr-4">
          <div className="text-sm font-medium text-dcs-text">{service.name}</div>
          <div className="truncate text-xs text-dcs-muted">{service.description}</div>
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-1.5 top-1.5 rounded p-0.5 text-dcs-muted opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          title="Delete custom service"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function ServiceMarketplace() {
  const customServices = useCustomCatalogStore((s) => s.services);
  const addService = useCustomCatalogStore((s) => s.addService);
  const deleteService = useCustomCatalogStore((s) => s.deleteService);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allServices = useMemo(() => mergeCatalog(customServices), [customServices]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogService[]>();
    for (const s of allServices) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    const order = ['custom', 'database', 'messaging', 'storage', 'search', 'dev', 'ai'];
    return order
      .filter((cat) => map.has(cat))
      .map((cat) => [cat, map.get(cat)!] as const);
  }, [allServices]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-dcs-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-dcs-text">Service Marketplace</h2>
            <p className="text-xs text-dcs-muted">Drag or click to add</p>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            title="Create custom service"
            className="rounded-lg p-1.5 text-dcs-muted transition-colors hover:bg-dcs-accent/20 hover:text-dcs-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {grouped.map(([category, services]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-dcs-muted">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <div className="space-y-1.5">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onDelete={s.isCustom ? () => deleteService(s.id) : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <CustomServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={(input) => addService(input)}
      />
    </div>
  );
}
