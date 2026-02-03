
import * as XLSX from 'xlsx';
import { CatalogItem, TaxRegime, SinapiDataType, MultiRegimeResult, SinapiParserConfig, EncargosMetadata } from '../types';

const BRAZIL_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const colLetterToIndex = (col: string): number => {
    if (!col) return -1;
    const clean = col.toUpperCase().trim();
    let sum = 0;
    for (let i = 0; i < clean.length; i++) {
        sum *= 26;
        sum += (clean.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return sum - 1;
};

const parsePrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return 0;
  
  let str = String(val).trim().toUpperCase().replace('R$', '').trim();
  if (!str) return 0;

  const isNegative = str.includes('-') || (str.startsWith('(') && str.endsWith(')'));
  str = str.replace(/[()]/g, '').replace('-', '').trim();

  let num = 0;
  if (str.includes(',')) {
      const clean = str.replace(/\./g, '').replace(',', '.');
      num = parseFloat(clean);
  } else if (str.includes('.')) {
      const parts = str.split('.');
      if (parts.length > 2) {
          num = parseFloat(str.replace(/\./g, ''));
      } else {
          const decimalPart = parts[1];
          if (decimalPart.length !== 3) {
              num = parseFloat(str);
          } else {
              if (parts[0] === '0') {
                  num = parseFloat(str);
              } else {
                  num = parseFloat(str.replace(/\./g, ''));
              }
          }
      }
  } else {
      num = parseFloat(str);
  }

  return isNegative ? -num : num;
};

const parsePercentage = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') {
        return val < 5 ? val * 100 : val; 
    }
    if (typeof val === 'string') {
        const clean = val.replace('%', '');
        return parsePrice(clean);
    }
    return 0;
};

const normalizeStr = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const detectStateRow = (sheet: XLSX.WorkSheet, range: XLSX.Range): number => {
    let bestRow = -1;
    let maxStatesFound = 0;
    for (let r = 0; r < Math.min(range.e.r, 15); r++) {
        let statesFound = 0;
        for (let c = 0; c < Math.min(range.e.c, 50); c++) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v) {
                const val = String(cell.v).trim().toUpperCase();
                const statePrefix = val.substring(0, 2);
                if (BRAZIL_STATES.includes(statePrefix)) {
                    statesFound++;
                }
            }
        }
        if (statesFound > maxStatesFound) {
            maxStatesFound = statesFound;
            bestRow = r;
        }
    }
    return maxStatesFound > 3 ? bestRow : -1;
};

const parseColumnHeader = (headerVal: string): { state: string, regime: TaxRegime | null } | null => {
    const clean = headerVal.trim().toUpperCase().replace(/\s/g, '');
    const match = clean.match(/^([A-Z]{2})\((SD|CD|SE|ND)\)$/); 
    
    if (match) {
        const state = match[1];
        const suffix = match[2];
        let regime: TaxRegime | null = null;
        
        if (suffix === 'CD') regime = 'DESONERADO';
        else if (suffix === 'SD' || suffix === 'ND') regime = 'NAO_DESONERADO';
        else if (suffix === 'SE') regime = 'SEM_ENCARGOS';

        if (regime && BRAZIL_STATES.includes(state)) {
            return { state, regime };
        }
    }
    if (BRAZIL_STATES.includes(clean)) {
        return { state: clean, regime: null };
    }
    return null;
};

const extractEncargosTable = (
    sheet: XLSX.WorkSheet,
    config: SinapiParserConfig
): EncargosMetadata[] => {
    const metadata: EncargosMetadata[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z500');
    const startRow = config.encargosStartRow; 
    const cState = colLetterToIndex(config.encargosColState);
    const cHor = colLetterToIndex(config.encargosColHorista);
    const cMen = colLetterToIndex(config.encargosColMensalista);

    for (let r = startRow; r <= range.e.r; r++) {
        const cellState = sheet[XLSX.utils.encode_cell({ r, c: cState })];
        if (!cellState || !cellState.v) continue;
        const valState = String(cellState.v).trim().toUpperCase();
        const parsed = parseColumnHeader(valState);
        if (parsed && parsed.regime) {
            const cellHor = sheet[XLSX.utils.encode_cell({ r, c: cHor })];
            const cellMen = sheet[XLSX.utils.encode_cell({ r, c: cMen })];
            metadata.push({
                state: parsed.state,
                regime: parsed.regime,
                horistaPct: parsePercentage(cellHor?.v),
                mensalistaPct: parsePercentage(cellMen?.v)
            });
        }
    }
    return metadata;
};

export const getRawSheetData = async (file: File, targetSheetNamePartial: string): Promise<{data: any[][], sheetNames: string[], foundName: string | null}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetNames = workbook.SheetNames;
                const targetNormalized = normalizeStr(targetSheetNamePartial);
                let foundName = sheetNames.find(n => normalizeStr(n) === targetNormalized);
                if (!foundName) foundName = sheetNames.find(n => normalizeStr(n).includes(targetNormalized));
                if (!foundName) { resolve({ data: [], sheetNames, foundName: null }); return; }
                const sheet = workbook.Sheets[foundName];
                const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z1000');
                range.e.r = Math.min(range.e.r, 1000); 
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', range: range });
                resolve({ data: json as any[][], sheetNames, foundName });
            } catch (err) { reject(err); }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

