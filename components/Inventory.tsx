
import React, { useState } from 'react';
import { InventoryItem, InventoryTransaction, User } from '../types';
import { Icons } from '../constants';

interface InventoryProps {
  inventory: InventoryItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  activeUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onUpdateInventory, onDeleteItem, activeUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transactionType, setTransactionType] = useState<'In' | 'Out'>('In');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Materiales',
    stock: 0,
    unit: 'Unidades',
    minStock: 5,
    priceCUP: 0,
    priceUSD: 0
  });

  const [transactionData, setTransactionData] = useState({
    quantity: 1,
    note: ''
  });

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...newItem,
      history: [{
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        type: 'In',
        quantity: newItem.stock,
        note: 'Stock inicial',
        doctorName: activeUser.name
      }]
    };
    onUpdateInventory(item);
    setIsAddModalOpen(false);
    setNewItem({ name: '', category: 'Materiales', stock: 0, unit: 'Unidades', minStock: 5, priceCUP: 0, priceUSD: 0 });
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const newQuantity = transactionType === 'In' 
      ? selectedItem.stock + transactionData.quantity 
      : selectedItem.stock - transactionData.quantity;

    const transaction: InventoryTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      type: transactionType,
      quantity: transactionData.quantity,
      note: transactionData.note,
      doctorName: activeUser.name
    };

    const updatedItem: InventoryItem = {
      ...selectedItem,
      stock: newQuantity,
      lastRestock: transactionType === 'In' ? transaction.date : selectedItem.lastRestock,
      history: [transaction, ...selectedItem.history]
    };

    onUpdateInventory(updatedItem);
    setIsTransactionModalOpen(false);
    setSelectedItem(null);
    setTransactionData({ quantity: 1, note: '' });
  };

  const categories = ['Materiales', 'Instrumental', 'Limpieza', 'Anestesia', 'Desechables', 'Otros'];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventario de Clínica</h1>
          <p className="text-slate-500 font-medium">Control de insumos, materiales y stock crítico.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl"
        >
          <Icons.Plus /> Nuevo Insumo
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icons.Search />
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredInventory.map(item => {
          const isLowStock = item.stock <= item.minStock;
          return (
            <div key={item.id} className={`bg-white p-6 rounded-[2.5rem] border ${isLowStock ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all group`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg tracking-widest">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{item.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedItem(item); setTransactionType('In'); setIsTransactionModalOpen(true); }}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                    title="Entrada"
                  >
                    <Icons.Plus />
                  </button>
                  <button 
                    onClick={() => { setSelectedItem(item); setTransactionType('Out'); setIsTransactionModalOpen(true); }}
                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                    title="Salida"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actual</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>{item.stock}</span>
                    <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Requerido</p>
                  <p className="text-sm font-bold text-slate-600">{item.minStock} {item.unit}</p>
                </div>
              </div>

              {isLowStock && (
                <div className="mt-4 p-3 bg-amber-100/50 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Stock Crítico - Reponer pronto</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex gap-4">
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase">CUP</p>
                     <p className="text-xs font-bold text-slate-700">${item.priceCUP}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase">USD</p>
                     <p className="text-xs font-bold text-emerald-600">${item.priceUSD}</p>
                   </div>
                </div>
                <button 
                  onClick={() => { if(confirm('¿Eliminar este insumo?')) onDeleteItem(item.id); }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: AGREGAR INSUMO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nuevo Insumo</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors">
                <Icons.Trash />
              </button>
            </header>
            <form onSubmit={handleAddItem} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Material</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-sky-500" placeholder="Ej: Anestesia Carpule" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidad de Medida</label>
                  <input required type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" placeholder="Ej: Cajas, ml, u" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stock Inicial</label>
                  <input required type="number" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stock Mínimo</label>
                  <input required type="number" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Costo (CUP)</label>
                  <input required type="number" value={newItem.priceCUP} onChange={e => setNewItem({...newItem, priceCUP: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Costo (USD)</label>
                  <input required type="number" value={newItem.priceUSD} onChange={e => setNewItem({...newItem, priceUSD: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl">Registrar Insumo</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMIENTO (ENTRADA/SALIDA) */}
      {isTransactionModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
            <header className={`p-8 border-b border-slate-100 flex justify-between items-center ${transactionType === 'In' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {transactionType === 'In' ? 'Entrada de Stock' : 'Salida de Stock'}
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">{selectedItem.name}</p>
              </div>
              <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 bg-white text-slate-400 rounded-xl shadow-sm">
                <Icons.Trash />
              </button>
            </header>
            <form onSubmit={handleTransaction} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cantidad ({selectedItem.unit})</label>
                <input required type="number" min="1" value={transactionData.quantity} onChange={e => setTransactionData({...transactionData, quantity: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-2xl focus:bg-white focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nota / Observación</label>
                <textarea value={transactionData.note} onChange={e => setTransactionData({...transactionData, note: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-sky-500 h-24 resize-none" placeholder="Ej: Reposición mensual, Uso en cirugía..." />
              </div>
              <button type="submit" className={`w-full py-5 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl transition-all shadow-xl ${transactionType === 'In' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                Confirmar {transactionType === 'In' ? 'Entrada' : 'Salida'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
