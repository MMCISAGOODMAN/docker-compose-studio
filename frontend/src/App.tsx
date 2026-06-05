import { ReactFlowProvider } from '@xyflow/react';
import Header, { RightPanelTabs } from '@/components/layout/Header';
import ServiceMarketplace from '@/components/marketplace/ServiceMarketplace';
import Canvas from '@/components/canvas/Canvas';
import ConfigPanel from '@/components/config/ConfigPanel';
import ComposeEditor from '@/components/compose/ComposeEditor';
import AiAssistant from '@/components/ai/AiAssistant';
import TemplateGallery from '@/components/templates/TemplateGallery';
import DiffPanel from '@/components/diff/DiffPanel';
import RuntimePanel from '@/components/runtime/RuntimePanel';
import { useProjectStore } from '@/stores/project-store';
import { mergeCatalog } from '@/lib/catalog';
import { useCustomCatalogStore } from '@/stores/custom-catalog-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function RightPanelContent() {
  const view = useProjectStore((s) => s.panelView);

  switch (view) {
    case 'templates':
      return <TemplateGallery />;
    case 'ai':
      return <AiAssistant />;
    case 'diff':
      return <DiffPanel />;
    case 'runtime':
      return <RuntimePanel />;
    default:
      return <ComposeEditor />;
  }
}

function AppLayout() {
  const addService = useProjectStore((s) => s.addService);
  const customServices = useCustomCatalogStore((s) => s.services);
  useKeyboardShortcuts();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const serviceId = e.dataTransfer.getData('application/dcs-service');
    const catalog = mergeCatalog(customServices).find((s) => s.id === serviceId);
    if (catalog) addService(catalog);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        {/* Left: Service Marketplace */}
        <aside className="w-64 shrink-0 border-r border-dcs-border bg-dcs-surface">
          <ServiceMarketplace />
        </aside>

        {/* Center: Canvas */}
        <main
          className="flex-1 min-w-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </main>

        {/* Right-bottom: Config Panel */}
        <aside className="w-72 shrink-0 border-l border-dcs-border bg-dcs-surface">
          <ConfigPanel />
        </aside>

        {/* Right: Compose / Templates / AI / Diff */}
        <aside className="w-96 shrink-0 border-l border-dcs-border bg-dcs-surface flex flex-col">
          <RightPanelTabs />
          <div className="flex-1 min-h-0">
            <RightPanelContent />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AppLayout;
