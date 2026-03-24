
import React, { useState, useEffect } from 'react';
import { Appointment, Service, PerformedService, PaymentMethod, Currency, InventoryItem, ConsumedItem } from '../types';
import { Icons } from '../constants';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  services: Service[];
  inventory: InventoryItem[];
  onConfirm: (data: {
    services: PerformedService[];
    suppliesUsed: ConsumedItem[];
    observations: string;
    totalCUP: number;
    totalUSD: number;
    extraChargeCUP?: number;
    extraChargeUSD?: number;
    extraChargeReason?: string;
    paymentMethod: PaymentMethod;
    paidCurrency: Currency;
  }) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, appointment, services, inventory, onConfirm }) => {
  const [selectedServices, setSelectedServices] = useState<PerformedService[]>([]);
  const [selectedSupplies, setSelectedSupplies] = useState<ConsumedItem[]>([]);
  const [extraCharge, setExtraCharge] = useState({ amount: 0, reason: '' });
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(appointment.paymentMethod || 'Efectivo');
  const [paidCurrency, setPaidCurrency] = useState<Currency>('CUP');
  
  const [searchTermService, setSearchTermService] = useState('');
  const [searchTermInventory, setSearchTermInventory] = useState('');

  useEffect(() => {
    if (isOpen && appointment) {
      setPaymentMethod(appointment.paymentMethod || 'Efectivo');
      const initialService = services.find(s => s.id === appointment.serviceId);
      if (initialService) {
        setSelectedServices([{
          serviceId: initialService.id,
          name: initialService.name,
          priceCUP: initialService.priceCUP,
          priceUSD: initialService.priceUSD
        }]);
      }
    }
  }, [isOpen, appointment, services]);

  if (!isOpen) return null;

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTermService.toLowerCase()));
  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTermInventory.toLowerCase()));

  const baseTotalCUP = selectedServices.reduce((sum, s) => sum + s.priceCUP, 0);
  const baseTotalUSD = selectedServices.reduce((sum, s) => sum + s.priceUSD, 0);

  const finalTotalCUP = baseTotalCUP + (paidCurrency === 'CUP' ? extraCharge.amount : 0);
  const finalTotalUSD = baseTotalUSD + (paidCurrency === 'USD' ? extraCharge.amount : 0);

  const addService = (s: Service) => {
    if (selectedServices.find(curr => curr.serviceId === s.id)) return;
    setSelectedServices([...selectedServices, { serviceId: s.id, name: s.name, priceCUP: s.priceCUP, priceUSD: s.priceUSD }]);
  };

  const removeService = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== id));
  };

  const addSupply = (item: InventoryItem) => {
    const existing = selectedSupplies.find(s => s.itemId === item.id);
    if (existing) {
      setSelectedSupplies(selectedSupplies.map(s => s.itemId === item.id ? { ...s, quantity: s.quantity + 1 } : s));
    } else {
      setSelectedSupplies([...selectedSupplies, { itemId: item.id, name: item.name, quantity: 1, unit: item.unit }]);
    }
  };

  const updateSupplyQuantity = (id: string, q: number) => {
    if (q <= 0) {
      setSelectedSupplies(selectedSupplies.filter(s => s.itemId !== id));
    } else {
      setSelectedSupplies(selectedSupplies.map(s => s.itemId === id ? { ...s, quantity: q } : s));
    }
  };

  const handleConfirm = () => {
    onConfirm({
      services: selectedServices,
      suppliesUsed: selectedSupplies,
      observations,
      totalCUP: finalTotalCUP,
      totalUSD: finalTotalUSD,
      extraChargeCUP: paidCurrency === 'CUP' ? extraCharge.amount : 0,
      extraChargeUSD: paidCurrency === 'USD' ? extraCharge.amount : 0,
      extraChargeReason: extraCharge.reason,
      paymentMethod,
      paidCurrency
    });
    onClose();
    setSelectedServices([]);
    setSelectedSupplies([]);
    setExtraCharge({ amount: 0, reason: '' });
    setObservations('');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-slideUp">
        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-sky-600 text-white rounded-[1.5rem] shadow-lg shadow-sky-100">
              <Icons.Coins />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 italic">Finalizar & Cobrar Consulta</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Paciente: <span className="text-slate-900 font-bold">{appointment.patientName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 p-8 border-r border-slate-100 overflow-y-auto space-y-8 custom-scrollbar">
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir Servicios</h3>
                <div className="relative w-64">
                   <input 
                    type="text" 
                    placeholder="Buscar servicio..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs outline-none"
                    value={searchTermService}
                    onChange={e => setSearchTermService(e.target.value)}
                   />
                   <span className="absolute left-3 top-2 text-slate-400"><Icons.Search /></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredServices.slice(0, 4).map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => addService(s)}
                    className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <p className="text-xs font-black text-slate-800 group-hover:text-sky-700">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">$ {s.priceCUP.toLocaleString()} CUP</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Insumos Utilizados (Inventario)</h3>
                <div className="relative w-64">
                   <input 
                    type="text" 
                    placeholder="Buscar insumo..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs outline-none"
                    value={searchTermInventory}
                    onChange={e => setSearchTermInventory(e.target.value)}
                   />
                   <span className="absolute left-3 top-2 text-slate-400"><Icons.Search /></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredInventory.slice(0, 4).map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => addSupply(item)}
                    className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-800 group-hover:text-emerald-700">{item.name}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${item.stock <= item.minStock ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        {item.stock} {item.unit}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">{item.category}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4 bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
               <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                 <Icons.Plus /> Cargo Adicional / Surcharge
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Monto ({paidCurrency})</label>
                    <input 
                      type="number" 
                      value={extraCharge.amount} 
                      onChange={e => setExtraCharge({...extraCharge, amount: Number(e.target.value)})}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                 </div>
                 <div className="sm:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Motivo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Recargo por urgencia, material extra..." 
                      value={extraCharge.reason}
                      onChange={e => setExtraCharge({...extraCharge, reason: e.target.value})}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    />
                 </div>
               </div>
            </section>

            <section className="space-y-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Observaciones Generales</h3>
               <textarea 
                value={observations}
                onChange={e => setObservations(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Resumen del procedimiento..."
               />
            </section>
          </div>

          <div className="w-full lg:w-[400px] bg-slate-900 p-8 text-white flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-widest text-center">Resumen Final</h3>
              
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase">Servicios</p>
                {selectedServices.length === 0 ? (
                   <p className="text-[10px] text-slate-600 italic">Ningún servicio seleccionado</p>
                ) : selectedServices.map(s => (
                  <div key={s.serviceId} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <button onClick={() => removeService(s.serviceId)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Icons.Trash /></button>
                      <p className="text-xs font-bold">{s.name}</p>
                    </div>
                    <span className="text-xs font-black text-sky-400">$ {s.priceCUP.toLocaleString()} CUP</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase">Insumos</p>
                {selectedSupplies.length === 0 ? (
                   <p className="text-[10px] text-slate-600 italic">Sin insumos registrados</p>
                ) : selectedSupplies.map(s => (
                  <div key={s.itemId} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateSupplyQuantity(s.itemId, 0)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Icons.Trash /></button>
                      <p className="text-xs font-bold">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                        type="number" 
                        value={s.quantity} 
                        onChange={e => updateSupplyQuantity(s.itemId, Number(e.target.value))}
                        className="w-12 bg-white/10 border-none rounded-lg text-xs font-black text-center p-1"
                       />
                       <span className="text-[10px] text-slate-500">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {extraCharge.amount > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-amber-500 uppercase">Cargo Extra</p>
                  <div className="flex justify-between items-start bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <div>
                      <p className="text-xs font-black text-amber-400">{extraCharge.reason || 'Surcharge'}</p>
                    </div>
                    <span className="text-xs font-black text-amber-400">$ {extraCharge.amount.toLocaleString()} {paidCurrency}</span>
                  </div>
                </div>
              )}

              <div className="pt-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Moneda de Pago</p>
                  <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    {(['CUP', 'USD'] as Currency[]).map(c => (
                      <button 
                        key={c}
                        onClick={() => setPaidCurrency(c)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter transition-all ${paidCurrency === c ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                      >
                        Pagar en {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Método de Pago Final</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Efectivo', 'Tarjeta', 'Transferencia'] as PaymentMethod[]).map(m => (
                      <button 
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${paymentMethod === m ? 'bg-sky-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Total Final</p>
                   <p className="text-3xl font-black text-white">
                     {paidCurrency === 'CUP' ? `$ ${finalTotalCUP.toLocaleString()}` : `$ ${finalTotalUSD.toLocaleString()}`}
                     <span className="text-xs text-slate-500 ml-2">{paidCurrency}</span>
                   </p>
                </div>
              </div>

              <button 
                onClick={handleConfirm}
                disabled={selectedServices.length === 0 && extraCharge.amount === 0}
                className="w-full py-5 bg-sky-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl hover:bg-sky-500 shadow-xl transition-all disabled:opacity-50 active:scale-95"
              >
                Cerrar Turno
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
