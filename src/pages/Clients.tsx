
import React from 'react';
import { Search, UserPlus, Phone, MessageSquare, ChevronRight } from 'lucide-react';

const Clients: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
        <button className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all">
          <UserPlus size={24} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou placa..."
          className="w-full bg-white border-none rounded-3xl py-4 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
        />
      </div>

      <div className="space-y-3">
        {[
          { name: 'Ricardo Martins', vehicle: 'Honda Civic', inspections: 3 },
          { name: 'Fernanda Lima', vehicle: 'Jeep Compass', inspections: 1 },
          { name: 'Carlos Mendes', vehicle: 'Ford Ranger', inspections: 2 },
          { name: 'Patrícia Oliveira', vehicle: 'VW Polo', inspections: 5 },
        ].map((client, i) => (
          <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-all">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
              {client.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">{client.name}</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{client.vehicle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-emerald-500 bg-emerald-50 rounded-xl">
                <MessageSquare size={18} />
              </button>
              <button className="p-2 text-indigo-500 bg-indigo-50 rounded-xl">
                <Phone size={18} />
              </button>
              <ChevronRight className="text-slate-200 ml-2" size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clients;
