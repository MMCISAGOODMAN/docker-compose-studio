import { create } from 'zustand';
import type { Template, Topology } from '@/types';
import { generateComposeYaml } from '@/lib/compose';

const STORAGE_KEY = 'dcs-custom-templates';

function load(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(templates: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function slugify(name: string): string {
  return `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
}

interface CustomTemplatesState {
  templates: Template[];
  loadFromStorage: () => void;
  saveTemplate: (name: string, description: string, topology: Topology, category?: string) => Template;
  deleteTemplate: (slug: string) => void;
}

export const useCustomTemplatesStore = create<CustomTemplatesState>((set, get) => ({
  templates: load(),

  loadFromStorage: () => set({ templates: load() }),

  saveTemplate: (name, description, topology, category = 'custom') => {
    const template: Template = {
      slug: slugify(name),
      name,
      description,
      category,
      topology: structuredClone(topology),
      composeYaml: generateComposeYaml(topology),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const templates = [...get().templates, template];
    persist(templates);
    set({ templates });
    return template;
  },

  deleteTemplate: (slug) => {
    const templates = get().templates.filter((t) => t.slug !== slug);
    persist(templates);
    set({ templates });
  },
}));
