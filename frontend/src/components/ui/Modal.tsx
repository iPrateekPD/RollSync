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
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />

        <div className="relative transform overflow-hidden rounded-2xl bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-border">
          <div className="px-6 pb-6 pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 bg-transparent text-muted-foreground hover:bg-zinc-100 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
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
