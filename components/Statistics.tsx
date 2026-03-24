
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Appointment, Patient, Service, User } from '../types';
import { Icons } from '../constants';

interface StatisticsProps {
  appointments: Appointment[];
  patients: Patient[];
  services: Service[];
  activeUser: User;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Statistics: React.FC<StatisticsProps> = ({ appointments, patients, services, activeUser }) => {
  // 1. Datos Mensuales (Ingresos y Pacientes)
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string, revenueCUP: number, revenueUSD: number, patients: number }> = {};
    
    // Obtener los últimos 6 meses
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
      data[monthKey] = { month: monthKey, revenueCUP: 0, revenueUSD: 0, patients: 0 };
    }

    // Sumar desde tratamientos
    patients.forEach(p => {
      p.history.forEach(h => {
        const d = new Date(h.date);
        const monthKey = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        if (data[monthKey]) {
          data[monthKey].revenueCUP += h.amountPaidCUP || 0;
          data[monthKey].revenueUSD += h.amountPaidUSD || 0;
          // Contaremos los pacientes de forma única más abajo, aquí solo sumamos ingresos
        }
      });
    });

    // Sumar desde reservas
    appointments.forEach(app => {
      if (app.status !== 'cancelled') {
        const d = new Date(app.date);
        const monthKey = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        if (data[monthKey]) {
          data[monthKey].revenueCUP += app.reservationFeeCUP || 0;
          data[monthKey].revenueUSD += app.reservationFeeUSD || 0;
        }
      }
    });

    // Contar pacientes únicos por mes
    patients.forEach(p => {
      const visitedMonths = new Set<string>();
      p.history.forEach(h => {
        const d = new Date(h.date);
        visitedMonths.add(d.toLocaleString('es-ES', { month: 'short', year: '2-digit' }));
      });
      visitedMonths.forEach(monthKey => {
        if (data[monthKey]) {
          data[monthKey].patients += 1;
        }
      });
    });

    return Object.values(data);
  }, [patients, appointments]);

  // 2. Estomatólogos que más reportan dinero
  const dentistPerformance = useMemo(() => {
    const data: Record<string, { name: string, revenueCUP: number, revenueUSD: number }> = {};
    
    patients.forEach(p => {
      p.history.forEach(h => {
        const name = h.doctor || 'Sin asignar';
        if (!data[name]) data[name] = { name, revenueCUP: 0, revenueUSD: 0 };
        data[name].revenueCUP += h.amountPaidCUP || 0;
        data[name].revenueUSD += h.amountPaidUSD || 0;
      });
    });

    appointments.forEach(a => {
      if (a.status !== 'cancelled' && (a.reservationFeeCUP > 0 || a.reservationFeeUSD > 0)) {
        const name = a.doctorName || 'Sin asignar';
        if (!data[name]) data[name] = { name, revenueCUP: 0, revenueUSD: 0 };
        data[name].revenueCUP += a.reservationFeeCUP || 0;
        data[name].revenueUSD += a.reservationFeeUSD || 0;
      }
    });

    return Object.values(data).sort((a, b) => b.revenueCUP - a.revenueCUP).slice(0, 5);
  }, [patients, appointments]);

  // 3. Servicios más demandados
  const serviceDemand = useMemo(() => {
    const data: Record<string, { name: string, value: number }> = {};
    
    patients.forEach(p => {
      p.history.forEach(h => {
        if (h.services && h.services.length > 0) {
          h.services.forEach(s => {
            const serviceName = s.name || 'Otro';
            if (!data[serviceName]) data[serviceName] = { name: serviceName, value: 0 };
            data[serviceName].value += 1;
          });
        } else {
          const serviceName = 'Consulta General';
          if (!data[serviceName]) data[serviceName] = { name: serviceName, value: 0 };
          data[serviceName].value += 1;
        }
      });
    });

    return Object.values(data).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [patients]);

  // 4. Métricas de Mercado
  const marketMetrics = useMemo(() => {
    const totalRevenueCUP = monthlyData.reduce((sum, d) => sum + d.revenueCUP, 0);
    const totalPatients = monthlyData.reduce((sum, d) => sum + d.patients, 0);
    const avgRevenuePerPatient = totalPatients > 0 ? totalRevenueCUP / totalPatients : 0;
    
    const newPatientsThisMonth = patients.filter(p => {
      const d = new Date(p.lastVisit);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const totalTreatments = patients.reduce((sum, p) => sum + p.history.length, 0);

    return {
      avgRevenuePerPatient,
      newPatientsThisMonth,
      totalPatientsCount: patients.length,
      retentionRate: patients.length > 0 ? (patients.filter(p => p.history.length > 1).length / patients.length) * 100 : 0,
      totalTreatments
    };
  }, [monthlyData, patients]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Estadísticas e Inteligencia de Mercado</h1>
        <p className="text-slate-500 font-medium">Análisis profundo del rendimiento clínico y tendencias de crecimiento.</p>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Icons.Users /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pacientes Totales</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{marketMetrics.totalPatientsCount}</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">+{marketMetrics.newPatientsThisMonth} este mes</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Icons.Coins /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso Promedio / Paciente</p>
          </div>
          <p className="text-3xl font-black text-slate-900">$ {marketMetrics.avgRevenuePerPatient.toFixed(0)} <span className="text-sm text-slate-400">CUP</span></p>
          <p className="text-xs font-bold text-slate-400 mt-1">Basado en últimos 6 meses</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Icons.TrendingUp /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa de Retención</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{marketMetrics.retentionRate.toFixed(1)}%</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Pacientes con más de 1 visita</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Icons.Stethoscope /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios Realizados</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{marketMetrics.totalTreatments}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Histórico total completado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TENDENCIA DE INGRESOS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Tendencia de Ingresos Mensuales (CUP)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="revenueCUP" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FLUJO DE PACIENTES */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Flujo de Pacientes por Mes</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Bar dataKey="patients" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TOP ESTOMATÓLOGOS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Top Estomatólogos por Ingresos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dentistPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#475569'}} width={120} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Bar dataKey="revenueCUP" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SERVICIOS MÁS DEMANDADOS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Servicios más Demandados</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceDemand}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceDemand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECOMENDACIONES DE MERCADO */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/10 rounded-2xl"><Icons.AI /></div>
          <h3 className="text-xl font-black uppercase tracking-widest">Insights de Mercado</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
              <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">Oportunidad de Crecimiento</p>
              <p className="text-sm font-medium leading-relaxed">
                El servicio de <span className="font-black text-white">"{serviceDemand[0]?.name}"</span> representa el {marketMetrics.totalTreatments > 0 ? ((serviceDemand[0]?.value / marketMetrics.totalTreatments) * 100).toFixed(1) : 0}% de tu demanda. Considera crear paquetes promocionales o campañas específicas para este servicio para maximizar ingresos.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
              <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">Análisis de Retención</p>
              <p className="text-sm font-medium leading-relaxed">
                Tu tasa de retención es del <span className="font-black text-white">{marketMetrics.retentionRate.toFixed(1)}%</span>. {marketMetrics.retentionRate < 50 ? 'Podrías mejorar el seguimiento post-tratamiento para fomentar visitas recurrentes.' : 'Tienes una base de pacientes leales sólida, excelente trabajo en la experiencia del paciente.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
