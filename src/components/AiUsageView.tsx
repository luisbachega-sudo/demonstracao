
import React from 'react';
import { useAiUsage } from './AiUsageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Zap, 
  Cpu, 
  Database, 
  Clock, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  History,
  Terminal,
  BrainCircuit,
  Unplug,
  WifiOff
} from 'lucide-react';

const AiUsageView: React.FC = () => {
  const { stats, logs, resetStats } = useAiUsage();

  const chartData = logs.slice().reverse().map(log => ({
    name: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tokens: log.tokens
  }));

  const pieData = [
    { name: 'Utilizado', value: stats.projectMaturity },
    { name: 'Livre', value: 100 - stats.projectMaturity },
  ];

  const getRiskUI = () => {
    switch(stats.stagnationRisk) {
      case 'CRITICAL': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500', label: 'RISCO CRÍTICO DE EVASÃO', sub: 'O modelo atingiu o teto de complexidade estrutural.' };
      case 'HIGH': return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500', label: 'ESTAGNAÇÃO ALTA', sub: 'Respostas podem começar a apresentar inconsistências.' };
      case 'MEDIUM': return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500', label: 'SAUDÁVEL', sub: 'Contexto amplo disponível para novas features.' };
      default: return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500', label: 'ÓTIMO', sub: 'Codebase leve e de alta resolução.' };
    }
  };

  const risk = getRiskUI();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      
      {/* ALERTA DE EVASÃO DINÂMICO */}
      {stats.projectMaturity > 75 && (
        <div className={`p-6 rounded-[2rem] border-2 ${risk.border} ${risk.bg} animate-pulse flex items-center gap-6`}>
           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${risk.color.replace('text', 'bg')}/20 ${risk.color}`}>
             <Unplug className="w-8 h-8" />
           </div>
           <div className="flex-1">
             <h4 className={`text-xl font-black ${risk.color} tracking-tighter`}>{risk.label}</h4>
             <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
               {risk.sub} <span className="underline">As instruções enviadas podem ser ignoradas devido à saturação do contexto.</span>
             </p>
           </div>
           <div className="hidden md:block">
              <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">
                Otimizar Contexto
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard icon={<Database />} label="Tokens Processados" value={stats.totalTokens.toLocaleString()} sub={`${stats.interactionsCount} chamadas de API`} />
        <UsageCard icon={<BrainCircuit />} label="Contexto Usado" value={`${stats.projectMaturity.toFixed(1)}%`} sub="Saturação do Modelo" />
        <UsageCard icon={<Cpu />} label="Codebase Size" value={`${(stats.totalCodeSize / 1024).toFixed(0)} KB`} sub="Entropia do Projeto" />
        <UsageCard icon={<DollarSign />} label="Gasto Estimado" value={`$${stats.estimatedCost.toFixed(4)}`} sub="Baseado em cotação Pro" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <Activity className="text-blue-500 w-4 h-4" /> Telemetria de Fluxo (Tokens/Tempo)
          </h4>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs mb-8 w-full">Janela de Contexto (1.5M)</h4>
          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" startAngle={90} endAngle={450}>
                  <Cell fill={stats.projectMaturity > 80 ? '#ef4444' : '#3b82f6'} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className={`text-3xl font-black ${stats.projectMaturity > 80 ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                 {stats.projectMaturity.toFixed(0)}%
               </span>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Maturidade</span>
            </div>
          </div>
          <div className="mt-8 space-y-4 w-full">
            <div className="flex justify-between items-center text-xs font-bold">
               <span className="text-slate-500">Estado de Resolução:</span>
               <span className={risk.color}>{risk.label}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed text-center italic">
              "Dados reais extraídos da análise sintática do código ObraSmart v3.1"
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
           <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs flex items-center gap-2">
             <Terminal className="w-4 h-4 text-emerald-500" /> Console de Raciocínio de IA
           </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tarefa Realizada</th>
                <th className="px-6 py-4 text-center">Tokens</th>
                <th className="px-6 py-4 text-center">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {log.resolutionStatus === 'EVASIVE' ? (
                       <span className="text-orange-500 flex items-center gap-1 font-bold"><WifiOff className="w-3 h-3" /> EVASIVO</span>
                    ) : (
                       <span className="text-emerald-500 flex items-center gap-1 font-bold"><ShieldCheck className="w-3 h-3" /> RESOLVIDO</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                    <span className="text-blue-500 mr-2">{'>'}</span> {log.action}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500">{log.tokens.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{log.latency.toFixed(2)}s</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400">Nenhum log de telemetria disponível.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center">
         <button 
           onClick={() => { if(confirm('Zerar banco de telemetria local?')) resetStats(); }}
           className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
         >
           Reiniciar Telemetria do Chat
         </button>
      </div>
    </div>
  );
};

const UsageCard: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string }> = ({ icon, label, value, sub }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-all">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-500 transition-all">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">{label}</span>
    </div>
    <div>
      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{sub}</p>
    </div>
  </div>
);

export default AiUsageView;