const processUnifiedSheet = (
    sheet: XLSX.WorkSheet,
    dataType: SinapiDataType,
    config: SinapiParserConfig,
    fileName: string
): MultiRegimeResult => {
    let colClassIdx, colCodeIdx, colDescIdx, colUnitIdx, colOriginIdx, colPriceStartIdx;
    if (dataType === 'INSUMO') {
        colClassIdx = colLetterToIndex(config.colClass);
        colCodeIdx = colLetterToIndex(config.colCode);
        colDescIdx = colLetterToIndex(config.colDesc);
        colUnitIdx = colLetterToIndex(config.colUnit);
        colOriginIdx = colLetterToIndex(config.colOrigin);
        colPriceStartIdx = colLetterToIndex(config.colPriceStart);
    } else { 
        colClassIdx = colLetterToIndex(config.compColGroup);
        colCodeIdx = colLetterToIndex(config.colCode);
        colDescIdx = colLetterToIndex(config.colDesc);
        colUnitIdx = colLetterToIndex(config.colUnit);
        colOriginIdx = -1; 
        colPriceStartIdx = colLetterToIndex(config.compColPriceStart);
    }

    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z200000');
    const colMap = new Map<number, { state: string, regime: TaxRegime }>();
    let headerRow = config.headerRow - 1; 
    const detectedHeader = detectStateRow(sheet, range);
    if (detectedHeader !== -1) headerRow = detectedHeader;

    for (let c = colPriceStartIdx; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
        if (cell && cell.v) {
            const parsed = parseColumnHeader(String(cell.v));
            if (parsed && parsed.regime) {
                colMap.set(c, { state: parsed.state, regime: parsed.regime });
            }
        }
    }

    const desItems: CatalogItem[] = [];
    const ndItems: CatalogItem[] = [];
    const seItems: CatalogItem[] = [];

    for (let r = headerRow + 1; r <= range.e.r; r++) {
        const cellCode = sheet[XLSX.utils.encode_cell({ r, c: colCodeIdx })];
        if (!cellCode) continue;
        let code = '';
        if (cellCode.t === 'n') code = String(cellCode.v);
        else if (cellCode.v) code = String(cellCode.v).trim();
        if (!code || code.toUpperCase().includes('CODIGO')) continue;

        const cellDesc = sheet[XLSX.utils.encode_cell({ r, c: colDescIdx })];
        const cellUnit = sheet[XLSX.utils.encode_cell({ r, c: colUnitIdx })];
        const cellClass = colClassIdx >= 0 ? sheet[XLSX.utils.encode_cell({ r, c: colClassIdx })] : null;
        const cellOrigin = colOriginIdx >= 0 ? sheet[XLSX.utils.encode_cell({ r, c: colOriginIdx })] : null;

        const description = cellDesc ? String(cellDesc.v).trim() : 'Sem descrição';
        const unit = cellUnit ? String(cellUnit.v).trim() : '';
        const classification = cellClass ? String(cellClass.v).trim() : '';
        const priceOrigin = cellOrigin ? String(cellOrigin.v).trim() : '';

        const createBaseItem = (regime: TaxRegime): CatalogItem => ({
            code, description, unit, price: 0, priceMap: {}, origin: fileName,
            category: dataType as any, taxType: regime,
            group: dataType === 'COMPOSICAO' ? classification : undefined,
            classification: dataType === 'INSUMO' ? classification : undefined,
            priceOrigin: dataType === 'INSUMO' ? priceOrigin : undefined
        });

        const itemDes = createBaseItem('DESONERADO');
        const itemNd = createBaseItem('NAO_DESONERADO');
        const itemSe = createBaseItem('SEM_ENCARGOS');

        colMap.forEach((meta, colIdx) => {
            const cellPrice = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
            const price = cellPrice ? parsePrice(cellPrice.v) : 0;
            if (meta.regime === 'DESONERADO') itemDes.priceMap![meta.state] = price;
            else if (meta.regime === 'NAO_DESONERADO') itemNd.priceMap![meta.state] = price;
            else if (meta.regime === 'SEM_ENCARGOS') itemSe.priceMap![meta.state] = price;
        });

        itemDes.price = itemDes.priceMap!['SP'] || Object.values(itemDes.priceMap!)[0] || 0;
        itemNd.price = itemNd.priceMap!['SP'] || Object.values(itemNd.priceMap!)[0] || 0;
        itemSe.price = itemSe.priceMap!['SP'] || Object.values(itemSe.priceMap!)[0] || 0;

        desItems.push(itemDes);
        ndItems.push(itemNd);
        seItems.push(itemSe);
    }

    let referenceDate = '';
    const cellDate = sheet[config.cellDate || 'B3'];
    if (cellDate) referenceDate = String(cellDate.v).trim();

    // Fix: Using snake_case for nao_desonerado and sem_encargos as per types.ts
    return {
        desonerado: desItems, nao_desonerado: ndItems, sem_encargos: seItems,
        stats: { totalDesonerado: desItems.length, totalNaoDesonerado: ndItems.length, totalSemEncargos: seItems.length },
        referenceDate
    };
};

