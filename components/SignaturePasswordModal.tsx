
import React, { useState } from 'react';

interface SignaturePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctorName: string;
  overridePassword?: string;
}

const SignaturePasswordModal: React.FC<SignaturePasswordModalProps> = ({ isOpen, onClose, onSuccess, doctorName, overridePassword }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPassword = overridePassword || '1234';
    
    if (password === targetPassword) {
      onSuccess();
      onClose();
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-slate-900">Validar Identidad</h3>
          <p className="text-sm text-slate-500 mt-2">Para acceder a la sesión de <span className="font-black text-slate-900">{doctorName}</span>, introduzca su contraseña personal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            autoFocus
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={`w-full p-4 bg-slate-50 border ${error ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'} rounded-2xl text-center text-2xl tracking-widest outline-none focus:bg-white focus:border-sky-500 transition-all`}
            placeholder="••••"
          />
          {error && <p className="text-xs text-red-500 font-bold animate-shake">Contraseña incorrecta</p>}
          
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">Ingresar</button>
          </div>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
};

export default SignaturePasswordModal;
