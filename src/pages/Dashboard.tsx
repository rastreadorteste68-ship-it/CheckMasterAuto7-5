
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
  LayoutGrid
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import { ChecklistTemplate, ServiceOrder } from '../types';

const Dashboard: React.FC = () => {
  const [favorites, setFavorites] = useState<ChecklistTemplate[]>([]);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [stats, setStats] = useState({ today: 0, gains: 0, clients: 0 });
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

  const shortcutColors = [
    'bg-[#5D5FEF] shadow-indigo-100',
    'bg-[#10B981] shadow-emerald-100',
    'bg-[#F59E0B] shadow-amber-100',
    'bg-[#EF4444] shadow-rose-100',
  ];

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* HEADER SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Dashboard Pro</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Bem-vindo ao CheckMaster Auto</p>
          </div>
          <Link to="/services" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-indigo-600 active:scale-95 transition-all">
            <Plus size={28} strokeWidth={2.5} />
          </Link>
        </div>

        {/* EMPRESA PRONTA - FAVORITOS */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
            <Zap size={14} className="text-amber-500 fill-amber-500" /> EMPRESA PRONTA
          </h3>
          <div className="flex gap-5 overflow-x-auto pb-6 px-2 scrollbar-hide">
            {favorites.length === 0 ? (
              <div className="min-w-[190px] p-8 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                <Star size={32} className="text-slate-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">Favorite modelos para acesso rápido</span>
              </div>
            ) : (
              favorites.map((template, idx) => (
                <button
                  key={template.id}
                  onClick={() => navigate(`/services?run=${template.id}`)}
                  className={`${shortcutColors[idx % shortcutColors.length]} min-w-[190px] p-8 rounded-[3rem] text-left text-white shadow-xl active:scale-95 transition-all flex flex-col justify-between aspect-[4/5]`}
                >
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                    <Star size={24} fill="white" strokeWidth={0} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl leading-tight mb-1">{template.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{template.fields.length} ITENS DE VISTORIA</span>
                  </div>
                </button>
              ))
            )}
            
            <Link
              to="/services"
              className="min-w-[190px] rounded-[3rem] border-4 border-dashed border-slate-200 bg-white/40 flex items-center justify-center text-slate-200 hover:text-indigo-400 hover:border-indigo-200 transition-all active:scale-95 aspect-[4/5]"
            >
              <Plus size={64} strokeWidth={3} />
            </Link>
          </div>
        </div>

        {/* PERFORMANCE STATS */}
        <div className="grid grid-cols-3 gap-4 px-1">
          {[
            { label: 'VISTORIAS', value: stats.today, icon: <ClipboardCheck size={28} />, color: 'bg-indigo-50 text-indigo-500' },
            { label: 'RECEITA', value: `R$ ${stats.gains}`, icon: <TrendingUp size={28} />, color: 'bg-emerald-50 text-emerald-500' },
            { label: 'EMPRESAS', value: stats.clients, icon: <Building2 size={28} />, color: 'bg-amber-50 text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white py-8 px-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-2xl ${stat.color} flex items-center justify-center shadow-inner`}>
                {stat.icon}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{stat.label}</span>
                <span className="text-lg font-black text-slate-900 truncate w-full block leading-none">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITIES */}
      <section className="space-y-4 px-1">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={14} className="text-indigo-500" /> ÚLTIMAS ATIVIDADES
          </h3>
          <Link to="/finance" className="text-indigo-600 text-[11px] font-black uppercase tracking-widest">Ver Histórico</Link>
        </div>

        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <div className="bg-white p-14 rounded-[3.5rem] border border-dashed border-slate-200 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
              Nenhuma vistoria finalizada hoje
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 active:scale-[0.98]">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <Car size={32} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight">{order.vehicle.placa || 'SEM PLACA'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide truncate max-w-[120px]">{order.clientName}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{order.templateName}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-emerald-500 font-black text-lg">R$ {order.totalValue}</span>
                  <div className="text-[9px] font-bold text-slate-300 uppercase">{new Date(order.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