const processAnaliticoSheet = (
    sheet: XLSX.WorkSheet,
    config: SinapiParserConfig,
    fileName: string
): CatalogItem[] => {
    const items: CatalogItem[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z200000');
    const cCompCode = colLetterToIndex(config.anaColCompCode); 
    const cType = colLetterToIndex(config.anaColType || 'C'); 
    const cItemCode = colLetterToIndex(config.anaColItemCode); 
    const cItemDesc = colLetterToIndex(config.anaColItemDesc); 
    const cUnit = colLetterToIndex(config.anaColUnit); 
    const cCoef = colLetterToIndex(config.anaColCoef); 
    const cPrice = colLetterToIndex(config.anaColPrice); 
    const cTotal = colLetterToIndex(config.anaColTotal); 
    const cSituation = colLetterToIndex(config.anaColSituation || 'K'); 
    
    let startRow = config.headerRow; 
    let lastSeenParentCode = '';
    let currentParentDesc = '';

    for (let R = startRow; R <= range.e.r; R++) {
        const cellCompCode = sheet[XLSX.utils.encode_cell({ r: R, c: cCompCode })];
        let compCode = cellCompCode ? String(cellCompCode.v).trim() : '';
        const cellDesc = sheet[XLSX.utils.encode_cell({ r: R, c: cItemDesc })];
        const descRaw = cellDesc ? String(cellDesc.v).trim() : '';
        const cellItemCode = sheet[XLSX.utils.encode_cell({ r: R, c: cItemCode })];
        const itemCode = cellItemCode ? String(cellItemCode.v).trim() : '';

        if (!compCode && lastSeenParentCode && (descRaw || itemCode)) compCode = lastSeenParentCode;
        if (!compCode || compCode.toUpperCase().includes('CODIGO')) continue;

        if (compCode !== lastSeenParentCode) {
            lastSeenParentCode = compCode;
            currentParentDesc = descRaw;
        } else {
            const cellType = sheet[XLSX.utils.encode_cell({ r: R, c: cType })];
            const cellUnit = sheet[XLSX.utils.encode_cell({ r: R, c: cUnit })];
            const cellCoef = sheet[XLSX.utils.encode_cell({ r: R, c: cCoef })];
            const cellPrice = sheet[XLSX.utils.encode_cell({ r: R, c: cPrice })];
            const cellTotal = sheet[XLSX.utils.encode_cell({ r: R, c: cTotal })];
            const cellSituation = sheet[XLSX.utils.encode_cell({ r: R, c: cSituation })];

            const typeRaw = cellType ? String(cellType.v).trim().toUpperCase() : 'INSUMO';
            const situationRaw = cellSituation ? String(cellSituation.v).trim() : '';
            
            if (descRaw || itemCode) {
                items.push({
                    code: itemCode || 'N/A', description: descRaw, unit: cellUnit ? String(cellUnit.v).trim() : '',
                    coefficient: parsePrice(cellCoef?.v), price: parsePrice(cellPrice?.v),
                    totalCost: parsePrice(cellTotal?.v), category: typeRaw as any, 
                    situation: situationRaw,
                    parentCode: lastSeenParentCode, parentDesc: currentParentDesc, origin: fileName
                });
            }
        }
    }
    return items;
}

export const parseSinapiAllRegimes = async (
    file: File, dataType: SinapiDataType, config: SinapiParserConfig
): Promise<MultiRegimeResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const findSheet = (namePartial: string): XLSX.WorkSheet | null => {
                    const normalizedPartial = normalizeStr(namePartial);
                    const foundName = workbook.SheetNames.find(n => normalizeStr(n).includes(normalizedPartial));
                    return foundName ? workbook.Sheets[foundName] : null;
                };
                
                if (dataType === 'ANALITICO') {
                    const sheet = findSheet(config.sheetAnalitico);
                    // Fix: Using snake_case for nao_desonerado and sem_encargos
                    if (!sheet) { resolve({ desonerado: [], nao_desonerado: [], sem_encargos: [], analitico: [], stats: { totalDesonerado: 0, totalNaoDesonerado: 0, totalSemEncargos: 0, totalAnalitico: 0 } }); return; }
                    const items = processAnaliticoSheet(sheet, config, file.name);
                    // Fix: Using snake_case for nao_desonerado and sem_encargos
                    resolve({ desonerado: [], nao_desonerado: [], sem_encargos: [], analitico: items, stats: { totalDesonerado: 0, totalNaoDesonerado: 0, totalSemEncargos: 0, totalAnalitico: items.length } });
                    return;
                }

                const sheetName = dataType === 'INSUMO' ? config.sheetInsumoDesonerado : config.sheetCompDesonerado;
                const mainSheet = findSheet(sheetName);
                if (mainSheet) {
                    const result = processUnifiedSheet(mainSheet, dataType, config, file.name);
                    if (dataType === 'INSUMO' && config.sheetEncargos) {
                        const sheetEncargos = findSheet(config.sheetEncargos);
                        if (sheetEncargos) result.encargosMetadata = extractEncargosTable(sheetEncargos, config);
                    }
                    resolve(result);
                    return;
                }
                // Fix: Using snake_case for nao_desonerado and sem_encargos
                resolve({ desonerado: [], nao_desonerado: [], sem_encargos: [], stats: { totalDesonerado: 0, totalNaoDesonerado: 0, totalSemEncargos: 0 } });
            } catch (err) { reject(err); }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

