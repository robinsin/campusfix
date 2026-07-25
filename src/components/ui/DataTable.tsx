import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortableKey?: keyof T;
  className?: string;
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pageSize?: number;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  pageSize = 8,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  if (loading) {
    return <TableSkeleton rows={pageSize} cols={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  // Handle Sort
  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return sortOrder === 'asc' ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
  });

  // Handle Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-ink/70 uppercase tracking-wider">
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(col.sortableKey)}
                  className={`px-4 py-3 ${col.sortableKey ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''} ${
                    col.className || ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortableKey && (
                      <span className="text-slate-400">
                        {sortKey === col.sortableKey ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-ledger-navy" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-ledger-navy" />
                          )
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginatedData.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-amber-50/20 transition-colors">
                {columns.map((col, cIndex) => (
                  <td key={cIndex} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                    {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-ink/70">
          <div>
            Showing <span className="font-semibold text-ledger-navy">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-ledger-navy">{Math.min(startIndex + pageSize, sortedData.length)}</span> of{' '}
            <span className="font-semibold text-ledger-navy">{sortedData.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
