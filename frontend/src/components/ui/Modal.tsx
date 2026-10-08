import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />

        <div className="relative transform overflow-hidden rounded-[20px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-[#E5E7EB] animate-in zoom-in-95 duration-200">
          <div className="px-6 pb-6 pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-semibold tracking-tight text-[#111827]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 bg-transparent text-[#667085] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
