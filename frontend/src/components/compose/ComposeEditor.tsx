import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '@/stores/project-store';
import { useThemeStore, getMonacoTheme } from '@/stores/theme-store';
import ValidationPanel from './ValidationPanel';

export default function ComposeEditor() {
  const composeYaml = useProjectStore((s) => s.composeYaml);
  const setComposeYaml = useProjectStore((s) => s.setComposeYaml);
  const validation = useProjectStore((s) => s.validation);
  const runValidation = useProjectStore((s) => s.runValidation);
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode);
  const nodes = useProjectStore((s) => s.nodes);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    runValidation();
  }, [runValidation]);

  const handleIssueClick = (issue: import('@/types').ValidationIssue) => {
    if (issue.service) {
      const node = nodes.find((n) => n.data.name === issue.service);
      if (node) {
        setSelectedNode(node.id);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ValidationPanel validation={validation} onIssueClick={handleIssueClick} />
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="yaml"
          value={composeYaml}
          onChange={(value) => setComposeYaml(value ?? '')}
          theme={getMonacoTheme(theme)}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
