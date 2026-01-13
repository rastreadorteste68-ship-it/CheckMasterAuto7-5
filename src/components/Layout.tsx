
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  CircleDollarSign, 
  CalendarRange, 
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../services/authContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Verifica se estamos no modo "Runner" (executando uma vistoria)
  const isRunningService = location.pathname === '/services' && location.search.includes('run=');

  const menuItems = [
    { icon: <LayoutDashboard size={24} />, label: 'Início', path: '/' },
    { icon: <ClipboardCheck size={24} />, label: 'Vistorias', path: '/services' },
    { icon: <CircleDollarSign size={24} />, label: 'Financeiro', path: '/finance' },
    { icon: <CalendarRange size={24} />, label: 'Agenda', path: '/agenda' },
    { icon: <Users size={24} />, label: 'Clientes', path: '/clients' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR - DESKTOP ONLY */}
      {!isRunningService && (
        <aside 
          className={`hidden md:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-slate-100 transition-all duration-300 ease-in-out z-40 shadow-lg ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 h-20">
            {!isCollapsed && (
              <h1 className="text-xl font-black text-indigo-600 tracking-tighter animate-fade-in">
                CheckMaster
              </h1>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all ${isCollapsed ? 'mx-auto' : ''}`}
            >
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 space-y-2 mt-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : ''}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap animate-fade-in">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-50">
            <button 
              onClick={logout}
              className={`flex items-center gap-4 w-full p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut size={24} className="shrink-0 transition-transform group-hover:rotate-12" />
              {!isCollapsed && (
                <span className="text-sm font-black uppercase tracking-widest animate-fade-in">Sair</span>
              )}
            </button>
          </div>
        </aside>
      )}

      {/* Main Layout Container */}
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          !isRunningService && !isCollapsed ? 'md:ml-64' : !isRunningService ? 'md:ml-20' : ''
        }`}
      >
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <h1 className="text-xl font-black text-indigo-600 tracking-tighter">CheckMaster</h1>
          <button 
            onClick={logout}
            className="p-3 bg-slate-50 text-slate-500 hover:text-red-500 rounded-2xl transition-all active:scale-90"
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 ${isRunningService ? 'pb-40' : 'pb-24'} p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full`}>
          <Outlet />
        </main>

        {/* MOBILE NAVIGATION - Bottom Bar */}
        {!isRunningService && (
          <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-slate-200 px-6 py-4 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-6 z-[60] animate-slide-up">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                    isActive ? 'text-indigo-600 scale-110' : 'text-slate-400'
                  }`}
                >
                  {item.icon}
                  <span className="text-[9px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

export default Layout;
