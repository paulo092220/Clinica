
import React, { useState } from 'react';
import { Appointment } from '../types';
import { Icons } from '../constants';

interface CalendarProps {
  appointments: Appointment[];
  onSlotClick: (time: string) => void;
  onDeleteAppointment?: (id: string) => void;
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void;
  onConfirmAppointment?: (appt: Appointment) => void;
  onStartCheckout?: (appt: Appointment) => void;
}

type CalendarView = 'day' | 'week' | 'month';

const Calendar: React.FC<CalendarProps> = ({ appointments, onSlotClick, onDeleteAppointment, onUpdateAppointment, onConfirmAppointment, onStartCheckout }) => {
  const [view, setView] = useState<CalendarView>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const dateString = currentDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const displayDate = currentDate.toISOString().split('T')[0]; 
  const dayAppts = appointments.filter(a => a.date === displayDate);

  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 capitalize">{view === 'day' ? 'Agenda Diaria' : 'Agenda'}</h1>
          <p className="text-slate-500 first-letter:uppercase font-medium">{dateString}</p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={handlePrevDay} className="p-2.5 hover:bg-slate-50 border-r border-slate-100 transition-colors text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={handleToday} className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-r border-slate-100">Hoy</button>
            <button onClick={handleNextDay} className="p-2.5 hover:bg-slate-50 transition-colors text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </header>

      {view === 'day' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {hours.map((hour) => {
              const apptsAtHour = dayAppts.filter(a => a.time.startsWith(hour.split(':')[0]));
              
              return (
                <div key={hour} className="flex min-h-[110px] group/row">
                  <div className="w-20 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{hour}</div>
                  <div className="flex-1 py-2 border-l border-slate-100 pl-4 relative space-y-3">
                    {apptsAtHour.map(appt => (
                      <div 
                        key={appt.id} 
                        className={`p-4 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md relative group/appt ${
                          appt.status === 'cancelled' ? 'opacity-50 grayscale' : ''
                        } ${
                          appt.type === 'Urgencia' ? 'bg-red-50 border-red-500 text-red-900' :
                          appt.type === 'Cirugía' ? 'bg-amber-50 border-amber-500 text-amber-900' :
                          appt.type === 'Ortodoncia' ? 'bg-indigo-50 border-indigo-500 text-indigo-900' :
                          'bg-sky-50 border-sky-500 text-sky-900'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <img src={`https://picsum.photos/seed/p${appt.patientId}/32/32`} className="w-8 h-8 rounded-full border border-white/50" alt="" />
                            <div>
                              <p className="text-sm font-bold leading-tight">{appt.patientName}</p>
                              <p className="text-[11px] opacity-75 font-medium">{appt.type} • {appt.duration} min • {appt.time}</p>
                              {appt.createdAt && (
                                <p className="text-[10px] opacity-60 font-medium mt-1">
                                  Agendado: {new Date(appt.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex gap-1 opacity-0 group-hover/appt:opacity-100 transition-opacity">
                               {appt.status === 'confirmed' && (
                                 <button 
                                  onClick={() => onStartCheckout?.(appt)}
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white shadow-sm transition-all"
                                  title="Iniciar Cobro y Evolución"
                                 >
                                    <Icons.Coins />
                                 </button>
                               )}
                               {appt.status === 'pending' && (
                                 <button 
                                  onClick={() => onConfirmAppointment?.(appt)}
                                  className="p-1.5 bg-sky-500 hover:bg-sky-600 rounded-lg text-white shadow-sm transition-all"
                                  title="Confirmar Asistencia"
                                 >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                 </button>
                               )}
                               {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                 <button 
                                  onClick={() => onUpdateAppointment?.(appt.id, { status: 'cancelled' })}
                                  className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-white shadow-sm transition-all"
                                  title="Marcar como No Asistió"
                                 >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                 </button>
                               )}
                               <button 
                                onClick={() => onDeleteAppointment?.(appt.id)}
                                className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100 transition-all"
                               >
                                  <Icons.Trash />
                                </button>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1 shadow-sm border ${
                                appt.status === 'confirmed' ? 'bg-emerald-500 text-white border-emerald-400' : 
                                appt.status === 'completed' ? 'bg-slate-900 text-white border-slate-700' :
                                appt.status === 'cancelled' ? 'bg-red-500 text-white border-red-400' : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {appt.status === 'confirmed' ? 'Confirmada' : appt.status === 'completed' ? 'Tratado' : appt.status === 'cancelled' ? 'No Asistió' : 'Por Venir'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={() => onSlotClick(hour)}
                      className="opacity-0 group-hover/row:opacity-100 transition-all bg-slate-50/80 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold cursor-pointer border-2 border-dashed border-slate-200 py-3 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50"
                    >
                      <Icons.Plus />
                      <span className="ml-2">Nueva Reserva {hour}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Calendar;
