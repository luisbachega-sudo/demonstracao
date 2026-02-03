
import React, { useState, useEffect } from 'react';
import { CalculatorHeader, BOMTable, BOMItem, FormulaCard, ReportModal, SaveToWorkModal } from './CalculatorUI';
import { useWorks } from '../WorkContext';
import { CalculatorSetup } from '../../App';

interface MixCalculatorProps {
  initialSetup?: CalculatorSetup;
}

const MixCalculator: React.FC<MixCalculatorProps> = ({ initialSetup }) => {
  const { addItemToWork, updateItemInWork } = useWorks();

  const [volume, setVolume] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [propSand, setPropSand] = useState(2);
  const [propStone, setPropStone] = useState(3);
  const [waterCementRatio, setWaterCementRatio] = useState(0.5);
  
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    if (initialSetup?.initialData) {
      const d = initialSetup.initialData;
      if (d.volume) setVolume(d.volume);
      if (d.quantity) setQuantity(d.quantity);
      if (d.propSand) setPropSand(d.propSand);
      if (d.propStone) setPropStone(d.propStone);
      if (d.waterCementRatio) setWaterCementRatio(d.waterCementRatio);
    }
  }, [initialSetup]);

  const [prices, setPrices] = useState<Record<string, number>>({
    'cement': 42.00,
    'sand': 120.00,
    'gravel': 115.00,
    'water': 0.02
  });

  const handlePriceChange = (id: string, newPrice: number) => {
    setPrices(prev => ({ ...prev, [id]: newPrice }));
  };

  const totalVolume = volume * quantity;
  const yields = 0.64; 
  const partVolume = 0.036; 
  const cementSacks = totalVolume > 0 ? (totalVolume / (partVolume * (1 + propSand + propStone) * yields)) : 0;
  const sandVol = cementSacks * propSand * partVolume;
  const stoneVol = cementSacks * propStone * partVolume;
  const waterLitres = cementSacks * 50 * waterCementRatio;

  const bom: BOMItem[] = [
    { id: 'cement', name: 'Cimento CP-II (50kg)', qty: Math.ceil(cementSacks), unit: 'sacos', category: 'Concreto', unitPrice: prices.cement },
    { id: 'sand', name: 'Areia Média', qty: Number(sandVol.toFixed(2)), unit: 'm³', category: 'Concreto', unitPrice: prices.sand },
    { id: 'gravel', name: 'Brita 1 (Pedra)', qty: Number(stoneVol.toFixed(2)), unit: 'm³', category: 'Concreto', unitPrice: prices.gravel },
    { id: 'water', name: 'Água Potável', qty: Math.round(waterLitres), unit: 'L', category: 'Concreto', unitPrice: prices.water },
  ];

  const handleSaveAction = () => {
    if (initialSetup?.mode === 'edit' && initialSetup.targetWorkId && initialSetup.targetItemId) {
        const totalCost = bom.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
        const totalMaterial = totalCost; // Mix só tem material por enquanto
        
        updateItemInWork(initialSetup.targetWorkId, initialSetup.targetItemId, {
             inputs: { volume, quantity, propSand, propStone, waterCementRatio },
             result: {
                totalCost,
                totalMaterial,
                totalLabor: 0,
                summary: `${totalVolume.toFixed(2)}m³ de Concreto/Argamassa (1:${propSand}:${propStone})`,
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
    const totalMaterial = totalCost;

    addItemToWork(workId, {
      type: 'mix',
      title: itemName,
      inputs: { volume, quantity, propSand, propStone, waterCementRatio },
      result: {
        totalCost,
        totalMaterial,
        totalLabor: 0,
        summary: `${totalVolume.toFixed(2)}m³ de Concreto/Argamassa (1:${propSand}:${propStone})`,
        items: bom
      }
    });
    setIsSaveModalOpen(false);
    alert('Cálculo salvo com sucesso na obra!');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
      <CalculatorHeader title="Traço de Concreto" icon="fa-mortar-pestle" color="blue" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-style">Volume Unitário (m³)</label>
              <input type="number" value={volume} step="0.1" onChange={(e) => setVolume(Number(e.target.value))} className="input-style" />
            </div>
            <div>
              <label className="label-style">Quantidade (un)</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input-style" />
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h5 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Configuração do Traço (1 : A : B)</h5>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">CIMENTO</label>
                <div className="h-11 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-bold">1</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">AREIA (A)</label>
                <input type="number" value={propSand} step="0.1" onChange={(e) => setPropSand(Number(e.target.value))} className="input-style h-11" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">BRITA (B)</label>
                <input type="number" value={propStone} step="0.1" onChange={(e) => setPropStone(Number(e.target.value))} className="input-style h-11" />
              </div>
            </div>
            <div className="mt-6">
              <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">Relação Água/Cimento (A/C)</label>
              <input type="range" min="0.3" max="0.8" step="0.01" value={waterCementRatio} onChange={(e) => setWaterCementRatio(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                <span>SECO (0.3)</span>
                <span className="text-blue-600 text-sm">{waterCementRatio.toFixed(2)}</span>
                <span>FLUIDO (0.8)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Resumo de Saída</h5>
          <FormulaCard 
            label="Volume Total Estimado" 
            formula={`${volume}m³ x ${quantity}`} 
            value={`${totalVolume.toFixed(3)} m³`}
            icon="fa-cube" color="text-blue-500"
          />
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-400 leading-relaxed italic border border-blue-100 dark:border-blue-800">
            *O cálculo de volume de materiais é uma estimativa baseada no rendimento médio do traço seco para concreto fresco. Considere 5-10% de margem para perdas.
          </div>
        </div>
      </div>

      <BOMTable items={bom} onPriceChange={handlePriceChange} />

      <div className="mt-12 flex justify-center gap-4">
        <button 
           onClick={handleSaveAction}
           className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-8 py-5 rounded-3xl font-black flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
        >
          <i className={`fa-solid ${initialSetup?.mode === 'edit' ? 'fa-rotate' : 'fa-cloud-arrow-up'} text-lg text-blue-500`}></i>
          {initialSetup?.mode === 'edit' ? 'Atualizar Item' : 'Salvar na Obra'}
        </button>
        
        <button 
          onClick={() => setIsReportOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-xs"
        >
          <i className="fa-solid fa-file-invoice"></i>
          GERAR RELATÓRIO TÉCNICO
        </button>
      </div>

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)}
        title="Relatório de Traço de Concreto"
        bom={bom}
        icon="fa-mortar-pestle"
        totals={{ volume: totalVolume, areaForm: 0, steelWeight: 0 }}
        summaryData={[
          { label: 'Proporção do Traço', value: `1 : ${propSand} : ${propStone}` },
          { label: 'Volume Total Projeto', value: `${totalVolume.toFixed(3)} m³` },
          { label: 'Relação Água/Cimento', value: waterCementRatio.toFixed(2) },
          { label: 'Rendimento Médio', value: `${(yields * 100).toFixed(0)}%` }
        ]}
      />
      
      <SaveToWorkModal 
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveNew}
        defaultName={`Traço 1:${propSand}:${propStone} - ${totalVolume}m³`}
        preSelectedWorkId={initialSetup?.targetWorkId}
      />
    </div>
  );
};

export default MixCalculator;
