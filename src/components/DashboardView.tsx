
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Abr', value: 800 },
  { name: 'Mai', value: 500 },
  { name: 'Jun', value: 900 },
];

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Obras Ativas" value="12" icon="fa-building" trend="+2 este mês" />
        <StatCard title="Orçamento Total" value="R$ 2.4M" icon="fa-wallet" trend="85% utilizado" />
        <StatCard title="Tarefas Pendentes" value="38" icon="fa-list-check" trend="-5 hoje" />
        <StatCard title="Colaboradores" value="24" icon="fa-users" trend="Equipe completa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-lg mb-6">Evolução dos Custos</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-lg mb-6">Atividades Recentes</h4>
          <div className="space-y-6">
            <ActivityItem 
              user="Ricardo" 
              action="aprovou o orçamento" 
              target="Edifício Horizon" 
              time="12 min atrás" 
              icon="fa-check"
              color="bg-green-100 text-green-600"
            />
            <ActivityItem 
              user="Ana" 
              action="adicionou fotos" 
              target="Residencial Aurora" 
              time="2h atrás" 
              icon="fa-image"
              color="bg-blue-100 text-blue-600"
            />
            <ActivityItem 
              user="Sistema" 
              action="alerta de atraso" 
              target="Ponte Vale Verde" 
              time="4h atrás" 
              icon="fa-triangle-exclamation"
              color="bg-amber-100 text-amber-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: string; trend: string }> = ({ title, value, icon, trend }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
    <p className="text-2xl font-bold mb-1">{value}</p>
    <p className="text-xs text-slate-400 font-medium">{trend}</p>
  </div>
);

const ActivityItem: React.FC<{ user: string; action: string; target: string; time: string; icon: string; color: string }> = ({ user, action, target, time, icon, color }) => (
  <div className="flex gap-4">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
      <i className={`fa-solid ${icon} text-xs`}></i>
    </div>
    <div className="text-sm">
      <p className="text-slate-700 dark:text-slate-300">
        <span className="font-bold">{user}</span> {action} em <span className="font-medium">{target}</span>
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{time}</p>
    </div>
  </div>
);

export default DashboardView;
