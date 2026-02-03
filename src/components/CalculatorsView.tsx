
import React, { useState, useEffect } from 'react';
import MixCalculator from './calculators/MixCalculator';
import BeamCalculator from './calculators/BeamCalculator';
import ColumnCalculator from './calculators/ColumnCalculator';
import SlabCalculator from './calculators/SlabCalculator';
import { CalculatorSetup } from '../App';

export type CalculatorType = 'mix' | 'beam' | 'column' | 'slab' | null;

interface CalculatorsViewProps {
  setup: CalculatorSetup | null;
  onClearSetup: () => void;
}

const CalculatorsView: React.FC<CalculatorsViewProps> = ({ setup, onClearSetup }) => {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>(null);

  // Se receber setup do App, define a calculadora ativa
  useEffect(() => {
    if (setup) {
      setActiveCalc(setup.type);
    }
  }, [setup]);

  const handleBack = () => {
    setActiveCalc(null);
    onClearSetup(); // Limpa o setup global ao voltar para o menu
  };

  // Renderiza o seletor de calculadoras (Menu Principal)
  if (!activeCalc) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Central de Ferramentas</h3>
          <p className="text-slate-500">Selecione a calculadora técnica necessária para sua tarefa atual.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CalcMenuCard 
            title="Traço (Receita)" 
            description="Proporções personalizadas de cimento, areia e brita."
            icon="fa-mortar-pestle" 
            color="blue" 
            onClick={() => setActiveCalc('mix')} 
          />
          <CalcMenuCard 
            title="Viga" 
            description="Cálculo de volume e materiais para vigas de concreto."
            icon="fa-grip-lines" 
            color="indigo" 
            onClick={() => setActiveCalc('beam')} 
          />
          <CalcMenuCard 
            title="Pilar" 
            description="Dimensionamento de volume para colunas e pilares."
            icon="fa-square" 
            color="emerald" 
            onClick={() => setActiveCalc('column')} 
          />
          <CalcMenuCard 
            title="Laje" 
            description="Área e volume para lajes maciças ou pré-moldadas."
            icon="fa-layer-group" 
            color="purple" 
            onClick={() => setActiveCalc('slab')} 
          />
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-300">Dica de Especialista</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">Utilize as calculadoras para gerar listas de compras precisas e evitar desperdício de material no canteiro.</p>
          </div>
        </div>
      </div>
    );
  }

  // Passa props de setup apenas se a calculadora ativa coincidir com o setup
  const currentSetup = (setup && setup.type === activeCalc) ? setup : undefined;

  // Renderiza a calculadora selecionada
  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <button 
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors group"
      >
        <i className="fa-solid fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
        <span className="font-medium">Voltar para o menu</span>
      </button>

      {/* Todas as calculadoras agora recebem initialSetup */}
      {activeCalc === 'beam' && <BeamCalculator initialSetup={currentSetup} />}
      {activeCalc === 'column' && <ColumnCalculator initialSetup={currentSetup} />}
      {activeCalc === 'slab' && <SlabCalculator initialSetup={currentSetup} />}
      {activeCalc === 'mix' && <MixCalculator initialSetup={currentSetup} />}
    </div>
  );
};

const CalcMenuCard: React.FC<{ title: string; description: string; icon: string; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 text-left flex flex-col h-full group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[color]}`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 flex-1">{description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
        ABRIR CALCULADORA <i className="fa-solid fa-chevron-right"></i>
      </div>
    </button>
  );
};

export default CalculatorsView;
