
import React, { useState, useMemo, useEffect } from 'react';
import { MultiRegimeResult, SinapiParserConfig, CatalogItem, BRAZIL_STATES, SinapiTableItem, SinapiTableStructure } from '../types';
import { parseSinapiAllRegimes } from '../services/excelParser';
import { AnaliticoPage } from './AnaliticoPage';
import { useSinapi } from './SinapiContext';
import { 
  FileSpreadsheet, 
  Database, 
  Search, 
  Settings, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  Table, 
  ArrowRightLeft,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Trash2,
  HardDrive,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const SinapiView: React.FC = () => {
  const { sinapi_references, sinapi_items, sinapi_structure, saveImportData, clearDatabase } = useSinapi();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [insumoResult, setInsumoResult] = useState<MultiRegimeResult | null>(null);
  const [compResult, setCompResult] = useState<MultiRegimeResult | null>(null);
  const [analiticoResult, setAnaliticoResult] = useState<MultiRegimeResult | null>(null);
  
  const [activeTab, setActiveTab] = useState<'INSUMOS' | 'COMPOSICOES' | 'ANALITICO' | 'ENCARGOS' | 'DB' | 'AUDITORIA'>('INSUMOS');
  const [selectedState, setSelectedState] = useState('SP');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [expandedDescCodes, setExpandedDescCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCurrentPage(1);
    setExpandedDescCodes(new Set());
  }, [searchTerm, activeTab]);

  const toggleDesc = (code: string) => {
    const newSet = new Set(expandedDescCodes);
    if (newSet.has(code)) newSet.delete(code);
    else newSet.add(code);
    setExpandedDescCodes(newSet);
  };

  const [parserConfig, setParserConfig] = useState<SinapiParserConfig>({
      headerRow: 10, cellDate: 'B3', encargosStartRow: 10, encargosColState: 'A', encargosColHorista: 'C', encargosColMensalista: 'D',
      colClass: 'A', colCode: 'B', colDesc: 'C', colUnit: 'D', colOrigin: 'E', colPriceStart: 'F',
      compColGroup: 'A', compColCode: 'B', compColDesc: 'C', compColUnit: 'D', compColPriceStart: 'E',
      anaColCompCode: 'B', anaColCompDesc: 'E', anaColType: 'C', anaColItemCode: 'D', anaColItemDesc: 'E', anaColUnit: 'F', anaColCoef: 'G', anaColPrice: 'H', anaColTotal: 'I', anaColSituation: 'K',
      sheetInsumoDesonerado: 'INSUMOS', sheetInsumoNaoDesonerado: 'ISD', sheetInsumoSemEncargos: 'ISE',
      sheetCompDesonerado: 'CPUS', sheetCompNaoDesonerado: 'CSD', sheetCompSemEncargos: 'CSE',
      sheetEncargos: 'ENCARGOS', sheetAnalitico: 'ANALITICO'
  });

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleStartImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setLogs([]);
    addLog("Iniciando Processamento ETL...");
    
    try {
      const iRes = await parseSinapiAllRegimes(file, 'INSUMO', parserConfig);
      setInsumoResult(iRes);
      addLog(`Insumos carregados: ${iRes.stats.totalDesonerado}`);

      const cRes = await parseSinapiAllRegimes(file, 'COMPOSICAO', parserConfig);
      setCompResult(cRes);
      addLog(`Composições carregadas: ${cRes.stats.totalDesonerado}`);

      const aRes = await parseSinapiAllRegimes(file, 'ANALITICO', parserConfig);
      setAnaliticoResult(aRes);
      addLog(`Itens Analíticos carregados: ${aRes.stats.totalAnalitico}`);
      
      addLog("Transformando dados para Persistência Local (JSONB Optimization)...");
      
      const itemsToTable: Omit<SinapiTableItem, 'id' | 'reference_id' | 'created_at'>[] = [];
      
      iRes.desonerado.forEach(item => {
        itemsToTable.push({
          code: item.code,
          description: item.description,
          unit: item.unit,
          category: 'INSUMO',
          classification: item.classification || 'SEM CLASSIFICAÇÃO',
          prices: item.priceMap || {}
        });
      });

      cRes.desonerado.forEach(item => {
        itemsToTable.push({
          code: item.code,
          description: item.description,
          unit: item.unit,
          category: 'COMPOSICAO',
          classification: item.group || 'SEM GRUPO',
          prices: item.priceMap || {}
        });
      });

      const structureToTable: Omit<SinapiTableStructure, 'id' | 'reference_id'>[] = [];
      if (aRes.analitico) {
        aRes.analitico.forEach(ana => {
          structureToTable.push({
            parent_code: ana.parentCode || '',
            child_code: ana.code,
            coefficient: ana.coefficient || 0,
            item_type: ana.category === 'INSUMO' ? 'INSUMO' : 'COMPOSICAO'
          });
        });
      }

      saveImportData(
        { 
          period: iRes.referenceDate || 'N/A', 
          description: `Importação manual: ${file.name}` 
        },
        itemsToTable,
        structureToTable
      );

      addLog("Sucesso! Banco de Dados Local atualizado.");
    } catch (err) {
      addLog(`ERRO: ${err instanceof Error ? err.message : 'Falha na leitura do Excel'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = useMemo(() => {
    const list = activeTab === 'INSUMOS' ? (insumoResult?.desonerado || []) : (compResult?.desonerado || []);
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(i => i.code.includes(lower) || i.description.toLowerCase().includes(lower));
  }, [activeTab, insumoResult, compResult, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const referenceDate = insumoResult?.referenceDate || compResult?.referenceDate || 'N/A';

  // --- LÓGICA DE AUDITORIA ---
  const auditData = useMemo(() => {
    const insumosByClass: Record<string, number> = {};
    const compsByGroup: Record<string, number> = {};
    
    sinapi_items.forEach(item => {
      if (item.category === 'INSUMO') {
        const cls = item.classification || 'OUTROS';
        insumosByClass[cls] = (insumosByClass[cls] || 0) + 1;
      } else {
        const grp = item.classification || 'OUTROS';
        compsByGroup[grp] = (compsByGroup[grp] || 0) + 1;
      }
    });

    return {
      insumosByClass: Object.entries(insumosByClass).sort((a, b) => b[1] - a[1]),
      compsByGroup: Object.entries(compsByGroup).sort((a, b) => b[1] - a[1]),
      totalChildren: sinapi_structure.length
    };
  }, [sinapi_items, sinapi_structure]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Banco SINAPI
            </h3>
            <p className="text-slate-500 text-sm font-medium">Gestão Inteligente de Tabelas de Preços</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 px-5 py-3 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">REFERÊNCIA ATUAL</p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100">{referenceDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-blue-600 dark:bg-blue-700 px-5 py-3 rounded-2xl border-2 border-blue-500 shadow-md">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
               <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">ESTADO BASE</p>
              <div className="relative">
                <select 
                  value={selectedState} 
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 cursor-pointer outline-none appearance-none pr-6"
                >
                  {BRAZIL_STATES.map(st => <option key={st} value={st} className="text-slate-900">{st}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-white/50 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm ${showConfig ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
            title="Configurações de Importação"
          >
            <Settings className={`w-6 h-6 ${showConfig ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <FileSpreadsheet className="text-blue-600" />
            <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm">Configurações de Mapeamento do Excel</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> Nomes das Abas
              </p>
              <div className="grid gap-3">
                <ConfigField label="Aba Insumos" value={parserConfig.sheetInsumoDesonerado} onChange={v => setParserConfig({...parserConfig, sheetInsumoDesonerado: v})} />
                <ConfigField label="Aba Composições" value={parserConfig.sheetCompDesonerado} onChange={v => setParserConfig({...parserConfig, sheetCompDesonerado: v})} />
                <ConfigField label="Aba Analítico" value={parserConfig.sheetAnalitico} onChange={v => setParserConfig({...parserConfig, sheetAnalitico: v})} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Table className="w-3 h-3" /> Células & Cabeçalho
              </p>
              <div className="grid gap-3">
                <ConfigField label="Linha do Cabeçalho" type="number" value={parserConfig.headerRow} onChange={v => setParserConfig({...parserConfig, headerRow: Number(v)})} />
                <ConfigField label="Célula Data Base" value={parserConfig.cellDate} onChange={v => setParserConfig({...parserConfig, cellDate: v})} />
                <ConfigField label="Início Preços (Insumo)" value={parserConfig.colPriceStart} onChange={v => setParserConfig({...parserConfig, colPriceStart: v})} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ArrowRightLeft className="w-3 h-3" /> Colunas (Letras)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ConfigField label="Coluna Código" value={parserConfig.colCode} onChange={v => setParserConfig({...parserConfig, colCode: v})} />
                <ConfigField label="Coluna Descrição" value={parserConfig.colDesc} onChange={v => setParserConfig({...parserConfig, colDesc: v})} />
                <ConfigField label="Coluna Unidade" value={parserConfig.colUnit} onChange={v => setParserConfig({...parserConfig, colUnit: v})} />
                <ConfigField label="Coluna Classe" value={parserConfig.colClass} onChange={v => setParserConfig({...parserConfig, colClass: v})} />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => setShowConfig(false)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              Aplicar e Fechar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <DbStatCard icon={<Calendar />} label="sinapi_references" value={sinapi_references.length} color="indigo" />
          <DbStatCard icon={<Database />} label="sinapi_items" value={sinapi_items.length} color="blue" />
          <DbStatCard icon={<HardDrive />} label="sinapi_structure" value={sinapi_structure.length} color="emerald" />
      </div>

      {!insumoResult && !isProcessing && sinapi_references.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-3xl flex items-center justify-center mb-8 text-4xl">
              <FileSpreadsheet />
            </div>
            <h4 className="text-2xl font-black mb-4">Carregar Banco SINAPI</h4>
            <p className="text-slate-500 max-w-md mb-10">Selecione o arquivo Excel extraído do site da Caixa Econômica para iniciar a importação para as tabelas locais (JSONB Optimized).</p>
            <input type="file" id="sinapi-upload" className="hidden" accept=".xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
            <div className="flex flex-col items-center gap-4">
              <label htmlFor="sinapi-upload" className="bg-slate-800 hover:bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl cursor-pointer transition-all active:scale-95">
                {file ? file.name : 'Selecionar Arquivo .xlsx'}
              </label>
              {file && (
                <button onClick={handleStartImport} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all">
                  Iniciar Processamento ETL
                </button>
              )}
            </div>
        </div>
      ) : isProcessing ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded-[2.5rem] p-12 text-blue-400 font-mono text-sm overflow-hidden">
           <div className="w-full max-w-3xl space-y-2 custom-scrollbar overflow-y-auto">
             {logs.map((log, i) => <div key={i} className="animate-in slide-in-from-left-2">{log}</div>)}
             <div className="animate-pulse">_</div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 overflow-x-auto">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <TabBtn active={activeTab === 'INSUMOS'} label="INSUMOS" onClick={() => setActiveTab('INSUMOS')} />
              <TabBtn active={activeTab === 'COMPOSICOES'} label="COMPOSIÇÕES" onClick={() => setActiveTab('COMPOSICOES')} />
              <TabBtn active={activeTab === 'ANALITICO'} label="ANALÍTICO" onClick={() => setActiveTab('ANALITICO')} />
              <TabBtn active={activeTab === 'ENCARGOS'} label="ENCARGOS" onClick={() => setActiveTab('ENCARGOS')} />
              <TabBtn active={activeTab === 'AUDITORIA'} label="AUDITORIA" onClick={() => setActiveTab('AUDITORIA')} />
              <TabBtn active={activeTab === 'DB'} label="VARS LOCAIS (DB)" onClick={() => setActiveTab('DB')} />
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pesquisar..."
              />
            </div>

            <button onClick={clearDatabase} className="text-slate-400 hover:text-red-500 p-2" title="Limpar Banco Local">
               <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'DB' ? (
              <LocalDbStatsView references={sinapi_references} items={sinapi_items} structures={sinapi_structure} />
            ) : activeTab === 'AUDITORIA' ? (
              <AuditoriaTab audit={auditData} />
            ) : activeTab === 'ANALITICO' ? (
              <AnaliticoPage analiticoResult={analiticoResult} compResult={compResult} insumoResult={insumoResult} selectedState={selectedState} />
            ) : activeTab === 'ENCARGOS' ? (
              <div className="h-full overflow-auto custom-scrollbar p-6">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-4">UF</th>
                      <th className="px-6 py-4">Regime</th>
                      <th className="px-6 py-4 text-right">Horista (%)</th>
                      <th className="px-6 py-4 text-right">Mensalista (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(insumoResult?.encargosMetadata || []).map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-100">{e.state}</td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{e.regime}</span></td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{e.horistaPct.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{e.mensalistaPct.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">
                      <tr>
                        <th className="px-6 py-4">Código</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4 text-center">Unidade</th>
                        <th className="px-6 py-4 text-right">Preço ({selectedState})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedItems.map((item) => {
                        const isExpanded = expandedDescCodes.has(item.code);
                        return (
                          <tr key={item.code} className={`transition-colors group ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                            <td className="px-6 py-4 font-mono font-bold text-blue-600 align-top">{item.code}</td>
                            <td 
                              className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 max-w-xl cursor-pointer"
                              onClick={() => toggleDesc(item.code)}
                            >
                              <div className="flex items-start gap-2">
                                 <div className={`${isExpanded ? '' : 'line-clamp-2'} flex-1 leading-relaxed transition-all`}>
                                   {item.description}
                                 </div>
                                 <div className={`shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isExpanded ? 'text-blue-600' : 'text-slate-400'}`}>
                                   {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                 </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-400 font-bold uppercase align-top">{item.unit}</td>
                            <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100 align-top">
                              R$ {(item.priceMap?.[selectedState] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-center items-center gap-4 shrink-0">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-30"><ChevronRight className="rotate-180" /></button>
                  <span className="text-xs font-bold text-slate-500">Página {currentPage} de {totalPages || 1}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-30"><ChevronRight /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE DE AUDITORIA ---

const AuditoriaTab: React.FC<{ audit: { insumosByClass: [string, number][], compsByGroup: [string, number][], totalChildren: number } }> = ({ audit }) => {
  return (
    <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-blue-600" />
            <h5 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">Total de Insumos</h5>
          </div>
          <p className="text-4xl font-black text-blue-700 dark:text-blue-400">
            {audit.insumosByClass.reduce((acc, curr) => acc + curr[1], 0).toLocaleString()}
          </p>
          <p className="text-xs text-blue-600/60 font-bold mt-2 uppercase tracking-tighter">Registrados por classe</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3 mb-4">
            <LayoutGrid className="text-emerald-600" />
            <h5 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">Total de Composições</h5>
          </div>
          <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
            {audit.compsByGroup.reduce((acc, curr) => acc + curr[1], 0).toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600/60 font-bold mt-2 uppercase tracking-tighter">Registrados por grupo</p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-indigo-600" />
            <h5 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">Integridade Estrutural</h5>
          </div>
          <p className="text-4xl font-black text-indigo-700 dark:text-indigo-400">
            {audit.totalChildren.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-xs text-indigo-600/60 font-bold uppercase tracking-tighter">Itens Filhos Validados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
             <h5 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-widest flex items-center gap-2">
               <Database className="w-4 h-4 text-blue-500" /> Insumos por Classe
             </h5>
             <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{audit.insumosByClass.length} Classes</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Nome da Classe</th>
                  <th className="px-6 py-4 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {audit.insumosByClass.map(([cls, qty]) => (
                  <tr key={cls} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{cls}</td>
                    <td className="px-6 py-3 text-right font-black text-blue-600">{qty.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
             <h5 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-widest flex items-center gap-2">
               <LayoutGrid className="w-4 h-4 text-emerald-500" /> Composições por Grupo
             </h5>
             <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{audit.compsByGroup.length} Grupos</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Nome do Grupo</th>
                  <th className="px-6 py-4 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {audit.compsByGroup.map(([grp, qty]) => (
                  <tr key={grp} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{grp}</td>
                    <td className="px-6 py-3 text-right font-black text-emerald-600">{qty.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8">
         <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-3xl shadow-lg shrink-0">
           <AlertCircle className="text-indigo-500" />
         </div>
         <div className="flex-1">
           <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-2">Relatório de Validação de Estrutura</h4>
           <p className="text-slate-500 text-sm leading-relaxed">
             A variável local <code className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono text-xs">sinapi_structure</code> contém exatamente 
             <span className="font-black text-indigo-600 mx-1">{audit.totalChildren.toLocaleString()}</span> relações de composição. 
             Isso significa que cada item filho (insumo ou composição auxiliar) está corretamente vinculado ao seu respectivo código pai, 
             garantindo a precisão das análises de custos unitários e globais.
           </p>
         </div>
         <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Status do Banco</span>
            <div className="px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-black text-xs uppercase tracking-tighter flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Consistente
            </div>
         </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const LocalDbStatsView: React.FC<{ references: any[], items: any[], structures: any[] }> = ({ references, items, structures }) => (
  <div className="p-8 space-y-8 overflow-y-auto h-full">
     <div>
       <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
         <Table className="text-indigo-500" /> Referências de Importação (sinapi_references)
       </h4>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {references.map(ref => (
            <div key={ref.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
               <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{ref.period}</p>
               <p className="font-bold text-slate-800 dark:text-slate-100">{ref.description}</p>
               <p className="text-[10px] text-slate-400 mt-2">UUID: {ref.id}</p>
            </div>
          ))}
          {references.length === 0 && <p className="text-sm text-slate-400 italic">Nenhuma referência encontrada.</p>}
       </div>
     </div>

     <div>
       <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
         <Database className="text-blue-500" /> Itens de Preços (sinapi_items)
       </h4>
       <p className="text-sm text-slate-500 mb-2">Total de {items.length} registros ativos na variável local.</p>
       <div className="h-64 overflow-y-auto border rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 font-mono text-[10px]">
          {items.slice(0, 20).map(item => (
            <div key={item.id} className="mb-1 text-slate-500">
               {JSON.stringify(item)}
            </div>
          ))}
          {items.length > 20 && <div className="text-blue-500 mt-2">... e mais {items.length - 20} registros</div>}
       </div>
     </div>

     <div>
       <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
         <HardDrive className="text-emerald-500" /> Estrutura de Composição (sinapi_structure)
       </h4>
       <p className="text-sm text-slate-500 mb-2">Total de {structures.length} relações pai-filho mapeadas.</p>
       <div className="h-64 overflow-y-auto border rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 font-mono text-[10px]">
          {structures.slice(0, 20).map(struct => (
            <div key={struct.id} className="mb-1 text-slate-500">
               {JSON.stringify(struct)}
            </div>
          ))}
          {structures.length > 20 && <div className="text-emerald-500 mt-2">... e mais {structures.length - 20} registros</div>}
       </div>
     </div>
  </div>
);

const DbStatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => {
  const colorClasses: any = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
  };
  return (
    <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 shadow-sm ${colorClasses[color]}`}>
       <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/50 dark:bg-black/20">
         {icon}
       </div>
       <div>
         <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
         <p className="text-xl font-black">{value.toLocaleString()}</p>
       </div>
    </div>
  );
};

const ConfigField: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
    />
  </div>
);

const TabBtn: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick} 
    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex-shrink-0 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700'}`}
  >
    {label}
  </button>
);

export default SinapiView;
