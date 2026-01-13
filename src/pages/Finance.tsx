
import React, { useEffect, useState } from 'react';
import { 
  Wallet,
  FileSpreadsheet,
  FileText,
  X,
  ChevronRight,
  Calendar,
  Clock,
  Car,
  Star,
  Printer,
  TrendingUp,
  Building2,
  ListFilter,
  CheckCircle2,
  LayoutList,
  Search,
  Download,
  Share2
} from 'lucide-react';
import { storage } from '../services/storage';
import { ServiceOrder } from '../types';

interface CompanyGroup {
  clientName: string;
  totalValue: number;
  totalServices: number;
  lastActivity: string;
  orders: ServiceOrder[];
}

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'individual'>('companies');
  const [groupedCompanies, setGroupedCompanies] = useState<CompanyGroup[]>([]);
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyGroup | null>(null);

  useEffect(() => {
    const orders: ServiceOrder[] = storage.getOrders();
    const completedOrders = orders.filter(o => o.status === 'completed').reverse();
    setAllOrders(completedOrders);
    
    const revenue = completedOrders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
    setTotalRevenue(revenue);

    const companies: Record<string, CompanyGroup> = {};
    completedOrders.forEach(order => {
      const key = order.clientName || 'Cliente Direto';
      if (!companies[key]) {
        companies[key] = {
          clientName: key,
          totalValue: 0,
          totalServices: 0,
          lastActivity: order.date,
          orders: []
        };
      }
      companies[key].totalValue += order.totalValue || 0;
      companies[key].totalServices += 1;
      companies[key].orders.push(order);
    });

    setGroupedCompanies(Object.values(companies).sort((a, b) => b.totalValue - a.totalValue));
  }, []);

  const exportToExcel = (order: ServiceOrder) => {
    const headers = "Campo,Valor\n";
    const rows = order.fields.map(f => `"${f.label}","${f.value === true ? 'SIM' : f.value === false ? 'NÃO' : f.value || '-'}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Vistoria_${order.vehicle.placa}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 pb-40 animate-slide-up max-w-7xl mx-auto px-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 px-2 gap-6">
        <div>
           <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">Faturamento Pro</h2>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Gestão Estratégica de Receita</p>
        </div>
        <div className="flex bg-white p-2 rounded-[1.8rem] shadow-sm border border-slate-100 w-full sm:w-auto self-start">
           <button 
             onClick={() => setActiveTab('companies')}
             className={`flex-1 sm:px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'companies' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
           >
             Empresas
           </button>
           <button 
             onClick={() => setActiveTab('individual')}
             className={`flex-1 sm:px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
           >
             Individual
           </button>
        </div>
      </header>

      {/* Card de Faturamento Total */}
      <section className="bg-slate-900 p-12 sm:p-16 rounded-[4rem] text-center space-y-4 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-10 text-white group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
         </div>
         <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.4em] relative z-10">Volume Financeiro Total</span>
         <h2 className="text-5xl sm:text-7xl font-black text-white relative z-10">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
         <div className="pt-6 relative z-10">
            <span className="px-6 py-2 bg-white/10 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">{allOrders.length} Vistorias Processadas</span>
         </div>
      </section>

      {activeTab === 'companies' ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {groupedCompanies.map((company, i) => (
            <div key={i} onClick={() => setSelectedCompany(company)} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all">
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Building2 size={28}/></div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl leading-none tracking-tight">{company.clientName}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 block">{company.totalServices} Vistorias Realizadas</span>
                  </div>
               </div>
               <div className="text-right">
                  <span className="block font-black text-indigo-600 text-2xl">R$ {company.totalValue.toLocaleString('pt-BR')}</span>
               </div>
            </div>
          ))}
          {groupedCompanies.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Nenhum dado empresarial encontrado</p>
            </div>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {allOrders.map((order, i) => (
            <div key={i} onClick={() => setSelectedOrder(order)} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all">
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><Car size={28}/></div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-xl leading-none tracking-tight truncate">{order.vehicle?.placa || 'SEM PLACA'}</h4>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-2 block truncate">{order.clientName}</span>
                  </div>
               </div>
               <div className="text-right shrink-0">
                  <span className="block font-black text-emerald-600 text-xl">R$ {order.totalValue.toLocaleString('pt-BR')}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{new Date(order.date).toLocaleDateString()}</span>
               </div>
            </div>
          ))}
        </section>
      )}

      {/* Modal: Relatório Individual Pro */}
      {(selectedOrder || selectedCompany) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#f3f4f6] w-full max-w-2xl rounded-[3.5rem] p-8 sm:p-12 max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 animate-in zoom-in duration-300">
             <header className="flex items-center justify-between mb-2 px-2">
                <div className="flex gap-4">
                  {selectedOrder && (
                    <>
                      <button onClick={() => exportToExcel(selectedOrder)} className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all"><Download size={24}/></button>
                      <button className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all"><Share2 size={24}/></button>
                    </>
                  )}
                </div>
                <button onClick={() => { setSelectedOrder(null); setSelectedCompany(null); }} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm hover:text-rose-500 active:scale-95 transition-all"><X size={24}/></button>
             </header>

             {selectedOrder ? (
               <div className="space-y-4">
                 <div className="bg-white p-10 rounded-[3rem] shadow-sm mb-6 flex flex-col items-center text-center space-y-2 border border-slate-100">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Comprovante Pro de Vistoria</span>
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedOrder.vehicle.placa}</h3>
                   <div className="pt-4 flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Ref: #{selectedOrder.id.slice(-6)}</span>
                      <span>•</span>
                      <span>{new Date(selectedOrder.date).toLocaleDateString()}</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {selectedOrder.fields.map((f, i) => (
                     <div key={i} className="bg-white px-8 py-6 rounded-[2rem] shadow-sm flex justify-between items-center group">
                        <span className="font-black text-slate-700 text-sm leading-tight max-w-[60%]">{f.label}</span>
                        <div className="text-right">
                           {f.type === 'photo' && f.value ? (
                             <img src={f.value} className="w-14 h-14 rounded-2xl object-cover border-4 border-slate-50 shadow-md" />
                           ) : (
                             <span className="font-black text-indigo-600 uppercase text-[10px] bg-indigo-50 px-4 py-2 rounded-xl">
                               {f.value === true ? 'SIM' : f.value === false ? 'NÃO' : String(f.value || '-')}
                             </span>
                           )}
                        </div>
                     </div>
                   ))}
                 </div>

                 <div className="pt-10 flex flex-col gap-4">
                    <button onClick={() => window.print()} className="w-full h-20 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-indigo-700">
                        <Printer size={24}/> IMPRIMIR RELATÓRIO PRO
                    </button>
                 </div>
               </div>
             ) : selectedCompany && (
                <div className="space-y-6">
                   <div className="bg-white p-10 rounded-[3rem] shadow-sm text-center mb-8 border border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">Relatório Consolidado</span>
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCompany.clientName}</h4>
                      <div className="mt-4 inline-flex px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedCompany.totalServices} Serviços Concluídos</div>
                   </div>
                   
                   <div className="space-y-3">
                     <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Histórico Recente</h5>
                     {selectedCompany.orders.map((order, i) => (
                       <div key={i} className="px-8 py-6 bg-white rounded-[2.5rem] shadow-sm flex justify-between items-center group hover:bg-indigo-50 transition-colors cursor-pointer">
                          <div>
                             <p className="font-black text-slate-800 uppercase text-lg leading-none">{order.vehicle.placa}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{new Date(order.date).toLocaleDateString()} • {order.templateName}</p>
                          </div>
                          <p className="font-black text-indigo-600 text-xl">R$ {order.totalValue}</p>
                       </div>
                     ))}
                   </div>

                   <div className="bg-slate-900 p-10 rounded-[3rem] text-center mt-12 shadow-2xl">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-2">Total do Faturamento</p>
                      <p className="text-5xl font-black text-white">R$ {selectedCompany.totalValue.toLocaleString('pt-BR')}</p>
                   </div>
                   
                   <button onClick={() => window.print()} className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-black">
                      <Printer size={24}/> GERAR FATURA EMPRESARIAL
                   </button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
