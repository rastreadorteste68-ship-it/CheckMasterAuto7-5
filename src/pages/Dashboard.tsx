
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ClipboardCheck, 
  Users, 
  Plus, 
  ChevronRight,
  Car,
  Star,
  Zap,
  Building2,
  Clock,
  LayoutGrid,
  X,
  Printer,
  FileText,
  Share2,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import { ChecklistTemplate, ServiceOrder } from '../types';

const Dashboard: React.FC = () => {
  const [favorites, setFavorites] = useState<ChecklistTemplate[]>([]);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [stats, setStats] = useState({ today: 0, gains: 0, clients: 0 });
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const templates = storage.getTemplates();
    setFavorites(templates.filter(t => t.isFavorite));

    const orders = storage.getOrders();
    setRecentOrders(orders.slice().reverse().slice(0, 5));

    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: ServiceOrder) => o.date.startsWith(todayStr));
    const totalGains = orders.reduce((acc: number, o: ServiceOrder) => acc + (o.totalValue || 0), 0);
    
    setStats({
      today: todayOrders.length,
      gains: totalGains,
      clients: new Set(orders.map((o: ServiceOrder) => o.clientName)).size
    });
  }, []);

  const exportToExcel = (order: ServiceOrder) => {
    const headers = "Campo,Valor\n";
    const rows = order.fields.map(f => `"${f.label}","${f.value === true ? 'SIM' : f.value === false ? 'NÃO' : f.value || '-'}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vistoria_${order.vehicle.placa || 'Sem_Placa'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareReport = async (order: ServiceOrder) => {
    const text = `CheckMaster Pro - Relatório de Vistoria\n\nVeículo: ${order.vehicle.marca} ${order.vehicle.modelo}\nPlaca: ${order.vehicle.placa}\nCliente: ${order.clientName}\nValor: R$ ${order.totalValue}\nData: ${new Date(order.date).toLocaleDateString()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Relatório CheckMaster', text: text });
      } catch (e) { console.error(e); }
    } else {
      alert("Copiado para a área de transferência!");
      navigator.clipboard.writeText(text);
    }
  };

  const shortcutColors = [
    'bg-[#818CF8]', // Indigo
    'bg-[#34D399]', // Emerald
    'bg-[#FBBF24]', // Amber
    'bg-[#F87171]', // Rose
  ];

  const glowStyles = [
    'shadow-[0_0_40px_rgba(129,140,248,0.4)]',
    'shadow-[0_0_40px_rgba(52,211,153,0.4)]',
    'shadow-[0_0_40px_rgba(251,191,36,0.4)]',
    'shadow-[0_0_40px_rgba(248,113,113,0.4)]',
  ];

  return (
    <div className="space-y-12 animate-slide-up pb-10 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">Dashboard Pro</h2>
            <p className="text-slate-500 text-sm sm:text-base font-medium mt-2">Bem-vindo ao seu painel administrativo</p>
          </div>
          <Link to="/services" className="bg-indigo-600 p-5 rounded-[1.8rem] shadow-xl shadow-indigo-100 text-white active:scale-95 transition-all hover:bg-indigo-700">
            <Plus size={32} strokeWidth={3} />
          </Link>
        </div>

        {/* PERFORMANCE STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-1">
          {[
            { label: 'VISTORIAS HOJE', value: stats.today, icon: <ClipboardCheck size={28} />, color: 'bg-indigo-50 text-indigo-500' },
            { label: 'RECEITA TOTAL', value: `R$ ${stats.gains.toLocaleString('pt-BR')}`, icon: <TrendingUp size={28} />, color: 'bg-emerald-50 text-emerald-500' },
            { label: 'EMPRESAS ATIVAS', value: stats.clients, icon: <Building2 size={28} />, color: 'bg-amber-50 text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-3xl ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{stat.label}</span>
                <span className="text-2xl font-black text-slate-900 leading-none">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* EMPRESA PRONTA - FAVORITOS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
              <Zap size={14} className="text-amber-500 fill-amber-500" /> EMPRESA PRONTA
            </h3>
            <Link to="/services" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
            {favorites.map((template, idx) => (
              <button
                key={template.id}
                onClick={() => navigate(`/services?run=${template.id}`)}
                className={`${shortcutColors[idx % shortcutColors.length]} ${glowStyles[idx % glowStyles.length]} p-10 rounded-[3.5rem] text-left text-white active:scale-95 transition-all flex flex-col justify-between aspect-[4/5] sm:aspect-square lg:aspect-[4/5] relative overflow-hidden group hover:-translate-y-2`}
              >
                {/* Star Icon Badge */}
                <div className="absolute top-8 left-8 w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                  <Star size={24} fill="white" className="group-hover:fill-indigo-600 transition-colors" strokeWidth={0} />
                </div>
                
                <div className="mt-auto">
                  <h4 className="font-black text-2xl leading-tight mb-2 pr-4">{template.name}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{template.fields.length} ITENS DE VISTORIA</span>
                </div>
              </button>
            ))}
            {favorites.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum favorito selecionado</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITIES */}
      <section className="space-y-6 px-1">
        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
          <Clock size={14} className="text-indigo-500" /> ÚLTIMAS ATIVIDADES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentOrders.map((order) => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 cursor-pointer active:scale-[0.98]">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <Car size={32} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight">{order.vehicle.placa || 'SEM PLACA'}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wide truncate">{order.clientName}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="block text-emerald-500 font-black text-lg">R$ {order.totalValue}</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(order.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Detalhes da Vistoria */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#f0f2f5] w-full max-w-2xl rounded-[3rem] p-6 sm:p-10 max-h-[92vh] overflow-y-auto shadow-2xl relative animate-in zoom-in duration-300">
             <header className="flex items-center justify-between mb-8 px-2">
                <div className="flex gap-4">
                  <button onClick={() => shareReport(selectedOrder)} className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"><Share2 size={24}/></button>
                  <button onClick={() => exportToExcel(selectedOrder)} className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm hover:bg-emerald-50 transition-all"><Download size={24}/></button>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24}/></button>
             </header>

             <div className="space-y-4">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 text-center sm:text-left">
                 <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Status da Vistoria</span>
                   <p className="font-black text-emerald-600 text-2xl uppercase">Finalizada</p>
                 </div>
                 <div className="text-center sm:text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Data de Realização</span>
                    <p className="font-black text-slate-900 text-xl">{new Date(selectedOrder.date).toLocaleDateString()} às {new Date(selectedOrder.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {selectedOrder.fields.map((f, i) => (
                   <div key={i} className="bg-white px-8 py-6 rounded-[2rem] shadow-sm flex justify-between items-center group">
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{f.type.replace('ai_', 'INTELIGÊNCIA ')}</span>
                        <span className="font-black text-slate-800 text-sm leading-tight block">{f.label}</span>
                      </div>
                      <div className="ml-4">
                         {f.type === 'photo' && f.value ? (
                           <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                              <img src={f.value} className="w-full h-full object-cover" alt="Evidência" />
                           </div>
                         ) : (
                           <span className="font-black text-indigo-600 uppercase text-xs bg-indigo-50 px-3 py-2 rounded-xl">
                             {f.value === true ? 'SIM' : f.value === false ? 'NÃO' : String(f.value || '-')}
                           </span>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="mt-12 px-2">
                <button 
                  onClick={() => window.print()} 
                  className="w-full h-[70px] rounded-[2rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-4 shadow-2xl shadow-indigo-200 active:scale-95 transition-all text-base tracking-widest uppercase hover:bg-indigo-700"
                >
                   <Printer size={24}/> GERAR PDF / IMPRIMIR
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
