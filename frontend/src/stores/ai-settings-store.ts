import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AiModelType = 'ollama' | 'openai-compatible';

export interface AiProviderSettings {
  type: AiModelType;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export const AI_PROVIDER_PRESETS: Record<
  string,
  { label: string; type: AiModelType; baseUrl: string; model: string }
> = {
  ollama: {
    label: 'Ollama (local)',
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  openai: {
    label: 'OpenAI',
    type: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  deepseek: {
    label: 'DeepSeek',
    type: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  groq: {
    label: 'Groq',
    type: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  together: {
    label: 'Together AI',
    type: 'openai-compatible',
    baseUrl: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  lmstudio: {
    label: 'LM Studio (local)',
    type: 'openai-compatible',
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    type: 'openai-compatible',
    baseUrl: '',
    model: '',
  },
};

interface AiSettingsState extends AiProviderSettings {
  preset: string;
  setPreset: (preset: string) => void;
  setType: (type: AiModelType) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setApiKey: (apiKey: string) => void;
  toApiOverride: () => {
    type: AiModelType;
    baseUrl: string;
    model: string;
    apiKey?: string;
  };
}

export const useAiSettingsStore = create<AiSettingsState>()(
  persist(
    (set, get) => ({
      preset: 'ollama',
      type: 'ollama',
      baseUrl: AI_PROVIDER_PRESETS.ollama.baseUrl,
      model: AI_PROVIDER_PRESETS.ollama.model,
      apiKey: '',

      setPreset: (preset) => {
        const config = AI_PROVIDER_PRESETS[preset];
        if (!config) return;
        set({
          preset,
          type: config.type,
          baseUrl: config.baseUrl,
          model: config.model,
        });
      },

      setType: (type) => set({ type, preset: 'custom' }),
      setBaseUrl: (baseUrl) => set({ baseUrl, preset: 'custom' }),
      setModel: (model) => set({ model, preset: 'custom' }),
      setApiKey: (apiKey) => set({ apiKey }),

      toApiOverride: () => {
        const { type, baseUrl, model, apiKey } = get();
        return {
          type,
          baseUrl,
          model,
          ...(apiKey ? { apiKey } : {}),
        };
      },
    }),
    { name: 'dcs-ai-settings' }
  )
);
