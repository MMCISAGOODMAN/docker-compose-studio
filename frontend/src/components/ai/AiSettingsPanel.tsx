import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { useState } from 'react';
import {
  AI_PROVIDER_PRESETS,
  useAiSettingsStore,
  type AiModelType,
} from '@/stores/ai-settings-store';

export default function AiSettingsPanel() {
  const [open, setOpen] = useState(false);
  const preset = useAiSettingsStore((s) => s.preset);
  const type = useAiSettingsStore((s) => s.type);
  const baseUrl = useAiSettingsStore((s) => s.baseUrl);
  const model = useAiSettingsStore((s) => s.model);
  const apiKey = useAiSettingsStore((s) => s.apiKey);
  const setPreset = useAiSettingsStore((s) => s.setPreset);
  const setType = useAiSettingsStore((s) => s.setType);
  const setBaseUrl = useAiSettingsStore((s) => s.setBaseUrl);
  const setModel = useAiSettingsStore((s) => s.setModel);
  const setApiKey = useAiSettingsStore((s) => s.setApiKey);

  return (
    <div className="mb-3 rounded-lg border border-dcs-border bg-dcs-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-dcs-text"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-dcs-accent" />
          Model Settings
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="space-y-2 border-t border-dcs-border px-3 py-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dcs-muted">Provider preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="input-field w-full text-xs"
            >
              {Object.entries(AI_PROVIDER_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dcs-muted">Provider type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AiModelType)}
              className="input-field w-full text-xs"
            >
              <option value="ollama">Ollama</option>
              <option value="openai-compatible">OpenAI Compatible</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dcs-muted">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="input-field w-full font-mono text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dcs-muted">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="llama3.2"
              className="input-field w-full font-mono text-xs"
            />
          </div>

          {type === 'openai-compatible' && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-dcs-muted">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="input-field w-full font-mono text-xs"
                autoComplete="off"
              />
              <p className="mt-1 text-[10px] text-dcs-muted">
                Stored locally in your browser only.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