export const generateCsvContent = (data: Record<TaxRegime, CatalogItem[]>, selectedRegimes: TaxRegime[]): string => {
    const states = new Set<string>();
    const allItems = [...(data['DESONERADO'] || []), ...(data['NAO_DESONERADO'] || []), ...(data['SEM_ENCARGOS'] || [])];
    allItems.forEach(i => i.priceMap && Object.keys(i.priceMap).forEach(s => states.add(s)));
    const sortedStates = Array.from(states).sort();

    let header = "CODIGO;DESCRICAO;UNIDADE;CLASSE;ORIGEM";
    selectedRegimes.forEach(r => sortedStates.forEach(s => { header += `;PRECO_${r}_${s}`; }));
    header += "\n";

    const mapItems = new Map<string, { des?: CatalogItem, nd?: CatalogItem, se?: CatalogItem }>();
    const addToMap = (list: CatalogItem[], key: 'des' | 'nd' | 'se') => list.forEach(i => {
        if (!mapItems.has(i.code)) mapItems.set(i.code, {});
        mapItems.get(i.code)![key] = i;
    });
    addToMap(data['DESONERADO'] || [], 'des');
    addToMap(data['NAO_DESONERADO'] || [], 'nd');
    addToMap(data['SEM_ENCARGOS'] || [], 'se');

    const rows: string[] = [];
    mapItems.forEach((val, code) => {
        const refItem = val.des || val.nd || val.se!;
        const safeDesc = `"${refItem.description.replace(/"/g, '""')}"`;
        const safeClass = `"${(refItem.classification || refItem.group || '').replace(/"/g, '""')}"`;
        let row = `${code};${safeDesc};${refItem.unit};${safeClass};${refItem.origin}`;
        selectedRegimes.forEach(r => {
            let itemObj = (r === 'DESONERADO' ? val.des : r === 'NAO_DESONERADO' ? val.nd : val.se);
            sortedStates.forEach(s => {
                const p = itemObj?.priceMap?.[s] || 0;
                row += `;${p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            });
        });
        rows.push(row);
    });
    return "\uFEFF" + header + rows.join("\n");
};
