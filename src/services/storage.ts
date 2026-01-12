import { ChecklistTemplate } from "../types";

const PREFIX = 'checkmaster_';

const PRESETS: ChecklistTemplate[] = [
  {
    id: 'preset_inst',
    name: 'Instalação Padrão',
    description: 'Checklist completo para novos rastreadores',
    isFavorite: true,
    fields: [
       { id: 'p1', label: 'Placa do Veículo', type: 'ai_placa', required: true },
       { id: 'p2', label: 'Dados do Carro', type: 'ai_brand_model', required: true },
       { id: 'p3', label: 'Foto do Equipamento', type: 'photo', required: true },
       { id: 'p4', label: 'Taxa de Instalação', type: 'price', required: true, value: 150 }
    ]
  },
  {
    id: 'preset_man',
    name: 'Manutenção Rápida',
    description: 'Verificação periódica de funcionamento',
    isFavorite: true,
    fields: [
       { id: 'm1', label: 'Placa do Veículo', type: 'ai_placa', required: true },
       { id: 'm2', label: 'Status do LED', type: 'boolean', required: true },
       { id: 'm3', label: 'Valor Manutenção', type: 'price', required: true, value: 80 }
    ]
  }
];

export const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(PREFIX + key);
    if (!data) return defaultValue;
    try {
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  
  // Helper for templates
  getTemplates: (): ChecklistTemplate[] => {
    const saved = storage.get<ChecklistTemplate[]>('templates', []);
    if (saved.length === 0) {
      storage.set('templates', PRESETS);
      return PRESETS;
    }
    return saved;
  },
  saveTemplate: (template: ChecklistTemplate) => {
    const templates = storage.getTemplates();
    const index = templates.findIndex((t: any) => t.id === template.id);
    if (index >= 0) templates[index] = template;
    else templates.push(template);
    storage.set('templates', templates);
  },
  
  // Helper for service orders
  getOrders: () => storage.get('orders', []),
  saveOrder: (order: any) => {
    const orders = storage.getOrders();
    orders.push(order);
    storage.set('orders', orders);
  }
};