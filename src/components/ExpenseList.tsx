import React from 'react';
import { Expense, User } from '../types';
import { Trash2, Calendar, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, users, onDeleteExpense, onEditExpense }) => {
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getUser = (id: string) => users.find(u => u.id === id);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="expense-list-container">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Gastos Recentes</h3>
        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{expenses.length} Transações</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dono</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {sortedExpenses.map((expense) => {
                const user = getUser(expense.userId);
                return (
                  <motion.tr 
                    key={expense.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="hover:bg-slate-50 transition-colors group text-sm"
                    id={`expense-row-${expense.id}`}
                  >
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm" 
                          style={{ backgroundColor: user?.color || '#CBD5E1' }} 
                        >
                          {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <div className="font-bold text-slate-900">{user?.name || 'Manual'}</div>
                           <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {format(parseISO(expense.date), 'dd/MM/yy', { locale: ptBR })}
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="font-semibold text-slate-700">
                        {expense.description}
                         {expense.installments > 1 && (
                          <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                            {expense.currentInstallment}/{expense.installments}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{expense.category}</div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="text-sm font-bold text-slate-900">- {formatCurrency(expense.amount)}</div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditExpense(expense.id)}
                          className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                          id={`btn-edit-${expense.id}`}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          id={`btn-delete-${expense.id}`}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        
        {expenses.length === 0 && (
          <div className="py-20 text-center">
             <div className="text-slate-300 italic text-sm mb-2">Nenhum gasto registrado ainda.</div>
             <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Comece adicionando uma despesa no painel superior</p>
          </div>
        )}
      </div>
    </div>
  );
};
