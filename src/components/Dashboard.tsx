import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Expense, User } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  allExpenses: Expense[];
  users: User[];
  totalLimit: number;
  availableLimit: number;
  onUserClick?: (userId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  expenses, 
  allExpenses,
  users, 
  totalLimit, 
  availableLimit,
  onUserClick
}) => {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Truly recent expenses from all time
  const recentExpenses = [...allExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const userData = users.map(user => {
    const amount = expenses
      .filter(exp => exp.userId === user.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      name: user.name,
      value: amount,
      color: user.color
    };
  }).filter(d => d.value > 0);

  const categoryData = expenses.reduce((acc: any[], exp) => {
    const existing = acc.find(item => item.name === exp.category);
    if (existing) {
      existing.value += exp.amount;
    } else {
      acc.push({ name: exp.category, value: exp.amount });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
          id="total-spent-card"
        >
          <div className="relative z-10">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Consumo Total</span>
            <div className="text-3xl font-bold text-indigo-600 mt-1">{formatCurrency(totalSpent)}</div>
            <div className="mt-2 flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
              <TrendingUp className="w-3 h-3 mr-1" />
              12% vs mês anterior
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
             <TrendingUp className="w-32 h-32 text-indigo-600" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          id="limit-card"
        >
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Limite Disponível</span>
          <div className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(availableLimit)}</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500" 
              style={{ width: `${Math.max(0, Math.min((availableLimit / totalLimit) * 100, 100))}%` }} 
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            De um total de {formatCurrency(totalLimit)}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          id="avg-card"
        >
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Média por Membro</span>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {formatCurrency(users.length > 0 ? totalSpent / users.length : 0)}
          </div>
          <div className="mt-4 flex -space-x-2">
            {users.map((user, i) => (
              <div 
                key={user.id} 
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
             <ArrowUpRight className="w-4 h-4 text-indigo-500" />
             Comparativo Individual
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-[300px]" id="chart-users">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', cursor: 'default' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-5 flex flex-col justify-center">
                 {userData.map((user) => (
                    <button 
                      key={user.name} 
                      className="relative block w-full text-left group"
                      onClick={() => {
                        const originalUser = users.find(u => u.name === user.name);
                        if (originalUser && onUserClick) onUserClick(originalUser.id);
                      }}
                    >
                      <div className="flex justify-between mb-2 text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                          {user.name}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 font-mono italic">{formatCurrency(user.value)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-lg overflow-hidden group-hover:ring-4 group-hover:ring-indigo-100/30 transition-all">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(user.value / totalSpent) * 100}%` }}
                          className="h-full rounded-lg"
                          style={{ backgroundColor: user.color }}
                        />
                      </div>
                    </button>
                 ))}
                 {userData.length === 0 && (
                   <p className="text-slate-400 text-sm text-center italic">Sem dados para comparar.</p>
                 )}
              </div>
           </div>
        </div>

        <div className="xl:col-span-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="chart-categories">
          <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Distribuição por Categoria</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Recent Activity */}
        <div className="xl:col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimas Atividades no Cartão (Histórico Geral)</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Top 5</span>
           </div>
           <div className="divide-y divide-slate-50">
              {recentExpenses.map((exp) => {
                const user = users.find(u => u.id === exp.userId);
                return (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: user?.color || '#CBD5E1' }}
                      >
                        {user?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{exp.description}</div>
                        <div className="text-[9px] font-medium text-slate-400">
                          {user?.name} • {new Date(exp.date).toLocaleDateString('pt-BR')} • {exp.billingMonth}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">{formatCurrency(exp.amount)}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {exp.installments > 1 ? `${exp.currentInstallment}/${exp.installments} parcelas` : 'À vista'}
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentExpenses.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs italic">Nenhuma atividade registrada ainda.</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
