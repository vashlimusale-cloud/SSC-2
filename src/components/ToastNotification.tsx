import React from 'react';
import { CheckCircle2, AlertCircle, Info, RotateCcw, X } from 'lucide-react';
import { useSystemCommand } from '../context/SystemCommandContext';

export const ToastNotification: React.FC = () => {
  const { toastMessage, clearToast, undoAction } = useSystemCommand();

  if (!toastMessage) return null;

  const handleUndo = () => {
    undoAction(toastMessage.undoActionId);
    clearToast();
  };

  const getIcon = () => {
    switch (toastMessage.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md win-card bg-[#1b202c] border border-white/20 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        {getIcon()}
        <span className="text-gray-200 truncate">{toastMessage.text}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {toastMessage.undoActionId && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Undo
          </button>
        )}
        <button
          onClick={clearToast}
          className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
