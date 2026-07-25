import React from 'react';
import type { StatusLog } from '../../types';
import { StatusBadge } from './StatusBadge';
import { User, Clock } from 'lucide-react';

interface TimelineProps {
  logs: StatusLog[];
}

export const Timeline: React.FC<TimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-ink/60 italic py-2">No history recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {logs.map((log) => {
        const formattedTime = new Date(log.changed_at).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div key={log.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-worn-gold ring-4 ring-chalk shadow-xs" />

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {log.old_status && (
                    <>
                      <StatusBadge status={log.old_status} className="scale-90 origin-left" />
                      <span className="text-xs text-slate-400 font-bold">→</span>
                    </>
                  )}
                  <StatusBadge status={log.new_status} className="scale-90 origin-left" />
                </div>
                <div className="flex items-center gap-1 text-xs text-ink/60 font-mono-data">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              <p className="text-sm text-ink font-medium leading-snug">{log.note}</p>

              <div className="flex items-center gap-1.5 text-xs text-ink/70 pt-1 border-t border-slate-100">
                <User className="w-3 h-3 text-worn-gold" />
                <span>Updated by <strong className="text-ledger-navy">{log.changed_by_name || 'System User'}</strong></span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
