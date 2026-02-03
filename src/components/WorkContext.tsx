
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Work, WorkItem } from '../types';

// Mock inicial rico para testes de UI
const INITIAL_WORKS: Work[] = [
  { 
    id: '1', 
    title: 'Edifício Horizon - Torre A', 
    status: 'In Progress', 
    budget: 2500000, 
    spent: 4250.50, // Soma dos itens abaixo
    progress: 15, 
    location: 'Av. Paulista, 1000 - SP',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        workId: '1',
        type: 'beam',
        title: 'Vigas Baldrame (Eixo X)',
        date: new Date().toISOString(),
        inputs: { width: 20, height: 40, length: 5, quantity: 4, steelRatio: 90, includeLabor: true, hoursPro: 12, ratePro: 35, hoursHelper: 10, rateHelper: 18 },
        result: {
          totalCost: 1850.20,
          totalMaterial: 1250.20,
          totalLabor: 600.00,
          summary: '4x Vigas (20x40cm) - 1.60m³ Total',
          items: [] // Simplificado para o mock, na real teria os itens
        }
      },
      {
        id: 'item-2',
        workId: '1',
        type: 'column',
        title: 'Pilares P1 a P4 (Térreo)',
        date: new Date(Date.now() - 86400000).toISOString(),
        inputs: { sideA: 30, sideB: 30, height: 3, quantity: 4, steelRatio: 100, includeLabor: false, formType: 'compensado' },
        result: {
          totalCost: 1450.80,
          totalMaterial: 1450.80,
          totalLabor: 0,
          summary: '4x Pilares (30x30cm) - 1.08m³ Total',
          items: []
        }
      },
      {
        id: 'item-3',
        workId: '1',
        type: 'slab',
        title: 'Laje Maciça L1',
        date: new Date(Date.now() - 172800000).toISOString(),
        inputs: { width: 5, length: 6, thickness: 12, quantity: 1, steelRatio: 80, includeLabor: true, hoursPro: 8, ratePro: 40, hoursHelper: 8, rateHelper: 20 },
        result: {
          totalCost: 949.50,
          totalMaterial: 469.50,
          totalLabor: 480.00,
          summary: '1x Laje (5x6m) - 3.60m³ Total',
          items: []
        }
      }
    ] 
  },
  { 
    id: '2', 
    title: 'Reforma Residencial Aurora', 
    status: 'Delayed', 
    budget: 85000, 
    spent: 320.00, 
    progress: 45, 
    location: 'Rua das Flores, 123 - Curitiba',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-4',
        workId: '2',
        type: 'mix',
        title: 'Contrapiso Sala',
        date: new Date().toISOString(),
        inputs: { volume: 0.5, quantity: 1, propSand: 3, propStone: 0 },
        result: {
          totalCost: 320.00,
          totalMaterial: 320.00,
          totalLabor: 0,
          summary: '0.50m³ de Concreto/Argamassa',
          items: []
        }
      }
    ]
  },
];

interface WorkContextType {
  works: Work[];
  addWork: (work: Omit<Work, 'id' | 'items' | 'createdAt' | 'spent'>) => void;
  updateWork: (id: string, data: Partial<Work>) => void;
  addItemToWork: (workId: string, item: Omit<WorkItem, 'id' | 'workId' | 'date'>) => void;
  updateItemInWork: (workId: string, itemId: string, item: Partial<WorkItem>) => void;
  deleteItemFromWork: (workId: string, itemId: string) => void;
  getWork: (id: string) => Work | undefined;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

export const WorkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Tenta carregar do localStorage, senão usa o mock
  const [works, setWorks] = useState<Work[]>(() => {
    // Para forçar o reload do mock novo, você pode comentar a linha do localStorage temporariamente ou limpar o cache do navegador
    // const saved = localStorage.getItem('obrasmart_works');
    // return saved ? JSON.parse(saved) : INITIAL_WORKS;
    return INITIAL_WORKS; // Forçando mock para teste do usuário
  });

  // Salva no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('obrasmart_works', JSON.stringify(works));
  }, [works]);

  const addWork = (newWorkData: Omit<Work, 'id' | 'items' | 'createdAt' | 'spent'>) => {
    const newWork: Work = {
      ...newWorkData,
      id: crypto.randomUUID(),
      items: [],
      createdAt: new Date().toISOString(),
      spent: 0
    };
    setWorks(prev => [newWork, ...prev]);
  };

  const updateWork = (id: string, data: Partial<Work>) => {
    setWorks(prev => prev.map(work => {
      if (work.id !== id) return work;
      return { ...work, ...data };
    }));
  };

  const addItemToWork = (workId: string, itemData: Omit<WorkItem, 'id' | 'workId' | 'date'>) => {
    setWorks(prev => prev.map(work => {
      if (work.id !== workId) return work;

      const newItem: WorkItem = {
        ...itemData,
        id: crypto.randomUUID(),
        workId,
        date: new Date().toISOString()
      };

      // Recalcula o total gasto
      const updatedItems = [newItem, ...work.items];
      const newSpent = updatedItems.reduce((acc, i) => acc + i.result.totalCost, 0);

      return {
        ...work,
        items: updatedItems,
        spent: newSpent
      };
    }));
  };

  const updateItemInWork = (workId: string, itemId: string, itemData: Partial<WorkItem>) => {
    setWorks(prev => prev.map(work => {
      if (work.id !== workId) return work;

      const updatedItems = work.items.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, ...itemData };
      });

      const newSpent = updatedItems.reduce((acc, i) => acc + i.result.totalCost, 0);

      return {
        ...work,
        items: updatedItems,
        spent: newSpent
      };
    }));
  };

  const deleteItemFromWork = (workId: string, itemId: string) => {
    setWorks(prev => prev.map(work => {
      if (work.id !== workId) return work;
      
      const updatedItems = work.items.filter(i => i.id !== itemId);
      const newSpent = updatedItems.reduce((acc, i) => acc + i.result.totalCost, 0);

      return {
        ...work,
        items: updatedItems,
        spent: newSpent
      };
    }));
  };

  const getWork = (id: string) => works.find(w => w.id === id);

  return (
    <WorkContext.Provider value={{ works, addWork, updateWork, addItemToWork, updateItemInWork, deleteItemFromWork, getWork }}>
      {children}
    </WorkContext.Provider>
  );
};

export const useWorks = () => {
  const context = useContext(WorkContext);
  if (context === undefined) {
    throw new Error('useWorks must be used within a WorkProvider');
  }
  return context;
};
