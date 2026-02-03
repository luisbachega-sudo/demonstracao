
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AiUsageStats, AiLog } from '../types';

interface AiUsageContextType {
  stats: AiUsageStats;
  logs: AiLog[];
  trackUsage: (tokens: number, latency: number, action: string, status?: 'RESOLVED' | 'EVASIVE') => void;
  resetStats: () => void;
}

// O contexto do Gemini 2.0 Flash é de 1.048.576 tokens.
const CONTEXT_WINDOW_LIMIT = 1048576; 

const AiUsageContext = createContext<AiUsageContextType | undefined>(undefined);

export const AiUsageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<AiUsageStats>(() => {
    const saved = localStorage.getItem('obrasmart_ai_stats');
    if (saved) return JSON.parse(saved);
    
    return {
      totalTokens: 0,
      promptTokens: 0,
      candidatesTokens: 0,
      interactionsCount: 0,
      averageLatency: 0,
      estimatedCost: 0,
      projectMaturity: 0,
      stagnationRisk: 'LOW',
      totalCodeSize: 0,
      lastUpdate: new Date().toISOString()
    };
  });

  const [logs, setLogs] = useState<AiLog[]>(() => {
    const saved = localStorage.getItem('obrasmart_ai_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Simulação de análise de tamanho do código do projeto atual
  useEffect(() => {
    const analyzeProject = () => {
      // Em um ambiente real, iteraríamos sobre os arquivos.
      // Aqui, estimamos baseado no volume de dados salvos e componentes ativos.
      const storageSize = JSON.stringify(localStorage).length;
      const estimatedCodeChars = 450000; // Valor base para o app ObraSmart atual
      const totalChars = estimatedCodeChars + storageSize;
      const estimatedTokens = Math.ceil(totalChars / 4);
      const maturity = (estimatedTokens / CONTEXT_WINDOW_LIMIT) * 100;

      let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (maturity > 85) risk = 'CRITICAL';
      else if (maturity > 60) risk = 'HIGH';
      else if (maturity > 30) risk = 'MEDIUM';

      setStats(prev => ({
        ...prev,
        totalCodeSize: totalChars,
        projectMaturity: maturity,
        stagnationRisk: risk,
        lastUpdate: new Date().toISOString()
      }));
    };

    analyzeProject();
    const interval = setInterval(analyzeProject, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('obrasmart_ai_stats', JSON.stringify(stats));
    localStorage.setItem('obrasmart_ai_logs', JSON.stringify(logs));
  }, [stats, logs]);

  const trackUsage = (tokens: number, latency: number, action: string, status: 'RESOLVED' | 'EVASIVE' = 'RESOLVED') => {
    setStats(prev => {
      const newInteractions = prev.interactionsCount + 1;
      const newTotalTokens = prev.totalTokens + tokens;
      
      return {
        ...prev,
        totalTokens: newTotalTokens,
        interactionsCount: newInteractions,
        averageLatency: (prev.averageLatency * (newInteractions - 1) + latency) / newInteractions,
        estimatedCost: newTotalTokens * 0.000007,
      };
    });

    const newLog: AiLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      model: 'gemini-2.0-flash-exp',
      tokens,
      latency,
      action,
      resolutionStatus: status
    };

    setLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  const resetStats = () => {
    localStorage.removeItem('obrasmart_ai_stats');
    localStorage.removeItem('obrasmart_ai_logs');
    window.location.reload();
  };

  return (
    <AiUsageContext.Provider value={{ stats, logs, trackUsage, resetStats }}>
      {children}
    </AiUsageContext.Provider>
  );
};

export const useAiUsage = () => {
  const context = useContext(AiUsageContext);
  if (!context) throw new Error('useAiUsage must be used within AiUsageProvider');
  return context;
};
