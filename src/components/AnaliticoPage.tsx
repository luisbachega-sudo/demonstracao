
import React, { useState, useMemo, useEffect } from 'react';
import { CatalogItem, MultiRegimeResult } from '../types';
import { Search, ChevronRight, ChevronDown, Database, AlertCircle, AlertTriangle, Download, Info, Maximize2, Minimize2 } from 'lucide-react';

interface PriceSet { des: number; nd: number; se: number; }
interface ChildItem extends CatalogItem { unitPrices: PriceSet; lineTotal: PriceSet; }
interface GroupedComposition {
    parentCode: string;
    group: string;
    parentDesc: string;
    unit: string;
    officialPrices: PriceSet;
    items: ChildItem[];
    calculatedTotals: PriceSet;
    hasMissingPrices: boolean;
    hasNoCostItems: boolean;
}

// Fixed the missing interface for AnaliticoPageProps
interface AnaliticoPageProps {
  analiticoResult: MultiRegimeResult | null;
  compResult: MultiRegimeResult | null;
  insumoResult: MultiRegimeResult | null;
  selectedState?: string;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const AnaliticoPage: React.FC<AnaliticoPageProps> = ({ analiticoResult, compResult, insumoResult, selectedState = 'SP' }) => {
  const [filterTerm, setFilterTerm] = useState('');
  const [expandedCompIds, setExpandedCompIds] = useState<Set<string>>(new Set());
  const [expandedChildCodes, setExpandedChildCodes] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDiscrepanciesOnly, setShowDiscrepanciesOnly] = useState(false);
  const itemsPerPage = 50;

