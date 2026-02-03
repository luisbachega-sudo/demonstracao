
import React, { useState } from 'react';
import { useSettings } from './SettingsContext';
import { ParametricTable, TableRow } from '../types';

const SettingsView: React.FC = () => {
  const { settings, updateTable, resetDefaults } = useSettings();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(settings.tables[0]?.id || null);

  const activeTable = settings.tables.find(t => t.id === selectedTableId);

  const handleAddRow = () => {
    if (!activeTable) return;
    const newRow: TableRow = {
      id: crypto.randomUUID(),
      inputs: activeTable.inputColumns.reduce((acc, col) => ({ ...acc, [col]: '' }), {}),
      outputs: activeTable.rows[0]?.outputs.map(o => ({ ...o, coefficient: 0 })) || []
    };
    updateTable(activeTable.id, { ...activeTable, rows: [...activeTable.rows, newRow] });
  };

  const handleUpdateCell = (rowId: string, inputName: string, value: string) => {
    if (!activeTable) return;
    const newRows = activeTable.rows.map(r => 
      r.id === rowId ? { ...r, inputs: { ...r.inputs, [inputName]: value } } : r
    );
    updateTable(activeTable.id, { ...activeTable, rows: newRows });
  };

  const handleUpdateOutput = (rowId: string, outputIdx: number, value: number) => {
    if (!activeTable) return;
    const newRows = activeTable.rows.map(r => {
      if (r.id !== rowId) return r;
      const newOutputs = [...r.outputs];
      newOutputs[outputIdx] = { ...newOutputs[outputIdx], coefficient: value };
      return { ...r, outputs: newOutputs };
    });
    updateTable(activeTable.id, { ...activeTable, rows: newRows });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Configurações de Engenharia</h3>
          <p className="text-slate-500">Gerencie as tabelas de coeficientes de consumo conforme normas da empresa.</p>
        </div>
        <button onClick={resetDefaults} className="text-xs text-red-500 font-bold hover:underline">RESTAURAR PADRÕES</button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        {settings.tables.map(t => (
          <button 
            key={t.id} 
            onClick={() => setSelectedTableId(t.id)}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${selectedTableId === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500'}`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {activeTable && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  {activeTable.inputColumns.map(col => (
                    <th key={col} className="px-4 py-4 font-black uppercase tracking-widest text-slate-400 border-r border-slate-200 dark:border-slate-800">{col}</th>
                  ))}
                  {activeTable.rows[0]?.outputs.map((out, idx) => (
                    <th key={idx} className="px-4 py-4 font-black uppercase tracking-widest text-blue-500 bg-blue-50/30">
                      {out.materialName} ({out.unit})
                    </th>
                  ))}
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeTable.rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {activeTable.inputColumns.map(col => (
                      <td key={col} className="p-2 border-r border-slate-200 dark:border-slate-800">
                        <input 
                          value={row.inputs[col]} 
                          onChange={e => handleUpdateCell(row.id, col, e.target.value)}
                          className="w-full bg-transparent p-2 font-bold focus:bg-white dark:focus:bg-slate-800 outline-none rounded"
                        />
                      </td>
                    ))}
                    {row.outputs.map((out, idx) => (
                      <td key={idx} className="p-2 bg-blue-50/10">
                        <input 
                          type="number" 
                          step="0.000001"
                          value={out.coefficient} 
                          onChange={e => handleUpdateOutput(row.id, idx, Number(e.target.value))}
                          className="w-full bg-transparent p-2 font-mono text-blue-600 text-center focus:bg-white dark:focus:bg-slate-800 outline-none rounded"
                        />
                      </td>
                    ))}
                    <td className="p-2">
                       <button className="text-slate-300 hover:text-red-500"><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/30">
             <button onClick={handleAddRow} className="text-blue-600 font-bold text-sm hover:underline">
               <i className="fa-solid fa-plus mr-2"></i> ADICIONAR NOVA LINHA DE COMPOSIÇÃO
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
