import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded border border-dashed border-slate-300 my-4">
      <div className="w-12 h-12 rounded-full bg-chalk flex items-center justify-center text-ledger-navy mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold font-heading text-ledger-navy">{title}</h3>
      {description && <p className="text-sm text-ink/70 max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-semibold text-sm rounded shadow-sm transition-all focus-visible:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
