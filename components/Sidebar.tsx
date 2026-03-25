
import React, { useState } from 'react';
import { AppRoute, User } from '../types';
import { Icons } from '../constants';
import SignaturePasswordModal from './SignaturePasswordModal';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
  activeUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, isOpen, onClose, activeUser, users, onSwitchUser }) => {
  const [showSwitch, setShowSwitch] = useState(false);
  const [pendingSwitchUser, setPendingSwitchUser] = useState<User | null>(null);

  const menuItems = [
    { id: AppRoute.DASHBOARD, label: 'Dashboard', icon: Icons.Dashboard, restricted: false },
    { id: AppRoute.PATIENTS, label: 'Pacientes', icon: Icons.Users, restricted: false },
    { id: AppRoute.CALENDAR, label: 'Agenda', icon: Icons.Calendar, restricted: false },
    { id: AppRoute.INVENTORY, label: 'Inventario', icon: Icons.Box, restricted: false },
    { id: AppRoute.BILLING, label: 'Facturación', icon: Icons.Coins, restricted: false },
    { id: AppRoute.INVESTMENTS, label: 'Inversiones', icon: Icons.TrendingUp, restricted: true },
    { id: AppRoute.FINANCIAL_DISTRIBUTION, label: 'Distribución', icon: Icons.ChartBar, restricted: true },
    { id: AppRoute.STATISTICS, label: 'Estadísticas', icon: Icons.AI, restricted: true },
    { id: AppRoute.SERVICES, label: 'Servicios', icon: Icons.Briefcase, restricted: true },
  ];

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    onClose();
  };

  const isAdmin = activeUser.roleType === 'ADMIN';

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-xl lg:shadow-sm z-[70] w-64
        transition-transform duration-300 ease-in-out flex flex-col print:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${activeUser.color} rounded-lg flex items-center justify-center text-white shadow-lg transition-colors duration-500`}>
              <Icons.Stethoscope />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Noah’s <span className="text-sky-600">Agency</span></span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <Icons.X />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            
            // Hide restricted items for non-admins
            if (!isAdmin && item.restricted) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  <Icon />
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2 relative">
          {showSwitch && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideUp">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cambiar Sesión</p>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {users.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => { 
                      if (u.id === activeUser.id) { setShowSwitch(false); return; }
                      setPendingSwitchUser(u); 
                    }}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-slate-50 transition-colors ${activeUser.id === u.id ? 'bg-sky-50/50 opacity-50' : ''}`}
                  >
                    <img src={u.avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => handleNavigate(AppRoute.SETTINGS)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${currentRoute === AppRoute.SETTINGS ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="opacity-60"><Icons.Dashboard /></span>
            <span className="font-bold text-sm">Configuración</span>
          </button>
          
          <button 
            onClick={() => setShowSwitch(!showSwitch)}
            className="w-full bg-slate-50 hover:bg-slate-100 rounded-xl p-3 flex items-center space-x-3 transition-colors border border-transparent hover:border-slate-200 text-left"
          >
            <div className="relative">
              <img src={activeUser.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${activeUser.color}`}></div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-slate-900 truncate">{activeUser.name}</p>
              <p className="text-[9px] font-bold text-slate-400 truncate uppercase">{activeUser.role}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 transition-transform ${showSwitch ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {pendingSwitchUser && (
        <SignaturePasswordModal 
          isOpen={true} 
          onClose={() => setPendingSwitchUser(null)} 
          onSuccess={() => {
            onSwitchUser(pendingSwitchUser);
            setPendingSwitchUser(null);
            setShowSwitch(false);
          }} 
          doctorName={pendingSwitchUser.name}
          overridePassword={pendingSwitchUser.password}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </>
  );
};

export default Sidebar;
