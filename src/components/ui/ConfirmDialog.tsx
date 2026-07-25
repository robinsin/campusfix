import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  isDestructive = true,
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ledger-navy/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden" role="dialog" aria-modal="true">
        <div className="p-5 flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-100 text-site-orange' : 'bg-amber-100 text-worn-gold'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold font-heading text-ledger-navy">{title}</h3>
            <p className="text-sm text-ink/80 mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 rounded p-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-chalk px-5 py-3 flex justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded shadow-xs transition-colors flex items-center gap-2 ${
              isDestructive ? 'bg-site-orange hover:bg-site-orange/90' : 'bg-ledger-navy hover:bg-ledger-navy/90'
            }`}
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
