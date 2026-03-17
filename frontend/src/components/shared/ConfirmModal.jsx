import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 shrink-0"><X size={16} /></button>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 ${
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
