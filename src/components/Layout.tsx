
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  CircleDollarSign, 
  CalendarRange, 
  Users,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../services/authContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={24} />, label: 'Início', path: '/' },
    { icon: <ClipboardCheck size={24} />, label: 'Vistorias', path: '/services' },
    { icon: <CircleDollarSign size={24} />, label: 'Financeiro', path: '/finance' },
    { icon: <CalendarRange size={24} />, label: 'Agenda', path: '/agenda' },
    { icon: <Users size={24} />, label: 'Clientes', path: '/clients' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <h1 className="text-xl font-bold text-indigo-600">CheckMaster</h1>
        <button 
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-4 p-4 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Navigation - Mobile Bottom Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-slate-200 px-6 py-3 rounded-[3rem] shadow-2xl flex items-center gap-8 z-40">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
                isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
