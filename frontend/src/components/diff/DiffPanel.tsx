import { useState } from 'react';
import { GitCompare } from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { diffCompose } from '@/lib/compose';

export default function DiffPanel() {
  const diffSource = useProjectStore((s) => s.diffSource);
  const diffTarget = useProjectStore((s) => s.diffTarget);
  const composeYaml = useProjectStore((s) => s.composeYaml);
  const setDiffSource = useProjectStore((s) => s.setDiffSource);
  const setDiffTarget = useProjectStore((s) => s.setDiffTarget);

  const [result, setResult] = useState<ReturnType<typeof diffCompose> | null>(null);

  const runDiff = () => {
    setResult(diffCompose(diffSource, diffTarget));
  };

  const useCurrentAsTarget = () => setDiffTarget(composeYaml);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-dcs-text">
          <GitCompare className="h-4 w-4 text-dcs-accent" />
          Compose Diff
        </h3>
        <p className="mt-1 text-xs text-dcs-muted">Compare two docker-compose.yml files</p>
      </div>

      <div className="grid flex-1 grid-rows-2 gap-3 min-h-0">
        <div className="flex flex-col min-h-0">
          <label className="mb-1 text-xs font-medium text-dcs-muted">Source (before)</label>
          <textarea
            value={diffSource}
            onChange={(e) => setDiffSource(e.target.value)}
            className="input-field flex-1 resize-none font-mono text-xs min-h-[120px]"
            placeholder="Paste original compose YAML..."
          />
        </div>
        <div className="flex flex-col min-h-0">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-dcs-muted">Target (after)</label>
            <button type="button" onClick={useCurrentAsTarget} className="text-xs text-dcs-accent hover:underline">
              Use current
            </button>
          </div>
          <textarea
            value={diffTarget}
            onChange={(e) => setDiffTarget(e.target.value)}
            className="input-field flex-1 resize-none font-mono text-xs min-h-[120px]"
            placeholder="Paste modified compose YAML..."
          />
        </div>
      </div>

      <button
        type="button"
        onClick={runDiff}
        disabled={!diffSource || !diffTarget}
        className="mt-3 rounded-lg bg-dcs-accent px-4 py-2 text-sm font-medium text-white hover:bg-dcs-accentHover disabled:opacity-50"
      >
        Compare
      </button>

      {result && (
        <div className="mt-4 space-y-3 overflow-y-auto">
          {result.added.length > 0 && (
            <DiffSection title="Added" items={result.added} color="text-emerald-400" prefix="+" />
          )}
          {result.removed.length > 0 && (
            <DiffSection title="Removed" items={result.removed} color="text-red-400" prefix="-" />
          )}
          {result.changed.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-yellow-400">Changed</p>
              {result.changed.map((c) => (
                <div key={c.path} className="rounded bg-dcs-bg px-2 py-1 font-mono text-xs text-dcs-muted">
                  <span className="text-yellow-400">{c.path}</span>
                  <br />
                  <span className="text-red-400/70">- {c.from}</span>
                  <br />
                  <span className="text-emerald-400/70">+ {c.to}</span>
                </div>
              ))}
            </div>
          )}
          {result.added.length === 0 && result.removed.length === 0 && result.changed.length === 0 && (
            <p className="text-xs text-dcs-muted">No differences found</p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffSection({ title, items, color, prefix }: { title: string; items: string[]; color: string; prefix: string }) {
  return (
    <div>
      <p className={`mb-1 text-xs font-medium ${color}`}>{title}</p>
      {items.map((item) => (
        <div key={item} className={`font-mono text-xs ${color}`}>
          {prefix} {item}
        </div>
      ))}
    </div>
  );
}
