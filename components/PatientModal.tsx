
import React, { useState, useEffect } from 'react';
import { Patient, User } from '../types';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (patient: Patient) => void;
  initialData?: Patient | null;
  activeUser: User;
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onConfirm, initialData, activeUser }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    phone: '',
    age: 0,
    history: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        phone: '',
        age: 18,
        history: []
      });
    }
  }, [initialData, isOpen, activeUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patientRecord: Patient = {
      ...(formData as Patient),
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      // Si es nuevo, asignamos al doctor actual como principal de la ficha
      treatingDoctor: initialData?.treatingDoctor || activeUser.name,
      lastVisit: initialData?.lastVisit || new Date().toISOString().split('T')[0],
      gallery: formData.gallery || [],
      history: formData.history || []
    };
    onConfirm(patientRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Editar Paciente' : 'Registrar Paciente'}</h2>
            <p className="text-sm text-slate-500">Información básica del paciente.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all outline-none"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Teléfono (Opcional)</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all outline-none"
                placeholder="+54 11..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Edad</label>
              <input 
                required
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="flex items-end">
               <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl w-full">
                  <p className="text-[10px] font-black text-sky-600 uppercase">Doctor Responsable</p>
                  <p className="text-sm font-bold text-slate-700">{initialData?.treatingDoctor || activeUser.name}</p>
               </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-100 transition-all"
            >
              {initialData ? 'Actualizar Ficha' : 'Guardar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;
