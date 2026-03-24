
import React, { useState, useEffect } from 'react';
import { Appointment, PaymentMethod, Service, Patient, User } from '../types';
import { Icons } from '../constants';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (appt: Omit<Appointment, 'id'>) => void;
  services: Service[];
  patients: Patient[];
  activeUser: User;
  initialPatientName?: string;
  initialTime?: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  isOpen, onClose, onConfirm, services, patients, activeUser,
  initialPatientName = '', initialTime = '' 
}) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: initialPatientName,
    patientAge: 18,
    doctorName: activeUser.name,
    serviceId: 'manual',
    type: 'Consulta General',
    date: new Date().toISOString().split('T')[0],
    time: initialTime || '09:00',
    duration: 30,
    status: 'pending' as const,
    priceCUP: 0,
    priceUSD: 0,
    reservationFeeCUP: 0,
    reservationFeeUSD: 0,
    paymentMethod: 'Efectivo' as PaymentMethod
  });

  const [search, setSearch] = useState(initialPatientName);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch(initialPatientName);
      setFormData(prev => ({
        ...prev,
        patientName: initialPatientName,
        time: initialTime || prev.time,
        doctorName: activeUser.name
      }));
    }
  }, [isOpen, initialPatientName, initialTime, activeUser]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const isExistingPatient = patients.some(p => p.name.toLowerCase() === search.toLowerCase());

  const handleSelectPatient = (p: Patient) => {
    setFormData({ 
      ...formData, 
      patientId: p.id, 
      patientName: p.name,
      patientAge: p.age 
    });
    setSearch(p.name);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ ...formData, patientName: search } as any);
    onClose();
    // Reset form
    setFormData({
      ...formData,
      patientId: '',
      patientName: '',
      patientAge: 18,
      priceCUP: 0,
      priceUSD: 0,
      reservationFeeCUP: 0,
      reservationFeeUSD: 0,
      type: 'Consulta General'
    });
    setSearch('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl h-full lg:h-[95vh] lg:rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp border border-slate-100 flex flex-col">
        <header className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Nueva Reserva</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión Noah's Agency</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
          {/* Doctor Info */}
          <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${activeUser.color} text-white`}>
              <Icons.Stethoscope />
            </div>
            <div>
              <select 
                value={formData.doctorName}
                onChange={e => setFormData({...formData, doctorName: e.target.value})}
                className="bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 p-0 outline-none"
              >
                <option value={activeUser.name}>{activeUser.name}</option>
                <option value="Dr. Ricardo Silva">Dr. Ricardo Silva</option>
                <option value="Dra. Elena Martínez">Dra. Elena Martínez</option>
                <option value="Dr. Carlos Pérez">Dr. Carlos Pérez</option>
              </select>
            </div>
          </div>

          {/* Sección: Identificación */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-sky-600 uppercase tracking-[0.2em] border-l-4 border-sky-600 pl-3">Identidad del Paciente</h3>
              {search.length > 2 && (
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${isExistingPatient ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                  {isExistingPatient ? 'Paciente Registrado' : 'Nuevo (Se registrará al asistir)'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={search}
                  onFocus={() => setShowResults(true)}
                  onChange={e => { 
                    setSearch(e.target.value); 
                    setFormData({...formData, patientId: ''}); 
                  }}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 text-base transition-all"
                  placeholder="Escriba el nombre..."
                />
                {showResults && search.length > 1 && filteredPatients.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredPatients.map(p => (
                      <button 
                        key={p.id} 
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full px-4 py-3 text-left hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-none"
                      >
                        <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400">Edad: {p.age} años</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Edad</label>
                <input 
                  required
                  type="number" 
                  value={formData.patientAge}
                  onChange={e => setFormData({...formData, patientAge: Number(e.target.value)})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 text-base"
                />
              </div>
            </div>
          </div>

          {/* Sección: Programación */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
              <input 
                required
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
              <input 
                required
                type="time" 
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Sección: Cobro de Reserva */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] space-y-6 shadow-2xl border border-slate-800">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-3">Cobro por Reserva</h3>
              <select 
                value={formData.paymentMethod}
                onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                className="bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 outline-none"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto CUP</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <span className="text-slate-500 font-bold">$</span>
                  <input 
                    type="number" 
                    value={formData.reservationFeeCUP}
                    onChange={e => setFormData({...formData, reservationFeeCUP: Number(e.target.value)})}
                    className="w-full bg-transparent text-white font-black outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Monto USD</label>
                <div className="flex items-center gap-2 bg-white/5 border border-emerald-500/10 rounded-2xl px-4 py-3">
                  <span className="text-emerald-500 font-bold">$</span>
                  <input 
                    type="number" 
                    value={formData.reservationFeeUSD}
                    onChange={e => setFormData({...formData, reservationFeeUSD: Number(e.target.value)})}
                    className="w-full bg-transparent text-emerald-400 font-black outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <footer className="px-10 py-8 border-t border-slate-100 flex gap-6 bg-slate-50/50">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200/50 rounded-2xl transition-all">
            Cancelar
          </button>
          <button type="submit" onClick={handleSubmit} className="flex-[2] py-4 bg-sky-600 text-white font-black uppercase text-xs tracking-[0.4em] rounded-2xl hover:bg-sky-700 shadow-2xl transition-all">
            Confirmar Reserva
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ScheduleModal;
