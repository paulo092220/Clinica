import React, { useState } from 'react';
import { Service } from '../types';
import { Icons } from '../constants';

interface ServicesManagerProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (id: string) => void;
}

const ServicesManager: React.FC<ServicesManagerProps> = ({ services, onAddService, onUpdateService, onDeleteService }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(350);
  
  const initialFormState: Partial<Service> = {
    name: '',
    category: 'Odontología General',
    priceCUP: 0,
    priceUSD: 0,
    exchangeRate: 350
  };

  const [formService, setFormService] = useState<Partial<Service>>(initialFormState);

  const handlePriceChange = (currency: 'CUP' | 'USD', value: number) => {
    const rate = Number(exchangeRate) || 1;
    if (currency === 'CUP') {
      const usdValue = value / rate;
      setFormService(prev => ({
        ...prev,
        priceCUP: value,
        priceUSD: Number(usdValue.toFixed(2))
      }));
    } else {
      const cupValue = value * rate;
      setFormService(prev => ({
        ...prev,
        priceUSD: value,
        priceCUP: Number(cupValue.toFixed(2))
      }));
    }
  };

  const handleRateUpdate = (newRate: number) => {
    setExchangeRate(newRate);
    setFormService(prev => {
      const cupValue = (prev.priceUSD || 0) * newRate;
      return {
        ...prev,
        exchangeRate: newRate,
        priceCUP: Number(cupValue.toFixed(2))
      };
    });
  };

  const handleEdit = (service: Service) => {
    setFormService(service);
    setExchangeRate(service.exchangeRate || 350);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setFormService(initialFormState);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formService.name && formService.priceCUP !== undefined) {
      const serviceData = {
        ...(formService as Service),
        id: isEditing ? (formService.id || '') : Math.random().toString(36).substr(2, 9),
        exchangeRate: exchangeRate
      };

      if (isEditing) {
        onUpdateService(serviceData);
      } else {
        onAddService(serviceData);
      }
      
      setIsFormOpen(false);
      setFormService(initialFormState);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo de Servicios</h1>
          <p className="text-slate-500 font-medium">Gestión de tratamientos y precios. Los cambios solo afectan a nuevas citas.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={handleAddNew}
            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-2xl hover:bg-sky-700 shadow-lg shadow-sky-100 transition-all flex items-center gap-2"
          >
            <Icons.Plus /> Nuevo Servicio
          </button>
        )}
      </header>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl animate-slideUp">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-black text-slate-800">{isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
             <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
               <Icons.Trash />
             </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Servicio</label>
                <input 
                  required
                  type="text" 
                  value={formService.name}
                  onChange={e => setFormService({...formService, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-700"
                  placeholder="Ej: Ortodoncia Estética"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría</label>
                <select 
                  value={formService.category}
                  onChange={e => setFormService({...formService, category: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-700"
                >
                  <option>Odontología General</option>
                  <option>Ortodoncia</option>
                  <option>Cirugía</option>
                  <option>Estética Dental</option>
                  <option>Endodoncia</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-sky-400">Vinculación de Precios</h3>
                <div className="flex items-center gap-3 bg-sky-500/10 px-4 py-2 rounded-xl border border-sky-500/30">
                  <span className="text-[9px] font-black text-sky-300 uppercase">Tasa Manual:</span>
                  <input 
                    type="number" 
                    value={exchangeRate} 
                    onChange={e => handleRateUpdate(Number(e.target.value))} 
                    className="w-16 bg-transparent text-sky-400 font-black text-lg outline-none text-center" 
                  />
                  <span className="text-[9px] font-black text-sky-300 uppercase">CUP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio en USD</label>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-emerald-400">$</span>
                    <input 
                      type="number" 
                      value={formService.priceUSD}
                      onChange={e => handlePriceChange('USD', Number(e.target.value))}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-black text-xl focus:border-emerald-500/50 transition-all"
                      placeholder="Monto USD"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio en CUP (Calculado)</label>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-sky-400">$</span>
                    <input 
                      type="number" 
                      value={formService.priceCUP}
                      onChange={e => handlePriceChange('CUP', Number(e.target.value))}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-white font-black text-xl focus:border-sky-500/50 transition-all"
                      placeholder="Monto CUP"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-sky-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-sky-700 shadow-2xl transition-all"
              >
                {isEditing ? 'Actualizar Servicio' : 'Registrar Servicio'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Servicio</th>
                <th className="px-8 py-6">Categoría</th>
                <th className="px-8 py-6 text-center">Precio CUP</th>
                <th className="px-8 py-6 text-center">Precio USD</th>
                <th className="px-8 py-6 text-center">Tasa Aplicada</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-900">{s.name}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-sky-50 text-sky-600 text-[10px] font-black uppercase rounded-lg border border-sky-100">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-700">
                    $ {s.priceCUP.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-emerald-600">
                    $ {s.priceUSD.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded border border-slate-200">
                      1 : {s.exchangeRate || '-'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleEdit(s)}
                        className="p-3 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all"
                      >
                        <Icons.Edit />
                      </button>
                      <button 
                        onClick={() => onDeleteService(s.id)}
                        className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center opacity-30 italic font-bold uppercase tracking-widest text-slate-400">
                    No hay servicios configurados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServicesManager;