import { create } from 'zustand';
import type { CatalogService, ServiceData } from '@/types';

const STORAGE_KEY = 'dcs-custom-catalog';

function load(): CatalogService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(services: CatalogService[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

function slugify(name: string): string {
  return `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

interface CustomCatalogState {
  services: CatalogService[];
  loadFromStorage: () => void;
  addService: (input: {
    name: string;
    description: string;
    image: string;
    category: string;
    ports?: string;
  }) => CatalogService;
  addFromServiceData: (name: string, description: string, data: ServiceData) => CatalogService;
  deleteService: (id: string) => void;
}

export const useCustomCatalogStore = create<CustomCatalogState>((set, get) => ({
  services: load(),

  loadFromStorage: () => set({ services: load() }),

  addService: (input) => {
    const id = slugify(input.name);
    const ports = input.ports
      ? input.ports.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
          const [host, container] = s.split(':');
          return { host: parseInt(host, 10), container: parseInt(container, 10) };
        })
      : [];

    const service: CatalogService = {
      id,
      name: input.name,
      category: input.category || 'custom',
      icon: 'code',
      description: input.description || input.image,
      defaultImage: input.image,
      defaults: {
        image: input.image,
        ports,
        volumes: [],
        environment: {},
      },
      isCustom: true,
    };

    const services = [...get().services.filter((s) => s.id !== id), service];
    persist(services);
    set({ services });
    return service;
  },

  addFromServiceData: (name, description, data) => {
    const id = slugify(name);
    const service: CatalogService = {
      id,
      name,
      category: 'custom',
      icon: 'code',
      description: description || data.image,
      defaultImage: data.image,
      defaults: {
        image: data.image,
        ports: structuredClone(data.ports),
        volumes: structuredClone(data.volumes),
        environment: structuredClone(data.environment),
        ...(data.healthcheck ? { healthcheck: structuredClone(data.healthcheck) } : {}),
        ...(data.command ? { command: data.command } : {}),
      },
      isCustom: true,
    };
    const services = [...get().services.filter((s) => s.id !== id), service];
    persist(services);
    set({ services });
    return service;
  },

  deleteService: (id) => {
    const services = get().services.filter((s) => s.id !== id);
    persist(services);
    set({ services });
  },
}));
