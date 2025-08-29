import React, { useEffect } from 'react';

export interface ToastProps { message: string; type?: 'info'|'success'|'error'; onClose: ()=>void; duration?: number }

export const Toast: React.FC<ToastProps> = ({ message, type='info', onClose, duration=3000 }) => {
  useEffect(()=>{ const t = setTimeout(onClose, duration); return ()=> clearTimeout(t); }, [onClose, duration]);
  const color = type==='error'? 'bg-red-600': type==='success'? 'bg-brand-green-600': 'bg-brand-blue-600';
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-xl text-white shadow-lg text-sm font-semibold animate-fade-in ${color}`}>
      {message}
    </div>
  );
};
