
import React from 'react';

interface TopbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMenu: () => void;
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ isDarkMode, onToggleDarkMode, onToggleMenu, title }) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMenu}
          className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2"
        >
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input 
            type="text" 
            placeholder="Procurar projeto..." 
            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64 outline-none"
          />
        </div>

        <button 
          onClick={onToggleDarkMode}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>

        <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <i className="fa-solid fa-bell"></i>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
