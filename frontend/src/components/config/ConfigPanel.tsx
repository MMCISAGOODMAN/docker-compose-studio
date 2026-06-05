import { Trash2, X, BookmarkPlus } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { useCustomCatalogStore } from '@/stores/custom-catalog-store';
import CustomServiceDialog from '@/components/marketplace/CustomServiceDialog';

export default function ConfigPanel() {
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const nodes = useProjectStore((s) => s.nodes);
  const updateNodeData = useProjectStore((s) => s.updateNodeData);
  const removeNode = useProjectStore((s) => s.removeNode);
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode);
  const addFromServiceData = useCustomCatalogStore((s) => s.addFromServiceData);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <p className="text-sm text-dcs-muted">Select a service on the canvas to configure</p>
      </div>
    );
  }

  const { data } = node;

  const updateEnv = (key: string, value: string) => {
    updateNodeData(node.id, { environment: { ...data.environment, [key]: value } });
  };

  const removeEnv = (key: string) => {
    const env = { ...data.environment };
    delete env[key];
    updateNodeData(node.id, { environment: env });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dcs-border px-4 py-3">
        <h2 className="text-sm font-semibold text-dcs-text">Service Config</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            className="rounded p-1 text-dcs-muted hover:bg-red-500/10 hover:text-red-400"
            title="Remove service"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="rounded p-1 text-dcs-muted hover:bg-dcs-border hover:text-dcs-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Field label="Service Name">
          <input
            value={data.name}
            onChange={(e) => updateNodeData(node.id, { name: e.target.value })}
            className="input-field"
          />
        </Field>

        <Field label="Image">
          <input
            value={data.image}
            onChange={(e) => updateNodeData(node.id, { image: e.target.value })}
            className="input-field font-mono text-xs"
          />
        </Field>

        <Field label="Ports (host:container)">
          <input
            value={data.ports.map((p) => `${p.host}:${p.container}`).join(', ')}
            onChange={(e) => {
              const ports = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => {
                  const [host, container] = s.split(':');
                  return { host: parseInt(host, 10), container: parseInt(container, 10) };
                });
              updateNodeData(node.id, { ports });
            }}
            placeholder="5432:5432, 8080:8080"
            className="input-field font-mono text-xs"
          />
        </Field>

        <Field label="Volumes (name:path)">
          <input
            value={data.volumes.map((v) => `${v.name}:${v.path}`).join(', ')}
            onChange={(e) => {
              const volumes = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => {
                  const [name, path] = s.split(':', 2);
                  return { name, path };
                });
              updateNodeData(node.id, { volumes });
            }}
            placeholder="pgdata:/var/lib/postgresql/data"
            className="input-field font-mono text-xs"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-dcs-muted">Environment Variables</label>
            <button
              type="button"
              onClick={() => updateEnv(`VAR_${Object.keys(data.environment).length + 1}`, '')}
              className="text-xs text-dcs-accent hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(data.environment).map(([key, value]) => (
              <div key={key} className="flex gap-1">
                <input
                  value={key}
                  onChange={(e) => {
                    const env = { ...data.environment };
                    delete env[key];
                    env[e.target.value] = value;
                    updateNodeData(node.id, { environment: env });
                  }}
                  className="input-field flex-1 font-mono text-xs"
                  placeholder="KEY"
                />
                <input
                  value={value}
                  onChange={(e) => updateEnv(key, e.target.value)}
                  className="input-field flex-1 font-mono text-xs"
                  placeholder="value"
                />
                <button
                  type="button"
                  onClick={() => removeEnv(key)}
                  className="rounded px-1 text-dcs-muted hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {data.command !== undefined && (
          <Field label="Command">
            <input
              value={data.command ?? ''}
              onChange={(e) => updateNodeData(node.id, { command: e.target.value })}
              className="input-field font-mono text-xs"
            />
          </Field>
        )}

        <button
          type="button"
          onClick={() => setSaveDialogOpen(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dcs-border py-2 text-xs text-dcs-muted transition-colors hover:border-dcs-accent hover:text-dcs-accent"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save as Custom Service
        </button>
      </div>

      <CustomServiceDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={({ name, description }) => {
          addFromServiceData(name, description, data);
        }}
        initial={{
          name: data.name,
          description: data.image,
          image: data.image,
          category: 'custom',
          ports: data.ports.map((p) => `${p.host}:${p.container}`).join(', '),
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-dcs-muted">{label}</label>
      {children}
    </div>
  );
}
