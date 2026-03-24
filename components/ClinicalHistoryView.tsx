
import React, { useState, useEffect } from 'react';
import Odontogram from './Odontogram';
import { Patient, User } from '../types';
import SignaturePasswordModal from './SignaturePasswordModal';
import { Icons } from '../constants';
import { summarizeHistoryForm } from '../services/geminiService';

interface HistoryState {
  fecha: string; unidad: string; consultorio: string; hc: string;
  paciente: string; ci: string; direccion: string; edad: string;
  sexo: 'M' | 'F' | ''; escolaridad: string; alergias: string;
  motivo: string; hea: string;
  ap: string[]; medicacion: string;
  apf_madre: 'V' | 'M' | ''; apf_padre: 'V' | 'M' | '';
  ah: string; rm: string;
  habitos_veces: string; habitos_forma: string; habitos_min: string;
  dieta: 'Balanceada' | 'Cariogénica' | '';
  habitos_deformantes: string;
  lactancia: string; lactancia_recuerda: boolean;
  habitos_nocivos: string[];
  extraoral_habitos: 'Normolineo' | 'Longuilineo' | 'Brevilineo' | '';
  piel: string;
  mucosa: string; labios: string; cierre_bilabial: string;
  cara: string; simetria: string; facie: string; perfil: string;
  tcs: string; adenopatias: string;
  atm: string[]; atm_lado: string;
  mucosa_intra: string; inserciones: string; periodonto: string;
  paladar_duro: string; paladar_blando: string;
  lengua: string; suelo_boca: string; orofaringe: string;
  denticion: string;
  relacion_ant_post: string; oclusion_inv_ant: boolean;
  linea_media: string; resalte_post: string; sobrepase: string;
  lenguaje: string; musculatura: string; flujo_salival: string;
  motilidad: string;
  grupo_epi: 'II' | 'III' | 'IV' | '';
  diagnostico_clinico: string; plan_tto: string;
  pronostico: string; acuerdo_tto: 'SI' | 'NO' | '';
}

interface ClinicalHistoryViewProps {
  selectedPatient: Patient | null;
  activeUser: User;
  onSaveHistory?: (pid: string, form: any) => void;
  onUpdateOdontogram?: (data: any) => void;
}

