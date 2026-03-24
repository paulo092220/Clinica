
import React, { useRef, useState } from 'react';
import { Icons } from '../constants';
import { User, UserRole } from '../types';

interface SettingsProps {
  activeUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onReset: () => void;
  onLogout?: () => void;
  onSetupAutosave: () => void;
  onResumeAutosave: () => void;
  autosaveStatus: 'idle' | 'active' | 'error' | 'needs_permission';
}

const Settings: React.FC<SettingsProps> = ({ 
  activeUser, users, onAddUser, onUpdateUser, onDeleteUser, 
  onExport, onImport, onReset, onLogout, 
  onSetupAutosave, onResumeAutosave, autosaveStatus 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [newUser, setNewUser] = useState({
    name: '',
    role: '',
    roleType: 'DENTIST' as UserRole,
    password: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          onImport(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.password) return;
    
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      role: newUser.role || (newUser.roleType === 'ADMIN' ? 'Administrador' : 'Estomatólogo'),
      roleType: newUser.roleType,
      avatar: `https://picsum.photos/seed/user-${Math.random()}/100/100`,
      color: newUser.roleType === 'ADMIN' ? 'bg-slate-900' : 'bg-sky-600',
      password: newUser.password
    };

    onAddUser(user);
    setIsAddingUser(false);
    setNewUser({ name: '', role: '', roleType: 'DENTIST', password: '' });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    onUpdateUser({ ...activeUser, password: passwordForm.newPassword });
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    alert("Contraseña actualizada correctamente");
  };

  const isAdmin = activeUser.roleType === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 font-medium">Gestiona el equipo, la seguridad y los datos de Noah's Agency.</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-6 py-3 bg-white text-red-600 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-red-100 hover:bg-red-50 transition-all shadow-sm"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* SEGURIDAD DE LA CUENTA */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Seguridad de la Cuenta</h3>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
              <input required type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-500" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
              <input required type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-500" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all">Actualizar Clave</button>
          </form>
        </div>
      </section>

      {/* GESTIÓN DE USUARIOS - SOLO ADMIN */}
      {isAdmin && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Gestión de Personal</h3>
            <button 
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="px-4 py-2 bg-sky-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
            >
              {isAddingUser ? 'Cerrar Formulario' : 'Nuevo Usuario'}
            </button>
          </div>

          {isAddingUser && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl animate-slideUp">
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-500" placeholder="Ej: Dr. Mario Pérez" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clave de Acceso</label>
                  <input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-sky-500" placeholder="Ej: 1234" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Cuenta</label>
                  <select value={newUser.roleType} onChange={e => setNewUser({...newUser, roleType: e.target.value as UserRole})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700">
                    <option value="DENTIST">Estomatólogo (Acceso Limitado)</option>
                    <option value="ADMIN">Administrador (Control Total)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-slate-800 transition-all">Crear Cuenta</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <img src={user.avatar} className="w-12 h-12 rounded-2xl shadow-sm" alt="" />
                   <div>
                     <p className="text-sm font-black text-slate-900">{user.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">{user.role}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Clave</p>
                    <p className="text-xs font-black text-sky-600">{user.password}</p>
                  </div>
                  {user.id !== activeUser.id && (
                    <button onClick={() => onDeleteUser(user.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Icons.Trash />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MANTENIMIENTO - SOLO ADMIN */}
      {isAdmin && (
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Mantenimiento del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AUTOGUARDADO */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-lg transition-all flex flex-col justify-between md:col-span-2">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Autoguardado Local</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Guarda una copia de seguridad automáticamente en tu computadora cada 1 minuto.</p>
                </div>
              </div>
              
              {autosaveStatus === 'active' && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 border border-emerald-100">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="font-bold text-sm">Autoguardado Activo y funcionando</span>
                </div>
              )}
              {autosaveStatus === 'needs_permission' && (
                <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl flex flex-col gap-3 border border-amber-100">
                  <span className="font-bold text-sm">El navegador requiere permiso para reanudar el autoguardado tras reiniciar la app.</span>
                  <button onClick={onResumeAutosave} className="px-4 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all">Reanudar Autoguardado</button>
                </div>
              )}
              {autosaveStatus === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                  <span className="font-bold text-sm">Error al guardar. Verifica los permisos de la carpeta.</span>
                </div>
              )}
              
              <button onClick={onSetupAutosave} className="w-full py-4 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 active:scale-95 transition-all">
                {autosaveStatus === 'idle' ? 'Configurar Carpeta de Autoguardado' : 'Cambiar Carpeta'}
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Copia de Seguridad</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Descarga la base de datos completa de pacientes, citas y contabilidad.</p>
                </div>
              </div>
              <button onClick={onExport} className="w-full py-4 bg-sky-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-sky-700 shadow-xl shadow-sky-100 active:scale-95 transition-all">Exportar JSON</button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Restaurar Datos</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Sube un respaldo para sobrescribir la información actual. Use con precaución.</p>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all">Importar Archivo</button>
            </div>
          </div>
        </section>
      )}

      {/* PELIGRO - SOLO ADMIN */}
      {isAdmin && (
        <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><Icons.Trash /></div>
            <div>
              <h3 className="text-xl font-black text-red-900 italic">Acción Irreversible</h3>
              <p className="text-sm text-red-600 font-bold uppercase tracking-widest mt-1 opacity-70">Mantenimiento de nivel crítico</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
               <p className="font-black text-slate-900 text-lg">Vaciado de Base de Datos</p>
               <p className="text-sm text-slate-500 mt-1 leading-relaxed">Elimina todos los pacientes, historias clínicas y comisiones de forma permanente.</p>
            </div>
            <button onClick={() => { if(confirm('¿BORRAR TODO? Esta acción es definitiva.')) onReset(); }} className="px-8 py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 active:scale-95 transition-all">Borrar Datos</button>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
           <h3 className="text-xl font-black text-slate-900">Restricción de Seguridad</h3>
           <p className="text-slate-500 max-w-sm mx-auto mt-2">Su cuenta de Estomatólogo no tiene permisos para modificar la infraestructura del sistema o gestionar personal.</p>
        </div>
      )}

      <div className="p-8 bg-slate-100 rounded-[2.5rem] text-center space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Plataforma Segura</p>
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <p className="text-xs font-black text-slate-600">Conectado con Noah's Cloud Encryption</p>
        </div>
        <p className="text-[9px] text-slate-400 font-bold italic mt-4">v2.1.0-STABLE</p>
      </div>
    </div>
  );
};

export default Settings;
