
import React, { useMemo } from 'react';
import { Investment, FixedExpense, Appointment, CommissionEntry, User, Patient, DistributionConfig } from '../types';
import { Icons } from '../constants';

interface FinancialDistributionProps {
  investments: Investment[];
  fixedExpenses: FixedExpense[];
  appointments: Appointment[];
  commissions: CommissionEntry[];
  activeUser: User;
  patients: Patient[];
  distributionConfig: DistributionConfig;
}

const FinancialDistribution: React.FC<FinancialDistributionProps> = ({ 
  investments, 
  fixedExpenses, 
  appointments, 
  commissions,
  activeUser,
  patients,
  distributionConfig
}) => {
  // 1. Calcular Ingresos Totales (Tratamientos + Reservas)
  const totals = useMemo(() => {
    let cup = 0;
    let usd = 0;

    // Sumar todos los tratamientos realizados
    patients.forEach(p => {
      p.history.forEach(h => {
        cup += h.amountPaidCUP || 0;
        usd += h.amountPaidUSD || 0;
      });
    });

    // Sumar las reservas de citas no canceladas
    appointments.forEach(a => {
      if (a.status !== 'cancelled') {
        cup += a.reservationFeeCUP || 0;
        usd += a.reservationFeeUSD || 0;
      }
    });

    return { cup, usd };
  }, [patients, appointments]);

  // 2. Calcular Inversión Inicial Total
  const totalInvestment = useMemo(() => {
    return investments.reduce((acc, inv) => {
      acc.cup += inv.amountCUP;
      acc.usd += inv.amountUSD;
      return acc;
    }, { cup: 0, usd: 0 });
  }, [investments]);

  // 3. Calcular Gastos Totales Realizados
  const totalExpenses = useMemo(() => {
    return fixedExpenses.reduce((acc, exp) => {
      acc.cup += exp.amountCUP;
      acc.usd += exp.amountUSD;
      return acc;
    }, { cup: 0, usd: 0 });
  }, [fixedExpenses]);

  // 4. Distribución según porcentajes configurados
  const distribution = useMemo(() => {
    return {
      investmentRecovery: {
        cup: totals.cup * (distributionConfig.investmentRecovery / 100),
        usd: totals.usd * (distributionConfig.investmentRecovery / 100),
        percentage: distributionConfig.investmentRecovery
      },
      operatingCosts: {
        cup: totals.cup * (distributionConfig.operatingCosts / 100),
        usd: totals.usd * (distributionConfig.operatingCosts / 100),
        percentage: distributionConfig.operatingCosts
      },
      dentists: {
        cup: totals.cup * (distributionConfig.doctorCommission / 100),
        usd: totals.usd * (distributionConfig.doctorCommission / 100),
        percentage: distributionConfig.doctorCommission
      },
      investor: {
        cup: totals.cup * (distributionConfig.investorPartner / 100),
        usd: totals.usd * (distributionConfig.investorPartner / 100),
        percentage: distributionConfig.investorPartner
      }
    };
  }, [totals, distributionConfig]);

  // Comparaciones
  const recoveryProgressCUP = totalInvestment.cup > 0 ? (distribution.investmentRecovery.cup / totalInvestment.cup) * 100 : 0;
  const expenseCoverageCUP = totalExpenses.cup > 0 ? (distribution.operatingCosts.cup / totalExpenses.cup) * 100 : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Distribución Financiera</h1>
        <p className="text-slate-500 font-medium">Análisis de rentabilidad y reparto de dividendos estratégicos.</p>
      </header>

      {/* RESUMEN DE INGRESOS */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] mb-2">Ingresos Brutos Totales</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-5xl font-black italic">$ {totals.cup.toLocaleString()} <span className="text-xl not-italic text-slate-400">CUP</span></h2>
              <h3 className="text-2xl font-bold text-emerald-400">$ {totals.usd.toLocaleString()} <span className="text-sm text-emerald-600/50">USD</span></h3>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tratamientos Realizados</p>
              <p className="text-xl font-black">{patients.reduce((sum, p) => sum + p.history.length, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RECUPERACIÓN DE INVERSIÓN */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg tracking-widest">{distributionConfig.investmentRecovery}% Recuperación</span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Fondo de Retorno</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-600">$ {distribution.investmentRecovery.cup.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-400">Acumulado para retorno</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Progreso de Recuperación</span>
              <span>{recoveryProgressCUP.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                style={{ width: `${Math.min(recoveryProgressCUP, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs font-bold text-slate-500 italic">Inversión Total: $ {totalInvestment.cup.toLocaleString()} CUP</p>
              {recoveryProgressCUP >= 100 ? (
                <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-lg">¡Inversión Recuperada!</span>
              ) : (
                <p className="text-xs font-black text-slate-900">Faltan: $ {(totalInvestment.cup - distribution.investmentRecovery.cup).toLocaleString()} CUP</p>
              )}
            </div>
          </div>
        </div>

        {/* GASTOS OPERATIVOS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg tracking-widest">{distributionConfig.operatingCosts}% Operativo</span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Fondo de Operación</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-600">$ {distribution.operatingCosts.cup.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-400">Disponible para gastos</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Cobertura de Gastos Realizados</span>
              <span>{expenseCoverageCUP.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${expenseCoverageCUP >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                style={{ width: `${Math.min(expenseCoverageCUP, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs font-bold text-slate-500 italic">Gastos Totales: $ {totalExpenses.cup.toLocaleString()} CUP</p>
              <p className="text-xs font-black text-slate-900">
                {distribution.operatingCosts.cup >= totalExpenses.cup 
                  ? `Superávit: $ ${(distribution.operatingCosts.cup - totalExpenses.cup).toLocaleString()} CUP`
                  : `Déficit: $ ${(totalExpenses.cup - distribution.operatingCosts.cup).toLocaleString()} CUP`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COMISIONES ESTOMATÓLOGOS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Icons.Users /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{distributionConfig.doctorCommission}% Estomatólogos</p>
              <h3 className="text-lg font-black text-slate-900">Pago por Producción</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-50 pb-4">
              <p className="text-sm font-bold text-slate-600">Total a Distribuir</p>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900">$ {distribution.dentists.cup.toLocaleString()} CUP</p>
                <p className="text-xs font-bold text-emerald-600">$ {distribution.dentists.usd.toLocaleString()} USD</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">Este monto se calcula sobre los ingresos generados por cada doctor individualmente.</p>
          </div>
        </div>

        {/* SOCIO INVERSOR */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Icons.Coins /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{distributionConfig.investorPartner}% Inversor</p>
              <h3 className="text-lg font-black text-slate-900">Dividendos de Socio</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-50 pb-4">
              <p className="text-sm font-bold text-slate-600">Utilidad Neta Socio</p>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-600">$ {distribution.investor.cup.toLocaleString()} CUP</p>
                <p className="text-xs font-bold text-emerald-400">$ {distribution.investor.usd.toLocaleString()} USD</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">Ganancia directa para el socio inversor tras cubrir costos y recuperación.</p>
          </div>
        </div>
      </div>

      {/* TABLA DE DESGLOSE POR DOCTOR */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Desglose de Producción por Estomatólogo ({distributionConfig.doctorCommission}%)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doctor</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ingreso Generado</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comisión ({distributionConfig.doctorCommission}%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(
                (() => {
                  const acc: Record<string, { cup: number, usd: number }> = {};
                  
                  // Sumar desde tratamientos
                  patients.forEach(p => {
                    p.history.forEach(h => {
                      const doc = h.doctor || 'Sin asignar';
                      if (!acc[doc]) acc[doc] = { cup: 0, usd: 0 };
                      acc[doc].cup += h.amountPaidCUP || 0;
                      acc[doc].usd += h.amountPaidUSD || 0;
                    });
                  });

                  // Sumar desde reservas
                  appointments.forEach(a => {
                    if (a.status !== 'cancelled' && (a.reservationFeeCUP > 0 || a.reservationFeeUSD > 0)) {
                      const doc = a.doctorName || 'Sin asignar';
                      if (!acc[doc]) acc[doc] = { cup: 0, usd: 0 };
                      acc[doc].cup += a.reservationFeeCUP || 0;
                      acc[doc].usd += a.reservationFeeUSD || 0;
                    }
                  });

                  return acc;
                })()
              ).map(([doc, income]) => (
                <tr key={doc} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="text-sm font-black text-slate-800">{doc}</p>
                  </td>
                  <td className="p-6 text-right">
                    <p className="text-xs font-bold text-slate-600">$ {income.cup.toLocaleString()} CUP</p>
                    <p className="text-[10px] text-emerald-600">$ {income.usd.toLocaleString()} USD</p>
                  </td>
                  <td className="p-6 text-right">
                    <p className="text-sm font-black text-indigo-600">$ {(income.cup * (distributionConfig.doctorCommission / 100)).toLocaleString()} CUP</p>
                    <p className="text-[10px] font-bold text-indigo-400">$ {(income.usd * (distributionConfig.doctorCommission / 100)).toLocaleString()} USD</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialDistribution;
