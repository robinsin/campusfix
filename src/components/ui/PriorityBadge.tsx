import React from 'react';
import type { Priority } from '../../types';
import { Flame, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getDetails = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return { label: 'URGENT', classNames: 'priority-urgent', Icon: Flame };
      case 'high':
        return { label: 'High', classNames: 'priority-high', Icon: ArrowUpCircle };
      case 'medium':
        return { label: 'Medium', classNames: 'priority-medium', Icon: ArrowRightCircle };
      case 'low':
        return { label: 'Low', classNames: 'priority-low', Icon: ArrowDownCircle };
    }
  };

  const { label, classNames, Icon } = getDetails(priority);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${classNames} ${className}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
