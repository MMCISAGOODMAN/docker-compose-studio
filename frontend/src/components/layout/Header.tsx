import {
  Download,
  FileArchive,
  Github,
  Sparkles,
  GitCompare,
  LayoutTemplate,
  Code2,
  Play,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { useRuntimeStore } from '@/stores/runtime-store';
import { exportYaml, exportZip } from '@/lib/export-utils';
import ImportButton from '@/components/import/ImportButton';
import ThemeToggle from '@/components/theme/ThemeToggle';
import type { PanelView } from '@/types';

const TABS: { id: PanelView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'compose', label: 'Compose', icon: Code2 },
  { id: 'runtime', label: 'Runtime', icon: Play },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'diff', label: 'Diff', icon: GitCompare },
];

export default function Header() {
  const projectName = useProjectStore((s) => s.projectName);
  const composeYaml = useProjectStore((s) => s.composeYaml);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const setPanelView = useProjectStore((s) => s.setPanelView);
  const deployStatus = useRuntimeStore((s) => s.deployStatus);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const historyPastLen = useProjectStore((s) => s.historyPast.length);
  const historyFutureLen = useProjectStore((s) => s.historyFuture.length);
  const validation = useProjectStore((s) => s.validation);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-dcs-border bg-dcs-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dcs-accent/20">
            <Code2 className="h-4 w-4 text-dcs-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-dcs-text">Docker Compose Studio</h1>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-xs text-dcs-muted outline-none focus:text-dcs-text"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-dcs-border">
          <button
            type="button"
            onClick={undo}
            disabled={historyPastLen === 0}
            title="Undo (⌘Z)"
            className="rounded-l-lg p-1.5 text-dcs-muted transition-colors hover:bg-dcs-border hover:text-dcs-text disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyFutureLen === 0}
            title="Redo (⌘⇧Z)"
            className="rounded-r-lg border-l border-dcs-border p-1.5 text-dcs-muted transition-colors hover:bg-dcs-border hover:text-dcs-text disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
        {validation && !validation.valid && (
          <span className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400" title="Fix validation errors before deploying">
            {validation.errors.length} error{validation.errors.length > 1 ? 's' : ''}
          </span>
        )}
        <ImportButton />
        <button
          type="button"
          onClick={() => exportYaml(composeYaml)}
          className="flex items-center gap-1.5 rounded-lg border border-dcs-border px-3 py-1.5 text-sm text-dcs-muted transition-colors hover:border-dcs-accent hover:text-dcs-text"
        >
          <Download className="h-4 w-4" />
          YAML
        </button>
        <button
          type="button"
          onClick={() => setPanelView('runtime')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            deployStatus === 'running'
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          <Play className="h-4 w-4" />
          {deployStatus === 'running' ? 'Running' : 'Deploy'}
        </button>
        <button
          type="button"
          onClick={() => exportZip(composeYaml, projectName)}
          className="flex items-center gap-1.5 rounded-lg border border-dcs-border px-3 py-1.5 text-sm text-dcs-muted transition-colors hover:border-dcs-accent hover:text-dcs-text"
        >
          <FileArchive className="h-4 w-4" />
          ZIP
        </button>
        <a
          href="https://github.com/MMCISAGOODMAN/docker-compose-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-dcs-muted transition-colors hover:text-dcs-text"
        >
          <Github className="h-5 w-5" />
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function RightPanelTabs() {
  const currentView = useProjectStore((s) => s.panelView);
  const setPanelView = useProjectStore((s) => s.setPanelView);

  return (
    <div className="flex border-b border-dcs-border">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setPanelView(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            currentView === id
              ? 'border-b-2 border-dcs-accent text-dcs-accent'
              : 'text-dcs-muted hover:text-dcs-text'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
