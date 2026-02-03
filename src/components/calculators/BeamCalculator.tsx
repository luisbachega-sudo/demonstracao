
import React, { useState, useEffect } from 'react';
import { CalculatorHeader, StructuralResults, FormulaCard, BOMTable, BOMItem, ReportModal, LaborCostSection, SaveToWorkModal } from './CalculatorUI';
import { useWorks } from '../WorkContext';
import { useSettings } from '../SettingsContext';
import { CalculatorSetup } from '../../App';

interface BeamCalculatorProps {
  initialSetup?: CalculatorSetup;
}

const BeamCalculator: React.FC<BeamCalculatorProps> = ({ initialSetup }) => {
  const { addItemToWork, updateItemInWork } = useWorks();
  const { settings } = useSettings();
  
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(30);
  const [length, setLength] = useState(4);
  const [quantity, setQuantity] = useState(1);
  const [steelRatio, setSteelRatio] = useState(90); 

  // --- FILTROS DINÂMICOS DA PLANILHA ---
  const beamFormTable = settings.tables.find(t => t.id === 'table_beam_form');
  const [formFilters, setFormFilters] = useState<Record<string, string>>({});

  // Labor State
  const [includeLabor, setIncludeLabor] = useState(false);
  const [hoursPro, setHoursPro] = useState(0);
  const [ratePro, setRatePro] = useState(25.00); 
  const [hoursHelper, setHoursHelper] = useState(0);
  const [rateHelper, setRateHelper] = useState(15.00); 

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Inicializa filtros com os primeiros valores da tabela
  useEffect(() => {
    if (beamFormTable && Object.keys(formFilters).length === 0) {
      const initial: Record<string, string> = {};
      beamFormTable.inputColumns.forEach(col => {
        const uniqueValues = Array.from(new Set(beamFormTable.rows.map(r => r.inputs[col])));
        initial[col] = uniqueValues[0] || '';
      });
      setFormFilters(initial);
    }
  }, [beamFormTable]);

  useEffect(() => {
    if (initialSetup?.initialData) {
      const d = initialSetup.initialData;
      if (d.width) setWidth(d.width);
      if (d.height) setHeight(d.height);
      if (d.length) setLength(d.length);
      if (d.quantity) setQuantity(d.quantity);
      if (d.steelRatio) setSteelRatio(d.steelRatio);
      if (d.formFilters) setFormFilters(d.formFilters);
      if (d.includeLabor !== undefined) setIncludeLabor(d.includeLabor);
      if (d.hoursPro) setHoursPro(d.hoursPro);
      if (d.ratePro) setRatePro(d.ratePro);
      if (d.hoursHelper) setHoursHelper(d.hoursHelper);
      if (d.rateHelper) setRateHelper(d.rateHelper);
    }
  }, [initialSetup]);

  // Cálculos Base
  const volume = (width / 100) * (height / 100) * length * quantity;
  const areaForm = ((2 * (height / 100)) + (width / 100)) * length * quantity;
  const steelWeight = volume * steelRatio;

  // --- MOTOR DE BUSCA NA MATRIZ ---
  const matchingRow = beamFormTable?.rows.find(row => {
    return Object.entries(formFilters).every(([key, val]) => row.inputs[key] === val);
  });

  const bom: BOMItem[] = [
    { id: 'cement', name: 'Cimento CP-II (50kg)', qty: Math.ceil(volume * 7.5), unit: 'sacos', category: 'Concreto', unitPrice: 42.00 },
    { id: 'sand', name: 'Areia Média', qty: Number((volume * 0.45).toFixed(2)), unit: 'm³', category: 'Concreto', unitPrice: 120 },
    { id: 'gravel', name: 'Brita 1', qty: Number((volume * 0.85).toFixed(2)), unit: 'm³', category: 'Concreto', unitPrice: 115 },
    { id: 'water', name: 'Água', qty: Math.round(volume * 180), unit: 'L', category: 'Concreto', unitPrice: 0.02 },
    { id: 'wire', name: 'Arame Recozido 18 BWG', qty: Number((steelWeight * 0.02).toFixed(2)), unit: 'kg', category: 'Aço', unitPrice: 24 },
    { id: 'spacers', name: 'Espaçadores', qty: Math.ceil(length * quantity * 3), unit: 'un', category: 'Aço', unitPrice: 0.45 },
  ];

  // Adiciona itens da Fôrma baseado na planilha Admin
  if (matchingRow) {
    matchingRow.outputs.forEach((out, idx) => {
      bom.push({
        id: `form-out-${idx}`,
        name: out.materialName,
        qty: Number((areaForm * out.coefficient).toFixed(4)),
        unit: out.unit,
        category: out.category,
        unitPrice: 20 // Preço base fixo para o exemplo
      });
    });
  }

  if (includeLabor) {
    bom.push(
      { id: 'labor_pro', name: 'Mão de Obra (Pedreiro/Carpinteiro)', qty: hoursPro, unit: 'h', category: 'Mão de Obra', unitPrice: ratePro },
      { id: 'labor_help', name: 'Mão de Obra (Servente/Ajudante)', qty: hoursHelper, unit: 'h', category: 'Mão de Obra', unitPrice: rateHelper }
    );
  }

  const handleSaveAction = () => {
    const totalCost = bom.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const dataToSave = {
      inputs: { width, height, length, quantity, steelRatio, formFilters, includeLabor, hoursPro, ratePro, hoursHelper, rateHelper },
      result: {
        totalCost,
        totalMaterial: bom.filter(i => i.category !== 'Mão de Obra').reduce((acc, item) => acc + (item.qty * item.unitPrice), 0),
        totalLabor: bom.filter(i => i.category === 'Mão de Obra').reduce((acc, item) => acc + (item.qty * item.unitPrice), 0),
        summary: `${quantity}x Vigas (${width}x${height}cm) - ${volume.toFixed(2)}m³`,
        items: bom
      }
    };
    if (initialSetup?.mode === 'edit' && initialSetup.targetWorkId && initialSetup.targetItemId) {
        updateItemInWork(initialSetup.targetWorkId, initialSetup.targetItemId, dataToSave);
        alert('Item atualizado!');
    } else {
        setIsSaveModalOpen(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
      <CalculatorHeader title="Cálculo de Vigas Paramétrico" icon="fa-grip-lines" color="indigo" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border-l-4 border-blue-500">
            <h5 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Geometria da Peça</h5>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-style">Largura (cm)</label><input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="input-style" /></div>
              <div><label className="label-style">Altura (cm)</label><input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="input-style" /></div>
              <div><label className="label-style">Comprimento (m)</label><input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="input-style" /></div>
              <div><label className="label-style">Quantidade</label><input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input-style" /></div>
            </div>
          </div>

          {/* FILTROS DINÂMICOS DA PLANILHA */}
          <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border-l-4 border-amber-500">
            <h5 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <i className="fa-solid fa-table"></i> Critérios Construtivos (Fôrma)
            </h5>
            <div className="space-y-4">
               {beamFormTable?.inputColumns.map(col => (
                 <div key={col}>
                    <label className="label-style">{col}</label>
                    <select 
                      value={formFilters[col] || ''}
                      onChange={e => setFormFilters({...formFilters, [col]: e.target.value})}
                      className="input-style text-xs"
                    >
                      {Array.from(new Set(beamFormTable.rows.map(r => r.inputs[col]))).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                 </div>
               ))}
            </div>
            {!matchingRow && (
              <p className="mt-3 text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded">
                ALERTA: Esta combinação não possui coeficientes cadastrados no Painel Admin.
              </p>
            )}
          </div>

          <div className="bg-slate-100/50 dark:bg-slate-800/50 p-5 rounded-2xl border-l-4 border-slate-500">
            <h5 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4">Armadura</h5>
            <label className="label-style">Taxa de Aço (kg/m³)</label>
            <input type="number" value={steelRatio} onChange={e => setSteelRatio(Number(e.target.value))} className="input-style" />
          </div>

          <LaborCostSection enabled={includeLabor} onToggle={setIncludeLabor} hoursPro={hoursPro} ratePro={ratePro} onHoursProChange={setHoursPro} onRateProChange={setRatePro} hoursHelper={hoursHelper} rateHelper={rateHelper} onHoursHelperChange={setHoursHelper} onRateHelperChange={setRateHelper} />
        </div>
        
        <div className="space-y-6">
          <StructuralResults volume={volume} areaForm={areaForm} steelWeight={steelWeight} />
          <div className="space-y-3">
             <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <p className="text-[10px] font-black uppercase text-indigo-500 mb-2">Resumo da Planilha de Consumo</p>
                {matchingRow ? (
                  <div className="space-y-1">
                    {matchingRow.outputs.map((out, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-medium text-indigo-700 dark:text-indigo-300 italic">
                        <span>{out.materialName}:</span>
                        <span>{out.coefficient.toFixed(4)} {out.unit}/m²</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400 italic">Configure no Painel Admin</p>}
             </div>
             <FormulaCard label="Volume" formula="L x H x C" value={`${volume.toFixed(3)} m³`} icon="fa-cube" color="text-blue-500" />
             <FormulaCard label="Área Fôrma" formula="Perímetro x C" value={`${areaForm.toFixed(2)} m²`} icon="fa-border-all" color="text-amber-500" />
          </div>
        </div>
      </div>

      <BOMTable items={bom} onPriceChange={() => {}} />

      <div className="mt-12 flex justify-center gap-4">
        <button onClick={handleSaveAction} className="bg-white dark:bg-slate-800 border px-8 py-5 rounded-3xl font-black flex items-center gap-3 uppercase tracking-widest text-xs">
          <i className="fa-solid fa-cloud-arrow-up text-blue-500"></i> {initialSetup?.mode === 'edit' ? 'Atualizar' : 'Salvar na Obra'}
        </button>
        <button onClick={() => setIsReportOpen(true)} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black shadow-lg uppercase tracking-widest text-xs">Gerar Relatório</button>
      </div>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Viga com Consumo Parametrizado" bom={bom} icon="fa-grip-lines" totals={{ volume, areaForm, steelWeight }} summaryData={[{ label: 'Seção', value: `${width}x${height}cm` }, { label: 'Comp. Total', value: `${length * quantity}m` }]} />
      <SaveToWorkModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={(wId, name) => {
        addItemToWork(wId, { type: 'beam', title: name, inputs: { width, height, length, quantity, steelRatio, formFilters }, result: { totalCost: bom.reduce((a,b)=>a+(b.qty*b.unitPrice),0), totalMaterial: bom.filter(i=>i.category!=='Mão de Obra').reduce((a,b)=>a+(b.qty*b.unitPrice),0), totalLabor: bom.filter(i=>i.category==='Mão de Obra').reduce((a,b)=>a+(b.qty*b.unitPrice),0), summary: `${quantity}x Vigas (${width}x${height}cm)`, items: bom }});
        setIsSaveModalOpen(false);
      }} defaultName={`Viga Paramétrica ${width}x${height}`} preSelectedWorkId={initialSetup?.targetWorkId} />
    </div>
  );
};

export default BeamCalculator;
