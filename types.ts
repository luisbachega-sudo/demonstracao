
export type AppView = 'works' | 'calculators' | 'dashboard' | 'settings' | 'sinapi' | 'usage';

export interface User {
  name: string;
  email: string;
  avatar: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
}

export interface AiUsageStats {
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  interactionsCount: number;
  averageLatency: number;
  estimatedCost: number;
  projectMaturity: number; 
  stagnationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalCodeSize: number; // Em bytes
  lastUpdate: string;
}

export interface AiLog {
  id: string;
  timestamp: string;
  model: string;
  tokens: number;
  latency: number;
  action: string;
  resolutionStatus: 'RESOLVED' | 'EVASIVE' | 'PENDING';
}

// ... (resto dos tipos permanecem iguais)
export interface BOMItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  category: 'Concreto' | 'Fôrma' | 'Aço' | 'Mão de Obra' | 'Outros';
}

export interface CalculationResult {
  totalCost: number;
  totalMaterial: number;
  totalLabor: number;
  summary: string;
  items: BOMItem[];
}

export interface WorkItem {
  id: string;
  workId: string;
  type: 'mix' | 'beam' | 'column' | 'slab';
  title: string;
  date: string;
  result: CalculationResult;
  inputs: any; 
}

export interface Work {
  id: string;
  title: string;
  status: 'In Progress' | 'Completed' | 'Delayed';
  budget: number;
  spent: number; 
  progress: number;
  location: string;
  items: WorkItem[];
  createdAt: string;
}

export interface SinapiTableReference {
  id: string;
  period: string;
  description: string;
  created_at: string;
}

export interface SinapiTableItem {
  id: string;
  reference_id: string;
  code: string;
  description: string;
  unit: string;
  category: 'INSUMO' | 'COMPOSICAO';
  classification: string;
  prices: Record<string, number>;
  created_at: string;
}

export interface SinapiTableStructure {
  id: string;
  reference_id: string;
  parent_code: string;
  child_code: string;
  coefficient: number;
  item_type: 'INSUMO' | 'COMPOSICAO';
}

export type SinapiFileType = 'SINTETICO' | 'ANALITICO' | 'INSUMOS' | 'REFERENCIA_2025' | 'OUTRO';
export type TaxRegime = 'DESONERADO' | 'NAO_DESONERADO' | 'SEM_ENCARGOS';
export type SinapiDataType = 'INSUMO' | 'COMPOSICAO' | 'ANALITICO';

export const BRAZIL_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export interface CatalogItem {
  code: string;
  description: string;
  unit: string;
  price: number; 
  priceMap?: Record<string, number>; 
  origin: string; 
  category?: 'COMPOSICAO' | 'INSUMO' | 'OUTRO' | 'ANALITICO';
  taxType?: TaxRegime;
  parentCode?: string;
  parentDesc?: string;
  coefficient?: number;
  totalCost?: number;
  situation?: string;
  group?: string;
  classification?: string;
  priceOrigin?: string;
}

export interface EncargosMetadata {
  state: string;
  regime: TaxRegime;
  horistaPct: number;
  mensalistaPct: number;
}

export interface MultiRegimeResult {
  desonerado: CatalogItem[];
  nao_desonerado: CatalogItem[];
  sem_encargos: CatalogItem[];
  analitico?: CatalogItem[]; 
  stats: {
    totalDesonerado: number;
    totalNaoDesonerado: number;
    totalSemEncargos: number;
    totalAnalitico?: number;
  };
  referenceDate?: string;
  encargosMetadata?: EncargosMetadata[];
}

export interface SinapiParserConfig {
  headerRow: number;
  cellDate: string;
  encargosStartRow: number;
  encargosColState: string;
  encargosColHorista: string;
  encargosColMensalista: string;
  colClass: string;
  colCode: string;
  colDesc: string;
  colUnit: string;
  colOrigin: string;
  colPriceStart: string;
  compColGroup: string;
  compColCode: string;
  compColDesc: string;
  compColUnit: string;
  compColPriceStart: string;
  anaColCompCode: string;
  anaColCompDesc: string;
  anaColType: string;
  anaColItemCode: string;
  anaColItemDesc: string;
  anaColUnit: string;
  anaColCoef: string;
  anaColPrice: string;
  anaColTotal: string;
  anaColSituation: string;
  sheetInsumoDesonerado: string;
  sheetInsumoNaoDesonerado: string;
  sheetInsumoSemEncargos: string;
  sheetCompDesonerado: string;
  sheetCompNaoDesonerado: string;
  sheetCompSemEncargos: string;
  sheetEncargos: string;
  sheetAnalitico: string;
}

export interface TableOutput {
  materialName: string;
  unit: string;
  coefficient: number; 
  category: 'Concreto' | 'Fôrma' | 'Aço' | 'Mão de Obra' | 'Outros';
}

export interface TableRow {
  id: string;
  inputs: Record<string, string>; 
  outputs: TableOutput[]; 
}

export interface ParametricTable {
  id: string;
  name: string;
  calculatorType: 'beam' | 'column' | 'slab' | 'mix';
  inputColumns: string[]; 
  rows: TableRow[];
}

export interface AppSettings {
  tables: ParametricTable[];
}
