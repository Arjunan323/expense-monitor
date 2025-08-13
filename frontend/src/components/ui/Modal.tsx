import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  widthClass?: string; // allow custom width
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, widthClass = 'max-w-3xl' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center overflow-y-auto p-4 bg-black/40 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className={`w-full ${widthClass} bg-white rounded-lg shadow-xl relative animate-fadeIn`}>        
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          <button onClick={onClose} aria-label="Close" className="ml-4 text-gray-500 hover:text-gray-800 px-2 py-1 rounded">
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
