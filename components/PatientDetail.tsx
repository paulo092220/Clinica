
import React, { useState, useMemo } from 'react';
import { Patient, TreatmentRecord, Service, PerformedService, GalleryItem, User, Currency, InventoryItem, ConsumedItem, Appointment } from '../types';
import { Icons } from '../constants';
import Odontogram from './Odontogram';
import ClinicalHistoryView from './ClinicalHistoryView';
import ClinicalGallery from './ClinicalGallery';
import { getSmartSummary } from '../services/geminiService';

interface PatientDetailProps {
  patient: Patient;
  appointments: Appointment[];
  services: Service[];
  inventory: InventoryItem[];
  activeUser: User;
  onBack: () => void;
  onSchedule?: () => void;
  onEdit?: (patient: Patient) => void;
  onAddHistory?: (patientId: string, record: TreatmentRecord) => void;
  onUpdateGallery?: (patientId: string, item: GalleryItem) => void;
  onUpdatePatientData?: (patient: Patient) => void;
}

type Tab = 'history' | 'appointments' | 'billing' | 'record' | 'odontogram' | 'gallery';

const PatientDetail: React.FC<PatientDetailProps> = ({ 
  patient, 
  appointments,
  services, 
  inventory,
  activeUser,
  onBack, 
  onSchedule, 
  onEdit, 
  onAddHistory,
  onUpdateGallery,
  onUpdatePatientData
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [billServices, setBillServices] = useState<PerformedService[]>([]);
  const [billSupplies, setBillSupplies] = useState<ConsumedItem[]>([]);
  const [extraCharge, setExtraCharge] = useState({ amount: 0, reason: '' });
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [paidCurrency, setPaidCurrency] = useState<Currency>('CUP');
  const [searchTermInventory, setSearchTermInventory] = useState('');
  const [manualAppointmentCreatedAt, setManualAppointmentCreatedAt] = useState('');

  const financialStats = useMemo(() => {
    return (patient.history || []).reduce((acc, record) => {
      acc.totalCUP += record.amountPaidCUP || 0;
      acc.totalUSD += record.amountPaidUSD || 0;
      return acc;
    }, { totalCUP: 0, totalUSD: 0 });
  }, [patient.history]);

  const currentBillTotals = useMemo(() => {
    const servicesTotal = billServices.reduce((acc, s) => {
      acc.cup += s.priceCUP;
      acc.usd += s.priceUSD;
      return acc;
    }, { cup: 0, usd: 0 });

    // Assuming extraCharge logic (if exchange rate is needed, we'd use services exchange rate or a default)
    // For simplicity, we add the flat amount to the corresponding currency total
    const extraCUP = paidCurrency === 'CUP' ? extraCharge.amount : 0;
    const extraUSD = paidCurrency === 'USD' ? extraCharge.amount : 0;

    return {
      cup: servicesTotal.cup + extraCUP,
      usd: servicesTotal.usd + extraUSD
    };
  }, [billServices, extraCharge, paidCurrency]);

  const handleGenerateAISummary = async () => {
    setIsSummarizing(true);
    const summary = await getSmartSummary(patient);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  const handleAddServiceToBill = (s: Service) => {
    if (billServices.find(item => item.serviceId === s.id)) return;
    setBillServices([...billServices, { 
      serviceId: s.id, 
      name: s.name, 
      priceCUP: s.priceCUP, 
      priceUSD: s.priceUSD 
    }]);
  };

  const handleAddSupplyToBill = (item: InventoryItem) => {
    const existing = billSupplies.find(s => s.itemId === item.id);
    if (existing) {
      setBillSupplies(billSupplies.map(s => s.itemId === item.id ? { ...s, quantity: s.quantity + 1 } : s));
    } else {
      setBillSupplies([...billSupplies, { itemId: item.id, name: item.name, quantity: 1, unit: item.unit }]);
    }
  };

  const handleUpdateSupplyQuantity = (id: string, q: number) => {
    if (q <= 0) {
      setBillSupplies(billSupplies.filter(s => s.itemId !== id));
    } else {
      setBillSupplies(billSupplies.map(s => s.itemId === id ? { ...s, quantity: q } : s));
    }
  };

  const handleRemoveServiceFromBill = (id: string) => {
    setBillServices(billServices.filter(s => s.serviceId !== id));
  };

  const handleSaveBill = () => {
    if (billServices.length === 0 && extraCharge.amount <= 0 && billSupplies.length === 0) {
      alert("Por favor seleccione al menos un servicio, insumo o ingrese un cargo extra.");
      return;
    }
    
    const newRecord: TreatmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      doctor: activeUser.name, 
      observations: observations || 'Registro manual desde perfil',
      amountPaidCUP: currentBillTotals.cup,
      amountPaidUSD: currentBillTotals.usd,
      extraChargeCUP: paidCurrency === 'CUP' ? extraCharge.amount : 0,
      extraChargeUSD: paidCurrency === 'USD' ? extraCharge.amount : 0,
      extraChargeReason: extraCharge.reason,
      paidCurrency,
      paymentMethod,
      services: billServices,
      suppliesUsed: billSupplies,
      appointmentCreatedAt: manualAppointmentCreatedAt || undefined
    };

    onAddHistory?.(patient.id, newRecord);
    
    setBillServices([]);
    setBillSupplies([]);
    setExtraCharge({ amount: 0, reason: '' });
    setObservations('');
    setManualAppointmentCreatedAt('');
    setActiveTab('history');
  };

  const handleSaveOdontogram = (data: any, silent: boolean = false) => {
    const updatedPatient = {
      ...patient,
      odontogramData: data
    };
    
    onUpdatePatientData?.(updatedPatient);

    if (!silent) {
      const logRecord: TreatmentRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        doctor: activeUser.name,
        observations: "Actualización de Odontograma clínico.",
        amountPaidCUP: 0,
        amountPaidUSD: 0,
        paidCurrency: 'CUP',
        paymentMethod: 'Efectivo',
        services: []
      };
      onAddHistory?.(patient.id, logRecord);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Servicios Realizados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => handleAddServiceToBill(s)}
                      className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-sky-500 hover:shadow-lg transition-all"
                    >
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs text-sky-600 font-black mt-1">$ {s.priceCUP.toLocaleString()} CUP</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Insumos del Inventario</h3>
                  <div className="relative w-48">
                    <input 
                      type="text" 
                      placeholder="Buscar insumo..." 
                      className="w-full pl-8 pr-4 py-1.5 bg-slate-100 border-none rounded-xl text-[10px] outline-none"
                      value={searchTermInventory}
                      onChange={e => setSearchTermInventory(e.target.value)}
                    />
                    <span className="absolute left-2.5 top-2 text-slate-400 scale-75"><Icons.Search /></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {inventory.filter(i => i.name.toLowerCase().includes(searchTermInventory.toLowerCase())).slice(0, 6).map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleAddSupplyToBill(item)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-2"
                    >
                      <span className="text-emerald-600">+</span> {item.name}
                      <span className="text-slate-400 font-medium">({item.stock})</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4 bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <Icons.Plus /> Cargo Extra / Comisión Adicional
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Monto ({paidCurrency})</label>
                    <input 
                      type="number" 
                      value={extraCharge.amount} 
                      onChange={e => setExtraCharge({...extraCharge, amount: Number(e.target.value)})}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Motivo del Cobro Extra</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Urgencia nocturna, material especial..." 
                      value={extraCharge.reason}
                      onChange={e => setExtraCharge({...extraCharge, reason: e.target.value})}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Notas Clínicas de la Sesión</h3>
                <textarea 
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Describa el procedimiento y hallazgos..."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 outline-none focus:ring-4 focus:ring-sky-500/10 transition-all text-sm font-medium"
                />
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fecha de Agendamiento (Opcional)</h3>
                <input 
                  type="datetime-local" 
                  value={manualAppointmentCreatedAt}
                  onChange={e => setManualAppointmentCreatedAt(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 transition-all text-sm font-medium"
                />
              </section>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
              <div className="flex-1 space-y-8 relative z-10">
                <div className="text-center">
                  <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] mb-2">Liquidación de Sesión</p>
                  <h3 className="text-2xl font-black italic">Confirmación de Pago</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Servicios y Materiales</p>
                  {billServices.length === 0 && extraCharge.amount === 0 && billSupplies.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-4">Seleccione servicios o insumos para cobrar.</p>
                  ) : (
                    <>
                      {billServices.map(s => (
                        <div key={s.serviceId} className="flex justify-between items-center py-2 group">
                          <div><p className="text-sm font-bold">{s.name}</p></div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-sky-400">$ {s.priceCUP.toLocaleString()}</span>
                            <button onClick={() => handleRemoveServiceFromBill(s.serviceId)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash /></button>
                          </div>
                        </div>
                      ))}
                      {billSupplies.map(s => (
                        <div key={s.itemId} className="flex justify-between items-center py-2 group">
                          <div><p className="text-sm font-bold text-emerald-400">{s.name}</p></div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={s.quantity} 
                                onChange={e => handleUpdateSupplyQuantity(s.itemId, Number(e.target.value))}
                                className="w-10 bg-white/10 border-none rounded-lg text-xs font-black text-center p-1"
                              />
                              <span className="text-[10px] text-slate-500">{s.unit}</span>
                            </div>
                            <button onClick={() => handleUpdateSupplyQuantity(s.itemId, 0)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash /></button>
                          </div>
                        </div>
                      ))}
                      {extraCharge.amount > 0 && (
                        <div className="flex justify-between items-center py-2 bg-amber-500/10 px-4 rounded-xl border border-amber-500/20">
                          <div>
                            <p className="text-sm font-black text-amber-400">Cargo Extra</p>
                            <p className="text-[10px] text-slate-400 italic">{extraCharge.reason || 'Sin motivo especificado'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-amber-400">$ {extraCharge.amount.toLocaleString()}</span>
                            <button onClick={() => setExtraCharge({ amount: 0, reason: '' })} className="text-red-500"><Icons.Trash /></button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* MÉTODO DE PAGO SEGREGADO */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Forma de Pago (Para Facturación)</p>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('Efectivo')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Efectivo' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
                      >
                         <Icons.Coins />
                         <span className="text-[10px] font-black uppercase tracking-widest">Efectivo</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('Transferencia')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Transferencia' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
                      >
                         <Icons.Dashboard />
                         <span className="text-[10px] font-black uppercase tracking-widest">Transferencia</span>
                      </button>
                   </div>
                </div>
              </div>

              <div className="pt-8 mt-auto space-y-6 relative z-10">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  {(['CUP', 'USD'] as Currency[]).map(c => (
                    <button key={c} onClick={() => setPaidCurrency(c)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${paidCurrency === c ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'}`}>En {c}</button>
                  ))}
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex justify-between items-end">
                   <p className="text-[10px] font-black text-slate-500 uppercase">Importe Final</p>
                   <p className="text-4xl font-black">
                     {paidCurrency === 'CUP' ? `$ ${currentBillTotals.cup.toLocaleString()}` : `$ ${currentBillTotals.usd.toLocaleString()}`}
                     <span className="text-sm text-slate-500 ml-2">{paidCurrency}</span>
                   </p>
                </div>
                <button onClick={handleSaveBill} disabled={billServices.length === 0 && extraCharge.amount === 0} className="w-full py-6 bg-sky-600 text-white font-black uppercase text-xs tracking-[0.4em] rounded-[2rem] hover:bg-sky-500 shadow-2xl transition-all disabled:opacity-30 active:scale-95">Archivar y Liquidar</button>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black text-slate-800 tracking-tight">Cronología de Evolución</h4>
              <button 
                onClick={handleGenerateAISummary}
                disabled={isSummarizing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-200 disabled:opacity-50"
              >
                {isSummarizing ? 'Analizando...' : <><Icons.Brain /> Resumen IA</>}
              </button>
            </div>

            {aiSummary && (
              <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 animate-slideUp">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 rounded-xl"><Icons.Brain /></div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Síntesis Inteligente Gemini</h5>
                </div>
                <p className="text-sm leading-relaxed font-medium italic opacity-90">"{aiSummary}"</p>
              </div>
            )}

            {(patient.history || []).length > 0 ? (
              <div className="relative border-l-2 border-slate-100 ml-6 space-y-10 pl-10">
                {patient.history.map((record) => (
                  <div key={record.id} className="relative group">
                    <div className="absolute -left-[51px] top-2 w-6 h-6 bg-white border-4 border-sky-500 rounded-full shadow-lg z-10 transition-transform group-hover:scale-125"></div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 hover:shadow-xl transition-all hover:border-sky-100">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-slate-900">{record.date}</span>
                           <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Dr. {record.doctor}</span>
                           {record.appointmentCreatedAt && (
                             <span className="text-[9px] font-medium text-slate-400 mt-1">
                               Agendado el: {new Date(record.appointmentCreatedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${record.paymentMethod === 'Transferencia' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                             {record.paymentMethod}
                           </span>
                          <span className={`px-4 py-1.5 rounded-full ${record.paidCurrency === 'USD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-sky-50 text-sky-600 border-sky-100'} text-xs font-black border shadow-sm`}>
                            {record.paidCurrency === 'USD' ? `$ ${record.amountPaidUSD.toLocaleString()} USD` : `$ ${record.amountPaidCUP.toLocaleString()} CUP`}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl italic">"{record.observations}"</p>
                      
                      {((record.extraChargeCUP || 0) > 0 || (record.extraChargeUSD || 0) > 0) && (
                         <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center">
                            <div>
                               <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Cobro Extra:</span>
                               <p className="text-xs font-bold text-slate-700">{record.extraChargeReason || 'Sin motivo'}</p>
                            </div>
                            <span className="text-xs font-black text-amber-600">
                               + {record.paidCurrency === 'USD' ? `$ ${record.extraChargeUSD?.toLocaleString()} USD` : `$ ${record.extraChargeCUP?.toLocaleString()} CUP`}
                            </span>
                         </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {record.services?.map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-white text-slate-700 text-[10px] font-bold rounded-xl border border-slate-200 shadow-sm">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Sin registros clínicos previos.</div>}
          </div>
        );
      case 'appointments':
        const patientAppointments = appointments
          .filter(a => a.patientId === patient.id)
          .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
        
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-6">
            <h4 className="text-lg font-black text-slate-800 tracking-tight">Historial de Citas</h4>
            
            {patientAppointments.length > 0 ? (
              <div className="relative border-l-2 border-slate-100 ml-6 space-y-10 pl-10">
                {patientAppointments.map((appt) => (
                  <div key={appt.id} className="relative group">
                    <div className={`absolute -left-[51px] top-2 w-6 h-6 border-4 rounded-full shadow-lg z-10 transition-transform group-hover:scale-125 ${
                      appt.status === 'completed' ? 'bg-slate-900 border-slate-700' :
                      appt.status === 'confirmed' ? 'bg-emerald-500 border-emerald-400' :
                      appt.status === 'cancelled' ? 'bg-red-500 border-red-400' : 'bg-sky-500 border-sky-400'
                    }`}></div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 hover:shadow-xl transition-all hover:border-sky-100">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-slate-900">{appt.date} a las {appt.time}</span>
                           <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Dr. {appt.doctorName || 'No asignado'}</span>
                           {appt.createdAt && (
                             <span className="text-[9px] font-medium text-slate-400 mt-1">
                               Agendado el: {new Date(appt.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              appt.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                              appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              appt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                           }`}>
                             {appt.status === 'confirmed' ? 'Confirmada' : appt.status === 'completed' ? 'Completada' : appt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                           </span>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                         <span className="px-3 py-1 bg-white text-slate-700 text-[10px] font-bold rounded-xl border border-slate-200 shadow-sm">{appt.type}</span>
                         <span className="px-3 py-1 bg-white text-slate-700 text-[10px] font-bold rounded-xl border border-slate-200 shadow-sm">{appt.duration} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No hay citas registradas.</div>}
          </div>
        );
      case 'record':
        return <div className="animate-fadeIn py-4"><ClinicalHistoryView selectedPatient={patient} activeUser={activeUser} onUpdateOdontogram={(data) => handleSaveOdontogram(data, true)} /></div>;
      case 'odontogram':
        return <div className="max-w-6xl mx-auto animate-fadeIn bg-white rounded-[3rem] border border-slate-100 shadow-xl mt-4 p-8 overflow-hidden"><Odontogram initialData={patient.odontogramData} onSave={(data) => handleSaveOdontogram(data, false)} activeDoctorName={activeUser.name} /></div>;
      case 'gallery':
        return <div className="animate-fadeIn py-4"><ClinicalGallery patient={patient} onAddItem={(item) => onUpdateGallery?.(patient.id, item)} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex justify-between items-center px-2">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 transition-all gap-3 font-black uppercase text-[10px] tracking-widest group">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </div>
          Volver al Directorio
        </button>
        <div className="flex gap-4">
          <button onClick={onSchedule} className="px-6 py-3 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 active:scale-95">Agendar Cita</button>
          <button onClick={() => onEdit?.(patient)} className="px-6 py-3 bg-white text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm">Editar Perfil</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden p-10 flex flex-col md:flex-row items-center gap-10">
        <div className="relative">
          <img src={`https://picsum.photos/seed/pat-${patient.id}/300/300`} className="w-40 h-40 rounded-[2.5rem] border-8 border-slate-50 shadow-2xl object-cover" alt="" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
            <Icons.Plus />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{patient.name}</h2>
            <span className="px-4 py-1.5 bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-100">Activo</span>
          </div>
          <p className="text-slate-400 font-bold text-sm">Historial Clínico: #HC-{patient.id.substring(0, 6).toUpperCase()}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-6 border-t border-slate-50 mt-6">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Edad</p><p className="text-lg font-black text-slate-800">{patient.age} años</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto</p><p className="text-lg font-black text-slate-800">{patient.phone || 'N/A'}</p></div>
            <div><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Responsable</p><p className="text-lg font-black text-indigo-600">{patient.treatingDoctor || activeUser.name}</p></div>
            <div><p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Total CUP</p><p className="text-lg font-black text-sky-600">$ {financialStats.totalCUP.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
        <div className="border-b border-slate-100 flex bg-slate-50/30 px-6 overflow-x-auto custom-scrollbar">
          {[
            { id: 'history', label: 'Evolución', icon: Icons.Calendar }, 
            { id: 'appointments', label: 'Citas', icon: Icons.Calendar },
            { id: 'billing', label: 'Nueva Sesión', icon: Icons.Coins },
            { id: 'record', label: 'Ficha Clínica', icon: Icons.Stethoscope },
            { id: 'odontogram', label: 'Odontograma', icon: Icons.Dashboard },
            { id: 'gallery', label: 'Galería', icon: Icons.Plus }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as Tab)} 
              className={`px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 whitespace-nowrap flex items-center gap-3 ${
                activeTab === tab.id 
                ? 'text-sky-600 border-sky-600 bg-white' 
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-10 flex-1 bg-gradient-to-b from-white to-slate-50/30">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default PatientDetail;
