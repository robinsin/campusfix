import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-300/60 rounded ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full space-y-3 p-4 bg-white rounded border border-slate-200">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-6 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
};
