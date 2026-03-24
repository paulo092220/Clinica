
import React, { useMemo, useState } from 'react';
import { Patient, TreatmentRecord, Appointment, PaymentMethod } from '../types';
import { Icons } from '../constants';

interface BillingProps {
  patients: Patient[];
  appointments: Appointment[];
}

const Billing: React.FC<BillingProps> = ({ patients, appointments }) => {
  const [filterMethod, setFilterMethod] = useState<'All' | PaymentMethod>('All');
  
  // Date range filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const allRecords = useMemo(() => {
    const treatments = patients.flatMap(p => 
      p.history.map(h => ({ 
        ...h, 
        patientName: p.name, 
        patientId: p.id,
        isReservation: false
      }))
    );

    const reservations = appointments
      .filter(a => a.status !== 'cancelled' && (a.reservationFeeCUP > 0 || a.reservationFeeUSD > 0))
      .map(a => ({
        id: 'res-' + a.id,
        date: a.date,
        doctor: a.doctorName || 'Clínica',
        observations: 'Cobro de Reserva (Adelanto)',
        amountPaidCUP: a.reservationFeeCUP,
        amountPaidUSD: a.reservationFeeUSD,
        paidCurrency: (a.reservationFeeUSD > 0 ? 'USD' : 'CUP') as any,
        paymentMethod: a.paymentMethod,
        patientName: a.patientName,
        isReservation: true,
        services: []
      }));

    return [...treatments, ...reservations]
      .filter(r => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [patients, appointments, startDate, endDate]);

  const filteredHistory = useMemo(() => {
    if (filterMethod === 'All') return allRecords;
    return allRecords.filter(r => r.paymentMethod === filterMethod);
  }, [allRecords, filterMethod]);

  const stats = useMemo(() => {
    const calc = (method: PaymentMethod) => {
      return allRecords
        .filter(r => r.paymentMethod === method)
        .reduce((acc, r) => ({
          CUP: acc.CUP + r.amountPaidCUP,
          USD: acc.USD + r.amountPaidUSD
        }), { CUP: 0, USD: 0 });
    };

    return {
      efectivo: calc('Efectivo'),
      transferencia: calc('Transferencia'),
      tarjeta: calc('Tarjeta'),
      totalCUP: allRecords.reduce((sum, r) => sum + r.amountPaidCUP, 0),
      totalUSD: allRecords.reduce((sum, r) => sum + r.amountPaidUSD, 0)
    };
  }, [allRecords]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Facturación Central</h1>
          <p className="text-slate-500 font-medium">Reporte de ingresos del periodo seleccionado.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black px-3 py-1.5 outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hasta:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black px-3 py-1.5 outline-none" />
          </div>
          <button onClick={() => window.print()} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md">
            <Icons.Calendar />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="bg-emerald-600 px-8 py-4 flex justify-between items-center">
            <h3 className="text-white font-black uppercase text-xs tracking-widest italic">Caja (Efectivo)</h3>
            <div className="p-2 bg-white/20 rounded-lg text-white"><Icons.Coins /></div>
          </div>
          <div className="p-8 grid grid-cols-2 gap-6">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total en CUP</p>
               <p className="text-3xl font-black text-slate-900 tracking-tighter">$ {stats.efectivo.CUP.toLocaleString()}</p>
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total en USD</p>
               <p className="text-3xl font-black text-emerald-600 tracking-tighter">$ {stats.efectivo.USD.toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-sky-200 transition-all">
          <div className="bg-sky-600 px-8 py-4 flex justify-between items-center">
            <h3 className="text-white font-black uppercase text-xs tracking-widest italic">Banco (Transferencia)</h3>
            <div className="p-2 bg-white/20 rounded-lg text-white"><Icons.Dashboard /></div>
          </div>
          <div className="p-8 grid grid-cols-2 gap-6">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total en CUP</p>
               <p className="text-3xl font-black text-slate-900 tracking-tighter">$ {stats.transferencia.CUP.toLocaleString()}</p>
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total en USD</p>
               <p className="text-3xl font-black text-sky-600 tracking-tighter">$ {stats.transferencia.USD.toLocaleString()}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
           <h3 className="text-lg font-black text-slate-900 italic">Movimientos del Periodo</h3>
           <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              {(['All', 'Efectivo', 'Transferencia'] as const).map(m => (
                <button 
                  key={m}
                  onClick={() => setFilterMethod(m as any)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filterMethod === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {m === 'All' ? 'Todos' : m}
                </button>
              ))}
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Fecha / Cliente</th>
                <th className="px-8 py-6 text-center">Forma de Pago</th>
                <th className="px-8 py-6">Concepto</th>
                <th className="px-8 py-6 text-right">Importe Liquidado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((record) => (
                <tr key={record.id} className={`hover:bg-slate-50/50 transition-colors group ${record.isReservation ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-sky-600 uppercase mb-1">{record.date}</span>
                      <span className="text-sm font-black text-slate-900">{record.patientName}</span>
                      <span className="text-[10px] text-slate-400 italic font-bold">Dr. {record.doctor}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-sm border ${
                      record.paymentMethod === 'Efectivo' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-sky-100 text-sky-700 border-sky-200'
                    }`}>
                      {record.paymentMethod}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-600">{record.observations.substring(0, 50)}...</span>
                  </td>
                  <td className="px-8 py-5 text-right font-black">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-900">$ {record.amountPaidCUP.toLocaleString()} CUP</span>
                      {record.amountPaidUSD > 0 && <span className="text-[10px] text-emerald-600">$ {record.amountPaidUSD.toLocaleString()} USD</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest">Sin movimientos en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Billing;
