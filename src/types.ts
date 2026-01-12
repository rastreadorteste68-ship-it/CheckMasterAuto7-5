
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'select' 
  | 'select_simple'
  | 'multiselect' 
  | 'ai_placa' 
  | 'ai_imei'
  | 'ai_brand_model'
  | 'price' 
  | 'photo';

export interface FieldOption {
  id: string;
  label: string;
  price: number;
}

export interface ChecklistField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: FieldOption[];
  value?: any; 
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  fields: ChecklistField[];
  isFavorite?: boolean;
}

export interface VehicleData {
  placa: string;
  marca: string;
  modelo: string;
  imei: string[];
}

export interface ServiceOrder {
  id: string;
  templateId: string;
  templateName: string;
  clientName: string;
  vehicle: VehicleData;
  fields: ChecklistField[];
  totalValue: number;
  status: 'completed';
  date: string;
}
