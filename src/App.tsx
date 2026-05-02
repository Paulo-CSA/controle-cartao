import React from 'react';
import { User, Expense, AppSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { UserManagement } from './components/UserManagement';
import { CreditCard, LayoutDashboard, ListFilter, Users, PlusCircle, LogOut, Calendar, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMonths, subMonths, parseISO, isAfter, setDate, getDay, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Você', color: '#6366f1' }, // Indigo-500
];

const INITIAL_SETTINGS: AppSettings = {
  closingDay: 10,
  totalLimit: 20000,
  paidMonths: [],
};

export default function App() {
  const [users, setUsers] = React.useState<User[]>(INITIAL_USERS);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [settings, setSettings] = React.useState<AppSettings>(INITIAL_SETTINGS);
  const [isSyncing, setIsSyncing] = React.useState(true);

  // Load from server on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          if (data.users) setUsers(data.users);
          if (data.expenses) setExpenses(data.expenses);
          if (data.settings) setSettings(data.settings);
        }
      } catch (err) {
        console.error('Falha ao carregar dados do servidor:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchData();
  }, []);

  // Save to server on changes
  React.useEffect(() => {
    if (isSyncing) return; // Don't save while initial loading

    const saveData = async () => {
      try {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users, expenses, settings }),
        });
      } catch (err) {
        console.error('Falha ao salvar dados no servidor:', err);
      }
    };

    const timeout = setTimeout(saveData, 500); // Debounce
    return () => clearTimeout(timeout);
  }, [users, expenses, settings, isSyncing]);

  const [activeTab, setActiveTab] = React.useState<'dashboard'|'expenses'|'users'|'settings'>('dashboard');
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);
  const [filterUserId, setFilterUserId] = React.useState<string | null>(null);

  // Clear editing state when changing tabs to avoid confusion
  React.useEffect(() => {
    if (activeTab !== 'expenses') {
      setEditingExpenseId(null);
    }
  }, [activeTab]);

  const currentMonthStr = format(currentMonth, 'yyyy-MM');

  const getBillingMonth = (dateStr: string, closingDay: number) => {
    const date = parseISO(dateStr);
    const day = getDate(date);
    if (day > closingDay) {
      return format(addMonths(date, 1), 'yyyy-MM');
    }
    return format(date, 'yyyy-MM');
  };

  const handleAddExpense = (newExp: {
    userId: string;
    description: string;
    amount: number;
    date: string;
    category: any;
    installments: number;
  }) => {
    if (editingExpenseId) {
      const expenseToEdit = expenses.find(e => e.id === editingExpenseId);
      if (expenseToEdit) {
        if (expenseToEdit.installmentGroupId) {
          const others = expenses.filter(e => e.installmentGroupId !== expenseToEdit.installmentGroupId);
          const groupId = expenseToEdit.installmentGroupId;
          const newExpenses: Expense[] = [];
          const installmentAmount = newExp.amount / newExp.installments;
          
          // Calculate first billing month once
          const firstBillingMonthStr = getBillingMonth(newExp.date, settings.closingDay);
          const firstBillingDate = parseISO(`${firstBillingMonthStr}-01`);

          for (let i = 0; i < newExp.installments; i++) {
            const billingMonth = format(addMonths(firstBillingDate, i), 'yyyy-MM');

            newExpenses.push({
              id: Math.random().toString(36).substring(2, 9),
              userId: newExp.userId,
              description: newExp.description + (newExp.installments > 1 ? ` (${i + 1}/${newExp.installments})` : ''),
              amount: installmentAmount,
              date: newExp.date,
              billingMonth,
              category: newExp.category,
              installments: newExp.installments,
              currentInstallment: i + 1,
              installmentGroupId: groupId,
            });
          }
          setExpenses([...others, ...newExpenses]);
        } else {
          const others = expenses.filter(e => e.id !== editingExpenseId);
          const billingMonth = getBillingMonth(newExp.date, settings.closingDay);
          setExpenses([...others, {
            id: editingExpenseId,
            ...newExp,
            billingMonth,
            currentInstallment: 1,
          }]);
        }
        setEditingExpenseId(null);
        setActiveTab('dashboard');
        return;
      }
    }

    const groupId = Math.random().toString(36).substring(2, 9);
    const newExpenses: Expense[] = [];
    const installmentAmount = newExp.amount / newExp.installments;

    // Calculate first billing month once for new expense
    const firstBillingMonthStr = getBillingMonth(newExp.date, settings.closingDay);
    const firstBillingDate = parseISO(`${firstBillingMonthStr}-01`);

    for (let i = 0; i < newExp.installments; i++) {
      const billingMonth = format(addMonths(firstBillingDate, i), 'yyyy-MM');

      newExpenses.push({
        id: Math.random().toString(36).substring(2, 9),
        userId: newExp.userId,
        description: newExp.description + (newExp.installments > 1 ? ` (${i + 1}/${newExp.installments})` : ''),
        amount: installmentAmount,
        date: newExp.date, // Store original transaction date
        billingMonth,
        category: newExp.category,
        installments: newExp.installments,
        currentInstallment: i + 1,
        installmentGroupId: groupId,
      });
    }

    setExpenses([...expenses, ...newExpenses]);
    setActiveTab('dashboard');
  };

  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (expenseToDelete?.installmentGroupId) {
       if (confirm('Deseja excluir todas as parcelas desta compra?')) {
         setExpenses(expenses.filter(e => e.installmentGroupId !== expenseToDelete.installmentGroupId));
         return;
       }
    }
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleEditExpense = (id: string) => {
    setEditingExpenseId(id);
    setActiveTab('expenses');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddUser = (name: string, color: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      color,
    };
    setUsers([...users, newUser]);
  };

  const handleRemoveUser = (id: string) => {
    if (users.length <= 1) {
      alert("Deve haver pelo menos um usuário.");
      return;
    }
    setUsers(users.filter(u => u.id !== id));
    setExpenses(expenses.filter(e => e.userId !== id));
  };

  const toggleMonthPayment = () => {
    const isPaid = settings.paidMonths.includes(currentMonthStr);
    if (isPaid) {
      setSettings({
        ...settings,
        paidMonths: settings.paidMonths.filter(m => m !== currentMonthStr),
      });
    } else {
      setSettings({
        ...settings,
        paidMonths: [...settings.paidMonths, currentMonthStr],
      });
    }
  };

  const [showAllExpenses, setShowAllExpenses] = React.useState(false);

  const filteredExpenses = expenses
    .filter(e => e.billingMonth === currentMonthStr)
    .filter(e => filterUserId ? e.userId === filterUserId : true);

  const listExpenses = showAllExpenses 
    ? expenses.filter(e => filterUserId ? e.userId === filterUserId : true)
    : filteredExpenses;

  const totalInMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate used limit
  // Only unpaid months subtract from limit? If bill is paid, that amount is replenished.
  // Actually, usually the limit is: Fixed Limit - Total of all Future Installments - Current unpaid bill.
  // User said: "when paid, take the paid value and increase the available limit"
  // So: Available Limit = Total Limit - Total of ALL expenses + Total of all PAID months.
  
  const totalAllExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidMonths = expenses.reduce((sum, e) => {
    if (settings.paidMonths.includes(e.billingMonth)) {
      return sum + e.amount;
    }
    return sum;
  }, 0);

  const availableLimit = settings.totalLimit - totalAllExpenses + totalPaidMonths;

  const handleExportData = () => {
    const data = {
      users,
      expenses,
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitcard-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    // CSV Header
    const headers = ['ID', 'Descrição', 'Valor', 'Data', 'Mês de Faturamento', 'Categoria', 'Parcelas Totais', 'Parcela Atual', 'Grupo', 'Usuário'];
    
    // Rows
    const rows = expenses.map(e => {
      const user = users.find(u => u.id === e.userId)?.name || 'Desconhecido';
      // Basic CSV formatting: quote strings, use semicolon for better Excel compatibility in pt-BR
      const description = `"${e.description.replace(/"/g, '""')}"`;
      const amount = e.amount.toFixed(2).replace('.', ',');
      const category = `"${e.category}"`;
      const userName = `"${user}"`;
      
      return [
        e.id,
        description,
        amount,
        e.date,
        e.billingMonth,
        category,
        e.installments,
        e.currentInstallment,
        e.installmentGroupId || '',
        userName
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    // Add BOM for Excel UTF-8 support
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitcard-gastos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.users && json.expenses && json.settings) {
          setUsers(json.users);
          setExpenses(json.expenses);
          setSettings(json.settings);
          alert('Dados importados com sucesso!');
        } else {
          alert('Formato de arquivo inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
    { id: 'expenses', icon: ListFilter, label: 'Gastos' },
    { id: 'settings', icon: CreditCard, label: 'Ajustes' },
    { id: 'users', icon: Users, label: 'Membros' },
  ];

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-800 font-sans" id="app-root">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1E293B] flex-col text-white p-6 shrink-0" id="sidebar">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl italic shadow-lg shadow-indigo-500/20">S</div>
          <span className="text-xl font-bold tracking-tight">SplitCard</span>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id 
                ? 'bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 py-3 bg-slate-800 rounded-xl mb-4">
           <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Dia de Fechamento</div>
           <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Dia {settings.closingDay}</span>
              <input 
                type="range" min="1" max="28" 
                value={settings.closingDay} 
                onChange={(e) => setSettings({...settings, closingDay: parseInt(e.target.value)})}
                className="w-24 accent-indigo-500"
              />
           </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
           <button 
            className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            id="btn-logout"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center" id="app-header">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">SplitCard • Admin</p>
            </div>

            <div className="h-10 w-px bg-slate-100 hidden md:block" />

            {/* Month Navigator */}
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <div className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={toggleMonthPayment}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                settings.paidMonths.includes(currentMonthStr)
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${settings.paidMonths.includes(currentMonthStr) ? 'fill-emerald-600' : ''}`} />
              {settings.paidMonths.includes(currentMonthStr) ? 'Fatura Paga' : 'Marcar como Paga'}
            </button>

            <button 
              onClick={() => setActiveTab('expenses')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
              id="btn-new-expense-header"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </header>

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${currentMonthStr}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <>
                    {filterUserId && (
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                            style={{ backgroundColor: users.find(u => u.id === filterUserId)?.color }}
                          >
                            {users.find(u => u.id === filterUserId)?.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-indigo-900">Gastos de {users.find(u => u.id === filterUserId)?.name}</h4>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Visualização Isolada</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setFilterUserId(null)}
                          className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Limpar Filtro
                        </button>
                      </div>
                    )}
                    <Dashboard 
                      expenses={filteredExpenses} 
                      allExpenses={expenses.filter(e => filterUserId ? e.userId === filterUserId : true)}
                      users={users} 
                      totalLimit={settings.totalLimit}
                      availableLimit={availableLimit}
                      onUserClick={setFilterUserId}
                    />
                  </>
                )}
                {activeTab === 'expenses' && (
                  <div className="space-y-8">
                    {filterUserId && (
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                            style={{ backgroundColor: users.find(u => u.id === filterUserId)?.color }}
                          >
                            {users.find(u => u.id === filterUserId)?.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-indigo-900">Mostrando gastos de {users.find(u => u.id === filterUserId)?.name}</h4>
                          </div>
                        </div>
                        <button 
                          onClick={() => setFilterUserId(null)}
                          className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Limpar Filtro
                        </button>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setShowAllExpenses(!showAllExpenses)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          showAllExpenses 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        {showAllExpenses ? 'Mostrando Tudo' : 'Ver Histórico Completo'}
                      </button>
                    </div>

                    <ExpenseForm 
                      onAddExpense={handleAddExpense} 
                      users={users} 
                      initialData={editingExpenseId ? expenses.find(e => e.id === editingExpenseId) : null} 
                      onCancelEdit={() => setEditingExpenseId(null)}
                    />
                    <ExpenseList 
                      expenses={listExpenses} 
                      users={users} 
                      onDeleteExpense={handleDeleteExpense} 
                      onEditExpense={handleEditExpense}
                    />
                  </div>
                )}
                {activeTab === 'users' && (
                  <UserManagement 
                    users={users} 
                    onAddUser={handleAddUser} 
                    onRemoveUser={handleRemoveUser} 
                  />
                )}
                {activeTab === 'settings' && (
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-indigo-600" />
                      Configurações do App
                    </h3>
                    
                    <div className="space-y-10 text-left">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financeiro</h4>
                         <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200">
                          <label className="block text-sm font-bold text-slate-700 mb-3">Limite Total do Cartão (R$)</label>
                          <input 
                            type="number"
                            value={settings.totalLimit}
                            onChange={(e) => setSettings({ ...settings, totalLimit: parseFloat(e.target.value) || 0 })}
                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all font-mono font-bold text-2xl text-indigo-600 bg-white"
                          />
                          <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">Este valor é a base para o cálculo do limite disponível no dashboard.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fechamento</h4>
                        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200">
                          <label className="block text-sm font-bold text-slate-700 mb-4">Dia de Fechamento da Fatura</label>
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            <input 
                              type="range" min="1" max="28" 
                              value={settings.closingDay} 
                              onChange={(e) => setSettings({...settings, closingDay: parseInt(e.target.value)})}
                              className="flex-1 w-full accent-indigo-600 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center bg-white px-6 py-4 rounded-2xl border-2 border-indigo-100 shadow-sm min-w-[120px]">
                               <span className="text-3xl font-black text-indigo-600">Dia {settings.closingDay}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Todo Mês</span>
                            </div>
                          </div>
                          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed font-medium">Lançamentos realizados após este dia serão automaticamente jogados para o faturamento do mês seguinte.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Backup e Segurança</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <button 
                             onClick={handleExportData}
                             className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group"
                           >
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-6 h-6 rotate-45" />
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-slate-900">Exportar Backup</div>
                                <div className="text-[10px] text-slate-500 font-medium">Baixar arquivo JSON</div>
                              </div>
                           </button>

                           <button 
                             onClick={handleExportCSV}
                             className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group"
                           >
                              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ListFilter className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-slate-900">Exportar Planilha</div>
                                <div className="text-[10px] text-slate-500 font-medium">Baixar arquivo CSV</div>
                              </div>
                           </button>

                           <label className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer">
                              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-slate-900">Importar Backup</div>
                                <div className="text-[10px] text-slate-500 font-medium">Restaurar de arquivo</div>
                              </div>
                           </label>
                        </div>
                      </div>

                      <div className="pt-10 border-t border-slate-100">
                          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Zona Crítica</h4>
                          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                             <div className="text-left">
                                <div className="text-sm font-bold text-rose-900">Limpar Todos os Registros</div>
                                <div className="text-[11px] text-rose-700 opacity-70">Atenção: Isso apagará permanentemente todos os gastos e pessoas.</div>
                             </div>
                             <button 
                                onClick={async () => {
                                  if(confirm('Tem certeza absoluta? Isso apagará EXATAMENTE TUDO do servidor.')) {
                                    try {
                                      await fetch('/api/save', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ users: INITIAL_USERS, expenses: [], settings: INITIAL_SETTINGS }),
                                      });
                                      window.location.reload();
                                    } catch (err) {
                                      alert('Erro ao limpar dados do servidor.');
                                    }
                                  }
                                }}
                                className="px-6 py-3 bg-white text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-200 whitespace-nowrap"
                              >
                                Apagar Tudo
                              </button>
                          </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-3 px-4 z-50 shadow-lg" id="mobile-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400 font-medium'}`}
            id={`mobile-nav-${item.id}`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

