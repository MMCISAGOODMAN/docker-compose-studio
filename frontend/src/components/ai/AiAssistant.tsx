import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { useAiSettingsStore } from '@/stores/ai-settings-store';
import { api, type AiProviderInfo } from '@/lib/api';
import { generateTopologyLocally, type AiProvider } from '@/lib/ai-local';
import AiSettingsPanel from '@/components/ai/AiSettingsPanel';
import type { Topology } from '@/types';

const EXAMPLES = [
  '我要搭建一个 Spring Boot + PostgreSQL + Redis 环境',
  '我要一个本地 RAG 开发环境',
  'Python + PostgreSQL 开发环境',
  '微服务开发环境 with Kafka',
];

const PROVIDER_LABELS: Record<string, string> = {
  template: 'Template match',
  rules: 'Keyword rules',
  local: 'Local (offline)',
  ollama: 'Ollama',
  'openai-compatible': 'OpenAI Compatible',
};

function normalizeTopology(raw: unknown): Topology {
  const topology = raw as Topology;
  return {
    nodes: Array.isArray(topology?.nodes) ? topology.nodes : [],
    edges: Array.isArray(topology?.edges) ? topology.edges : [],
  };
}

export default function AiAssistant() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [provider, setProvider] = useState<string>('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [providers, setProviders] = useState<AiProviderInfo[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const loadTopology = useProjectStore((s) => s.loadTopology);
  const setPanelView = useProjectStore((s) => s.setPanelView);
  const toApiOverride = useAiSettingsStore((s) => s.toApiOverride);
  const settingsType = useAiSettingsStore((s) => s.type);
  const settingsModel = useAiSettingsStore((s) => s.model);

  const refreshStatus = useCallback(() => {
    const override = toApiOverride();
    api
      .aiStatus(override)
      .then((status) => {
        setProviders(status.providers);
        setStatusMessage(status.message);
      })
      .catch(() => {
        setProviders([]);
        setStatusMessage('Backend offline — using local template/keyword matching');
      });
  }, [toApiOverride]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus, settingsType, settingsModel]);

  const activeProvider = providers.find((p) => p.id === settingsType);
  const llmReady = activeProvider?.available ?? false;

  const applyResult = (
    topology: Topology,
    resultExplanation: string,
    resultProvider: string
  ) => {
    const normalized = normalizeTopology(topology);
    if (normalized.nodes.length === 0) {
      setError('No services were generated. Try a more specific prompt.');
      return;
    }
    loadTopology(normalized);
    setSuccessCount(normalized.nodes.length);
    setExplanation(resultExplanation);
    setProvider(resultProvider);
    setError('');
    setPanelView('compose');
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setExplanation('');
    setProvider('');
    setError('');

    const override = toApiOverride();

    try {
      const result = await api.generateTopology(prompt, override);
      applyResult(result.topology, result.explanation, result.provider ?? 'rules');
    } catch (backendError) {
      try {
        const local = generateTopologyLocally(prompt);
        applyResult(
          local.topology,
          `${local.explanation} (offline mode)`,
          'local'
        );
      } catch {
        setError(
          backendError instanceof Error
            ? backendError.message
            : 'Failed to generate topology'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-dcs-text">
          <Sparkles className="h-4 w-4 text-dcs-accent" />
          AI Assistant
        </h3>
        <p className="mt-1 text-xs text-dcs-muted">
          Describe your dev environment — default model: Ollama, or any OpenAI-compatible API
        </p>
        {statusMessage && (
          <p className="mt-2 rounded-md border border-dcs-border bg-dcs-bg px-2 py-1.5 text-[11px] text-dcs-muted">
            {llmReady ? '🟢 ' : '🔵 '}
            {statusMessage}
          </p>
        )}
      </div>

      <AiSettingsPanel />

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Spring Boot + PostgreSQL + Redis"
        className="input-field min-h-[100px] resize-none font-mono text-sm"
        onKeyDown={(e) => e.key === 'Enter' && e.metaKey && generate()}
      />

      <button
        type="button"
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-dcs-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dcs-accentHover disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generate Topology
      </button>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-dcs-muted">Examples</p>
        <div className="space-y-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="block w-full rounded-md border border-dcs-border bg-dcs-bg px-3 py-2 text-left text-xs text-dcs-muted transition-colors hover:border-dcs-accent hover:text-dcs-text"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {explanation && !error && (
        <div className="mt-4 rounded-lg border border-dcs-border bg-dcs-bg p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Applied to canvas ({successCount} services)
          </div>
          {provider && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-dcs-muted">
              {PROVIDER_LABELS[provider as AiProvider] ?? provider}
            </p>
          )}
          <p className="text-xs text-dcs-text">{explanation}</p>
        </div>
      )}
    </div>
  );
}
