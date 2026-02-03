
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SinapiTableReference, SinapiTableItem, SinapiTableStructure } from '../types';

interface SinapiContextType {
  sinapi_references: SinapiTableReference[];
  sinapi_items: SinapiTableItem[];
  sinapi_structure: SinapiTableStructure[];
  saveImportData: (
    reference: Omit<SinapiTableReference, 'id' | 'created_at'>,
    items: Omit<SinapiTableItem, 'id' | 'reference_id' | 'created_at'>[],
    structures: Omit<SinapiTableStructure, 'id' | 'reference_id'>[]
  ) => void;
  clearDatabase: () => void;
}

const SinapiContext = createContext<SinapiContextType | undefined>(undefined);

export const SinapiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sinapi_references, setReferences] = useState<SinapiTableReference[]>(() => {
    const saved = localStorage.getItem('sinapi_references');
    return saved ? JSON.parse(saved) : [];
  });

  const [sinapi_items, setItems] = useState<SinapiTableItem[]>(() => {
    const saved = localStorage.getItem('sinapi_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [sinapi_structure, setStructure] = useState<SinapiTableStructure[]>(() => {
    const saved = localStorage.getItem('sinapi_structure');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sinapi_references', JSON.stringify(sinapi_references));
  }, [sinapi_references]);

  useEffect(() => {
    // Nota: Items e Structure podem ser grandes. Se exceder 5MB, o localStorage falhará.
    // Em produção real usaríamos IndexedDB. Aqui mantemos em memória e tentamos salvar.
    try {
      localStorage.setItem('sinapi_items', JSON.stringify(sinapi_items));
      localStorage.setItem('sinapi_structure', JSON.stringify(sinapi_structure));
    } catch (e) {
      console.warn("LocalStorage cheio. Mantendo dados apenas em memória.");
    }
  }, [sinapi_items, sinapi_structure]);

  const saveImportData = (
    refData: Omit<SinapiTableReference, 'id' | 'created_at'>,
    itemsData: Omit<SinapiTableItem, 'id' | 'reference_id' | 'created_at'>[],
    structData: Omit<SinapiTableStructure, 'id' | 'reference_id'>[]
  ) => {
    const refId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newReference: SinapiTableReference = {
      ...refData,
      id: refId,
      created_at: createdAt
    };

    const newItems: SinapiTableItem[] = itemsData.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      reference_id: refId,
      created_at: createdAt
    }));

    const newStructures: SinapiTableStructure[] = structData.map(struct => ({
      ...struct,
      id: crypto.randomUUID(),
      reference_id: refId
    }));

    setReferences(prev => [newReference, ...prev]);
    setItems(prev => [...newItems, ...prev]);
    setStructure(prev => [...newStructures, ...prev]);
  };

  const clearDatabase = () => {
    setReferences([]);
    setItems([]);
    setStructure([]);
    localStorage.removeItem('sinapi_references');
    localStorage.removeItem('sinapi_items');
    localStorage.removeItem('sinapi_structure');
  };

  return (
    <SinapiContext.Provider value={{ 
      sinapi_references, 
      sinapi_items, 
      sinapi_structure, 
      saveImportData,
      clearDatabase 
    }}>
      {children}
    </SinapiContext.Provider>
  );
};

export const useSinapi = () => {
  const context = useContext(SinapiContext);
  if (!context) throw new Error('useSinapi must be used within a SinapiProvider');
  return context;
};
