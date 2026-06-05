import { useState } from 'react';
import { LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { useCustomTemplatesStore } from '@/stores/custom-templates-store';
import { BUILTIN_TEMPLATES } from '@/lib/templates';
import SaveTemplateDialog from './SaveTemplateDialog';
import type { Template } from '@/types';

function TemplateCard({
  template,
  selected,
  onApply,
  onDelete,
}: {
  template: Template;
  selected: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`relative w-full rounded-lg border p-3 text-left transition-colors ${
        selected ? 'border-dcs-accent bg-dcs-accent/10' : 'border-dcs-border bg-dcs-bg hover:border-dcs-accent'
      }`}
    >
      <button type="button" onClick={onApply} className="w-full text-left">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-dcs-text">{template.name}</div>
          {template.isCustom && (
            <span className="rounded bg-dcs-accent/20 px-1 py-0.5 text-[10px] text-dcs-accent">Custom</span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-dcs-muted">{template.description || 'No description'}</div>
        <div className="mt-2 flex gap-1">
          <span className="rounded bg-dcs-surface px-1.5 py-0.5 text-xs text-dcs-muted">{template.category}</span>
          <span className="rounded bg-dcs-surface px-1.5 py-0.5 text-xs text-dcs-muted">
            {template.topology.nodes.length} services
          </span>
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute right-2 top-2 rounded p-1 text-dcs-muted hover:bg-red-500/10 hover:text-red-400"
          title="Delete template"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function TemplateGallery() {
  const loadTopology = useProjectStore((s) => s.loadTopology);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const nodes = useProjectStore((s) => s.nodes);
  const edges = useProjectStore((s) => s.edges);
  const projectName = useProjectStore((s) => s.projectName);

  const customTemplates = useCustomTemplatesStore((s) => s.templates);
  const saveTemplate = useCustomTemplatesStore((s) => s.saveTemplate);
  const deleteTemplate = useCustomTemplatesStore((s) => s.deleteTemplate);

  const [selected, setSelected] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const apply = (template: Template) => {
    loadTopology(template.topology);
    setProjectName(template.name);
    setSelected(template.slug);
  };

  const handleSave = (name: string, description: string) => {
    if (nodes.length === 0) return;
    const template = saveTemplate(name, description, { nodes, edges });
    setSelected(template.slug);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-dcs-text">
            <LayoutTemplate className="h-4 w-4 text-dcs-accent" />
            Environment Templates
          </h3>
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            disabled={nodes.length === 0}
            title={nodes.length === 0 ? 'Add services to canvas first' : 'Save current canvas as template'}
            className="flex items-center gap-1 rounded-lg bg-dcs-accent/20 px-2 py-1 text-xs font-medium text-dcs-accent hover:bg-dcs-accent/30 disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
            Save
          </button>
        </div>
        <p className="mt-1 text-xs text-dcs-muted">Built-in and custom environment setups</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {customTemplates.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-dcs-muted">My Templates</h4>
            <div className="space-y-2">
              {customTemplates.map((t) => (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  selected={selected === t.slug}
                  onApply={() => apply(t)}
                  onDelete={() => deleteTemplate(t.slug)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-dcs-muted">Built-in</h4>
          <div className="space-y-2">
            {BUILTIN_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.slug}
                template={t}
                selected={selected === t.slug}
                onApply={() => apply(t)}
              />
            ))}
          </div>
        </section>
      </div>

      <SaveTemplateDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSave}
        defaultName={projectName}
      />
    </div>
  );
}
