
import React, { useState } from 'react';
import { Work, WorkItem } from '../types';
import { useWorks } from './WorkContext';
import { CalculatorSetup } from '../App';
import { BOMTable } from './calculators/CalculatorUI';

interface WorksViewProps {
  onNavigateToCalculator: (setup: CalculatorSetup) => void;
}

const WorksView: React.FC<WorksViewProps> = ({ onNavigateToCalculator }) => {
  const { works, addWork, updateWork, deleteItemFromWork } = useWorks();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Se uma obra foi selecionada, mostra o detalhe (Orçamento)
  if (selectedWorkId) {
    const activeWork = works.find(w => w.id === selectedWorkId);
    if (!activeWork) {
      setSelectedWorkId(null);
      return null;
    }

    return (
      <WorkDetailView 
        work={activeWork} 
        onBack={() => setSelectedWorkId(null)} 
        onDeleteItem={(itemId) => {
          if (window.confirm('Tem certeza que deseja excluir este item do orçamento?')) {
            deleteItemFromWork(activeWork.id, itemId);
          }
        }}
        onUpdateWork={(data) => updateWork(activeWork.id, data)}
        onEditItem={(item) => onNavigateToCalculator({
          type: item.type,
          mode: 'edit',
          initialData: item.inputs,
          targetWorkId: activeWork.id,
          targetItemId: item.id
        })}
        onAddItem={() => onNavigateToCalculator({
          type: 'beam', // Default to beam, user can switch in calc view but context helps
          mode: 'create',
          targetWorkId: activeWork.id
        })}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gerencie seus projetos</h3>
          <p className="text-slate-500 text-sm">Acompanhe cronograma e orçamento em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl flex items-center">
            <button 
              onClick={() => setViewMode('grid')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <i className="fa-solid fa-table-cells-large"></i>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <i className="fa-solid fa-list-ul"></i>
            </button>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            Nova Obra
          </button>
        </div>
      </div>

      {works.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <i className="fa-solid fa-folder-open text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhuma obra cadastrada</h3>
          <p className="text-slate-500 text-sm mb-6">Crie seu primeiro projeto para começar a organizar orçamentos.</p>
          <button onClick={() => setIsAddModalOpen(true)} className="text-blue-600 font-bold hover:underline">Criar agora</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} onClick={() => setSelectedWorkId(work.id)} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Status / Nome</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Progresso</th>
                <th className="px-6 py-4">Financeiro</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {works.map((work) => (
                <WorkRow key={work.id} work={work} onClick={() => setSelectedWorkId(work.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAddModalOpen && (
        <WorkModal onClose={() => setIsAddModalOpen(false)} onSave={addWork} title="Criar Nova Obra" />
      )}
    </div>
  );
};

// --- VIEW DE DETALHE DA OBRA ---

interface WorkDetailViewProps {
  work: Work;
  onBack: () => void;
  onDeleteItem: (id: string) => void;
  onUpdateWork: (data: Partial<Work>) => void;
  onEditItem: (item: WorkItem) => void;
  onAddItem: () => void;
}

const WorkDetailView: React.FC<WorkDetailViewProps> = ({ work, onBack, onDeleteItem, onUpdateWork, onEditItem, onAddItem }) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isEditWorkModalOpen, setIsEditWorkModalOpen] = useState(false);

  const totalMaterial = work.items.reduce((acc, i) => acc + i.result.totalMaterial, 0);
  const totalLabor = work.items.reduce((acc, i) => acc + i.result.totalLabor, 0);

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  return (
    <div className="animate-in slide-in-from-right-8 duration-300 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{work.title}</h2>
              <button 
                onClick={() => setIsEditWorkModalOpen(true)}
                className="text-slate-400 hover:text-blue-500 transition-colors"
                title="Editar informações da obra"
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <i className="fa-solid fa-location-dot"></i> {work.location}
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${work.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{work.status}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={onAddItem}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <i className="fa-solid fa-calculator"></i>
          Adicionar Cálculo
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Custo Total Atual</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">R$ {work.spent.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">de R$ {work.budget.toLocaleString('pt-BR')} estimado</p>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] text-slate-100 dark:text-slate-800 text-8xl opacity-50">
            <i className="fa-solid fa-wallet"></i>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-blue-500 mb-1">Materiais</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">R$ {totalMaterial.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-cubes"></i>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-orange-500 mb-1">Mão de Obra</p>
            <p className="text-xl font-black text-orange-700 dark:text-orange-300">R$ {totalLabor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-helmet-safety"></i>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Itens do Orçamento</h3>
          <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">{work.items.length} Itens</span>
        </div>

        {work.items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="fa-solid fa-calculator text-4xl mb-4 opacity-50"></i>
            <p>Nenhum cálculo salvo nesta obra ainda.</p>
            <p className="text-sm cursor-pointer hover:text-indigo-500 transition-colors" onClick={onAddItem}>Clique aqui para adicionar seu primeiro cálculo.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Resumo Técnico</th>
                <th className="px-6 py-4 text-right">Material</th>
                <th className="px-6 py-4 text-right">M.O.</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {work.items.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className={`transition-colors ${expandedItemId === item.id ? 'bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs ${
                          item.type === 'beam' ? 'bg-indigo-500' :
                          item.type === 'column' ? 'bg-emerald-500' :
                          item.type === 'slab' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}>
                          <i className={`fa-solid ${
                            item.type === 'beam' ? 'fa-grip-lines' :
                            item.type === 'column' ? 'fa-square' :
                            item.type === 'slab' ? 'fa-layer-group' : 'fa-mortar-pestle'
                          }`}></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</p>
                            {expandedItemId === item.id ? 
                              <i className="fa-solid fa-chevron-up text-[10px] text-slate-400"></i> : 
                              <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                            }
                          </div>
                          <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                      {item.result.summary}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                      R$ {item.result.totalMaterial.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                      R$ {item.result.totalLabor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-sm text-slate-800 dark:text-slate-200">
                      R$ {item.result.totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onEditItem(item)}
                          className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-500 text-slate-400 transition-colors"
                          title="Editar Cálculo"
                        >
                          <i className="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button 
                          onClick={() => onDeleteItem(item.id)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                          title="Excluir Item"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedItemId === item.id && (
                    <tr className="bg-slate-50 dark:bg-slate-800/50 animate-in fade-in">
                      <td colSpan={6} className="px-6 pb-6 pt-2">
                         <div className="pl-11">
                           <BOMTable items={item.result.items} onPriceChange={() => {}} />
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isEditWorkModalOpen && (
        <WorkModal 
          title="Editar Informações da Obra"
          onClose={() => setIsEditWorkModalOpen(false)}
          onSave={(data) => {
             onUpdateWork(data);
             setIsEditWorkModalOpen(false);
          }}
          initialData={{
            title: work.title,
            location: work.location,
            budget: work.budget,
            status: work.status,
            progress: work.progress
          }}
        />
      )}
    </div>
  );
};


// --- COMPONENTES AUXILIARES ---

const WorkRow: React.FC<{ work: Work; onClick: () => void }> = ({ work, onClick }) => {
  const statusColor = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700',
    'Delayed': 'bg-amber-100 text-amber-700'
  }[work.status];

  return (
    <tr onClick={onClick} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${statusColor.replace('bg-', 'bg-').split(' ')[0]}`}></span>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{work.title}</p>
            <span className={`text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded ${statusColor}`}>
              {work.status}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
        {work.location}
      </td>
      <td className="px-6 py-4">
        <div className="w-32">
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-slate-400">{work.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${work.status === 'Delayed' ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${work.progress}%` }}></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-medium">
        <p className="text-slate-800 dark:text-slate-200 font-bold">R$ {work.spent.toLocaleString('pt-BR')}</p>
        <p className="text-slate-400 text-[10px] uppercase">de R$ {work.budget.toLocaleString('pt-BR')}</p>
      </td>
      <td className="px-6 py-4 text-center">
        <i className="fa-solid fa-chevron-right text-slate-300"></i>
      </td>
    </tr>
  );
};

const WorkCard: React.FC<{ work: Work; onClick: () => void }> = ({ work, onClick }) => {
  const statusColor = {
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Delayed': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  }[work.status];

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${statusColor}`}>
            {work.status}
          </span>
          <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
            <i className="fa-solid fa-arrow-right-long"></i>
          </div>
        </div>
        
        <h4 className="text-lg font-black mb-1 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{work.title}</h4>
        <p className="text-slate-500 text-sm flex items-center gap-1.5 mb-6 font-medium">
          <i className="fa-solid fa-location-dot text-blue-500"></i>
          {work.location}
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <span>Progresso físico</span>
              <span>{work.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 shadow-inner">
              <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ${work.status === 'Delayed' ? 'bg-amber-500' : 'bg-blue-600'}`} 
                style={{ width: `${work.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Gasto Atual</p>
              <p className="font-black text-slate-800 dark:text-slate-200">
                R$ {work.spent.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400">Total Orcado</p>
              <p className="font-bold text-slate-500 dark:text-slate-400">
                R$ {work.budget.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WorkModalProps { 
  onClose: () => void; 
  onSave: (data: any) => void; 
  title: string;
  initialData?: any; 
}

const WorkModal: React.FC<WorkModalProps> = ({ onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    location: initialData?.location || '',
    budget: initialData?.budget || '',
    status: initialData?.status || 'In Progress',
    progress: initialData?.progress || 0
  });

  const handleSubmit = () => {
    if (!formData.title) return;
    onSave({
      title: formData.title,
      location: formData.location || 'Sem local',
      budget: Number(formData.budget) || 0,
      status: formData.status,
      progress: Number(formData.progress)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6">{title}</h3>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="label-style">Nome do Projeto</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="input-style"
              placeholder="Ex: Residencial Flores"
            />
          </div>
          <div>
            <label className="label-style">Localização</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="input-style"
              placeholder="Cidade, UF"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="label-style">Orçamento Previsto (R$)</label>
              <input 
                type="number" 
                value={formData.budget} 
                onChange={e => setFormData({...formData, budget: e.target.value})}
                className="input-style"
              />
            </div>
            <div>
              <label className="label-style">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="input-style"
              >
                <option value="In Progress">Em Andamento</option>
                <option value="Delayed">Atrasado</option>
                <option value="Completed">Concluído</option>
              </select>
            </div>
          </div>
          {initialData && (
            <div>
              <label className="label-style">Progresso Físico (%)</label>
              <input 
                type="number" 
                min="0" max="100"
                value={formData.progress} 
                onChange={e => setFormData({...formData, progress: e.target.value})}
                className="input-style"
              />
              <input 
                 type="range" min="0" max="100" 
                 value={formData.progress} 
                 onChange={e => setFormData({...formData, progress: e.target.value})}
                 className="w-full mt-2 accent-blue-600" 
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={handleSubmit} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Salvar Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorksView;
