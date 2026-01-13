
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
  Monitor,
  Eye,
  EyeOff,
  ListChecks as ListIcon,
  CheckSquare,
  Smartphone,
  Binary
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
  
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'truck' | 'machine' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanningFieldId, setScanningFieldId] = useState<string | null>(null);

  // Drag and Drop States
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const ts = storage.getTemplates();
    setTemplates(ts);
    if (templateId) {
      const found = ts.find(t => t.id === templateId);
      if (found) startInspection(found);
    }
  }, [templateId]);

  const handleCreateTemplate = () => {
    setActiveTemplate({ id: Date.now().toString(), name: '', description: '', fields: [], isFavorite: false });
    setView('builder');
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    setActiveTemplate(JSON.parse(JSON.stringify(template)));
    setView('builder');
  };

  const handleDuplicateTemplate = (e: React.MouseEvent, tId: string) => {
    e.stopPropagation();
    storage.duplicateTemplate(tId);
    setTemplates(storage.getTemplates());
    alert("Modelo duplicado com sucesso!");
  };

  const handleToggleFavorite = (e: React.MouseEvent, tId: string) => {
    e.stopPropagation();
    storage.toggleFavorite(tId);
    setTemplates(storage.getTemplates());
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    const [movedItem] = newFields.splice(index, 1);
    newFields.splice(targetIndex, 0, movedItem);
    
    setActiveTemplate({
      ...activeTemplate,
      fields: newFields
    });
  };

  // Field Drag and Drop
  const onFieldDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const onFieldDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    const [draggedItem] = newFields.splice(draggedItemIndex, 1);
    newFields.splice(index, 0, draggedItem);
    
    setActiveTemplate({ ...activeTemplate, fields: newFields });
    setDraggedItemIndex(index);
  };

  // Template Drag and Drop
  const onTemplateDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const onTemplateDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newTemplates = [...templates];
    const [draggedItem] = newTemplates.splice(draggedItemIndex, 1);
    newTemplates.splice(index, 0, draggedItem);
    
    setTemplates(newTemplates);
    setDraggedItemIndex(index);
  };

  const onTemplateDragEnd = () => {
    setDraggedItemIndex(null);
    storage.set('templates', templates);
  };

  const startInspection = (template: ChecklistTemplate) => {
    setActiveTemplate(JSON.parse(JSON.stringify(template)));
    setFieldValues({});
    setClientName('');
    setVehicleType(null);
    setSelectedBrand('');
    setSelectedModel('');
    setView('runner');
  };

  const saveTemplate = () => {
    if (!activeTemplate?.name) return alert("Dê um nome ao modelo.");
    storage.saveTemplate(activeTemplate);
    setTemplates(storage.getTemplates());
    setView('menu');
  };

  const finishInspection = () => {
    if (!activeTemplate || !clientName) return alert("Informe o cliente.");
    
    try {
      const order: ServiceOrder = {
        id: Date.now().toString(),
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
        clientName: clientName,
        vehicle: { 
          placa: String(fieldValues['ai_placa'] || ''), 
          marca: selectedBrand || '', 
          modelo: selectedModel || String(fieldValues['ai_brand_model'] || ''), 
          imei: Array.isArray(fieldValues['ai_imei']) ? fieldValues['ai_imei'] : [String(fieldValues['ai_imei'] || '')]
        },
        fields: activeTemplate.fields.map(f => ({ ...f, value: fieldValues[f.id] })),
        totalValue: calculateTotal(),
        status: 'completed',
        date: new Date().toISOString()
      };
      
      storage.saveOrder(order);
      navigate('/');
    } catch (e) {
      alert("Erro ao salvar vistoria.");
    }
  };

  const calculateTotal = () => {
    if (!activeTemplate) return 0;
    return activeTemplate.fields.reduce((acc, f) => {
      if (f.type === 'price') return acc + (Number(fieldValues[f.id]) || 0);
      if (f.type === 'select' && f.options) {
        const opt = f.options.find(o => o.id === fieldValues[f.id]);
        return acc + (opt?.price || 0);
      }
      if (f.type === 'multiselect' && f.options && Array.isArray(fieldValues[f.id])) {
        const selectedIds = fieldValues[f.id] as string[];
        const sum = f.options.filter(o => selectedIds.includes(o.id)).reduce((s, o) => s + (o.price || 0), 0);
        return acc + sum;
      }
      return acc;
    }, 0);
  };

  const handleFieldChange = (id: string, val: any) => setFieldValues(p => ({ ...p, [id]: val }));

  const addField = (type: FieldType, label: string) => {
    if (!activeTemplate) return;
    const newField: ChecklistField = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      label: label,
      type: type,
      required: true,
      options: ['select', 'select_simple', 'multiselect'].includes(type) ? [{ id: Date.now().toString(), label: 'Opção 1', price: 0 }] : undefined
    };
    setActiveTemplate({
      ...activeTemplate,
      fields: [...activeTemplate.fields, newField]
    });
    setEditingFieldId(newField.id);
  };

  const removeField = (id: string) => {
    if (!activeTemplate) return;
    setActiveTemplate({
      ...activeTemplate,
      fields: activeTemplate.fields.filter(f => f.id !== id)
    });
  };

  const addOption = (fieldIndex: number) => {
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    const field = newFields[fieldIndex];
    const newOption: FieldOption = { id: Date.now().toString(), label: `Opção ${(field.options?.length || 0) + 1}`, price: 0 };
    field.options = [...(field.options || []), newOption];
    setActiveTemplate({...activeTemplate, fields: newFields});
  };

  const removeOption = (fieldIndex: number, optionId: string) => {
    if (!activeTemplate) return;
    const newFields = [...activeTemplate.fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options?.filter(o => o.id !== optionId);
    setActiveTemplate({...activeTemplate, fields: newFields});
  };

  const loadPreset = (fieldIndex: number, presetType: string) => {
    if (!activeTemplate) return;
    const presets: Record<string, string[]> = {
      types: ['Carro Passeio', 'Picape / SUV', 'VUC', 'Toco', 'Truck', 'Cavalo Mecânico', 'Moto', 'Máquina'],
      cars: ['Toyota', 'Volkswagen', 'Ford', 'Fiat', 'Chevrolet', 'Honda', 'Hyundai', 'Jeep'],
      truck_brands: ['Mercedes-Benz', 'Volvo', 'Scania', 'Volkswagen', 'Iveco', 'DAF'],
      truck_models: ['Volvo FH 540', 'Scania R 450', 'VW Constellation', 'MB Actros']
    };
    
    const labels = presets[presetType] || [];
    const newFields = [...activeTemplate.fields];
    newFields[fieldIndex].options = labels.map(l => ({ id: Math.random().toString(36).substr(2, 9), label: l, price: 0 }));
    setActiveTemplate({...activeTemplate, fields: newFields});
  };

  const handleScan = (fieldId: string) => {
    setScanningFieldId(fieldId);
    fileInputRef.current?.click();
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

  const renderTextFeedback = (field: ChecklistField) => {
    const val = fieldValues[field.id];
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) return null;
    let label = '';
    if (field.type === 'select' || field.type === 'select_simple') {
      label = field.options?.find(o => o.id === val)?.label || '';
    } else if (field.type === 'multiselect' && Array.isArray(val)) {
      label = val.map(id => field.options?.find(o => o.id === id)?.label).join(', ');
    } else if (field.type === 'boolean') {
      label = val ? 'SIM / OK' : 'NÃO / FALHA';
    } else if (field.type === 'photo') {
      label = 'FOTO REGISTRADA';
    } else {
      label = String(val);
    }

    return (
      <div className="mt-2 px-5 py-2 bg-[#EEF2FF] rounded-[1.2rem] border-l-[6px] border-[#818CF8] animate-fade-in shadow-sm">
        <span className="text-[10px] font-black text-[#818CF8] uppercase tracking-[0.15em] block mb-0.5">Escrito:</span>
        <span className="text-sm font-black text-[#4F46E5] uppercase">{label}</span>
      </div>
    );
  };

  const builderComponents: { type: FieldType; label: string; icon: React.ReactNode }[] = [
    { type: 'select_simple', label: 'Seleção Simples', icon: <LayoutList size={22} /> },
    { type: 'select', label: 'Seleção (+ Preço)', icon: <Package size={22} /> },
    { type: 'multiselect', label: 'Múltipla (+ Preço)', icon: <CheckSquare size={22} /> },
    { type: 'ai_brand_model', label: 'Veículo (IA)', icon: <Car size={22} /> },
    { type: 'ai_placa', label: 'Placa (Scanner IA)', icon: <Hash size={22} /> },
    { type: 'photo', label: 'Foto', icon: <Camera size={22} /> },
    { type: 'date', label: 'Data/Hora', icon: <Calendar size={22} /> },
    { type: 'boolean', label: 'OK / Falha', icon: <ToggleLeft size={22} /> },
    { type: 'text', label: 'Texto', icon: <FileText size={22} /> },
    { type: 'number', label: 'Número', icon: <Binary size={22} /> },
    { type: 'ai_imei', label: 'IMEI (IA)', icon: <Monitor size={22} /> },
    { type: 'price', label: 'Preço Manual', icon: <DollarSign size={22} /> },
  ];

  if (view === 'builder' && activeTemplate) {
    return (
      <div className="space-y-6 pb-40 animate-slide-up max-w-4xl mx-auto px-2">
        <header className="flex items-center justify-between py-4 sticky top-0 bg-slate-50/90 backdrop-blur-md z-50 px-2">
           <button onClick={() => setView('menu')} className="p-4 bg-white text-slate-500 rounded-[1.5rem] shadow-sm border border-slate-100 active:scale-90"><ChevronLeft size={24} /></button>
           <button onClick={saveTemplate} className="bg-indigo-600 text-white px-8 h-14 rounded-[1.5rem] font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all text-sm uppercase tracking-widest">Salvar Modelo</button>
        </header>

        <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-2">
           <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Título do Checklist Profissional</label>
           <input type="text" value={activeTemplate.name} onChange={e => setActiveTemplate({...activeTemplate, name: e.target.value})} className="w-full text-2xl sm:text-3xl font-black bg-slate-50/50 rounded-[2rem] border-none p-6 mt-2 outline-none focus:ring-4 focus:ring-indigo-100 shadow-inner" placeholder="Ex: Vistoria Pro 4.0" />
        </div>

        <div className="space-y-4 px-2">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Estrutura de Campos (Arraste para reordenar)</h3>
           {activeTemplate.fields.map((field, i) => (
             <div 
               key={field.id} 
               draggable
               onDragStart={() => onFieldDragStart(i)}
               onDragOver={(e) => onFieldDragOver(e, i)}
               onDragEnd={() => setDraggedItemIndex(null)}
               className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden cursor-move ${editingFieldId === field.id ? 'border-indigo-400 shadow-md ring-8 ring-indigo-50/50' : 'border-slate-100 shadow-sm'} ${draggedItemIndex === i ? 'opacity-40 scale-95' : ''}`}
             >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="text-slate-300 bg-slate-50 p-3 rounded-2xl">
                       <GripVertical size={20} />
                     </div>
                     <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">{i+1}</div>
                     <div>
                        <p className="font-black text-slate-800 text-lg leading-tight">{field.label}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{field.type.toUpperCase().replace('_', ' ')}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)} className={`p-4 rounded-2xl transition-all ${editingFieldId === field.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}><Edit3 size={18} /></button>
                    <button onClick={() => removeField(field.id)} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>

                {editingFieldId === field.id && (
                  <div className="px-8 pb-10 pt-2 space-y-8 bg-white animate-fade-in border-t border-slate-50">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo / Pergunta</label>
                      <input className="w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] py-5 px-6 font-bold text-slate-800 text-lg shadow-inner focus:ring-4 focus:ring-indigo-100 transition-all outline-none" value={field.label} onChange={(e) => {
                        const newFields = [...activeTemplate.fields];
                        newFields[i].label = e.target.value;
                        setActiveTemplate({...activeTemplate, fields: newFields});
                      }} />
                    </div>

                    {['select', 'select_simple', 'multiselect'].includes(field.type) && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Preenchimento Inteligente (Presets)</label>
                           <div className="flex flex-wrap gap-2">
                              <button onClick={() => loadPreset(i, 'types')} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-indigo-50 transition-all"><LayoutList size={14}/> Tipos</button>
                              <button onClick={() => loadPreset(i, 'cars')} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-indigo-100 transition-all"><Car size={14}/> Carros</button>
                              <button onClick={() => loadPreset(i, 'truck_brands')} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-emerald-100 transition-all"><Truck size={14}/> Marcas</button>
                           </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opções do Item</label>
                           <button onClick={() => addOption(i)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-xl uppercase tracking-widest active:scale-95 hover:bg-indigo-100 transition-all">
                              <PlusCircle size={16}/> Add Opção
                           </button>
                        </div>

                        <div className="space-y-3">
                           {field.options?.map((opt, optIdx) => (
                             <div key={opt.id} className="flex gap-3 items-center group">
                                <input 
                                  className="flex-1 bg-slate-50 border-none rounded-[1.5rem] py-4 px-6 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner" 
                                  value={opt.label} 
                                  onChange={(e) => {
                                    const newFields = [...activeTemplate.fields];
                                    if(newFields[i].options) newFields[i].options![optIdx].label = e.target.value;
                                    setActiveTemplate({...activeTemplate, fields: newFields});
                                  }}
                                />
                                {['select', 'multiselect'].includes(field.type) && (
                                   <div className="flex items-center bg-slate-50 rounded-[1.5rem] px-4 w-36 border border-transparent focus-within:border-indigo-200 transition-all shadow-inner">
                                      <span className="text-[10px] font-black text-indigo-300 mr-2">R$</span>
                                      <input 
                                        type="number" 
                                        className="w-full bg-transparent border-none py-4 p-0 text-sm font-black text-indigo-600 outline-none" 
                                        value={opt.price} 
                                        onChange={(e) => {
                                          const newFields = [...activeTemplate.fields];
                                          if(newFields[i].options) newFields[i].options![optIdx].price = Number(e.target.value);
                                          setActiveTemplate({...activeTemplate, fields: newFields});
                                        }}
                                      />
                                   </div>
                                )}
                                <button onClick={() => removeOption(i, opt.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><X size={20}/></button>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-slate-50">
                       <label className="flex items-center gap-4 cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-all">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              checked={field.required} 
                              onChange={(e) => {
                                const newFields = [...activeTemplate.fields];
                                newFields[i].required = e.target.checked;
                                setActiveTemplate({...activeTemplate, fields: newFields});
                              }} 
                              className="peer h-10 w-10 appearance-none rounded-2xl border-2 border-slate-100 bg-white transition-all checked:bg-indigo-600 checked:border-indigo-600" 
                            />
                            <Check className="absolute top-2.5 left-2.5 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">Campo Obrigatório</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Este item deve ser preenchido para finalizar</span>
                          </div>
                       </label>
                    </div>
                  </div>
                )}
             </div>
           ))}
        </div>

        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 px-4 sm:px-12">
           <div className="text-center">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Inserir Novo Componente</h3>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {builderComponents.map(comp => (
                <button 
                  key={comp.type} 
                  onClick={() => addField(comp.type, comp.label)} 
                  className="bg-white border border-slate-100 py-10 px-4 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:border-indigo-200 hover:shadow-2xl hover:-translate-y-2 transition-all active:scale-95"
                >
                  <div className="text-slate-300 group-hover:text-indigo-500 transition-all scale-125 mb-2">
                    {comp.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 text-center leading-tight uppercase tracking-tight">{comp.label}</span>
                </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (view === 'runner' && activeTemplate) {
    return (
      <div className="space-y-6 pb-48 animate-slide-up max-w-2xl mx-auto px-2">
        <header className="flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-md py-4 z-50 px-4">
          <button onClick={() => setView('menu')} className="p-4 bg-white text-slate-500 rounded-[1.5rem] shadow-sm border border-slate-100 active:scale-90"><ChevronLeft size={24} /></button>
          <div className="bg-[#D1FAE5] text-[#059669] px-8 py-4 rounded-[1.8rem] text-2xl font-black shadow-lg shadow-emerald-100 border border-[#A7F3D0]">R$ {calculateTotal().toLocaleString('pt-BR')}</div>
        </header>

        <section className="bg-white p-8 sm:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
           <div className="space-y-3">
             <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-4">Nome do Cliente / Empresa Responsável</label>
             <input className="w-full bg-[#F8FAFC] border-none rounded-[2rem] py-6 px-10 text-slate-900 font-black text-2xl focus:ring-4 focus:ring-indigo-100 outline-none shadow-inner" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Cliente..." />
             {clientName && (
                <div className="px-8 py-3 bg-[#EEF2FF] rounded-[1.5rem] border-l-[8px] border-[#818CF8] text-[11px] font-black text-[#4F46E5] uppercase shadow-sm">Cliente Ativo: {clientName}</div>
             )}
           </div>
        </section>

        <div className="space-y-6 px-1">
          {activeTemplate.fields.map((field) => (
            <div key={field.id} className="bg-white p-8 sm:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between px-2">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{field.type.replace('ai_', 'INTELIGÊNCIA ')}</span>
                    <h4 className="font-black text-slate-800 text-2xl tracking-tight leading-tight">{field.label}</h4>
                 </div>
                 {['ai_placa', 'photo', 'ai_imei', 'ai_brand_model'].includes(field.type) && <button onClick={() => handleScan(field.id)} className="w-16 h-16 text-indigo-600 bg-white border border-slate-100 shadow-xl rounded-[1.5rem] active:scale-90 transition-all flex items-center justify-center hover:bg-indigo-50"><Camera size={28} /></button>}
              </div>

              {field.type === 'ai_placa' && fieldValues[field.id] && (
                 <div className="placa-mercosul shadow-2xl scale-125 my-12 animate-in zoom-in"><div className="texto-placa">{fieldValues[field.id]}</div></div>
              )}

              {field.type === 'multiselect' && field.options && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {field.options.map(opt => {
                     const selected = Array.isArray(fieldValues[field.id]) && fieldValues[field.id].includes(opt.id);
                     return (
                      <button 
                        key={opt.id} 
                        onClick={() => {
                          const current = Array.isArray(fieldValues[field.id]) ? fieldValues[field.id] : [];
                          const next = current.includes(opt.id) ? current.filter(id => id !== opt.id) : [...current, opt.id];
                          handleFieldChange(field.id, next);
                        }}
                        className={`flex flex-col items-center justify-center min-h-[110px] p-6 rounded-[2rem] font-black text-sm transition-all border-4 ${selected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-transparent hover:border-indigo-100'}`}
                      >
                        <span className="uppercase text-center leading-tight tracking-tight">{opt.label}</span>
                        {opt.price > 0 && <span className={`text-[10px] mt-2 px-4 py-1.5 rounded-full font-black ${selected ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>+ R${opt.price}</span>}
                      </button>
                     );
                   })}
                 </div>
              )}

              {field.type === 'boolean' && (
                 <div className="flex flex-col sm:flex-row gap-4">
                    {[true, false].map(v => (
                      <button key={String(v)} onClick={() => handleFieldChange(field.id, v)} className={`flex-1 h-[70px] rounded-[1.8rem] font-black text-xs tracking-[0.2em] transition-all shadow-sm flex items-center justify-center gap-3 ${fieldValues[field.id] === v ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>
                        {v ? <CheckCircle2 size={20}/> : <X size={20}/>}
                        {v ? 'SIM / OK' : 'NÃO / FALHA'}
                      </button>
                    ))}
                 </div>
              )}

              {['text', 'date', 'price', 'number', 'ai_imei', 'ai_brand_model'].includes(field.type) && (
                <div className="bg-slate-50/50 rounded-[2rem] p-1 shadow-inner border border-slate-100">
                  <input 
                    type={field.type === 'price' || field.type === 'number' ? 'number' : field.type === 'date' ? 'datetime-local' : 'text'} 
                    value={fieldValues[field.id] || ''} 
                    onChange={e => handleFieldChange(field.id, e.target.value)} 
                    className="w-full bg-transparent p-6 font-black border-none text-2xl text-slate-800 outline-none text-center placeholder:text-slate-300" 
                    placeholder={field.type === 'price' ? '0,00' : 'Preencha aqui...'}
                  />
                </div>
              )}

              {field.type === 'photo' && fieldValues[field.id] && <div className="relative group/photo"><img src={fieldValues[field.id]} className="w-full h-80 rounded-[3rem] object-cover border-8 border-white shadow-2xl transition-all group-hover/photo:scale-[1.02]" /><button onClick={() => handleFieldChange(field.id, null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl text-rose-500 shadow-xl"><Trash2 size={20}/></button></div>}
              
              {(field.type === 'select' || field.type === 'select_simple') && field.options && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {field.options.map(opt => {
                      const selected = fieldValues[field.id] === opt.id;
                      return (
                        <button 
                          key={opt.id} 
                          onClick={() => handleFieldChange(field.id, opt.id)}
                          className={`flex flex-col items-center justify-center min-h-[90px] p-6 rounded-[2rem] font-black text-sm transition-all border-4 ${selected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-indigo-100'}`}
                        >
                          <span className="uppercase text-center leading-tight tracking-tight">{opt.label}</span>
                          {(field.type === 'select' && opt.price > 0) && <span className={`text-[10px] mt-2 px-4 py-1.5 rounded-full font-black ${selected ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>+ R${opt.price}</span>}
                        </button>
                      )
                    })}
                 </div>
              )}

              {renderTextFeedback(field)}
            </div>
          ))}
        </div>

        <input ref={fileInputRef} type="file" className="hidden" capture="environment" onChange={onFileChange} />
        
        <div className="fixed bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-[70] max-w-4xl mx-auto flex justify-center">
          <button onClick={finishInspection} className="w-full h-[80px] rounded-[2.5rem] bg-[#4F46E5] text-white font-black shadow-[0_30px_60px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 text-xl animate-slide-up hover:bg-[#4338ca]">
            <CheckCircle2 size={32} /> CONCLUIR VISTORIA PRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-slide-up max-w-7xl mx-auto px-4">
      <header className="flex items-center justify-between py-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">Modelos de Vistoria</h2>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Clique e arraste para organizar</p>
        </div>
        <button onClick={handleCreateTemplate} className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center hover:bg-indigo-700"><Plus size={36} strokeWidth={3} /></button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((t, i) => (
          <div 
            key={t.id} 
            draggable
            onDragStart={() => onTemplateDragStart(i)}
            onDragOver={(e) => onTemplateDragOver(e, i)}
            onDragEnd={onTemplateDragEnd}
            className={`bg-white p-8 sm:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[340px] hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-move ${draggedItemIndex === i ? 'opacity-40 scale-95' : ''}`}
          >
            <div className="space-y-6">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{t.fields.length} Itens</span>
                    <h4 className="font-black text-slate-800 text-2xl tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors mt-2">{t.name || 'Sem nome'}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => handleToggleFavorite(e, t.id)} className={`p-4 bg-slate-50 rounded-2xl border border-transparent active:scale-90 transition-all ${t.isFavorite ? 'text-amber-500 bg-amber-50 shadow-inner' : 'text-slate-300 hover:text-amber-400 hover:bg-white'}`}>
                      <Star size={20} fill={t.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button onClick={(e) => handleDuplicateTemplate(e, t.id)} title="Duplicar modelo" className="p-4 bg-slate-50 text-slate-300 rounded-2xl border border-transparent hover:text-emerald-500 hover:bg-white active:scale-90 transition-all">
                      <Copy size={20} />
                    </button>
                    <button onClick={() => handleEditTemplate(t)} className="p-4 bg-slate-50 text-slate-300 rounded-2xl border border-transparent hover:text-indigo-600 hover:bg-white active:scale-90 transition-all"><Settings2 size={20}/></button>
                  </div>
               </div>
               <div className="w-full h-24 bg-slate-50/50 rounded-[2rem] flex items-center justify-center group-hover:bg-indigo-50/30 transition-colors border border-dashed border-slate-200">
                  <LayoutList size={40} className="text-slate-200 group-hover:text-indigo-100 transition-colors" />
               </div>
            </div>

            <button onClick={() => startInspection(t)} className="mt-10 w-full h-[70px] bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-4">
              <ListIcon size={20} /> INICIAR VISTORIA PRO
            </button>
          </div>
        ))}

        <button onClick={handleCreateTemplate} className="bg-slate-50/30 border-4 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-slate-300 hover:text-indigo-400 hover:border-indigo-200 hover:bg-white transition-all active:scale-[0.98] min-h-[340px]">
           <Plus size={54} strokeWidth={3} />
           <span className="mt-6 font-black uppercase tracking-[0.3em] text-xs">Criar Novo Modelo</span>
        </button>
      </div>
      
      {isAnalyzing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white p-14 sm:p-20 rounded-[4rem] text-center space-y-8 animate-in zoom-in duration-300 shadow-2xl">
             <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 rounded-full border-[6px] border-indigo-100"></div>
                <div className="absolute inset-0 rounded-full border-[6px] border-indigo-600 border-t-transparent animate-spin"></div>
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Análise de IA Ativa</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Sincronizando dados periciais...</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
