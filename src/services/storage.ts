
import { ChecklistTemplate, ServiceOrder } from "../types";

const PREFIX = 'checkmaster_';

const PRESETS: ChecklistTemplate[] = [
  {
    id: 'preset_inst_rastreador_completo_pro',
    name: 'Instalação Rastreador Pro',
    description: 'Checklist profissional com testes de bloqueio, pós-chave e sinal.',
    isFavorite: true,
    fields: [
       { id: 'ir1', label: 'Scanner de Placa', type: 'ai_placa', required: true },
       { id: 'ir2', label: 'Identificação do Veículo', type: 'ai_brand_model', required: true },
       { id: 'ir3', label: 'IMEI do Equipamento', type: 'ai_imei', required: true },
       { id: 'ir4', label: 'Foto da Fixação do Módulo', type: 'photo', required: true },
       { id: 'ir5', label: 'Teste de Bloqueio (Corte)', type: 'boolean', required: true },
       { id: 'ir6', label: 'Teste de Ignição (Pós-Chave)', type: 'boolean', required: true },
       { id: 'ir7', label: 'Sinal GPS/GPRS Verificado', type: 'boolean', required: true },
       { id: 'ir8', label: 'Chicote Escondido e Organizado', type: 'boolean', required: true },
       { id: 'ir9', label: 'Valor da Instalação', type: 'price', required: true }
    ]
  },
  {
    id: 'preset_manutencao_pro',
    name: 'Manutenção Corretiva',
    description: 'Troca de chip, bateria ou reposicionamento de hardware.',
    isFavorite: true,
    fields: [
       { id: 'mc1', label: 'Placa', type: 'ai_placa', required: true },
       { id: 'mc2', label: 'Motivo da Manutenção', type: 'text', required: true },
       { id: 'mc3', label: 'Equipamento Substituído?', type: 'boolean', required: true },
       { id: 'mc4', label: 'Novo IMEI (se houver)', type: 'ai_imei', required: false },
       { id: 'mc5', label: 'Foto do Serviço', type: 'photo', required: true },
       { id: 'mc6', label: 'Valor Manutenção', type: 'price', required: true }
    ]
  },
  {
    id: 'preset_vistoria_frota',
    name: 'Vistoria de Frota (Check-in)',
    description: 'Ideal para locadoras e transportadoras.',
    isFavorite: true,
    fields: [
       { id: 'vf1', label: 'Placa do Veículo', type: 'ai_placa', required: true },
       { id: 'vf2', label: 'Quilometragem (KM)', type: 'number', required: true },
       { id: 'vf3', label: 'Nível de Combustível', type: 'select_simple', required: true, options: [
         { id: 'c1', label: 'Reserva', price: 0 },
         { id: 'c2', label: '1/4', price: 0 },
         { id: 'c3', label: 'Meio Tanque', price: 0 },
         { id: 'c4', label: 'Cheio', price: 0 }
       ]},
       { id: 'vf4', label: 'Avarias Externas?', type: 'boolean', required: true },
       { id: 'vf5', label: 'Foto Lateral Direita', type: 'photo', required: true },
       { id: 'vf6', label: 'Foto Lateral Esquerda', type: 'photo', required: true },
       { id: 'vf7', label: 'Limpeza Interna OK?', type: 'boolean', required: true }
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
  duplicateTemplate: (templateId: string) => {
    const templates = storage.getTemplates();
    const original = templates.find(t => t.id === templateId);
    if (original) {
      const copy = JSON.parse(JSON.stringify(original)) as ChecklistTemplate;
      copy.id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
      copy.name = `${copy.name} (Cópia)`;
      copy.isFavorite = false;
      templates.push(copy);
      storage.set('templates', templates);
      return copy;
    }
    return null;
  },
  toggleFavorite: (templateId: string) => {
    const templates = storage.getTemplates();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      template.isFavorite = !template.isFavorite;
      storage.set('templates', templates);
      return template.isFavorite;
    }
    return false;
  },
  getOrders: (): ServiceOrder[] => storage.get('orders', []),
  saveOrder: (order: ServiceOrder) => {
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    
    if (index >= 0) {
      // Update existing order
      orders[index] = order;
    } else {
      // Create new order
      orders.push(order);
    }
    storage.set('orders', orders);
  }
};
