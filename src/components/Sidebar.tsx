
import React from 'react';
import { AppView, User } from '../types';

interface SidebarProps {
  user: User;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onViewChange, isOpen, onClose }) => {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
      lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-helmet-safety text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">ObraSmart</h1>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-500">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5" />
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.plan}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <NavItem 
          icon="fa-chart-pie" 
          label="Painel Geral" 
          active={activeView === 'dashboard'} 
          onClick={() => onViewChange('dashboard')} 
        />
        <NavItem 
          icon="fa-building" 
          label="Minhas Obras" 
          active={activeView === 'works'} 
          onClick={() => onViewChange('works')} 
        />
        <NavItem 
          icon="fa-calculator" 
          label="Calculadoras" 
          active={activeView === 'calculators'} 
          onClick={() => onViewChange('calculators')} 
        />
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Armazenamento</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-2">
            <div className="bg-blue-600 h-1.5 rounded-full w-[65%]"></div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">1.3 GB de 2 GB usado</p>
        </div>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
    }`}
  >
    <i className={`fa-solid ${icon} w-5`}></i>
    {label}
  </button>
);

export default Sidebar;
