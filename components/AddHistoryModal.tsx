
import React, { useState } from 'react';
// Added missing imports from types to satisfy interface requirements
import { TreatmentRecord, PaymentMethod, Currency, PerformedService, InventoryItem, ConsumedItem } from '../types';

interface AddHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onConfirm: (record: TreatmentRecord) => void;
}

const AddHistoryModal: React.FC<AddHistoryModalProps> = ({ isOpen, onClose, inventory, onConfirm }) => {
  const [formData, setFormData] = useState<TreatmentRecord>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    doctor: 'Dr. Ricardo Silva',
    observations: '',
    amountPaidCUP: 0,
    amountPaidUSD: 0,
    paidCurrency: 'CUP',
    paymentMethod: 'Efectivo',
    services: [],
    suppliesUsed: [],
    followUpTreatment: ''
  });

  const [searchTermInventory, setSearchTermInventory] = useState('');

  if (!isOpen) return null;

  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTermInventory.toLowerCase()));

  const addSupply = (item: InventoryItem) => {
    const existing = (formData.suppliesUsed || []).find(s => s.itemId === item.id);
    if (existing) {
      setFormData({
        ...formData,
        suppliesUsed: (formData.suppliesUsed || []).map(s => s.itemId === item.id ? { ...s, quantity: s.quantity + 1 } : s)
      });
    } else {
      setFormData({
        ...formData,
        suppliesUsed: [...(formData.suppliesUsed || []), { itemId: item.id, name: item.name, quantity: 1, unit: item.unit }]
      });
    }
  };

  const updateSupplyQuantity = (id: string, q: number) => {
    if (q <= 0) {
      setFormData({
        ...formData,
        suppliesUsed: (formData.suppliesUsed || []).filter(s => s.itemId !== id)
      });
    } else {
      setFormData({
        ...formData,
        suppliesUsed: (formData.suppliesUsed || []).map(s => s.itemId === id ? { ...s, quantity: q } : s)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: Ensure the record has an ID before confirming
    const recordWithId: TreatmentRecord = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9)
    };
    onConfirm(recordWithId);
    onClose();
    // Fix: Reset form with all required properties for TreatmentRecord
    setFormData({
      id: '',
      date: new Date().toISOString().split('T')[0],
      doctor: 'Dr. Ricardo Silva',
      observations: '',
      amountPaidCUP: 0,
      amountPaidUSD: 0,
      paidCurrency: 'CUP',
      paymentMethod: 'Efectivo',
      services: [],
      suppliesUsed: [],
      followUpTreatment: ''
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <header className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Añadir Registro Manual</h2>
            <p className="text-sm text-slate-500">Ingresa datos de consultas previas.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Fecha</label>
              <input 
                required
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Médico</label>
              <input 
                required
                type="text" 
                value={formData.doctor}
                onChange={e => setFormData({...formData, doctor: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Observaciones</label>
            <textarea 
              required
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
              className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="Describa los hallazgos o procedimiento realizado..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Cantidad Pagada (CUP)</label>
              <input 
                type="number" 
                // Fix: Changed from amountPaid to amountPaidCUP to match TreatmentRecord interface
                value={formData.amountPaidCUP}
                onChange={e => setFormData({...formData, amountPaidCUP: Number(e.target.value)})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Método de Pago</label>
              <select 
                value={formData.paymentMethod}
                onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Tratamiento Posterior</label>
            <input 
              type="text" 
              value={formData.followUpTreatment}
              onChange={e => setFormData({...formData, followUpTreatment: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej: Control en 15 días"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase">Insumos Utilizados</label>
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="text-[10px] p-1 border rounded"
                value={searchTermInventory}
                onChange={e => setSearchTermInventory(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {filteredInventory.slice(0, 6).map(item => (
                <button 
                  key={item.id}
                  type="button"
                  onClick={() => addSupply(item)}
                  className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold rounded-lg border border-slate-200 transition-colors"
                >
                  + {item.name}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {(formData.suppliesUsed || []).map(s => (
                <div key={s.itemId} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="text-xs font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={s.quantity} 
                      onChange={e => updateSupplyQuantity(s.itemId, Number(e.target.value))}
                      className="w-12 p-1 text-xs border rounded text-center"
                    />
                    <span className="text-[10px] text-slate-500">{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-lg transition-all">Guardar Registro</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHistoryModal;
