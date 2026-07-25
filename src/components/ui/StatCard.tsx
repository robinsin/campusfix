import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  variant?: 'default' | 'gold' | 'orange' | 'green' | 'navy';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'gold':
        return 'border-l-4 border-l-worn-gold bg-amber-50/40 text-ledger-navy';
      case 'orange':
        return 'border-l-4 border-l-site-orange bg-orange-50/40 text-ledger-navy';
      case 'green':
        return 'border-l-4 border-l-resolved-green bg-emerald-50/40 text-ledger-navy';
      case 'navy':
        return 'border-l-4 border-l-ledger-navy bg-slate-50 text-ledger-navy';
      default:
        return 'border-l-4 border-l-slate-400 bg-white text-ledger-navy';
    }
  };

  return (
    <div className={`p-5 rounded-lg border border-slate-200 shadow-xs flex items-start justify-between ${getStyles()} ${className}`}>
      <div>
        <p className="text-xs font-semibold text-ink/70 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-extrabold font-heading text-ledger-navy mt-1">{value}</h3>
        {trend && <p className="text-xs text-ink/60 mt-1 font-medium">{trend}</p>}
      </div>
      <div className="p-2.5 rounded-md bg-white border border-slate-200 text-ledger-navy shrink-0 shadow-xs">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
