
import React, { useState, useEffect } from 'react';
import { CalculatorHeader, StructuralResults, FormulaCard, BOMTable, BOMItem, ReportModal, LaborCostSection, SaveToWorkModal } from './CalculatorUI';
import { useWorks } from '../WorkContext';
import { CalculatorSetup } from '../../App';

interface ColumnCalculatorProps {
  initialSetup?: CalculatorSetup;
}

const ColumnCalculator: React.FC<ColumnCalculatorProps> = ({ initialSetup }) => {
  const { addItemToWork, updateItemInWork } = useWorks();

  const [sideA, setSideA] = useState(20);
  const [sideB, setSideB] = useState(20);
  const [height, setHeight] = useState(3);
  const [quantity, setQuantity] = useState(1);
  const [formType, setFormType] = useState<'madeira' | 'compensado'>('madeira');
  const [steelRatio, setSteelRatio] = useState(110);
  
  // Labor State
  const [includeLabor, setIncludeLabor] = useState(false);
  const [hoursPro, setHoursPro] = useState(0);
  const [ratePro, setRatePro] = useState(25.00); 
  const [hoursHelper, setHoursHelper] = useState(0);
  const [rateHelper, setRateHelper] = useState(15.00);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    if (initialSetup?.initialData) {
      const d = initialSetup.initialData;
      if (d.sideA) setSideA(d.sideA);
      if (d.sideB) setSideB(d.sideB);
      if (d.height) setHeight(d.height);
      if (d.quantity) setQuantity(d.quantity);
      if (d.steelRatio) setSteelRatio(d.steelRatio);
      if (d.formType) setFormType(d.formType);
      if (d.includeLabor !== undefined) setIncludeLabor(d.includeLabor);
      if (d.hoursPro) setHoursPro(d.hoursPro);
      if (d.ratePro) setRatePro(d.ratePro);
      if (d.hoursHelper) setHoursHelper(d.hoursHelper);
      if (d.rateHelper) setRateHelper(d.rateHelper);
    }
  }, [initialSetup]);

  const [prices, setPrices] = useState<Record<string, number>>({
    'cement': 42.00,
    'sand': 120.00,
    'gravel': 115.00,
    'sarrafo': 6.50,
    'plywood': 210.00,
    'bracing': 15.00,
    'nails': 17.50,
    'spacers': 0.65,
    'wire': 24.00
  });

  const handlePriceChange = (id: string, newPrice: number) => {
    setPrices(prev => ({ ...prev, [id]: newPrice }));
  };

  const volume = (sideA / 100) * (sideB / 100) * height * quantity;
  const areaForm = (2 * ((sideA / 100) + (sideB / 100))) * height * quantity;
  const steelWeight = volume * steelRatio;

  // Auto-estimate labor
  useEffect(() => {
    if (includeLabor && hoursPro === 0 && volume > 0 && !initialSetup?.initialData) {
       setHoursPro(Number((volume * 12).toFixed(1))); // Pilares demoram mais que vigas
       setHoursHelper(Number((volume * 14).toFixed(1)));
    }
  }, [includeLabor, volume, initialSetup]);

  const bom: BOMItem[] = [
    { id: 'cement', name: 'Cimento CP-III (50kg)', qty: Math.ceil(volume * 8), unit: 'sacos', category: 'Concreto', unitPrice: prices.cement },
    { id: 'sand', name: 'Areia Lavada', qty: Number((volume * 0.42).toFixed(2)), unit: 'm³', category: 'Concreto', unitPrice: prices.sand },
    { id: 'gravel', name: 'Brita 1 e 2', qty: Number((volume * 0.88).toFixed(2)), unit: 'm³', category: 'Concreto', unitPrice: prices.gravel },
    
    formType === 'madeira' 
      ? { id: 'sarrafo', name: 'Sarrafo de Pinus (10cm)', qty: Math.ceil(areaForm / 0.3 * 4), unit: 'm', category: 'Fôrma', unitPrice: prices.sarrafo }
      : { id: 'plywood', name: 'Compensado Plastificado (18mm)', qty: Math.ceil(areaForm / 2.97 / 8), unit: 'chapas', category: 'Fôrma', unitPrice: prices.plywood },
    { id: 'bracing', name: 'Gravatas de Madeira (Bracing)', qty: Math.ceil(height * quantity * 2.5), unit: 'un', category: 'Fôrma', unitPrice: prices.bracing },
    { id: 'nails', name: 'Pregos 18x27', qty: Number((areaForm * 0.35).toFixed(2)), unit: 'kg', category: 'Fôrma', unitPrice: prices.nails },
    
    { id: 'spacers', name: 'Espaçadores de Roda (Pilar)', qty: Math.ceil(height * quantity * 6), unit: 'un', category: 'Aço', unitPrice: prices.spacers },
    { id: 'wire', name: 'Arame Recozido', qty: Number((steelWeight * 0.025).toFixed(2)), unit: 'kg', category: 'Aço', unitPrice: prices.wire },
  ];

  if (includeLabor) {
    bom.push(
      { id: 'labor_pro', name: 'Mão de Obra (Pedreiro/Carpinteiro)', qty: hoursPro, unit: 'h', category: 'Mão de Obra', unitPrice: ratePro },
      { id: 'labor_help', name: 'Mão de Obra (Servente/Ajudante)', qty: hoursHelper, unit: 'h', category: 'Mão de Obra', unitPrice: rateHelper }
    );
  }

  const handleSaveAction = () => {
    if (initialSetup?.mode === 'edit' && initialSetup.targetWorkId && initialSetup.targetItemId) {
        const totalCost = bom.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
        const totalMaterial = bom.filter(i => i.category !== 'Mão de Obra').reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
        const totalLabor = bom.filter(i => i.category === 'Mão de Obra').reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);

        updateItemInWork(initialSetup.targetWorkId, initialSetup.targetItemId, {
             inputs: { sideA, sideB, height, quantity, steelRatio, formType, includeLabor, hoursPro, ratePro, hoursHelper, rateHelper },
             result: {
                totalCost,
                totalMaterial,
                totalLabor,
                summary: `${quantity}x Pilares (${sideA}x${sideB}cm) - ${volume.toFixed(2)}m³ Total`,
                items: bom
             }
        });
        alert('Item atualizado com sucesso!');
    } else {
        setIsSaveModalOpen(true);
    }
  };

  const handleSaveNew = (workId: string, itemName: string) => {
    const totalCost = bom.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const totalMaterial = bom.filter(i => i.category !== 'Mão de Obra').reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const totalLabor = bom.filter(i => i.category === 'Mão de Obra').reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);

    addItemToWork(workId, {
      type: 'column',
      title: itemName,
      inputs: { sideA, sideB, height, quantity, steelRatio, formType, includeLabor, hoursPro, ratePro, hoursHelper, rateHelper },
      result: {
        totalCost,
        totalMaterial,
        totalLabor,
        summary: `${quantity}x Pilares (${sideA}x${sideB}cm) - ${volume.toFixed(2)}m³ Total`,
        items: bom
      }
    });
    setIsSaveModalOpen(false);
    alert('Cálculo salvo com sucesso na obra!');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
      <CalculatorHeader title="Cálculo de Pilares" icon="fa-square" color="emerald" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          
          {/* BLOCO 1: PARAMETROS PARA VOLUME (CONCRETO) */}
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border-l-4 border-emerald-500">
             <h5 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <i className="fa-solid fa-cube"></i> Parâmetros para Volume
             </h5>
             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-style">Lado A (cm)</label>
                <input type="number" value={sideA} onChange={(e) => setSideA(Number(e.target.value))} className="input-style" />
              </div>
              <div>
                <label className="label-style">Lado B (cm)</label>
                <input type="number" value={sideB} onChange={(e) => setSideB(Number(e.target.value))} className="input-style" />
              </div>
              <div>
                <label className="label-style">Altura (m)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input-style" />
              </div>
              <div>
                <label className="label-style">Quantidade</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input-style" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* BLOCO 2: PARAMETROS PARA FÔRMA */}
             <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border-l-4 border-amber-500">
               <h5 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-border-all"></i> Para Fôrma
              </h5>
               <div>
                  <label className="label-style">Tipo de Material</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="input-style text-xs"
                  >
                    <option value="madeira">Tábuas/Sarrafo</option>
                    <option value="compensado">Compensado</option>
                  </select>
               </div>
             </div>
             
             {/* BLOCO 3: PARAMETROS PARA AÇO */}
             <div className="bg-slate-100/50 dark:bg-slate-800/50 p-5 rounded-2xl border-l-4 border-slate-500">
                <h5 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-bars-staggered"></i> Para Aço
                </h5>
                <div>
                  <label className="label-style">Taxa (kg/m³)</label>
                  <input type="number" value={steelRatio} onChange={(e) => setSteelRatio(Number(e.target.value))} className="input-style" />
                  <p className="text-[9px] text-slate-400 mt-1">Estimativa média</p>
                </div>
             </div>
          </div>
            
             {/* Mão de Obra Integration */}
            <LaborCostSection 
              enabled={includeLabor}
              onToggle={setIncludeLabor}
              hoursPro={hoursPro}
              ratePro={ratePro}
              onHoursProChange={setHoursPro}
              onRateProChange={setRatePro}
              hoursHelper={hoursHelper}
              rateHelper={rateHelper}
              onHoursHelperChange={setHoursHelper}
              onRateHelperChange={setRateHelper}
            />

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fórmulas Aplicadas</h5>
              <FormulaCard label="Perímetro" formula={`2 x (A+B)`} value={`${((2 * (sideA + sideB)) / 100).toFixed(2)} m`} icon="fa-ruler-combined" color="text-emerald-500" />
              <FormulaCard label="Peso Aço" formula={`Vol x Taxa`} value={`${steelWeight.toFixed(1)} kg`} icon="fa-bars-staggered" color="text-slate-500" />
            </div>
          </div>
        
        <div className="space-y-6">
          <StructuralResults volume={volume} areaForm={areaForm} steelWeight={steelWeight} />
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800">
             <h6 className="text-[10px] font-black text-emerald-700 uppercase mb-2 tracking-widest">Dica de Obra</h6>
             <p className="text-xs text-emerald-800 dark:text-emerald-400 opacity-80 leading-relaxed italic">
               Confira a lista de materiais abaixo para ver o consumo de gravatas e arame.
             </p>
          </div>
        </div>
      </div>

      <BOMTable items={bom} onPriceChange={handlePriceChange} />

      <div className="mt-12 flex justify-center gap-4">
        <button 
           onClick={handleSaveAction}
           className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-8 py-5 rounded-3xl font-black flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
        >
          <i className={`fa-solid ${initialSetup?.mode === 'edit' ? 'fa-rotate' : 'fa-cloud-arrow-up'} text-lg text-emerald-500`}></i>
          {initialSetup?.mode === 'edit' ? 'Atualizar Item' : 'Salvar na Obra'}
        </button>

        <button onClick={() => setIsReportOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-3xl font-black shadow-2xl shadow-emerald-500/20 flex items-center gap-4 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-xs">
          <i className="fa-solid fa-file-invoice-dollar text-lg"></i>
          Exportar Orçamento
        </button>
      </div>

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)}
        title="Pilar de Concreto Estrutural"
        bom={bom}
        icon="fa-square"
        totals={{ volume, areaForm, steelWeight }}
        summaryData={[
          { label: 'Seção do Pilar', value: `${sideA} x ${sideB} cm` },
          { label: 'Altura Total', value: `${height} m` },
          { label: 'Quantidade de Unidades', value: `${quantity} un` },
          { label: 'Volume por Pilar', value: `${(volume/quantity).toFixed(3)} m³` },
          { label: 'Fôrma Utilizada', value: formType === 'madeira' ? 'Tábua Serrada' : 'Compensado Plastificado' },
          { label: 'Estimativa de Aço', value: `${steelRatio} kg/m³` }
        ]}
      />
      
      <SaveToWorkModal 
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveNew}
        defaultName={`Pilar ${sideA}x${sideB} - ${height}m`}
        preSelectedWorkId={initialSetup?.targetWorkId}
      />
    </div>
  );
};

export default ColumnCalculator;
