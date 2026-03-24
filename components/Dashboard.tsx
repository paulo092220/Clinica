
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment, AppRoute, Service, User, Patient, FixedExpense, DistributionConfig } from '../types';
import { Icons } from '../constants';
import { generateMasterReportPDF } from '../services/pdfExportService';

interface DashboardProps {
  activeUser: User;
  onScheduleNew?: () => void;
  onNavigate: (route: AppRoute) => void;
  appointments: Appointment[];
  services: Service[];
  patients: Patient[];
  commissions?: any[];
  fixedExpenses?: FixedExpense[];
  distributionConfig?: DistributionConfig;
  users?: User[];
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void;
  onConfirmAppointment?: (appt: Appointment) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  activeUser, onScheduleNew, onNavigate, appointments, services, patients,
  fixedExpenses = [], distributionConfig, users = [],
  onUpdateAppointment, onConfirmAppointment 
}) => {
  const [showToast, setShowToast] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayAppts = useMemo(() => 
    appointments
      .filter(a => a.date === todayStr && a.status !== 'cancelled')
      .sort((a,b) => a.time.localeCompare(b.time))
  , [appointments, todayStr]);

  const pendingAppts = useMemo(() => 
    appointments
      .filter(a => a.status === 'pending')
      .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  , [appointments]);

  const revenueToday = useMemo(() => {
    let cup = 0;
    let usd = 0;
    
    // Sum from treatments today
    patients.forEach(p => {
      p.history.forEach(h => {
        if (h.date === todayStr) {
          cup += h.amountPaidCUP || 0;
          usd += h.amountPaidUSD || 0;
        }
      });
    });

    // Sum from reservations today
    appointments.forEach(a => {
      if (a.date === todayStr && a.status !== 'cancelled') {
        cup += a.reservationFeeCUP || 0;
        usd += a.reservationFeeUSD || 0;
      }
    });

    return { cup, usd };
  }, [patients, appointments, todayStr]);

  const newPatientsToday = useMemo(() => 
    patients.filter(p => p.lastVisit === todayStr && (p.history || []).length <= 1).length
  , [patients, todayStr]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dStr = d.toISOString().split('T')[0];
      
      let dayRevenue = 0;
      
      // Sum from treatments
      patients.forEach(p => {
        p.history.forEach(h => {
          if (h.date === dStr) {
            dayRevenue += h.amountPaidCUP || 0;
          }
        });
      });

      // Sum from reservations
      appointments.forEach(a => {
        if (a.date === dStr && a.status !== 'cancelled') {
          dayRevenue += a.reservationFeeCUP || 0;
        }
      });

      return { name: days[d.getDay()], revenue: dayRevenue };
    });
  }, [patients, appointments]);

  const handleExportPDF = () => {
    if (!distributionConfig) return;
    generateMasterReportPDF({
      patients,
      appointments,
      fixedExpenses,
      config: distributionConfig,
      users
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src={activeUser.avatar} className="w-16 h-16 rounded-3xl border-4 border-white shadow-xl object-cover" alt="User" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${activeUser.color} rounded-full border-2 border-white`}></div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 ${activeUser.color} text-white text-[9px] font-black rounded-full uppercase tracking-widest`}>{activeUser.role}</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
            <p className="text-slate-500 font-medium text-sm capitalize">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {activeUser.roleType === 'ADMIN' && (
            <button 
              onClick={handleExportPDF}
              className="flex-1 md:flex-none px-6 py-4 bg-slate-900 text-white rounded-[1.25rem] hover:bg-slate-800 shadow-xl transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95"
            >
              <Icons.Briefcase /> Reporte Maestro PDF
            </button>
          )}
          <button 
            onClick={onScheduleNew}
            className="flex-1 md:flex-none px-6 py-4 bg-sky-600 text-white rounded-[1.25rem] hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95"
          >
            <Icons.Plus /> Agendar Turno
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Citas Hoy', value: todayAppts.length.toString(), sub: 'Pacientes confirmados', icon: Icons.Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Ingresos Hoy', value: `$ ${revenueToday.cup.toLocaleString()} CUP`, sub: revenueToday.usd > 0 ? `+ $ ${revenueToday.usd.toLocaleString()} USD` : 'Monto liquidado', icon: Icons.Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Por Confirmar', value: pendingAppts.length.toString(), sub: 'Pendientes de validación', icon: Icons.Dashboard, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group transition-all hover:border-sky-200 hover:shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                  <Icon />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-all">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Rendimiento Semanal</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Comparativa de ingresos liquidados</p>
            </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}}
                    itemStyle={{fontWeight: '900', color: '#0ea5e9'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col border-t-4 border-t-sky-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Agenda de Hoy</h3>
              <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {todayAppts.length} Turnos
              </span>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
              {todayAppts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                   <div className="p-5 bg-white rounded-full shadow-sm mb-4 text-slate-300">
                     <Icons.Calendar />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sin citas agendadas<br/>para hoy</p>
                </div>
              ) : (
                todayAppts.map((appt) => (
                  <div key={appt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 group hover:bg-white hover:shadow-xl transition-all hover:border-sky-100">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] text-white ${appt.status === 'confirmed' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-sky-600 shadow-sky-100'} shadow-lg`}>
                            <span>{appt.time}</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{appt.patientName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{appt.type}</p>
                            {appt.createdAt && (
                              <p className="text-[9px] font-medium text-slate-400 mt-1">
                                Agendado: {new Date(appt.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                       </div>
                    </div>
                    
                    {appt.status === 'pending' && (
                      <div className="flex gap-2 border-t border-slate-200 pt-3">
                        <button 
                          onClick={() => onConfirmAppointment?.(appt)}
                          className="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                           Confirmar Asistencia
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => onNavigate(AppRoute.CALENDAR)}
              className="mt-8 w-full py-4 bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