  const toggleChildDesc = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedChildCodes);
    if (newSet.has(code)) newSet.delete(code);
    else newSet.add(code);
    setExpandedChildCodes(newSet);
  };

  const priceMap = useMemo(() => {
    const map = new Map<string, PriceSet>();
    const normalizeKey = (k: any) => k ? String(k).trim().toUpperCase() : 'UNK';

    const addToMap = (list: CatalogItem[] | undefined, regimeKey: keyof PriceSet) => {
        if (!list) return;
        list.forEach(item => {
            const k = normalizeKey(item.code);
            if (!map.has(k)) map.set(k, { des: 0, nd: 0, se: 0 });
            const entry = map.get(k)!;
            let p = 0;
            if (item.priceMap && typeof item.priceMap[selectedState] === 'number' && item.priceMap[selectedState] > 0) p = item.priceMap[selectedState];
            else if (item.priceMap && typeof item.priceMap['SP'] === 'number' && item.priceMap['SP'] > 0) p = item.priceMap['SP'];
            else p = item.price || 0;
            entry[regimeKey] = p;
        });
    };

    if (insumoResult) {
        addToMap(insumoResult.desonerado, 'des');
        // Fix: Changed naoDesonerado to nao_desonerado and semEncargos to sem_encargos
        addToMap(insumoResult.nao_desonerado, 'nd');
        addToMap(insumoResult.sem_encargos, 'se');
    }
    if (compResult) {
        addToMap(compResult.desonerado, 'des');
        // Fix: Changed naoDesonerado to nao_desonerado and semEncargos to sem_encargos
        addToMap(compResult.nao_desonerado, 'nd');
        addToMap(compResult.sem_encargos, 'se');
    }
    return map;
  }, [insumoResult, compResult, selectedState]);

  const groupedAnalitico = useMemo(() => {
    const normalizeKey = (k: any) => k ? String(k).trim().toUpperCase() : 'UNK';
    const map = new Map<string, GroupedComposition>();

    if (compResult && compResult.desonerado) {
        compResult.desonerado.forEach(comp => {
            const key = normalizeKey(comp.code);
            map.set(key, {
                parentCode: comp.code, group: comp.group || 'Geral',
                parentDesc: comp.description, unit: comp.unit,
                officialPrices: priceMap.get(key) || { des: 0, nd: 0, se: 0 },
                items: [], calculatedTotals: { des: 0, nd: 0, se: 0 }, hasMissingPrices: false, hasNoCostItems: false
            });
        });
    }

    if (analiticoResult && analiticoResult.analitico) {
        analiticoResult.analitico.forEach(item => {
            const key = normalizeKey(item.parentCode);
            if (!map.has(key)) {
                map.set(key, { 
                    parentCode: item.parentCode!, group: 'Geral', 
                    parentDesc: item.parentDesc || `Comp. ${item.parentCode}`, unit: 'UN',
                    officialPrices: priceMap.get(key) || { des: 0, nd: 0, se: 0 }, 
                    items: [], calculatedTotals: { des: 0, nd: 0, se: 0 }, hasMissingPrices: false, hasNoCostItems: false
                });
            }
            const group = map.get(key)!;
            const childPrices = priceMap.get(normalizeKey(item.code)) || { des: 0, nd: 0, se: 0 };
            const coef = item.coefficient || 0;
            
            if (childPrices.des === 0) group.hasMissingPrices = true;
            if (item.situation?.toUpperCase().includes('SEM CUSTO')) group.hasNoCostItems = true;

            const lineTotal = { des: round2(childPrices.des * coef), nd: round2(childPrices.nd * coef), se: round2(childPrices.se * coef) };
            group.calculatedTotals.des += lineTotal.des;
            group.calculatedTotals.nd += lineTotal.nd;
            group.calculatedTotals.se += lineTotal.se;
            group.items.push({ ...item, unitPrices: childPrices, lineTotal });
        });
    }

    let groups = Array.from(map.values());
    if (filterTerm) {
        const lower = filterTerm.toLowerCase();
        groups = groups.filter(g => g.parentCode.toLowerCase().includes(lower) || g.parentDesc.toLowerCase().includes(lower));
    }
    if (showDiscrepanciesOnly) groups = groups.filter(g => Math.abs(g.officialPrices.des - g.calculatedTotals.des) > 0.05);
    return groups.sort((a,b) => a.parentCode.localeCompare(b.parentCode));
  }, [analiticoResult, compResult, priceMap, filterTerm, showDiscrepanciesOnly]);

  const displayedGroups = groupedAnalitico.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(groupedAnalitico.length / itemsPerPage);

  const GRID_COLS = "grid-cols-[40px_100px_1fr_60px_100px_100px_100px_100px]";
  const CHILD_COLS = "grid-cols-[60px_100px_1fr_60px_120px_100px_100px_100px_100px]";

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 custom-scrollbar overflow-hidden">
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            {groupedAnalitico.length} Composições Analisadas
          </div>
          <button 
            onClick={() => setShowDiscrepanciesOnly(!showDiscrepanciesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${showDiscrepanciesOnly ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            <AlertCircle className="w-4 h-4" /> Divergências
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-none rounded-xl text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Pesquisar..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        <div className={`grid ${GRID_COLS} gap-2 px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 dark:bg-slate-900 z-10`}>
          <div></div>
          <div>Código</div>
          <div>Descrição</div>
          <div className="text-center">UND</div>
          <div className="text-right">Oficial (R$)</div>
          <div className="text-right">Soma (R$)</div>
          <div className="text-right">Diff (R$)</div>
        </div>

        {displayedGroups.map(group => {
          const isExpanded = expandedCompIds.has(group.parentCode);
          const diff = Math.abs(group.officialPrices.des - group.calculatedTotals.des);
          const hasIssue = diff > 0.05;

          return (
            <div key={group.parentCode} className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm transition-all ${hasIssue ? 'border-amber-200 dark:border-amber-900/50' : 'border-slate-200 dark:border-slate-700'}`}>
              <div 
                className={`grid ${GRID_COLS} gap-2 p-4 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
                onClick={() => {
                  const newSet = new Set(expandedCompIds);
                  if (newSet.has(group.parentCode)) newSet.delete(group.parentCode); else newSet.add(group.parentCode);
                  setExpandedCompIds(newSet);
                }}
              >
                <div className="text-slate-400">{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</div>
                <div className="font-mono font-bold text-blue-600">{group.parentCode}</div>
                <div className="flex items-center gap-2 overflow-hidden">
                   <div className={`font-medium text-slate-800 dark:text-slate-200 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                     {group.parentDesc}
                   </div>
                   {group.hasNoCostItems && (
                     <div className="bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1 shrink-0">
                       <AlertTriangle className="w-3 h-3" /> SEM CUSTO NA BASE
                     </div>
                   )}
                </div>
                <div className="text-center font-bold text-slate-400 uppercase">{group.unit}</div>
                <div className="text-right font-bold">R$ {group.officialPrices.des.toFixed(2)}</div>
                <div className={`text-right font-bold ${hasIssue ? 'text-amber-500' : 'text-emerald-500'}`}>R$ {group.calculatedTotals.des.toFixed(2)}</div>
                <div className={`text-right font-bold ${hasIssue ? 'text-red-500' : 'text-slate-400'}`}>R$ {diff.toFixed(2)}</div>
              </div>
              
              {isExpanded && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 space-y-1">
                  {hasIssue && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                       <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                       <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                         Divergência detectada: A soma dos itens calculados (R$ {group.calculatedTotals.des.toFixed(2)}) difere do preço oficial SINAPI (R$ {group.officialPrices.des.toFixed(2)}). 
                         {group.hasNoCostItems ? " Verificamos que existem itens marcados como 'SEM CUSTO' na planilha original, o que explica esta diferença." : " Verifique se todos os coeficientes e insumos estão atualizados."}
                       </div>
                    </div>
                  )}

                  {group.items.map((item, idx) => {
                    const isAuxComp = item.category?.toUpperCase().includes('COMP');
                    const isNoCost = item.situation?.toUpperCase().includes('SEM CUSTO');
                    const childExpanded = expandedChildCodes.has(`${group.parentCode}-${item.code}-${idx}`);
                    
                    return (
                      <div key={idx} className={`grid ${CHILD_COLS} gap-2 px-4 py-2 text-[11px] items-start border-b border-slate-100 dark:border-slate-800/50 group/child ${isNoCost ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                        <div className={`text-[9px] font-black px-1.5 py-0.5 rounded text-center transition-colors mt-0.5 ${
                          isAuxComp 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' 
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        }`}>
                          {isAuxComp ? 'CPU' : 'INS'}
                        </div>
                        <div className="font-mono text-slate-500 mt-0.5">{item.code}</div>
                        <div 
                          className="flex flex-col gap-1 cursor-pointer overflow-hidden" 
                          onClick={(e) => toggleChildDesc(`${group.parentCode}-${item.code}-${idx}`, e)}
                        >
                           <div className={`text-slate-600 dark:text-slate-400 leading-relaxed ${childExpanded ? '' : 'line-clamp-2'}`}>
                              {item.description}
                           </div>
                           <div className="flex items-center gap-2">
                             {isNoCost && (
                               <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-1 shrink-0">
                                 <AlertTriangle className="w-2.5 h-2.5" /> SEM CUSTO
                               </span>
                             )}
                             <span className="text-[9px] font-bold text-blue-500 opacity-0 group-hover/child:opacity-100 uppercase tracking-widest">
                               {childExpanded ? "Ver menos" : "Ver mais"}
                             </span>
                           </div>
                        </div>
                        <div className="text-center text-slate-400 mt-0.5">{item.unit}</div>
                        <div className="text-right font-mono text-blue-500 mt-0.5">{item.coefficient?.toFixed(7)}</div>
                        <div className={`text-right mt-0.5 ${isNoCost ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                          x R$ {item.unitPrices.des.toFixed(2)}
                        </div>
                        <div className={`text-right font-bold mt-0.5 ${isNoCost ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          = R$ {item.lineTotal.des.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-center items-center gap-4">
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-2 text-slate-400 hover:text-blue-500"><ChevronRight className="rotate-180" /></button>
        <span className="text-xs font-bold text-slate-500">Página {currentPage} de {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className="p-2 text-slate-400 hover:text-blue-500"><ChevronRight /></button>
      </div>
    </div>
  );
};
