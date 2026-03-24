
import React, { useState, useRef } from 'react';
import { Patient, GalleryItem } from '../types';
import { Icons } from '../constants';

interface ClinicalGalleryProps {
  patient: Patient;
  onAddItem: (item: GalleryItem) => void;
}

const ClinicalGallery: React.FC<ClinicalGalleryProps> = ({ patient, onAddItem }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoType, setPhotoType] = useState<'Photo' | 'X-Ray'>('Photo');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      alert("Error al acceder a la cámara. Asegúrese de otorgar permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const newItem: GalleryItem = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          type: photoType,
          url: dataUrl,
          notes: ''
        };
        onAddItem(newItem);
        stopCamera();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800 italic">Galería de Evidencia Clínica</h3>
        <button 
          onClick={startCamera} 
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center gap-2"
        >
          <Icons.Plus /> Capturar Foto
        </button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6">
              <button onClick={stopCamera} className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md">
                <Icons.Trash />
              </button>
              <button 
                onClick={capturePhoto} 
                className="w-20 h-20 bg-white rounded-full border-8 border-white/20 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 bg-indigo-600 rounded-full" />
              </button>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setPhotoType('Photo')} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${photoType === 'Photo' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white'}`}
                >
                  Clínica
                </button>
                <button 
                  onClick={() => setPhotoType('X-Ray')} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${photoType === 'X-Ray' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white'}`}
                >
                  Rx
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-white/60 text-sm font-bold">Alinee la cámara con la zona de interés</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(patient.gallery || []).map((item) => (
          <div key={item.id} className="group relative bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-square">
            <img src={item.url} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
              <p className="text-[10px] font-black text-sky-400 uppercase">{item.type} • {item.date}</p>
              <p className="text-xs text-white font-bold truncate">{item.notes || 'Sin notas'}</p>
            </div>
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${item.type === 'X-Ray' ? 'bg-slate-900 text-white' : 'bg-sky-600 text-white'}`}>
                {item.type}
              </span>
            </div>
          </div>
        ))}
        {(patient.gallery || []).length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
             <div className="p-4 bg-slate-50 rounded-full mb-4"><Icons.Box /></div>
             <p className="font-bold uppercase tracking-widest text-[10px]">No hay registros visuales aún</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalGallery;
