
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, ParametricTable, TableRow } from '../types';

const INITIAL_TABLES: ParametricTable[] = [
  {
    id: 'table_beam_form',
    name: 'Fôrmas para Vigas (Consumo/m2)',
    calculatorType: 'beam',
    inputColumns: ['Tipo de Fôrma', 'Tipo de Escoramento', 'Utilizações'],
    rows: [
      {
        id: '1',
        inputs: { 'Tipo de Fôrma': 'Tábua', 'Tipo de Escoramento': 'Pontaletes', 'Utilizações': '1x' },
        outputs: [
          { materialName: 'Prego 17x21', unit: 'kg', coefficient: 0.1692, category: 'Fôrma' },
          { materialName: 'Tábua 2,5 x 30cm', unit: 'm', coefficient: 4.53696, category: 'Fôrma' },
          { materialName: 'Sarrafo 2,5 x 7,5cm', unit: 'm', coefficient: 4.31256, category: 'Fôrma' },
          { materialName: 'Desmoldante', unit: 'L', coefficient: 0.017, category: 'Fôrma' },
        ]
      },
      {
        id: '2',
        inputs: { 'Tipo de Fôrma': 'Compensado Plastificado', 'Tipo de Escoramento': 'Garfo de Madeira', 'Utilizações': '10x' },
        outputs: [
          { materialName: 'Prego 17x21', unit: 'kg', coefficient: 0.038691, category: 'Fôrma' },
          { materialName: 'Chapa Compensado Plast. 17mm', unit: 'm²', coefficient: 0.330258, category: 'Fôrma' },
          { materialName: 'Sarrafo 2,5 x 7,5cm', unit: 'm', coefficient: 1.14708, category: 'Fôrma' },
          { materialName: 'Desmoldante', unit: 'L', coefficient: 0.004, category: 'Fôrma' },
        ]
      }
    ]
  }
];

interface SettingsContextType {
  settings: AppSettings;
  updateTable: (tableId: string, updatedTable: ParametricTable) => void;
  addTable: (table: ParametricTable) => void;
  deleteTable: (tableId: string) => void;
  resetDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('obrasmart_settings_v3');
    return saved ? JSON.parse(saved) : { tables: INITIAL_TABLES };
  });

  useEffect(() => {
    localStorage.setItem('obrasmart_settings_v3', JSON.stringify(settings));
  }, [settings]);

  const updateTable = (id: string, updated: ParametricTable) => {
    setSettings(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === id ? updated : t)
    }));
  };

  const addTable = (table: ParametricTable) => {
    setSettings(prev => ({ ...prev, tables: [...prev.tables, table] }));
  };

  const deleteTable = (id: string) => {
    setSettings(prev => ({ ...prev, tables: prev.tables.filter(t => t.id !== id) }));
  };

  const resetDefaults = () => setSettings({ tables: INITIAL_TABLES });

  return (
    <SettingsContext.Provider value={{ settings, updateTable, addTable, deleteTable, resetDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
