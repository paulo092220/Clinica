
import React, { useState, useEffect } from 'react';

type MarkingColor = 'red' | 'blue' | 'green' | 'none';
type Surface = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface ToothState {
  [key: string]: MarkingColor;
}

interface OdontogramProps {
  initialData?: Record<number, ToothState>;
  onSave?: (data: Record<number, ToothState>) => void;
  activeDoctorName?: string;
}

const Odontogram: React.FC<OdontogramProps> = ({ initialData, onSave, activeDoctorName }) => {
  const [activeTool, setActiveTool] = useState<MarkingColor>('red');
  const [teethData, setTeethData] = useState<Record<number, ToothState>>(initialData || {});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTeethData(initialData);
    }
  }, [initialData]);

  // Quadrant piece definitions
  const permanentUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const permanentUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const deciduousUpperRight = [55, 54, 53, 52, 51];
  const deciduousUpperLeft = [61, 62, 63, 64, 65];
  
  const deciduousLowerRight = [85, 84, 83, 82, 81];
  const deciduousLowerLeft = [71, 72, 73, 74, 75];
  const permanentLowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const permanentLowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const fourSurfacedTeeth = [
    11, 12, 13, 21, 22, 23, 
    31, 32, 33, 41, 42, 43, 
    51, 52, 53, 61, 62, 63, 
    71, 72, 73, 81, 82, 83
  ];

  const handleSurfaceClick = (toothId: number, surface: Surface) => {
    setTeethData(prev => {
      const tooth = prev[toothId] || {};
      const currentColor = tooth[surface] || 'none';
      setIsDirty(true);
      return {
        ...prev,
        [toothId]: {
          ...tooth,
          [surface]: currentColor === activeTool ? 'none' : activeTool
        }
      };
    });
  };

  const getSurfaceColor = (toothId: number, surface: Surface) => {
    const color = teethData[toothId]?.[surface] || 'none';
    if (color === 'red') return 'fill-red-500 stroke-red-600 print-fill-red';
    if (color === 'blue') return 'fill-blue-500 stroke-blue-600 print-fill-blue';
    if (color === 'green') return 'fill-emerald-500 stroke-emerald-600 print-fill-green';
    return 'fill-white stroke-slate-400 hover:fill-slate-50';
  };

  const handleSave = () => {
    if (onSave) {
      onSave(teethData);
      setIsDirty(false);
    }
  };

  const ToothVisual: React.FC<{ id: number }> = ({ id }) => {
    const isPosterior = !fourSurfacedTeeth.includes(id);

    return (
      <div className="flex flex-col items-center group/tooth">
        <div className="w-full text-center border-b border-slate-200 bg-white py-0.5 group-hover/tooth:bg-sky-50 transition-colors">
          <span className="text-[8px] font-bold text-slate-600 group-hover/tooth:text-sky-700">{id}</span>
        </div>
        <div className="p-1 bg-white">
          <svg width="28" height="28" viewBox="0 0 100 100" className="cursor-pointer overflow-visible">
            {isPosterior ? (
              <>
                <path 
                  d="M 10,10 L 35,35 L 65,35 L 90,10 A 55,55 0 0,0 10,10 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'top')}`}
                  onClick={() => handleSurfaceClick(id, 'top')}
                  strokeWidth="2"
                />
                <path 
                  d="M 90,10 L 65,35 L 65,65 L 90,90 A 55,55 0 0,0 90,10 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'right')}`}
                  onClick={() => handleSurfaceClick(id, 'right')}
                  strokeWidth="2"
                />
                <path 
                  d="M 90,90 L 65,65 L 35,65 L 10,90 A 55,55 0 0,0 90,90 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'bottom')}`}
                  onClick={() => handleSurfaceClick(id, 'bottom')}
                  strokeWidth="2"
                />
                <path 
                  d="M 10,90 L 35,65 L 35,35 L 10,10 A 55,55 0 0,0 10,90 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'left')}`}
                  onClick={() => handleSurfaceClick(id, 'left')}
                  strokeWidth="2"
                />
                <circle 
                  cx="50" cy="50" r="20" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'center')}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSurfaceClick(id, 'center');
                  }}
                  strokeWidth="2"
                />
              </>
            ) : (
              <>
                <path 
                  d="M 10,10 L 35,50 L 65,50 L 90,10 A 55,55 0 0,0 10,10 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'top')}`}
                  onClick={() => handleSurfaceClick(id, 'top')}
                  strokeWidth="2"
                />
                <path 
                  d="M 90,10 L 65,50 L 90,90 A 55,55 0 0,0 90,10 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'right')}`}
                  onClick={() => handleSurfaceClick(id, 'right')}
                  strokeWidth="2"
                />
                <path 
                  d="M 90,90 L 65,50 L 35,50 L 10,90 A 55,55 0 0,0 90,90 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'bottom')}`}
                  onClick={() => handleSurfaceClick(id, 'bottom')}
                  strokeWidth="2"
                />
                <path 
                  d="M 10,90 L 35,50 L 10,10 A 55,55 0 0,0 10,90 Z" 
                  className={`transition-colors duration-200 ${getSurfaceColor(id, 'left')}`}
                  onClick={() => handleSurfaceClick(id, 'left')}
                  strokeWidth="2"
                />
              </>
            )}
          </svg>
        </div>
        <div className="w-full h-2 border-t border-slate-200 bg-white"></div>
      </div>
    );
  };

  const QuadrantBlock = ({ pieces, side }: { pieces: number[], side: 'left' | 'right' }) => (
    <div className={`flex flex-col ${side === 'right' ? 'border-r-2 border-slate-300' : ''}`}>
      <div className="flex border border-slate-300 shadow-sm overflow-hidden rounded-sm">
        {pieces.map(id => <ToothVisual key={id} id={id} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn pb-4 w-full">
      {/* Tool Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTool('red')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              activeTool === 'red' ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-white text-red-600 border-red-100 hover:bg-red-50'
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full" /> Rojo
          </button>
          <button 
            onClick={() => setActiveTool('blue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              activeTool === 'blue' ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full" /> Azul
          </button>
          <button 
            onClick={() => setActiveTool('green')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              activeTool === 'green' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full" /> Verde
          </button>
          <button 
            onClick={() => setActiveTool('none')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              activeTool === 'none' ? 'bg-slate-700 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
            }`}
          >
            Borrador
          </button>
          
          <div className="w-[1px] h-6 bg-slate-300 mx-2" />
          
          <button 
            onClick={() => { if(confirm('¿Reiniciar odontograma?')) { setTeethData({}); setIsDirty(true); } }}
            className="text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest underline decoration-dotted"
          >
            Limpiar
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeDoctorName && (
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validando como:</p>
              <p className="text-xs font-bold text-indigo-600">{activeDoctorName}</p>
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${
              isDirty 
              ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-100' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isDirty ? 'Guardar Cambios' : 'Sin cambios'}
          </button>
        </div>
      </div>

      {/* Main Grid View - Scaled and centered */}
      <div className="flex justify-center w-full px-2 py-4 print:p-0">
        <div className="max-w-full flex flex-col items-center">
          
          {/* Row 1: Permanent Upper */}
          <div className="flex gap-2 mb-2">
            <QuadrantBlock pieces={permanentUpperRight} side="right" />
            <QuadrantBlock pieces={permanentUpperLeft} side="left" />
          </div>

          {/* Row 2: Deciduous Upper */}
          <div className="flex gap-2 mb-2 origin-center">
            <QuadrantBlock pieces={deciduousUpperRight} side="right" />
            <QuadrantBlock pieces={deciduousUpperLeft} side="left" />
          </div>

          {/* Plano Oclusal */}
          <div className="h-4 flex items-center justify-center w-full relative my-2">
             <div className="h-[1px] bg-slate-300 w-full max-w-[600px]"></div>
             <div className="absolute px-2 bg-white text-[7px] font-bold text-slate-400 uppercase tracking-widest z-10">Oclusal</div>
          </div>

          {/* Row 3: Deciduous Lower */}
          <div className="flex gap-2 mb-2 origin-center">
            <QuadrantBlock pieces={deciduousLowerRight} side="right" />
            <QuadrantBlock pieces={deciduousLowerLeft} side="left" />
          </div>

          {/* Row 4: Permanent Lower */}
          <div className="flex gap-2">
            <QuadrantBlock pieces={permanentLowerRight} side="right" />
            <QuadrantBlock pieces={permanentLowerLeft} side="left" />
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print-fill-red { fill: #ef4444 !important; stroke: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-fill-blue { fill: #2563eb !important; stroke: #1d4ed8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-fill-green { fill: #10b981 !important; stroke: #059669 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </div>
  );
};

export default Odontogram;
