
import React, { useEffect, useState } from 'react';
import { 
  Wallet,
  FileSpreadsheet,
  FileText,
  Share2,
  ArrowRight,
  X,
  ChevronRight,
  Calendar,
  Clock,
  Car,
  Star,
  Download,
  Printer,
  TrendingUp,
  LayoutGrid,
  ChevronDown,
  Building2,
  ListFilter,
  // Added missing CheckCircle2 import
  CheckCircle2
} from 'lucide-react';
import { storage } from '../services/storage';
import { ServiceOrder } from '../types';

interface ServiceGroup {
  templateName: string;
  count: number;
  total: number;
  orders: ServiceOrder[];
}

interface CompanyGroup {
  clientName: string;
  totalValue: number;
  totalServices: number;
  lastActivity: string;
  services: Record<string, ServiceGroup>;
}

const Finance: React.FC = () => {
  const [groupedCompanies, setGroupedCompanies] = useState<CompanyGroup[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<CompanyGroup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const orders: ServiceOrder[] = storage.getOrders();
    // Professional Rule: Only completed orders are accounted
    const completedOrders = orders.filter(o => o.status === 'completed');
    
    const revenue = completedOrders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
    setTotalRevenue(revenue);

    const companies: Record<string, CompanyGroup> = {};

    completedOrders.forEach(order => {
      const companyKey = order.clientName || 'Cliente Direto';
      
      if (!companies[companyKey]) {
        companies[companyKey] = {
          clientName: companyKey,
          totalValue: 0,
          totalServices: 0,
          lastActivity: order.date,
          services: {}
        };
      }

      const comp = companies[companyKey];
      comp.totalValue += order.totalValue || 0;
      comp.totalServices += 1;
      if (new Date(order.date) > new Date(comp.lastActivity)) {
        comp.lastActivity = order.date;
      }

      const serviceKey = order.templateName;
      if (!comp.services[serviceKey]) {
        comp.services[serviceKey] = {
          templateName: serviceKey,
          count: 0,
          total: 0,
          orders: []
        };
      }

      const serv = comp.services[serviceKey];
      serv.count += 1;
      serv.total += order.totalValue || 0;
      serv.orders.push(order);
    });

    setGroupedCompanies(Object.values(companies).sort((a, b) => b.totalValue - a.totalValue));
  }, []);

  const exportToExcel = (company: CompanyGroup) => {
    const headers = "Data,Placa,Serviço,Valor Unitário (R$)\n";
    const rows = (Object.values(company.services) as ServiceGroup[]).flatMap(s => 
      s.orders.map(o => {
        const date = new Date(o.date).toLocaleDateString('pt-BR');
        const placa = o.vehicle?.placa || 'SEM PLACA';
        return `${date},${placa},${o.templateName},${o.totalValue}`;
      })
    ).join("\n");
    
    const footer = `\nTOTAL GERAL DO CLIENTE,,,${company.totalValue}`;
    const blob = new Blob(["\ufeff" + headers + rows + footer], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Faturamento_${company.clientName}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleOpenDetail = (company: CompanyGroup) => {
    setSelectedCompany(company);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-8 pb-40 animate-slide-up max-w-4xl mx-auto px-2">
      {/* Header Fixo */}
      <header className="flex items-center justify-between pt-4 px-4 print:hidden">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios Pro</h2>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Faturamento Consolidado</p>
        </div>
        <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100 text-indigo-600">
           <TrendingUp size={24} />
        </div>
      </header>

      {/* Card de Resumo Geral */}
      <section className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl shadow-indigo-200/20 text-center space-y-3 relative overflow-hidden print:hidden mx-2">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet size={120} className="text-white" />
         </div>
         <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.3em] relative z-10">Montante Total Realizado</span>
         <div className="flex items-center justify-center gap-3 relative z-10">
            <span className="text-indigo-400 text-2xl font-black">R$</span>
            <h2 className="text-6xl font-black text-white tracking-tighter">
              {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
         </div>
         <div className="flex gap-3 justify-center mt-6 relative z-10">
            <div className="px-4 py-2 bg-white/10 rounded-2xl text-white/60 text-[10px] font-black uppercase tracking-widest">
               {groupedCompanies.length} Empresas Vinculadas
            </div>
         </div>
      </section>

      {/* Lista de Empresas */}
      <section className="space-y-6 print:hidden">
        <div className="flex items-center justify-between px-6">
          <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Faturamento por Empresa</h3>
          <ListFilter size={16} className="text-slate-300" />
        </div>

        <div className="space-y-4 px-2">
          {groupedCompanies.length === 0 ? (
            <div className="bg-white p-20 rounded-[4rem] border border-dashed border-slate-200 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Building2 size={32} />
               </div>
               <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Sem dados para exibir</p>
            </div>
          ) : (
            groupedCompanies.map((company, idx) => (
              <div 
                key={idx} 
                onClick={() => handleOpenDetail(company)}
                className="bg-white p-6 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-inner shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Building2 size={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                       <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none truncate max-w-[180px]">{company.clientName}</h4>
                       {company.totalValue > 2000 && <Star size={14} className="text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="text-[9px] text-slate-400 font-black mt-2 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid size={10} /> {company.totalServices} VISTORIAS
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      ATIVO EM {new Date(company.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="block font-black text-indigo-600 text-2xl tracking-tighter">
                    R$ {company.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <ChevronRight size={16} className="text-slate-200 ml-auto mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal de Detalhamento / Relatório Pro */}
      {isDetailOpen && selectedCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end justify-center animate-in fade-in duration-300 print:relative print:bg-white print:p-0 print:block">
          <div className="bg-white w-full max-w-3xl rounded-t-[4rem] p-8 max-h-[92vh] overflow-y-auto shadow-2xl print:max-h-none print:shadow-none print:rounded-none">
            
            {/* Header Modal */}
            <header className="flex items-center justify-between mb-8 print:hidden">
               <button onClick={() => setIsDetailOpen(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all"><X /></button>
               <div className="text-center">
                  <h3 className="font-black text-slate-900 text-2xl tracking-tighter">{selectedCompany.clientName}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Consolidado Analítico de Vistorias</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => exportToExcel(selectedCompany)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all" title="Exportar Excel"><FileSpreadsheet size={20}/></button>
                 <button onClick={() => window.print()} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all" title="Imprimir Relatório"><Printer size={20}/></button>
               </div>
            </header>

            {/* Cabeçalho de Impressão Profissional */}
            <div className="print:block hidden mb-12 border-b-8 border-indigo-600 pb-8">
               <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-black text-indigo-600 tracking-tighter">CheckMaster Auto Pro</h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">Relatório de Prestação de Serviços</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Data de Emissão</p>
                    <p className="font-black text-slate-900">{new Date().toLocaleString('pt-BR')}</p>
                  </div>
               </div>
               <div className="mt-10 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Empresa / Cliente</p>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">{selectedCompany.clientName}</h2>
                  <div className="flex gap-8 mt-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                     <span>Volume: {selectedCompany.totalServices} serviços</span>
                     <span>Período Ativo: {new Date(selectedCompany.lastActivity).toLocaleDateString()}</span>
                  </div>
               </div>
            </div>

            {/* 3-LEVEL GROUPING: Company > Service Type > Details */}
            <div className="space-y-10">
               {(Object.values(selectedCompany.services) as ServiceGroup[]).map((group, i) => (
                 <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                       <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-3">
                          <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg" />
                          {group.templateName}
                       </h5>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.count} Ocorrências</span>
                    </div>

                    <div className="space-y-3">
                       {group.orders.map((order, j) => (
                         <div key={j} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-indigo-200 transition-all print:bg-white print:border-slate-200">
                            <div className="flex items-center gap-4">
                               <div className="p-4 bg-white rounded-2xl text-slate-300 print:border shadow-sm">
                                  <Car size={20} />
                               </div>
                               <div>
                                  <h6 className="font-black text-slate-900 text-lg uppercase tracking-tight">{order.vehicle?.placa || 'SEM PLACA'}</h6>
                                  <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                     <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(order.date).toLocaleDateString()}</span>
                                     <span className="flex items-center gap-1"><Clock size={10}/> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-slate-900 text-xl">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                                  <CheckCircle2 size={10} /> FINALIZADO
                               </span>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="bg-indigo-50/40 p-6 rounded-[2rem] flex items-center justify-between mx-2 border border-indigo-100/50">
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Subtotal em {group.templateName}</span>
                       <span className="font-black text-indigo-600 text-lg leading-none">R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
               ))}
            </div>

            {/* Total Final Report */}
            <div className="mt-16 pt-10 border-t-4 border-slate-100 flex flex-col items-center pb-12">
               <div className="w-full flex justify-between items-center mb-12 px-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">Total Consolidado a Receber</span>
                    <span className="text-6xl font-black text-indigo-600 tracking-tighter">R$ {selectedCompany.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="hidden print:block text-right">
                    <div className="w-56 h-[2px] bg-slate-900 mb-2 ml-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Assinatura de Fechamento</p>
                  </div>
               </div>
               
               <div className="hidden print:block text-center text-slate-300 text-[9px] font-black uppercase tracking-[0.5em] mt-24">
                  DOCUMENTO GERADO PELO SISTEMA CHECKMASTER AUTO PRO • COD {Date.now()}
               </div>
               
               <button 
                 onClick={() => setIsDetailOpen(false)}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-indigo-600 transition-all active:scale-95 print:hidden"
               >
                 Fechar Visualização
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Print Professional CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root, .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0;
            margin: 0;
            background: white !important;
          }
          .print\\:hidden { display: none !important; }
          .rounded-[4rem], .rounded-[3.5rem], .rounded-[2.5rem], .rounded-t-[4rem], .rounded-[2rem] { 
            border-radius: 0.5rem !important; 
            border: 1px solid #e2e8f0 !important;
          }
          .shadow-sm, .shadow-xl, .shadow-2xl, .shadow-indigo-200 {
            box-shadow: none !important;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};

export default Finance;
