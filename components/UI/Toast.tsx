
import React from 'react';
import { MailCheck } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-900/20 text-white px-4 py-3 rounded-lg flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 fade-in">
      <div className="bg-emerald-500/20 p-2 rounded-full">
         <MailCheck className="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-emerald-100">Notification Sent</p>
        <p className="text-xs text-emerald-400/80">{message}</p>
      </div>
    </div>
  );
};
