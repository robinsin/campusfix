import React from 'react';
import type { RequestStatus } from '../../types';
import { Sparkles, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getDetails = (st: RequestStatus) => {
    switch (st) {
      case 'new':
        return { label: 'New', classNames: 'status-new', Icon: Sparkles };
      case 'in_progress':
        return { label: 'In Progress', classNames: 'status-in_progress', Icon: Clock };
      case 'on_hold':
        return { label: 'On Hold', classNames: 'status-on_hold', Icon: AlertTriangle };
      case 'resolved':
        return { label: 'Resolved', classNames: 'status-resolved', Icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Cancelled', classNames: 'status-cancelled', Icon: XCircle };
    }
  };

  const { label, classNames, Icon } = getDetails(status);

  return (
    <span className={`ticket-stub ${classNames} ${className}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
