
import React, { useState, useEffect } from 'react';
import { CalculatorHeader, StructuralResults, FormulaCard, BOMTable, BOMItem, ReportModal, LaborCostSection, SaveToWorkModal } from './CalculatorUI';
import { useWorks } from '../WorkContext';
import { CalculatorSetup } from '../../App';

interface SlabCalculatorProps {
  initialSetup?: CalculatorSetup;
}

const SlabCalculator: React.FC<SlabCalculatorProps> = ({ initialSetup }) => {
  const { addItemToWork, updateItemInWork } = useWorks();

  const [width, setWidth] = useState(5);
  const [length, setLength] = useState(5);
  const [thickness, setThickness] = useState(12);
  const [quantity, setQuantity] = useState(1);
  const [steelRatio, setSteelRatio] = useState(70);

  const [includeLabor, setIncludeLabor] = useState(false);
  const [hoursPro, setHoursPro] = useState(0);
  const [ratePro, setRatePro] = useState(25.00); 
  const [hoursHelper, setHoursHelper] = useState(0);
  const [rateHelper, setRateHelper] = useState(15.00);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    if (initialSetup?.initialData) {
      const d = initialSetup.initialData;
      if (d.width) setWidth(d.width);
      if (d.length) setLength(d.length);
      if (d.thickness) setThickness(d.thickness);
      if (d.quantity) setQuantity(d.quantity);
      if (d.steelRatio) setSteelRatio(d.steelRatio);
    }
  }, [initialSetup]);

  const volume = width * length * (thickness / 100) * quantity;
  const areaForm = width * length * quantity;
  const steelWeight = volume * steelRatio;

  const bom: BOMItem[] = [
    { id: 'concrete', name: 'Concreto FCK 25 (Usinado)', qty: volume, unit: 'm³', category: 'Concreto', unitPrice: 520 },
    { id: 'plywood', name: 'Compensado Plastificado (Fundo)', qty: Math.ceil(areaForm / 2.97), unit: 'chapas', category: 'Fôrma', unitPrice: 185 },
    { id: 'props', name: 'Locação Escoramento (m²/mês)', qty: Math.ceil(areaForm), unit: 'm²', category: 'Fôrma', unitPrice: 15 },
    { id: 'mesh', name: 'Malha de Aço Soldada', qty: Math.ceil(areaForm / 6), unit: 'un', category: 'Aço', unitPrice: 85 },
  ];

  if (includeLabor) {
    bom.push(
      { id: 'labor_pro', name: 'Mão de Obra (Pedreiro)', qty: hoursPro || volume * 8, unit: 'h', category: 'Mão de Obra', unitPrice: ratePro },
      { id: 'labor_help', name: 'Mão de Obra (Ajudante)', qty: hoursHelper || volume * 8, unit: 'h', category: 'Mão de Obra', unitPrice: rateHelper }
    );
  }

  const handleSaveAction = () => {
    if (initialSetup?.mode === 'edit' && initialSetup.targetWorkId && initialSetup.targetItemId) {
        updateItemInWork(initialSetup.targetWorkId, initialSetup.targetItemId, {
             inputs: { width, length, thickness, quantity },
             result: { totalCost: bom.reduce((a,b)=>a+(b.qty*b.unitPrice),0), totalMaterial: bom.filter(i=>i.category!=='Mão de Obra').reduce((a,b)=>a+(b.qty*b.unitPrice),0), totalLabor: bom.filter(i=>i.category==='Mão de Obra').reduce((a,b)=>a+(b.qty*b.unitPrice),0), summary: `Laje Maciça ${width}x${length}m`, items: bom }
        });
        alert('Item atualizado!');
    } else {
        setIsSaveModalOpen(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border shadow-xl">
      <CalculatorHeader title="Cálculo de Laje Maciça" icon="fa-layer-group" color="purple" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-style">Largura (m)</label><input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="input-style" /></div>
            <div><label className="label-style">Comprimento (m)</label><input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="input-style" /></div>
            <div><label className="label-style">Espessura (cm)</label><input type="number" value={thickness} onChange={e => setThickness(Number(e.target.value))} className="input-style" /></div>
            <div><label className="label-style">Quantidade</label><input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input-style" /></div>
          </div>
          <LaborCostSection enabled={includeLabor} onToggle={setIncludeLabor} hoursPro={hoursPro} ratePro={ratePro} onHoursProChange={setHoursPro} onRateProChange={setRatePro} hoursHelper={hoursHelper} rateHelper={rateHelper} onHoursHelperChange={setHoursHelper} onRateHelperChange={setRateHelper} />
        </div>
        
        <div className="space-y-6">
          <StructuralResults volume={volume} areaForm={areaForm} steelWeight={steelWeight} />
        </div>
      </div>

      <BOMTable items={bom} onPriceChange={() => {}} />

      <div className="mt-12 flex justify-center gap-4">
        <button onClick={handleSaveAction} className="bg-white border px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-xs">Salvar na Obra</button>
        <button onClick={() => setIsReportOpen(true)} className="bg-purple-600 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs">Gerar Relatório</button>
      </div>

      <SaveToWorkModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={(wId, name) => {
        addItemToWork(wId, { type: 'slab', title: name, inputs: { width, length, thickness, quantity }, result: { totalCost: bom.reduce((a,b)=>a+(b.qty*b.unitPrice),0), totalMaterial: bom.filter(i=>i.category!=='Mão de Obra').reduce((a,b)=>a+(b.qty*b.unitPrice),0), totalLabor: bom.filter(i=>i.category==='Mão de Obra').reduce((a,b)=>a+(b.qty*b.unitPrice),0), summary: `Laje ${width}x${length}m`, items: bom }});
        setIsSaveModalOpen(false);
      }} defaultName="Laje de Concreto" preSelectedWorkId={initialSetup?.targetWorkId} />
    </div>
  );
};

export default SlabCalculator;
