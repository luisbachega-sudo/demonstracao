
import React, { useState, useEffect } from 'react';
import { AppView, User, WorkItem } from './types';
import { WorkProvider } from './components/WorkContext';
import { SettingsProvider } from './components/SettingsContext';
import { SinapiProvider } from './components/SinapiContext';
import { AiUsageProvider } from './components/AiUsageContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import WorksView from './components/WorksView';
import CalculatorsView from './components/CalculatorsView';
import DashboardView from './components/DashboardView';

export interface CalculatorSetup {
  type: 'mix' | 'beam' | 'column' | 'slab';
  initialData?: any;
  targetWorkId?: string;
  targetItemId?: string;
  mode: 'create' | 'edit';
}

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [calculatorSetup, setCalculatorSetup] = useState<CalculatorSetup | null>(null);
  
  const [user] = useState<User>({
    name: 'Eng. Ricardo Almeida',
    email: 'ricardo@obrasmart.com',
    avatar: 'https://picsum.photos/seed/ricardo/200',
    plan: 'Pro'
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleViewChange = (view: AppView) => {
    setActiveView(view);
    setCalculatorSetup(null);
    setIsSidebarOpen(false);
  };

  const handleOpenCalculator = (setup: CalculatorSetup) => {
    setCalculatorSetup(setup);
    setActiveView('calculators');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar 
        user={user} 
        activeView={activeView} 
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={toggleDarkMode} 
          onToggleMenu={toggleSidebar}
          title={
            activeView === 'dashboard' ? 'Dashboard Geral' :
            activeView === 'works' ? 'Minhas Obras' : 'Calculadoras Técnicas'
          }
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'works' && (
            <WorksView onNavigateToCalculator={handleOpenCalculator} />
          )}
          {activeView === 'calculators' && (
            <CalculatorsView setup={calculatorSetup} onClearSetup={() => setCalculatorSetup(null)} />
          )}
        </main>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AiUsageProvider>
      <SinapiProvider>
        <WorkProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </WorkProvider>
      </SinapiProvider>
    </AiUsageProvider>
  );
};

export default App;
