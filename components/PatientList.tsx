
import React, { useState } from 'react';
// Added GalleryItem to imports
import { Patient, TreatmentRecord, Service, User, GalleryItem, InventoryItem, Appointment } from '../types';
import { Icons } from '../constants';
import PatientDetail from './PatientDetail';

interface PatientListProps {
  patients: Patient[];
  appointments: Appointment[];
  services: Service[];
  inventory: InventoryItem[];
  activeUser: User;
  onScheduleForPatient?: (name: string) => void;
  onAddPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  onClinicalHistory?: (patient: Patient) => void;
  onAddHistory?: (patientId: string, record: TreatmentRecord) => void;
  // Added onUpdateGallery prop definition
  onUpdateGallery?: (patientId: string, item: GalleryItem) => void;
  onUpdatePatientObject?: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ 
  patients, 
  appointments,
  services,
  inventory,
  activeUser,
  onScheduleForPatient, 
  onAddPatient, 
  onEditPatient, 
  onDeletePatient,
  onClinicalHistory, 
  onAddHistory,
  onUpdateGallery,
  onUpdatePatientObject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.phone && p.phone.includes(searchTerm)) ||
    (p.treatingDoctor && p.treatingDoctor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedPatient) {
    const currentPatient = patients.find(p => p.id === selectedPatient.id) || selectedPatient;
    return (
      <PatientDetail 
        patient={currentPatient} 
        appointments={appointments}
        services={services}
        inventory={inventory}
        activeUser={activeUser}
        onBack={() => setSelectedPatient(null)} 
        onSchedule={() => onScheduleForPatient?.(currentPatient.name)}
        onEdit={(p) => { onEditPatient(p); }}
        onAddHistory={onAddHistory}
        // Passed onUpdateGallery to PatientDetail
        onUpdateGallery={onUpdateGallery}
        onUpdatePatientData={onUpdatePatientObject}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Directorio de Pacientes</h1>
          <p className="text-slate-500">Gestiona el historial y la información de tus pacientes.</p>
        </div>
        <button onClick={() => (onAddPatient({} as any))} className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-100 transition-all flex items-center gap-2 whitespace-nowrap"><Icons.Plus /> Registrar Nuevo Paciente</button>
      </header>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></span>
            <input type="text" placeholder="Buscar por nombre, teléfono o doctor..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent focus:bg-white focus:border-sky-500 rounded-xl outline-none transition-all text-slate-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Edad</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-sky-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <img src={`https://picsum.photos/seed/pat-${patient.id}/40/40`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                      <div><p className="text-sm font-bold text-slate-900 group-hover:text-sky-600">{patient.name}</p><p className="text-xs text-slate-500">{patient.phone || 'Sin teléfono'}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><p className="text-xs font-bold text-slate-600">{patient.age} años</p></td>
                  <td className="px-6 py-4"><p className="text-xs font-medium text-indigo-600 italic">{patient.treatingDoctor || 'No asignado'}</p></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}
                        className="px-4 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 rounded-lg transition-all border border-transparent hover:border-sky-100"
                      >
                        Ver Ficha
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeletePatient(patient.id); }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar Paciente"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No se encontraron pacientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientList;
