
import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import SignaturePasswordModal from './SignaturePasswordModal';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLoginSuccess }) => {
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>

      <div className="w-full max-w-4xl relative z-10">
        <header className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-[2rem] shadow-xl mb-6 border border-slate-100">
             <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Icons.Stethoscope />
             </div>
             <div className="ml-4 text-left">
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Noah’s <span className="text-sky-600">Agency</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Dental Management Suite</p>
             </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Bienvenido a su Clínica</h2>
          <p className="text-slate-500 font-medium">Por favor, seleccione su perfil para comenzar su jornada.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setPendingUser(user)}
              className="group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-sky-200 transition-all duration-500 text-center flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                    <Icons.Plus />
                 </div>
              </div>

              <div className="relative mb-6">
                <img 
                  src={user.avatar} 
                  className="w-24 h-24 rounded-[2rem] border-4 border-slate-50 shadow-xl group-hover:scale-105 transition-transform duration-500 object-cover" 
                  alt={user.name} 
                />
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${user.color} rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white`}>
                   <Icons.Dashboard />
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">{user.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{user.role}</p>
              
              <div className="w-full pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-sky-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                 Acceder al Sistema <Icons.Plus />
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-20 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Sistema de Gestión Estomatológica v2.5.0</p>
        </footer>
      </div>

      {pendingUser && (
        <SignaturePasswordModal
          isOpen={true}
          onClose={() => setPendingUser(null)}
          onSuccess={() => {
            onLoginSuccess(pendingUser);
            setPendingUser(null);
          }}
          doctorName={pendingUser.name}
          overridePassword={pendingUser.password}
        />
      )}
    </div>
  );
};

export default Login;
