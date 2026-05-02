import React, { useState } from 'react';
import { User, Category, CATEGORIES } from '../types';
import { PlusCircle } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (expense: {
    userId: string;
    description: string;
    amount: number;
    date: string;
    category: Category;
    installments: number;
  }) => void;
  users: User[];
  initialData?: Expense | null;
}

export const ExpenseForm: React.FC<ExpenseFormProps & { onCancelEdit?: () => void }> = ({ 
  onAddExpense, 
  users, 
  initialData, 
  onCancelEdit 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [amountMode, setAmountMode] = useState<'total' | 'installment'>('total');
  const [userId, setUserId] = useState('');
  const [category, setCategory] = useState<Category>('Outros');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState('1');

  // Computed values
  const parsedValue = React.useMemo(() => {
    // Replace all dots (thousands) and then replace comma with dot (decimal)
    const normalized = amount.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }, [amount]);

  const parsedInstallments = Math.max(1, parseInt(installments) || 1);
  
  const totalAmount = amountMode === 'total' ? parsedValue : parsedValue * parsedInstallments;
  const installmentValue = amountMode === 'installment' ? parsedValue : (parsedValue / parsedInstallments);

  React.useEffect(() => {
    if (initialData) {
      setDescription(initialData.description.replace(/ \(\d+\/\d+\)$/, ''));
      // When editing, we show the installment value by default or keep it as total? 
      // Let's stick to total for consistency in editing
      setAmountMode('total');
      const total = initialData.amount * initialData.installments;
      setAmount(total.toFixed(2).replace('.', ','));
      setUserId(initialData.userId);
      setCategory(initialData.category);
      setDate(initialData.date);
      setInstallments(initialData.installments.toString());
    } else {
      setDescription('');
      setAmount('');
      setAmountMode('total');
      setUserId('');
      setCategory('Outros');
      setDate(new Date().toISOString().split('T')[0]);
      setInstallments('1');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !userId || !category) return;

    if (totalAmount <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    onAddExpense({
      userId,
      description,
      amount: totalAmount,
      date,
      category,
      installments: parsedInstallments,
    });

    if (!initialData) {
      setDescription('');
      setAmount('');
      setInstallments('1');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="expense-form-container">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div className="text-left">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {initialData ? 'Conectar Edição' : 'Registrar Gasto'}
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
            {initialData ? 'Atualizando transação existente' : 'Adicione uma nova despesa ao painel'}
          </p>
        </div>
        {initialData && (
          <button 
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm flex items-center gap-2"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8" id="expense-form">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">O que comprou?</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold text-slate-700"
              required
              id="input-description"
            />
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center pl-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{amountMode === 'total' ? 'Valor Total' : 'Valor da Parcela'}</label>
              <button 
                type="button"
                onClick={() => setAmountMode(prev => prev === 'total' ? 'installment' : 'total')}
                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-tight"
              >
                Mudar para {amountMode === 'total' ? 'Vlr. Parcela' : 'Vlr. Total'}
              </button>
            </div>
            <div className="relative group">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-mono font-bold text-slate-900"
                required
                id="input-amount"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                 {parsedValue > 0 && (
                   <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap">
                     {amountMode === 'total' ? 'Total' : 'Mensal'}
                   </span>
                 )}
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium pl-1 italic">Use vírgula para centavos (ex: 248,00)</p>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Quem gastou?</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium"
              required
              id="select-user"
            >
              <option value="">Selecione o membro</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium"
              required
              id="select-category"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium"
              required
              id="input-date"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Quantas Parcelas?</label>
            <input
              type="number"
              min="1"
              max="48"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold text-slate-700"
              required
              id="input-installments"
            />
          </div>

          <div className="flex items-end lg:col-span-1">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-slate-900 text-white h-[46px] rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 text-sm"
              id="btn-add-expense"
            >
              <PlusCircle className="w-4 h-4" />
              {initialData ? 'Salvar Edição' : 'Salvar Registro'}
            </button>
          </div>
        </div>

        {/* Math Summary Box */}
        {parsedValue > 0 && (
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 flex flex-wrap gap-8 items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-left">
              <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-1">
                {amountMode === 'total' ? 'Valor por Parcela' : 'Valor Total Pago'}
              </div>
              <div className="text-xl font-black text-indigo-700">
                R$ {(amountMode === 'total' ? installmentValue : totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-px h-10 bg-indigo-100 hidden sm:block" />
            <div className="text-left flex-1 min-w-[200px]">
              <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-1">Resumo das Parcelas</div>
              <div className="text-xs font-bold text-indigo-900 leading-relaxed">
                {parsedInstallments > 1 
                  ? `Sua compra de R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi dividida em ${parsedInstallments} meses. Cada mês custará R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                  : `Compra à vista no valor de R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                }
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
