
import React, { useState } from 'react';
import { Investment, User, FixedExpense } from '../types';
import { Icons } from '../constants';

interface InvestmentsProps {
  investments: Investment[];
  onUpdateInvestment: (investment: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  fixedExpenses: FixedExpense[];
  onUpdateFixedExpense: (expense: FixedExpense) => void;
  onDeleteFixedExpense: (id: string) => void;
  activeUser: User;
}

type ViewMode = 'investments' | 'expenses';

const Investments: React.FC<InvestmentsProps> = ({ 
  investments, 
  onUpdateInvestment, 
  onDeleteInvestment,
  fixedExpenses,
  onUpdateFixedExpense,
  onDeleteFixedExpense,
  activeUser 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('investments');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Investment | FixedExpense | null>(null);

  const [investmentForm, setInvestmentForm] = useState<Omit<Investment, 'id'>>({
    name: '',
    amountCUP: 0,
    amountUSD: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Equipamiento',
    status: 'Realizado',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState<Omit<FixedExpense, 'id'>>({
    category: 'Alquiler',
    amountCUP: 0,
    amountUSD: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredInvestments = investments.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = fixedExpenses.filter(exp => 
    exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'investments') {
      const investment: Investment = {
        id: (editingItem as Investment)?.id || Math.random().toString(36).substr(2, 9),
        ...investmentForm
      };
      onUpdateInvestment(investment);
    } else {
      const expense: FixedExpense = {
        id: (editingItem as FixedExpense)?.id || Math.random().toString(36).substr(2, 9),
        ...expenseForm
      };
      onUpdateFixedExpense(expense);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (item: Investment | FixedExpense) => {
    setEditingItem(item);
    if ('name' in item) {
      setViewMode('investments');
      setInvestmentForm({
        name: item.name,
        amountCUP: item.amountCUP,
        amountUSD: item.amountUSD,
        date: item.date,
        category: item.category,
        status: item.status,
        notes: item.notes || ''
      });
    } else {
      setViewMode('expenses');
      setExpenseForm({
        category: item.category,
        amountCUP: item.amountCUP,
        amountUSD: item.amountUSD,
        date: item.date,
        notes: item.notes || ''
      });
    }
    setIsModalOpen(true);
  };

  const investmentCategories: Investment['category'][] = ['Equipamiento', 'Infraestructura', 'Tecnología', 'Mobiliario', 'Otros'];
  const expenseCategories: FixedExpense['category'][] = ['Alquiler', 'Electricidad', 'Limpieza', 'Merienda', 'Otros'];
  const statuses: Investment['status'][] = ['Planificado', 'Realizado', 'En Proceso'];

  const totalInvCUP = investments.reduce((sum, inv) => sum + inv.amountCUP, 0);
  const totalInvUSD = investments.reduce((sum, inv) => sum + inv.amountUSD, 0);
  
  const totalExpCUP = fixedExpenses.reduce((sum, exp) => sum + exp.amountCUP, 0);
  const totalExpUSD = fixedExpenses.reduce((sum, exp) => sum + exp.amountUSD, 0);

  const globalTotalCUP = totalInvCUP + totalExpCUP;
  const globalTotalUSD = totalInvUSD + totalExpUSD;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión Financiera Global</h1>
          <p className="text-slate-500 font-medium">Inversiones estratégicas y gastos operativos de la clínica.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            if (viewMode === 'investments') {
              setInvestmentForm({
                name: '',
                amountCUP: 0,
                amountUSD: 0,
                date: new Date().toISOString().split('T')[0],
                category: 'Equipamiento',
                status: 'Realizado',
                notes: ''
              });
            } else {
              setExpenseForm({
                category: 'Alquiler',
                amountCUP: 0,
                amountUSD: 0,
                date: new Date().toISOString().split('T')[0],
                notes: ''
              });
            }
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100"
        >
          <Icons.Plus /> {viewMode === 'investments' ? 'Nueva Inversión' : 'Nuevo Gasto'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inversión Clínica (Total)</p>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-900">$ {totalInvCUP.toLocaleString()} CUP</p>
            <p className="text-sm font-bold text-emerald-600">$ {totalInvUSD.toLocaleString()} USD</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gastos Operativos (Total)</p>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-900">$ {totalExpCUP.toLocaleString()} CUP</p>
            <p className="text-sm font-bold text-emerald-600">$ {totalExpUSD.toLocaleString()} USD</p>
          </div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-100 text-white">
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Inversión Global (Total)</p>
          <div className="space-y-1">
            <p className="text-2xl font-black">$ {globalTotalCUP.toLocaleString()} CUP</p>
            <p className="text-sm font-bold text-indigo-200">$ {globalTotalUSD.toLocaleString()} USD</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-50 flex bg-slate-50/30">
          <button 
            onClick={() => setViewMode('investments')}
            className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${viewMode === 'investments' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
          >
            Inversiones Clínicas
          </button>
          <button 
            onClick={() => setViewMode('expenses')}
            className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${viewMode === 'expenses' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
          >
            Gastos Fijos y Operativos
          </button>
        </div>

        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search />
            </span>
            <input 
              type="text" 
              placeholder={`Buscar ${viewMode === 'investments' ? 'inversión' : 'gasto'}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewMode === 'investments' ? 'Inversión' : 'Categoría'}</th>
                {viewMode === 'investments' && <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>}
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                {viewMode === 'investments' && <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>}
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {viewMode === 'investments' ? (
                filteredInvestments.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No hay inversiones registradas.</td></tr>
                ) : (
                  filteredInvestments.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6"><p className="text-xs font-black text-slate-900">{inv.date}</p></td>
                      <td className="p-6">
                        <p className="text-sm font-black text-slate-800">{inv.name}</p>
                        {inv.notes && <p className="text-[10px] text-slate-400 italic mt-1">{inv.notes}</p>}
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg tracking-widest">{inv.category}</span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900">$ {inv.amountCUP.toLocaleString()} CUP</p>
                          <p className="text-[10px] font-bold text-emerald-600">$ {inv.amountUSD.toLocaleString()} USD</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg tracking-widest ${
                          inv.status === 'Realizado' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'En Proceso' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Icons.Dashboard /></button>
                          <button onClick={() => { if(confirm('¿Eliminar esta inversión?')) onDeleteInvestment(inv.id); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Icons.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredExpenses.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No hay gastos registrados.</td></tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6"><p className="text-xs font-black text-slate-900">{exp.date}</p></td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg tracking-widest">{exp.category}</span>
                        {exp.notes && <p className="text-[10px] text-slate-400 italic mt-1">{exp.notes}</p>}
                      </td>
                      <td className="p-6 text-right">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900">$ {exp.amountCUP.toLocaleString()} CUP</p>
                          <p className="text-[10px] font-bold text-emerald-600">$ {exp.amountUSD.toLocaleString()} USD</p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(exp)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Icons.Dashboard /></button>
                          <button onClick={() => { if(confirm('¿Eliminar este gasto?')) onDeleteFixedExpense(exp.id); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Icons.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {editingItem ? 'Editar Registro' : (viewMode === 'investments' ? 'Nueva Inversión' : 'Nuevo Gasto')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white text-slate-400 rounded-xl hover:bg-slate-100 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {viewMode === 'investments' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre de la Inversión</label>
                    <input required type="text" value={investmentForm.name} onChange={e => setInvestmentForm({...investmentForm, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Ej: Sillón Dental A-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                      <select value={investmentForm.category} onChange={e => setInvestmentForm({...investmentForm, category: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm">
                        {investmentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
                      <input required type="date" value={investmentForm.date} onChange={e => setInvestmentForm({...investmentForm, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto (CUP)</label>
                      <input required type="number" value={investmentForm.amountCUP} onChange={e => setInvestmentForm({...investmentForm, amountCUP: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto (USD)</label>
                      <input required type="number" value={investmentForm.amountUSD} onChange={e => setInvestmentForm({...investmentForm, amountUSD: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                      {statuses.map(s => (
                        <button key={s} type="button" onClick={() => setInvestmentForm({...investmentForm, status: s})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${investmentForm.status === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas (Opcional)</label>
                    <textarea value={investmentForm.notes} onChange={e => setInvestmentForm({...investmentForm, notes: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 h-20 resize-none text-sm" placeholder="Detalles adicionales..." />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría del Gasto</label>
                    <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm">
                      {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
                    <input required type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto (CUP)</label>
                      <input required type="number" value={expenseForm.amountCUP} onChange={e => setExpenseForm({...expenseForm, amountCUP: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto (USD)</label>
                      <input required type="number" value={expenseForm.amountUSD} onChange={e => setExpenseForm({...expenseForm, amountUSD: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas (Opcional)</label>
                    <textarea value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 h-20 resize-none text-sm" placeholder="Ej: Pago de alquiler marzo..." />
                  </div>
                </>
              )}

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                {editingItem ? 'Actualizar Registro' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
