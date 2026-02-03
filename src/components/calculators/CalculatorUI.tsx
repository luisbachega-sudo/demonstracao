
import React, { useState, useEffect } from 'react';
import { BOMItem, Work, CalculationResult } from '../../types';
import { useWorks } from '../WorkContext';

export type { BOMItem };

export const CalculatorHeader: React.FC<{ title: string; icon: string; color: string }> = ({ title, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${colorMap[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500">Estimativa técnica e orçamento analítico de materiais.</p>
      </div>
    </div>
  );
};

export const FormulaCard: React.FC<{ label: string; formula: string; value: string; icon: string; color: string }> = ({ label, formula, value, icon, color }) => (
  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
    <div className="flex items-center gap-2 mb-2">
      <i className={`fa-solid ${icon} text-[10px] ${color}`}></i>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mb-1 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded border border-slate-100 dark:border-slate-800">
      {formula}
    </div>
    <div className="text-right text-xs font-bold text-slate-700 dark:text-slate-200">
      = {value}
    </div>
  </div>
);

// --- COMPONENTE DE MÃO DE OBRA ---
interface LaborCostSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  hoursPro: number;
  ratePro: number;
  onHoursProChange: (v: number) => void;
  onRateProChange: (v: number) => void;
  hoursHelper: number;
  rateHelper: number;
  onHoursHelperChange: (v: number) => void;
  onRateHelperChange: (v: number) => void;
}

export const LaborCostSection: React.FC<LaborCostSectionProps> = (props) => {
  return (
    <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/30">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <i className="fa-solid fa-helmet-safety"></i>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 dark:text-slate-100">Custo de Mão de Obra</h5>
            <p className="text-xs text-slate-500">Estimar horas de profissionais e ajudantes.</p>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={props.enabled} onChange={(e) => props.onToggle(e.target.checked)} />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
        </label>
      </div>

      {props.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
              <span>Profissional (Pedreiro)</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 mb-1 block">HORAS</label>
                <input type="number" value={props.hoursPro} onChange={(e) => props.onHoursProChange(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold" />
              </div>
              <div className="flex-1">
                 <label className="text-[10px] text-slate-400 mb-1 block">R$ / HORA</label>
                <input type="number" value={props.ratePro} onChange={(e) => props.onRateProChange(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
              <span>Ajudante (Servente)</span>
            </div>
            <div className="flex gap-2">
               <div className="flex-1">
                <label className="text-[10px] text-slate-400 mb-1 block">HORAS</label>
                <input type="number" value={props.hoursHelper} onChange={(e) => props.onHoursHelperChange(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 mb-1 block">R$ / HORA</label>
                <input type="number" value={props.rateHelper} onChange={(e) => props.onRateHelperChange(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MODAL DE SALVAR ---
interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workId: string, itemName: string) => void;
  defaultName: string;
  preSelectedWorkId?: string; // Prop opcional para travar a seleção
}

export const SaveToWorkModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave, defaultName, preSelectedWorkId }) => {
  const { works } = useWorks();
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [itemName, setItemName] = useState(defaultName);

  useEffect(() => {
    if (preSelectedWorkId) {
      setSelectedWorkId(preSelectedWorkId);
    } else if (works.length > 0 && !selectedWorkId) {
      setSelectedWorkId(works[0].id);
    }
    setItemName(defaultName);
  }, [works, defaultName, isOpen, preSelectedWorkId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Salvar Cálculo na Obra</h3>
        
        <div className="space-y-4 mb-6">
          {!preSelectedWorkId && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecione a Obra</label>
              <select 
                value={selectedWorkId} 
                onChange={(e) => setSelectedWorkId(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                {works.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
          )}
          {preSelectedWorkId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-2">
               <p className="text-xs font-bold text-blue-500 uppercase">Obra Selecionada</p>
               <p className="font-bold text-blue-900 dark:text-blue-300">
                 {works.find(w => w.id === preSelectedWorkId)?.title || 'Desconhecida'}
               </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Item</label>
            <input 
              type="text" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Viga Baldrame V1"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
          <button 
            onClick={() => onSave(selectedWorkId, itemName)}
            disabled={!selectedWorkId || !itemName.trim()}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
};


interface BOMTableProps {
  items: BOMItem[];
  onPriceChange: (id: string, newPrice: number) => void;
}

export const BOMTable: React.FC<BOMTableProps> = ({ items, onPriceChange }) => {
  const grandTotal = items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);

  const categoryColors: Record<string, string> = {
    'Concreto': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Fôrma': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Aço': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'Mão de Obra': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Outros': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-list-check text-blue-500"></i>
          Lista Detalhada de Materiais (Orçamento Analítico)
        </h5>
        <div className="text-right bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md">
          <p className="text-[9px] font-bold uppercase opacity-80">Investimento Total na Peça</p>
          <p className="text-xl font-black">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Insumo</th>
              <th className="px-4 py-4 text-center">Uso / Categoria</th>
              <th className="px-4 py-4 text-center">Quantidade</th>
              <th className="px-4 py-4">Unid.</th>
              <th className="px-6 py-4 text-right">P. Unitário (R$)</th>
              <th className="px-6 py-4 text-right">Custo Total (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{item.name}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${categoryColors[item.category] || categoryColors.Outros}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-center font-bold text-slate-600 dark:text-slate-400">
                  {item.qty.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-slate-500 text-xs font-medium uppercase">{item.unit}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[10px] font-bold text-slate-400">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => onPriceChange(item.id, Number(e.target.value))}
                      className="w-24 text-right bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded-lg px-2 py-1 text-sm font-bold text-blue-600 outline-none transition-all"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100">
                  R$ {(item.qty * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
             <tr>
               <td colSpan={5} className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-500">Subtotal Materiais:</td>
               <td className="px-6 py-5 text-right font-black text-lg text-blue-600 dark:text-blue-400">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export const StructuralResults: React.FC<{ volume: number; areaForm: number; steelWeight: number }> = ({ volume, areaForm, steelWeight }) => (
  <div className="space-y-4">
    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Resultados da Geometria</h5>
    
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-blue-500/20 flex justify-between items-center transition-transform hover:scale-[1.02]">
        <div>
          <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-1">Volume Concreto</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{volume.toFixed(3)}</span>
            <span className="text-sm font-bold opacity-80 uppercase">m³</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-cube text-xl"></i>
        </div>
      </div>

      <div className="bg-amber-600 text-white p-5 rounded-2xl shadow-lg shadow-amber-500/20 flex justify-between items-center transition-transform hover:scale-[1.02]">
        <div>
          <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-1">Área de Fôrma</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{areaForm.toFixed(2)}</span>
            <span className="text-sm font-bold opacity-80 uppercase">m²</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-border-all text-xl"></i>
        </div>
      </div>

      <div className="bg-slate-700 text-white p-5 rounded-2xl shadow-lg shadow-slate-500/20 flex justify-between items-center transition-transform hover:scale-[1.02]">
        <div>
          <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-1">Peso Estimado Aço</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{steelWeight.toFixed(1)}</span>
            <span className="text-sm font-bold opacity-80 uppercase">kg</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-bars-staggered text-xl"></i>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTES PARA RELATÓRIO ---

interface ReportOptions {
  includeCosts: boolean;
  includeSummary: boolean;
  categories: {
    Concreto: boolean;
    Fôrma: boolean;
    Aço: boolean;
    'Mão de Obra': boolean;
    Outros: boolean;
  };
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  bom: BOMItem[];
  summaryData: { label: string; value: string }[];
  totals: { volume: number; areaForm: number; steelWeight: number };
  icon: string; // Ícone da calculadora (ex: fa-grip-lines)
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, title, bom, summaryData, totals, icon }) => {
  const [options, setOptions] = useState<ReportOptions>({
    includeCosts: true,
    includeSummary: true,
    categories: { Concreto: true, Fôrma: true, Aço: true, 'Mão de Obra': true, Outros: true }
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtragem
  const filteredBOM = bom.filter(item => options.categories[item.category as keyof typeof options.categories]);
  const grandTotal = filteredBOM.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-6xl max-h-full rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
        
        {/* Header Modal */}
        <div className="p-6 md:px-10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-file-pdf text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Configurar Exportação</h3>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Configuração */}
          <div className="w-full lg:w-80 p-8 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="space-y-8">
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Módulos do Relatório</h5>
                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all">
                  <input type="checkbox" checked={options.includeSummary} onChange={e => setOptions({...options, includeSummary: e.target.checked})} className="w-5 h-5 rounded-lg text-blue-600" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Card de Premissas</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all">
                  <input type="checkbox" checked={options.includeCosts} onChange={e => setOptions({...options, includeCosts: e.target.checked})} className="w-5 h-5 rounded-lg text-blue-600" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Custos Detalhados</span>
                </label>
              </div>
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Filtrar por Categoria</h5>
                {(['Concreto', 'Fôrma', 'Aço', 'Mão de Obra', 'Outros'] as const).map(cat => (
                  <label key={cat} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all">
                    <input type="checkbox" checked={options.categories[cat]} onChange={e => setOptions({...options, categories: { ...options.categories, [cat]: e.target.checked }})} className="w-5 h-5 rounded-lg text-blue-600" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto">
            <div id="report-paper" className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] p-10 md:p-14 shadow-2xl rounded-sm text-slate-900 relative">
              
              {/* Report Header */}
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-10">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter text-blue-600">ObraSmart</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relatório Técnico Individual</p>
                </div>
                <div className="text-right text-[10px] font-bold text-slate-500">
                  GERADO EM: {new Date().toLocaleDateString('pt-BR')} AS {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 uppercase border-l-8 border-blue-600 pl-4">{title}</h2>
              </div>

              {/* Premissas de Cálculo - CARD FORMAT */}
              {options.includeSummary && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">01. Premissas de Cálculo</h4>
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex gap-8 items-center relative overflow-hidden">
                    {/* Watermark Icon */}
                    <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none">
                       <i className={`fa-solid ${icon} text-[200px]`}></i>
                    </div>

                    <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl text-blue-600 shrink-0 border border-slate-100">
                      <i className={`fa-solid ${icon}`}></i>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
                      {summaryData.map((item, idx) => (
                        <div key={idx} className="flex flex-col border-b border-slate-200/50 pb-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-tight">{item.label}</span>
                          <span className="text-sm font-bold text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resultados Geométricos Compactos */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                     <div className="bg-blue-600 rounded-2xl p-4 text-white">
                        <p className="text-[9px] font-bold uppercase opacity-80 mb-1">Vol. Concreto</p>
                        <p className="text-xl font-black">{totals.volume.toFixed(3)} m³</p>
                     </div>
                     <div className="bg-amber-600 rounded-2xl p-4 text-white">
                        <p className="text-[9px] font-bold uppercase opacity-80 mb-1">Área Fôrma</p>
                        <p className="text-xl font-black">{totals.areaForm.toFixed(2)} m²</p>
                     </div>
                     <div className="bg-slate-800 rounded-2xl p-4 text-white">
                        <p className="text-[9px] font-bold uppercase opacity-80 mb-1">Peso Aço Est.</p>
                        <p className="text-xl font-black">{totals.steelWeight.toFixed(1)} kg</p>
                     </div>
                  </div>
                </div>
              )}

              {/* BOM Table */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">02. Listagem de Materiais (BOM)</h4>
                {filteredBOM.length > 0 ? (
                  <table className="w-full text-[11px] text-left">
                    <thead className="border-b-2 border-slate-900">
                      <tr>
                        <th className="py-2">Descrição do Insumo</th>
                        <th className="py-2 text-center">Quant.</th>
                        <th className="py-2">Unid.</th>
                        {options.includeCosts && <th className="py-2 text-right">Preço Unit.</th>}
                        {options.includeCosts && <th className="py-2 text-right">Subtotal</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBOM.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <span className="block text-[8px] uppercase font-black text-slate-400">{item.category}</span>
                          </td>
                          <td className="py-2.5 text-center font-bold">{item.qty.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                          <td className="py-2.5 uppercase font-medium text-slate-500">{item.unit}</td>
                          {options.includeCosts && <td className="py-2.5 text-right font-medium text-slate-600">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                          {options.includeCosts && <td className="py-2.5 text-right font-black">R$ {(item.qty * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                        </tr>
                      ))}
                    </tbody>
                    {options.includeCosts && (
                      <tfoot className="border-t-2 border-slate-900">
                        <tr>
                          <td colSpan={4} className="py-6 text-right font-black uppercase text-xs">Investimento Total Estimado:</td>
                          <td className="py-6 text-right font-black text-lg text-blue-600">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : (
                  <div className="py-8 text-center text-slate-400 font-bold border-2 border-dashed rounded-3xl">Selecione ao menos uma categoria para exibir.</div>
                )}
              </div>

              {/* Report Footer */}
              <div className="mt-20 pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>Calculado via motor ObraSmart Engine</span>
                <span>Página 1 / 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">VOLTAR</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs">
            <i className="fa-solid fa-print"></i>
            Imprimir Relatório
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-paper, #report-paper * { visibility: visible; }
          #report-paper {
            position: absolute;
            left: 0; top: 0; width: 100%; height: auto;
            box-shadow: none !important; border: none !important; padding: 15mm !important;
          }
          @page { size: portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};
