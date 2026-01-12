
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ChevronLeft, 
  Camera, 
  Check, 
  Scan,
  FileText,
  Trash2,
  Star,
  Settings2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit3,
  CheckCircle2,
  Loader2,
  ListChecks,
  Car,
  Hash,
  Type as TypeIcon,
  X,
  PlusCircle,
  Image as ImageIcon,
  Clock,
  Copy,
  LayoutList,
  Search,
  Truck,
  Bike,
  Wrench,
  AlertCircle,
  Package,
  Calendar,
  ToggleLeft,
  DollarSign,
  Monitor
} from 'lucide-react';
import { storage } from '../services/storage';
import { analyzeVehicleImage } from '../services/aiService';
import { ChecklistTemplate, ChecklistField, ServiceOrder, VehicleData, FieldType, FieldOption } from '../types';

const Services: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get('run');

  const [view, setView] = useState<'menu' | 'builder' | 'runner'>('menu');
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clientName, setClientName] = useState('');
  
  // Guided Vehicle Selector States
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'truck' | 'machine' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [scanningFieldId, setScanningFieldId] = useState<string | null>(null);

  useEffect(() => {
    const ts = storage.getTemplates();
    setTemplates(ts);
    
    if (templateId) {
      const found = ts.find(t => t.id === templateId);
      if (found) startInspection(found);
    }
  }, [templateId]);

  // Sync Guided Header with Checklist Fields
  useEffect(() => {
    if (view === 'runner' && activeTemplate) {
      const newValues = { ...fieldValues };
      let changed = false;

      activeTemplate.fields.forEach(field => {
        // Auto-fill Brand/Model field
        if (field.type === 'ai_brand_model') {
          const combined = [selectedBrand, selectedModel].filter(Boolean).join(' ');
          if (combined && newValues[field.id] !== combined) {
            newValues[field.id] = combined;
            changed = true;
          }
        }

        // Auto-select in Select Simple fields based on label matching
        if (field.type === 'select_simple' || field.type === 'select') {
          const labelLower = field.label.toLowerCase();
          
          // Match Category
          if (labelLower.includes('categoria') || labelLower.includes('tipo')) {
            const match = field.options?.find(o => 
              o.label.toLowerCase().includes(vehicleType || '___')
            );
            if (match && newValues[field.id] !== match.id) {
              newValues[field.id] = match.id;
              changed = true;
            }
          }

          // Match Brand
          if (labelLower.includes('marca')) {
            const match = field.options?.find(o => 
              o.label.toLowerCase() === selectedBrand.toLowerCase()
            );
            if (match && newValues[field.id] !== match.id) {
              newValues[field.id] = match.id;
              changed = true;
            }
          }
        }
      });

      if (changed) {
        setFieldValues(newValues);
      }
    }
  }, [vehicleType, selectedBrand, selectedModel, view]);

  const handleCreateTemplate = () => {
    const newTemplate: ChecklistTemplate = {
      id: Date.now().toString(),
      name: 'Novo Checklist',
      description: 'Modelo customizado',
      fields: [],
      isFavorite: false
    };
    setActiveTemplate(newTemplate);
    setView('builder');
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    setActiveTemplate(JSON.parse(JSON.stringify(template)));
    setView('builder');
  };

  const handleDuplicateTemplate = (template: ChecklistTemplate) => {
    const duplicated: ChecklistTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      id: Date.now().toString(),
      name: `${template.name} (Cópia)`,
      isFavorite: false
    };
    storage.saveTemplate(duplicated);
    setTemplates(storage.getTemplates());
  };

  const startInspection = (template: ChecklistTemplate) => {
    setActiveTemplate(JSON.parse(JSON.stringify(template)));
    setFieldValues({});
    setClientName('');
    setVehicleType(null);
    setSelectedBrand('');
    setSelectedModel('');
    setView('runner');
    setSearchParams({});
  };

  const addField = (type: FieldType, label: string) => {
    if (!activeTemplate) return;
    const newField: ChecklistField = {
      id: Math.random().toString(36).substr(2, 9),
      label: label,
      type: type,
      required: false,
      options: (type === 'select' || type === 'multiselect' || type === 'select_simple') ? [{ id: Date.now().toString(), label: 'Opção 1', price: 0 }] : undefined
    };
    setActiveTemplate({
      ...activeTemplate,
      fields: [...activeTemplate.fields, newField]
    });
    setEditingFieldId(newField.id);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    setActiveTemplate({ ...activeTemplate, fields: newFields });
  };

  const updateField = (index: number, updates: Partial<ChecklistField>) => {
    if (!activeTemplate) return;
    const next = [...activeTemplate.fields];
    next[index] = { ...next[index], ...updates };
    setActiveTemplate({ ...activeTemplate, fields: next });
  };

  const addOption = (fieldIndex: number, label = 'Nova Opção') => {
    if (!activeTemplate) return;
    const fields = [...activeTemplate.fields];
    const field = fields[fieldIndex];
    const newOption: FieldOption = { id: Date.now().toString() + Math.random(), label, price: 0 };
    field.options = [...(field.options || []), newOption];
    setActiveTemplate({ ...activeTemplate, fields });
  };

  const loadPresetOptions = (fieldIndex: number, category: 'cars' | 'bikes' | 'trucks' | 'truck_models' | 'machines' | 'types') => {
    if (!activeTemplate) return;
    const presets = {
      cars: ['Toyota', 'Volkswagen', 'Ford', 'Fiat', 'Chevrolet', 'Honda', 'Hyundai', 'Jeep', 'Renault', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Kia', 'Mitsubishi', 'Land Rover', 'Volvo', 'Peugeot', 'Citroën', 'Chery', 'JAC', 'Suzuki', 'Subaru', 'Ram'],
      bikes: ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW Motorrad', 'Triumph', 'Harley-Davidson', 'Ducati', 'KTM', 'Royal Enfield', 'Dafra', 'Shineray', 'Indian', 'Bajaj'],
      trucks: ['Mercedes-Benz', 'Volvo Trucks', 'Scania', 'Volkswagen Caminhões', 'Iveco', 'DAF', 'Ford Trucks', 'MAN', 'Foton', 'Sinotruk', 'International', 'MWM'],
      truck_models: ['Volvo FH 540', 'Scania R 450', 'VW Constellation 24.280', 'MB Actros 2651', 'Volvo VM 270', 'Scania G 420', 'Iveco Stralis', 'MB Axor 2544', 'VW Meteor', 'Ford Cargo 2429'],
      machines: ['Caterpillar (CAT)', 'JCB', 'Case CE', 'Komatsu', 'John Deere', 'New Holland', 'Sany', 'Volvo CE', 'Bobcat', 'Hyundai CE', 'Massey Ferguson', 'Valtra', 'LS Tractor', 'Yanmar', 'XCMG', 'LiuGong'],
      types: ['Carro Passeio', 'Picape / SUV', 'Caminhão Leve (VUC)', 'Caminhão Toco', 'Caminhão Truck', 'Caminhão Traçado', 'Cavalo Mecânico', 'Moto', 'Scooter', 'Máquina Agrícola', 'Retroescavadeira', 'Escavadeira Hidráulica', 'Pá Carregadeira', 'Rolo Compactador', 'Van / Furgão', 'Ônibus / Micro']
    };

    const fields = [...activeTemplate.fields];
    fields[fieldIndex].options = presets[category].map(label => ({
      id: Math.random().toString(36).substr(2, 9),
      label,
      price: 0
    }));
    setActiveTemplate({ ...activeTemplate, fields });
  };

  const updateOption = (fieldIndex: number, optIndex: number, updates: Partial<FieldOption>) => {
    if (!activeTemplate) return;
    const fields = [...activeTemplate.fields];
    const field = fields[fieldIndex];
    if (field.options) {
      field.options[optIndex] = { ...field.options[optIndex], ...updates };
      setActiveTemplate({ ...activeTemplate, fields });
    }
  };

  const removeOption = (fieldIndex: number, optIndex: number) => {
    if (!activeTemplate) return;
    const fields = [...activeTemplate.fields];
    const field = fields[fieldIndex];
    if (field.options) {
      field.options.splice(optIndex, 1);
      setActiveTemplate({ ...activeTemplate, fields });
    }
  };

  const removeField = (id: string) => {
    if (!activeTemplate) return;
    setActiveTemplate({ ...activeTemplate, fields: activeTemplate.fields.filter(f => f.id !== id) });
  };

  const saveTemplate = () => {
    if (!activeTemplate) return;
    storage.saveTemplate(activeTemplate);
    setTemplates(storage.getTemplates());
    setView('menu');
  };

  const handleScan = (fieldId: string) => {
    setScanningFieldId(fieldId);
    fileInputRef.current?.click();
  };

  const handleGallery = (fieldId: string) => {
    setScanningFieldId(fieldId);
    galleryInputRef.current?.click();
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const fillCurrentDateTime = (fieldId: string) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    handleFieldChange(fieldId, localISOTime);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scanningFieldId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      const field = activeTemplate?.fields.find(f => f.id === scanningFieldId);
      if (field?.type === 'photo') {
        handleFieldChange(scanningFieldId, reader.result);
        setScanningFieldId(null);
        return;
      }

      setIsAnalyzing(true);
      const data = await analyzeVehicleImage(base64);
      if (data) {
        const newValues = { ...fieldValues };
        if (field?.type === 'ai_placa') newValues[scanningFieldId] = data.placa;
        if (field?.type === 'ai_brand_model') {
           newValues[scanningFieldId] = `${data.marca} ${data.modelo}`;
           setSelectedBrand(data.marca);
           setSelectedModel(data.modelo);
        }
        if (field?.type === 'ai_imei') newValues[scanningFieldId] = data.imei?.[0] || '';
        setFieldValues(newValues);
      }
      setIsAnalyzing(false);
      setScanningFieldId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const calculateTotal = () => {
    if (!activeTemplate) return 0;
    return activeTemplate.fields.reduce((acc, f) => {
      if (f.type === 'price') return acc + (Number(fieldValues[f.id]) || 0);
      if (f.type === 'select' && f.options) {
        const selectedId = fieldValues[f.id];
        const opt = f.options.find(o => o.id === selectedId);
        return acc + (opt?.price || 0);
      }
      if (f.type === 'multiselect' && f.options) {
        const selectedIds = fieldValues[f.id] || [];
        const optsPrice = f.options
          .filter(o => selectedIds.includes(o.id))
          .reduce((sum, o) => sum + (o.price || 0), 0);
        return acc + optsPrice;
      }
      return acc;
    }, 0);
  };

  const finishInspection = () => {
    if (!activeTemplate || !clientName) return;
    const order: ServiceOrder = {
      id: Date.now().toString(),
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      clientName: clientName,
      vehicle: { 
        placa: fieldValues['ai_placa'] || fieldValues[activeTemplate.fields.find(f => f.type === 'ai_placa')?.id || ''] || '', 
        marca: selectedBrand, 
        modelo: selectedModel || fieldValues['ai_brand_model'] || fieldValues[activeTemplate.fields.find(f => f.type === 'ai_brand_model')?.id || ''] || '', 
        imei: [] 
      },
      fields: activeTemplate.fields.map(f => ({ ...f, value: fieldValues[f.id] })),
      totalValue: calculateTotal(),
      status: 'completed',
      date: new Date().toISOString()
    };
    storage.saveOrder(order);
    navigate('/');
  };

  // Guided Brand Presets
  const brandsByType = {
    car: ['Toyota', 'Volkswagen', 'Ford', 'Fiat', 'Chevrolet', 'Honda', 'Hyundai', 'Jeep', 'Renault', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Kia', 'Mitsubishi', 'Land Rover', 'Volvo', 'Peugeot', 'Citroën', 'Chery', 'Ram'],
    bike: ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW Motorrad', 'Triumph', 'Harley-Davidson', 'Ducati', 'KTM', 'Royal Enfield'],
    truck: ['Mercedes-Benz', 'Volvo Trucks', 'Scania', 'Volkswagen Caminhões', 'Iveco', 'DAF', 'Ford Trucks', 'MAN'],
    machine: ['Caterpillar (CAT)', 'JCB', 'Case CE', 'Komatsu', 'John Deere', 'New Holland', 'Sany', 'Volvo CE']
  };

  // Guided Model Presets for Trucks
  const modelsByBrand: Record<string, string[]> = {
    'Mercedes-Benz': ['Actros 2651', 'Axor 2544', 'Accelo 1016', 'Atego 2426'],
    'Volvo Trucks': ['FH 460', 'FH 540', 'VM 270', 'VM 330'],
    'Scania': ['R 450', 'R 500', 'G 420', 'P 320'],
    'Volkswagen Caminhões': ['Constellation 24.280', 'Delivery 11.180', 'Meteor 29.520'],
    'Iveco': ['Stralis', 'Daily', 'Trakker', 'Hi-Way'],
    'DAF': ['XF 530', 'CF 410', 'XF 480'],
    'Ford Trucks': ['Cargo 2429', 'Cargo 816', 'F-4000'],
    'MAN': ['TGX 28.440', 'TGX 29.480']
  };

  // --- RENDER BUILDER ---
  if (view === 'builder' && activeTemplate) {
    const fieldTypesList: { t: FieldType; l: string; i: React.ReactNode }[] = [
      { t: 'select_simple', l: 'Seleção Simples', i: <LayoutList size={20}/> },
      { t: 'select', l: 'Seleção (+ Preço)', i: <Package size={20}/> },
      { t: 'multiselect', l: 'Múltipla (+ Preço)', i: <CheckCircle2 size={20}/> },
      { t: 'ai_brand_model', l: 'Veículo (IA)', i: <Car size={20}/> },
      { t: 'ai_placa', l: 'Placa (Scanner IA)', i: <Hash size={20}/> },
      { t: 'photo', l: 'Foto', i: <Camera size={20}/> },
      { t: 'date', l: 'Data/Hora', i: <Calendar size={20}/> },
      { t: 'boolean', l: 'OK / Falha', i: <ToggleLeft size={20}/> },
      { t: 'text', l: 'Texto', i: <FileText size={20}/> },
      { t: 'number', l: 'Número', i: <Hash size={20}/> },
      { t: 'ai_imei', l: 'IMEI (IA)', i: <Monitor size={20}/> },
      { t: 'price', l: 'Preço Manual', i: <DollarSign size={20}/> },
    ];

    return (
      <div className="space-y-6 pb-40 animate-slide-up max-w-2xl mx-auto px-2">
        <header className="flex items-center justify-between sticky top-0 bg-slate-50/90 backdrop-blur-md py-4 z-50">
          <button onClick={() => setView('menu')} className="p-3 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100"><ChevronLeft /></button>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setActiveTemplate({...activeTemplate, isFavorite: !activeTemplate.isFavorite})} 
                className={`p-3 rounded-2xl transition-all ${activeTemplate.isFavorite ? 'bg-amber-50 text-amber-500 shadow-amber-100' : 'bg-white text-slate-300 border border-slate-100'}`}
             >
                <Star size={20} fill={activeTemplate.isFavorite ? 'currentColor' : 'none'} />
             </button>
             <button onClick={saveTemplate} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all uppercase text-xs tracking-widest">Salvar Modelo</button>
          </div>
        </header>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Título do Checklist</label>
            <input 
              type="text" 
              value={activeTemplate.name}
              onChange={(e) => setActiveTemplate({...activeTemplate, name: e.target.value})}
              className="w-full text-2xl font-black border-none p-2 focus:ring-0 text-slate-900 bg-slate-50 rounded-2xl"
              placeholder="Ex: Vistoria Cautelar"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-6">Estrutura de Campos</h3>
          {activeTemplate.fields.map((field, idx) => {
            const isEditing = editingFieldId === field.id;
            const hasOptions = ['select', 'select_simple', 'multiselect'].includes(field.type);
            const hasPrice = field.type === 'select' || field.type === 'multiselect';

            return (
              <div key={field.id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${isEditing ? 'border-indigo-400 shadow-xl ring-4 ring-indigo-50/50' : 'border-slate-100 shadow-sm'}`}>
                <div className="p-5 flex items-center gap-3">
                  <div className="text-slate-300 cursor-grab active:cursor-grabbing"><GripVertical size={20} /></div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{field.label}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{field.type.replace('ai_', 'IA ').replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="p-2 text-slate-300 hover:text-indigo-600 disabled:opacity-10"><ChevronUp size={20} /></button>
                    <button onClick={() => moveField(idx, 'down')} disabled={idx === activeTemplate.fields.length - 1} className="p-2 text-slate-300 hover:text-indigo-600 disabled:opacity-10"><ChevronDown size={20} /></button>
                    <button onClick={() => setEditingFieldId(isEditing ? null : field.id)} className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-slate-50'}`}><Edit3 size={18} /></button>
                    <button onClick={() => removeField(field.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-6 pb-6 pt-2 space-y-4 bg-slate-50/50 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo / Pergunta</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        value={field.label}
                        onChange={(e) => updateField(idx, { label: e.target.value })}
                      />
                    </div>
                    
                    {hasOptions && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Preenchimento Inteligente (Presets)</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <button onClick={() => loadPresetOptions(idx, 'types')} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm"><LayoutList size={12}/> TIPOS</button>
                            <button onClick={() => loadPresetOptions(idx, 'cars')} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm"><Car size={12}/> CARROS</button>
                            <button onClick={() => loadPresetOptions(idx, 'trucks')} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm"><Truck size={12}/> MARCAS TRUCK</button>
                            <button onClick={() => loadPresetOptions(idx, 'truck_models')} className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm"><Truck size={12}/> MODELOS TRUCK</button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Opções do Item</label>
                          <button onClick={() => addOption(idx)} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg flex items-center gap-1"><PlusCircle size={12} /> ADD OPÇÃO</button>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-hide border-y border-slate-100 py-2">
                          {field.options?.map((opt, optIdx) => (
                            <div key={opt.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                              <input className="flex-1 bg-slate-50 border-none rounded-lg py-2 px-3 text-xs font-bold" value={opt.label} onChange={(e) => updateOption(idx, optIdx, { label: e.target.value })} placeholder="Nome" />
                              {hasPrice && (
                                <div className="flex items-center bg-slate-50 rounded-lg px-2 w-24">
                                  <span className="text-[9px] font-black text-slate-400 mr-1">R$</span>
                                  <input type="number" className="w-full bg-transparent border-none p-0 text-xs font-black text-indigo-600 focus:ring-0" value={opt.price} onChange={(e) => updateOption(idx, optIdx, { price: Number(e.target.value) })} />
                                </div>
                              )}
                              <button onClick={() => removeOption(idx, optIdx)} className="p-2 text-rose-500"><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer pt-2">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })} className="w-5 h-5 rounded-lg text-indigo-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Campo Obrigatório</span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-[#F8FAFC] border-2 border-dashed border-slate-200 rounded-[3.5rem] space-y-8 mt-10 shadow-inner">
          <h3 className="text-center text-[13px] font-black text-[#5C728E] uppercase tracking-[0.2em]">Inserir Componente</h3>
          <div className="grid grid-cols-2 gap-4">
            {fieldTypesList.map(item => (
              <button 
                key={item.t}
                onClick={() => addField(item.t, item.l)}
                className="bg-white border border-slate-200 p-6 rounded-[1.8rem] flex flex-col items-center justify-center gap-2 group active:scale-[0.97] transition-all hover:border-indigo-200 hover:shadow-md shadow-sm"
              >
                <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{item.i}</div>
                <span className="text-[11px] font-bold text-[#5C728E] text-center leading-tight">{item.l}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER RUNNER ---
  if (view === 'runner' && activeTemplate) {
    return (
      <div className="space-y-6 pb-32 animate-slide-up max-w-xl mx-auto px-2">
        <header className="flex items-center justify-between sticky top-0 bg-slate-50/90 backdrop-blur-md py-4 z-50 px-2">
          <button onClick={() => setView('menu')} className="p-3 bg-white text-slate-500 rounded-2xl shadow-sm border border-slate-100"><ChevronLeft /></button>
          <div className="text-center">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{activeTemplate.name}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{clientName || 'Vistoria Pro'}</p>
          </div>
          <div className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl text-lg font-black shadow-lg">
            <span className="text-xs">R$</span>{calculateTotal()}
          </div>
        </header>

        {/* GUIDED HEADER: CLIENT & VEHICLE TYPE */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="space-y-2">
             <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-4">Cliente / Empresa</label>
             <input 
               className="w-full bg-slate-50 border-none rounded-[2rem] py-5 px-8 text-slate-900 font-black text-lg focus:ring-2 focus:ring-indigo-500"
               value={clientName}
               onChange={e => setClientName(e.target.value)}
               placeholder="Ex: LK Logística, França..."
             />
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categoria do Veículo</label>
             <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'car', icon: <Car size={20}/>, label: 'Carro' },
                  { id: 'bike', icon: <Bike size={20}/>, label: 'Moto' },
                  { id: 'truck', icon: <Truck size={20}/>, label: 'Truck' },
                  { id: 'machine', icon: <Wrench size={20}/>, label: 'Máq' },
                ].map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => {
                      setVehicleType(cat.id as any);
                      setSelectedBrand('');
                      setSelectedModel('');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${vehicleType === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    {cat.icon}
                    <span className="text-[8px] font-black uppercase mt-1">{cat.label}</span>
                  </button>
                ))}
             </div>
           </div>

           {vehicleType && (
             <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Selecione a Marca</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {brandsByType[vehicleType].map(brand => (
                      <button 
                        key={brand}
                        onClick={() => {
                          setSelectedBrand(brand);
                          setSelectedModel('');
                        }}
                        className={`px-6 py-3 rounded-xl border text-[11px] font-black whitespace-nowrap transition-all ${selectedBrand === brand ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBrand && modelsByBrand[selectedBrand] && (
                  <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Selecione o Modelo</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {modelsByBrand[selectedBrand].map(model => (
                        <button 
                          key={model}
                          onClick={() => setSelectedModel(model)}
                          className={`px-6 py-3 rounded-xl border text-[11px] font-black whitespace-nowrap transition-all ${selectedModel === model ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
           )}
        </section>

        {activeTemplate.fields.map((field) => (
          <div key={field.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-5 transition-all">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-800 text-lg tracking-tight">{field.label}</h4>
                {field.type === 'date' && (
                  <button onClick={() => fillCurrentDateTime(field.id)} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md active:scale-90 transition-all"><Clock size={10} /> Agora</button>
                )}
              </div>
              
              {['ai_placa', 'ai_brand_model', 'ai_imei', 'photo'].includes(field.type) && (
                <div className="flex gap-2">
                  <button onClick={() => handleScan(field.id)} className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"><Camera size={20} /></button>
                  <button onClick={() => handleGallery(field.id)} className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"><ImageIcon size={20} /></button>
                </div>
              )}
            </div>
            
            {field.type === 'ai_placa' && fieldValues[field.id] && (
              <div className="space-y-4 animate-in zoom-in duration-300">
                <div className="flex items-center justify-center gap-2 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                   <AlertCircle size={14} className="text-indigo-600" />
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Leitura Confirmada: {fieldValues[field.id]}</span>
                </div>
                <div className="placa-mercosul shadow-2xl scale-110 my-4">
                  <div className="texto-placa uppercase">{fieldValues[field.id]}</div>
                </div>
              </div>
            )}

            {field.type === 'price' && (
              <div className="flex items-center bg-slate-50 rounded-[2rem] px-8 py-5 border border-slate-100">
                <span className="font-black text-slate-400 mr-3 text-lg">R$</span>
                <input type="number" value={fieldValues[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 font-black text-slate-900 flex-1 text-xl" placeholder="0,00" />
              </div>
            )}

            {/* SELEÇÃO INTELIGENTE (Botões de Toque Único) */}
            {(field.type === 'select' || field.type === 'select_simple') && (
              <div className="grid grid-cols-2 gap-3">
                {field.options?.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleFieldChange(field.id, opt.id)}
                    className={`flex flex-col items-center justify-center min-h-[80px] p-4 rounded-[1.8rem] font-black text-xs transition-all text-center border-2 ${fieldValues[field.id] === opt.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105 z-10' : 'bg-slate-50 text-slate-400 border-slate-50'}`}
                  >
                    <span className="uppercase tracking-tight leading-tight">{opt.label}</span>
                    {(field.type === 'select' && opt.price > 0) && (
                       <span className={`text-[8px] mt-1 px-2 py-0.5 rounded-full ${fieldValues[field.id] === opt.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>+ R${opt.price}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {field.type === 'multiselect' && (
              <div className="grid grid-cols-2 gap-3">
                {field.options?.map(opt => {
                  const selected = (fieldValues[field.id] || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const current = fieldValues[field.id] || [];
                        const next = selected ? current.filter((id: string) => id !== opt.id) : [...current, opt.id];
                        handleFieldChange(field.id, next);
                      }}
                      className={`flex flex-col items-center justify-center min-h-[80px] p-4 rounded-[1.8rem] font-black text-xs transition-all text-center border-2 ${selected ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-50'}`}
                    >
                      <span className="uppercase tracking-tight leading-tight">{opt.label}</span>
                      {opt.price > 0 && (
                        <span className={`text-[8px] mt-1 px-2 py-0.5 rounded-full ${selected ? 'bg-white/20' : 'bg-emerald-50 text-emerald-500'}`}>+ R${opt.price}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {field.type === 'boolean' && (
               <div className="flex gap-3">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => handleFieldChange(field.id, v)} className={`flex-1 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all ${fieldValues[field.id] === v ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-50 text-slate-400'}`}>
                      {v ? 'Sim / OK' : 'Não / Falha'}
                    </button>
                  ))}
               </div>
            )}

            {field.type === 'photo' && (
               <div className="space-y-4">
                  {fieldValues[field.id] ? (
                    <div className="relative animate-in zoom-in duration-300">
                      <img src={fieldValues[field.id]} className="w-full h-72 rounded-[3rem] object-cover shadow-2xl border-8 border-white" />
                      <button onClick={() => handleFieldChange(field.id, null)} className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-full shadow-lg active:scale-90 transition-all"><X size={20} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button onClick={() => handleScan(field.id)} className="flex-1 py-14 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 group">
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Camera size={32} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Câmera</span>
                      </button>
                      <button onClick={() => handleGallery(field.id)} className="flex-1 py-14 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 group">
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><ImageIcon size={32} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Galeria</span>
                      </button>
                    </div>
                  )}
               </div>
            )}

            {['text', 'number', 'date', 'ai_brand_model', 'ai_imei'].includes(field.type) && (
               <div className="relative">
                 {field.type === 'ai_brand_model' && <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />}
                 <input 
                   type={field.type === 'number' ? 'number' : field.type === 'date' ? 'datetime-local' : 'text'}
                   value={fieldValues[field.id] || ''}
                   onChange={(e) => handleFieldChange(field.id, e.target.value)}
                   className={`w-full bg-slate-50 border-none rounded-[2rem] py-5 px-8 text-slate-900 font-black focus:ring-4 focus:ring-indigo-100 transition-all ${field.type === 'ai_brand_model' ? 'pl-16' : ''}`}
                   placeholder={field.type === 'ai_brand_model' ? "Ex: VW Gol 1.0..." : "Preencher campo..."}
                 />
               </div>
            )}
          </div>
        ))}

        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={onFileChange} />
        <input ref={galleryInputRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-40 max-w-xl mx-auto">
          <button onClick={finishInspection} className="w-full py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-200 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-95 transition-all"><CheckCircle2 /> Finalizar Vistoria</button>
        </div>
      </div>
    );
  }

  // --- RENDER MENU ---
  return (
    <div className="space-y-8 pb-24 animate-slide-up max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Modelos Pro</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-1">Checklists Empresariais</p>
        </div>
        <button onClick={handleCreateTemplate} className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl active:scale-95 transition-all">
          <Plus size={32} />
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(template => (
          <div key={template.id} className={`bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6 group hover:shadow-xl transition-all border-b-8 ${template.isFavorite ? 'border-amber-400' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-2xl tracking-tighter leading-none">{template.name}</h4>
                  {template.isFavorite && <Star size={18} className="text-amber-500" fill="currentColor" />}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">{template.fields.length} itens configurados</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleDuplicateTemplate(template)} className="p-3 text-slate-300 hover:text-indigo-600 rounded-2xl transition-all"><Copy size={20} /></button>
                <button onClick={() => handleEditTemplate(template)} className="p-3 text-slate-300 hover:text-indigo-600 rounded-2xl transition-all"><Settings2 size={20} /></button>
              </div>
            </div>
            <button onClick={() => startInspection(template)} className="w-full bg-slate-50 text-slate-900 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-4"><ListChecks size={24} /> Iniciar Vistoria</button>
          </div>
        ))}
        <button onClick={handleCreateTemplate} className="border-4 border-dashed border-slate-200 rounded-[3.5rem] p-12 flex flex-col items-center justify-center gap-3 text-slate-300 hover:text-indigo-400 hover:border-indigo-200 transition-all active:scale-95 group">
           <div className="p-6 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform"><Plus size={48} /></div>
           <span className="font-black text-xs uppercase tracking-widest">Criar Checklist</span>
        </button>
      </section>

      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[4rem] text-center space-y-6 animate-in zoom-in duration-300 shadow-2xl">
            <div className="relative">
               <Loader2 className="w-20 h-20 text-indigo-600 animate-spin mx-auto" />
               <Scan className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Analisando Dados...</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Extraindo placa e veículo via IA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
