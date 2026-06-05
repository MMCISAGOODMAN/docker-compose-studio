import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { parseComposeYaml } from '@/lib/compose';

export default function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadTopology = useProjectStore((s) => s.loadTopology);
  const setProjectName = useProjectStore((s) => s.setProjectName);

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      const topology = parseComposeYaml(text);
      loadTopology(topology);
      setProjectName(file.name.replace(/\.(yml|yaml)$/i, ''));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to parse compose file');
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".yml,.yaml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-lg border border-dcs-border px-3 py-1.5 text-sm text-dcs-muted transition-colors hover:border-dcs-accent hover:text-dcs-text"
      >
        <Upload className="h-4 w-4" />
        Import
      </button>
    </>
  );
}