const ClinicalHistoryView: React.FC<ClinicalHistoryViewProps> = ({ 
  selectedPatient, 
  activeUser,
  onSaveHistory,
  onUpdateOdontogram
}) => {
  const [signed, setSigned] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  const [form, setForm] = useState<HistoryState>({
    fecha: new Date().toLocaleDateString(), unidad: '', consultorio: '', hc: '', paciente: '', ci: '', direccion: '', edad: '',
    sexo: '', escolaridad: '', alergias: '', motivo: '', hea: '', ap: [], medicacion: '',
    apf_madre: '', apf_padre: '', ah: '', rm: '', habitos_veces: '', habitos_forma: '', habitos_min: '',
    dieta: '', habitos_deformantes: '', lactancia: '', lactancia_recuerda: false, habitos_nocivos: [],
    extraoral_habitos: '', piel: '', mucosa: '', labios: '', cierre_bilabial: '', cara: '', simetria: '', facie: '', perfil: '',
    tcs: '', adenopatias: '', atm: [], atm_lado: '', mucosa_intra: '', inserciones: '', periodonto: '',
    paladar_duro: '', paladar_blando: '', lengua: '', suelo_boca: '', orofaringe: '', denticion: '',
    relacion_ant_post: '', oclusion_inv_ant: false, linea_media: '', resalte_post: '', sobrepase: '',
    lenguaje: '', musculatura: '', flujo_salival: '', motilidad: '', grupo_epi: '', diagnostico_clinico: '',
    plan_tto: '', pronostico: '', acuerdo_tto: ''
  });

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      setForm(prev => ({ 
        ...prev, 
        paciente: selectedPatient.name, 
        edad: selectedPatient.age.toString(), 
        hc: selectedPatient.id.substring(0, 6).toUpperCase() 
      }));
    }
  }, [selectedPatient]);

  const handleGenerateAISummary = async () => {
    setIsSummarizing(true);
    const summary = await summarizeHistoryForm(form);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  const toggleArrayItem = (field: keyof HistoryState, item: string) => {
    const arr = form[field] as string[];
    setForm({ ...form, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] });
  };

  const ClickableField = ({ label, field, value, type = 'check' }: { label: string, field: keyof HistoryState, value: string, type?: 'check' | 'radio' }) => {
    const isSelected = type === 'check' 
      ? (Array.isArray(form[field]) ? (form[field] as string[]).includes(value) : form[field] === value)
      : form[field] === value;

    return (
      <span 
        onClick={() => {
          if (type === 'check' && Array.isArray(form[field])) {
            toggleArrayItem(field, value);
          } else {
            setForm({ ...form, [field]: isSelected ? '' : value });
          }
        }}
        className="cursor-pointer hover:bg-slate-100 px-1 transition-colors flex items-center gap-1"
      >
        <span className="font-serif">___</span>
        <span className={isSelected ? 'font-bold underline' : ''}>
          {isSelected ? <span className="text-blue-600 font-bold">X </span> : null}
          {label}
        </span>
      </span>
    );
  };

  const InputField = ({ label, field, className = "" }: { label: string, field: keyof HistoryState, className?: string }) => (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="whitespace-nowrap font-bold">{label}</span>
      <input 
        type="text" 
        value={form[field] as string} 
        onChange={e => setForm({...form, [field]: e.target.value})}
        className="flex-1 border-b border-black outline-none bg-transparent px-1 min-w-[30px]"
      />
    </div>
  );

  const handleSave = () => {
    if (!signed) {
      alert("Es obligatorio firmar el documento para guardar oficialmente.");
      return;
    }
    if (onSaveHistory && selectedPatient) {
      onSaveHistory(selectedPatient.id, form);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (!selectedPatient) return null;

  return (
    <div className="bg-white p-4 md:p-8 animate-fadeIn">
      {/* Barra de herramientas flotante */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleGenerateAISummary}
            disabled={isSummarizing}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSummarizing ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Icons.Brain />}
            {isSummarizing ? 'Analizando...' : 'Generar Síntesis IA'}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSignModalOpen(true)} className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all ${signed ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white hover:bg-sky-700'}`}>
            {signed ? 'Documento Firmado' : 'Validar Firma Médica'}
          </button>
          <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2">
            <Icons.Calendar /> Imprimir Ficha Oficial
          </button>
        </div>
      </div>

      {/* DOCUMENTO PRINCIPAL */}
      <div className="max-w-[210mm] mx-auto border-[1.5px] border-black p-4 text-[10px] leading-[1.3] text-black font-sans bg-white print:p-0 print:border-black">
        
        {/* CABEZAL */}
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-8 p-2 border-r border-black flex flex-col justify-center">
            <h1 className="text-lg font-bold tracking-tighter">HISTORIA CLINICA ESTOMATOLOGICA</h1>
          </div>
          <div className="col-span-4 p-2 flex flex-col">
            <InputField label="Fecha:" field="fecha" />
            <div className="flex justify-center text-[12px] mt-1 italic">/ /</div>
          </div>
        </div>

        {/* DATOS IDENTIFICACIÓN */}
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-4 p-1 border-r border-black"><InputField label="Unidad:" field="unidad" /></div>
          <div className="col-span-4 p-1 border-r border-black"><InputField label="Consultorio:" field="consultorio" /></div>
          <div className="col-span-4 p-1"><InputField label="HC:" field="hc" /></div>
        </div>
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-9 p-1 border-r border-black"><InputField label="Pte:" field="paciente" /></div>
          <div className="col-span-3 p-1"><InputField label="C.I:" field="ci" /></div>
        </div>
        <div className="p-1 border-b border-black"><InputField label="Dirección:" field="direccion" /></div>
        <div className="grid grid-cols-12 border-b border-black items-center">
          <div className="col-span-2 p-1 border-r border-black"><InputField label="Edad:" field="edad" /></div>
          <div className="col-span-3 p-1 border-r border-black flex gap-2">
            <span className="font-bold">Sexo:</span>
            <span onClick={() => setForm({...form, sexo: 'M'})} className="cursor-pointer">M ( {form.sexo === 'M' ? 'X' : ' '} )</span>
            <span onClick={() => setForm({...form, sexo: 'F'})} className="cursor-pointer">F ( {form.sexo === 'F' ? 'X' : ' '} )</span>
          </div>
          <div className="col-span-3 p-1 border-r border-black"><InputField label="Escolaridad:" field="escolaridad" /></div>
          <div className="col-span-4 p-1"><InputField label="Alergias:" field="alergias" className="text-red-600" /></div>
        </div>

        {/* MOTIVO Y HEA */}
        <div className="p-1 border-b border-black min-h-[40px]">
          <strong className="block uppercase text-[9px]">Motivo de Consulta:</strong>
          <textarea className="w-full border-none outline-none resize-none h-8 bg-transparent" value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} />
        </div>

        {/* ANTECEDENTES Y HÁBITOS */}
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-12 p-1 flex flex-wrap gap-x-4">
            <span className="font-bold">AP:</span>
            <ClickableField label="No refiere" field="ap" value="No refiere" />
            <ClickableField label="HTA" field="ap" value="HTA" />
            <ClickableField label="DB" field="ap" value="DB" />
            <ClickableField label="Cardiópata" field="ap" value="Cardiópata" />
            <InputField label="Otras:" field="rm" className="flex-1" />
          </div>
        </div>
        <div className="p-1 border-b border-black flex flex-wrap gap-x-3 items-center">
            <span className="font-bold">Hábitos Nocivos:</span>
            <ClickableField label="No Refiere" field="habitos_nocivos" value="No Refiere" />
            <ClickableField label="Café" field="habitos_nocivos" value="Café" />
            <ClickableField label="Tabaquismo" field="habitos_nocivos" value="Tabaquismo" />
            <ClickableField label="Alcoholismo" field="habitos_nocivos" value="Alcoholismo" />
            <ClickableField label="Drogas" field="habitos_nocivos" value="Drogas" />
        </div>

        {/* EXAMEN FÍSICO EXTRAORAL */}
        <div className="bg-slate-100 p-0.5 text-center font-bold border-b border-black uppercase tracking-widest text-[9px]">Examen Físico Extraoral</div>
        <div className="p-1 border-b border-black flex gap-4">
            <ClickableField label="Normolineo" field="extraoral_habitos" value="Normolineo" />
            <ClickableField label="Longuilineo" field="extraoral_habitos" value="Longuilineo" />
            <ClickableField label="Brevilineo" field="extraoral_habitos" value="Brevilineo" />
        </div>
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-6 p-1 border-r border-black flex gap-2">
             <span className="font-bold">Cara:</span>
             <ClickableField label="Ovoide" field="cara" value="Ovoide" />
             <ClickableField label="Cuadrada" field="cara" value="Cuadrada" />
             <ClickableField label="Redondeada" field="cara" value="Redondeada" />
             <ClickableField label="Triangular" field="cara" value="Triangular" />
          </div>
          <div className="col-span-6 p-1 flex gap-2">
             <span className="font-bold">Facie:</span>
             <ClickableField label="No Patológica" field="facie" value="No Patológica" />
             <ClickableField label="Patológica" field="facie" value="Patológica" />
          </div>
        </div>

        {/* EXAMEN FÍSICO INTRAORAL */}
        <div className="bg-slate-100 p-0.5 text-center font-bold border-b border-black uppercase tracking-widest text-[9px]">Examen Físico Intraoral</div>
        <div className="p-1 border-b border-black">
            <span className="font-bold">Mucosas:</span>
            <ClickableField label="Normocoloreada" field="mucosa" value="Normocoloreada" />
            <ClickableField label="Hipercoloreada" field="mucosa" value="Hipercoloreada" />
            <ClickableField label="Hipocoloreada" field="mucosa" value="Hipocoloreada" />
        </div>

        {/* ODONTOGRAMA Y OCLUSIÓN - SINCRONIZADO */}
        <div className="p-2 bg-white flex justify-center py-4 border-b border-black overflow-hidden">
           <div className="scale-[0.8] origin-center">
              <Odontogram 
                initialData={selectedPatient.odontogramData} 
                onSave={(data) => onUpdateOdontogram?.(data)} 
                activeDoctorName={activeUser.name}
              />
           </div>
        </div>

        {/* RESUMEN AUTOMÁTICO IA */}
        {aiSummary && (
          <div className="p-3 bg-indigo-50/30 border-b border-black animate-fadeIn print:bg-transparent">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-600"><Icons.Brain /></span>
              <strong className="text-[9px] uppercase tracking-widest text-indigo-800">Síntesis Clínica Generada por IA Noah's Agency</strong>
            </div>
            <p className="text-[10px] italic leading-relaxed text-slate-700">
              "{aiSummary}"
            </p>
          </div>
        )}

        {/* FIN DEL DOCUMENTO */}
        <div className="p-1 border-b border-black min-h-[40px]"><InputField label="Diagnóstico Clínico:" field="diagnostico_clinico" /></div>
        <div className="p-1 border-b border-black min-h-[60px]">
            <strong className="block mb-1">Plan de TTo:</strong>
            <textarea className="w-full h-12 border-none outline-none bg-transparent" value={form.plan_tto} onChange={e => setForm({...form, plan_tto: e.target.value})} />
        </div>
        
        <div className="grid grid-cols-12">
          <div className="col-span-8 p-2 flex gap-4 items-center">
             <span className="font-bold">¿Está usted de acuerdo con el tratamiento a realizar?</span>
             <span onClick={() => setForm({...form, acuerdo_tto: 'SI'})} className="cursor-pointer font-bold">___ SÍ {form.acuerdo_tto === 'SI' ? 'X' : ''}</span>
             <span onClick={() => setForm({...form, acuerdo_tto: 'NO'})} className="cursor-pointer font-bold">___ NO {form.acuerdo_tto === 'NO' ? 'X' : ''}</span>
          </div>
          <div className="col-span-4 p-2 border-l border-black flex flex-col items-center justify-center italic text-[8px]">
             {signed ? (
               <div className="flex flex-col items-center">
                 <img src="https://fontmeme.com/permalink/240520/6c6c6c6c6c6c6c6c6c6c6c6c.png" className="h-8 opacity-80" alt="Sign" />
                 <span className="font-bold text-[7px] uppercase mt-1">Firma Digital Validada</span>
               </div>
             ) : (
               <span>Firma del Profesional: ________________</span>
             )}
          </div>
        </div>
      </div>

      <SignaturePasswordModal 
        isOpen={isSignModalOpen} 
        onClose={() => setIsSignModalOpen(false)} 
        onSuccess={() => setSigned(true)} 
        doctorName={activeUser.name} 
        overridePassword={activeUser.password}
      />

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 font-bold animate-slideUp">
           <Icons.Stethoscope /> Documento Archivado Exitosamente
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .max-w-[210mm] { width: 100% !important; margin: 0 !important; max-width: none !important; border: 1.5px solid black !important; padding: 0 !important; }
          @page { margin: 5mm; }
          .print\\:hidden { display: none !important; }
          textarea { border: none !important; overflow: hidden !important; }
        }
      `}} />
    </div>
  );
};

export default ClinicalHistoryView;
